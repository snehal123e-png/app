const express = require("express");
const multer = require("multer");
const path = require("path");
const supabase = require("../supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/* ===========================
   Multer Configuration
=========================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* ===========================
      GET ALL POSTS
=========================== */

router.get("/", async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users!posts_author_id_fkey(username)
      `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      return res.status(500).json({
        message: error.message,
      });
    }

    const formattedPosts = [];

    for (const post of posts) {
      const { count } = await supabase
        .from("likes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("post_id", post.id);

      formattedPosts.push({
        id: post.id,
        title: post.title,
        content: post.content,
        image: post.image,

        authorId: post.author_id,

        author:
          post.users?.username ||
          "Unknown",

        createdAt:
          post.created_at,

        likeCount:
          count || 0,
      });
    }

    res.json(formattedPosts);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});
/* ===========================
      GET SINGLE POST
=========================== */

router.get("/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    // Fetch post with author
    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users!posts_author_id_fkey(username)
      `
      )
      .eq("id", postId)
      .single();

    if (error || !post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    // Fetch comments with author names
    const { data: comments, error: commentError } = await supabase
      .from("comments")
      .select(
        `
        *,
        users!comments_author_id_fkey(username)
      `
      )
      .eq("post_id", postId)
      .order("created_at", {
        ascending: true,
      });

    if (commentError) {
      console.error(commentError);

      return res.status(500).json({
        message: commentError.message,
      });
    }

    // Count likes
    const { count } = await supabase
      .from("likes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("post_id", postId);

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      postId: comment.post_id,
      authorId: comment.author_id,
      author: comment.users?.username || "Unknown",
      createdAt: comment.created_at,
    }));

    res.json({
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,

      authorId: post.author_id,

      author:
        post.users?.username ||
        "Unknown",

      createdAt:
        post.created_at,

      likeCount:
        count || 0,

      comments:
        formattedComments,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});
/* ===========================
      CREATE POST
=========================== */

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          message: "Title and content are required.",
        });
      }

      const imagePath = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title,
            content,
            image: imagePath,
            author_id: req.user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);

        return res.status(500).json({
          message: error.message,
        });
      }

      res.status(201).json({
        id: data.id,
        title: data.title,
        content: data.content,
        image: data.image,
        authorId: data.author_id,
        createdAt: data.created_at,
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);
/* ===========================
        DELETE POST
=========================== */

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    // Check if post exists
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    // Only author can delete
    if (post.author_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only delete your own posts.",
      });
    }

    // Delete likes
    const { error: likeError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId);

    if (likeError) {
      console.error(likeError);
    }

    // Delete comments
    const { error: commentError } = await supabase
      .from("comments")
      .delete()
      .eq("post_id", postId);

    if (commentError) {
      console.error(commentError);
    }

    // Delete post
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      return res.status(500).json({
        message: deleteError.message,
      });
    }

    res.json({
      message: "Post deleted successfully.",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});
/* ===========================
        ADD COMMENT
=========================== */

router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        message: "Comment text is required.",
      });
    }

    // Check post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from("comments")
      .insert([
        {
          text: text.trim(),
          post_id: postId,
          author_id: req.user.id,
        },
      ])
      .select(
        `
        *,
        users!comments_author_id_fkey(username)
        `
      )
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        message: error.message,
      });
    }

    res.status(201).json({
      id: comment.id,
      text: comment.text,
      postId: comment.post_id,
      authorId: comment.author_id,
      author: comment.users?.username || req.user.username,
      createdAt: comment.created_at,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});
/* ===========================
        LIKE / UNLIKE POST
=========================== */

router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    // Check if user already liked this post
    const { data: existingLike } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    let liked = false;

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      liked = false;

    } else {

      // Like
      const { error } = await supabase
        .from("likes")
        .insert([
          {
            post_id: postId,
            user_id: req.user.id,
          },
        ]);

      if (error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      liked = true;
    }

    // Get latest like count
    const { count } = await supabase
      .from("likes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("post_id", postId);

    res.json({
      liked,
      likeCount: count || 0,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});
module.exports = router;
