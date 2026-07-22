// routes/posts.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { readDB, writeDB } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// --- Configure Multer for image uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Helper: attach author username + like count to a post object
function enrichPost(db, post) {
  const author = db.users.find((u) => u.id === post.authorId);
  const likeCount = db.likes.filter((l) => l.postId === post.id).length;
  return {
    ...post,
    author: author ? author.username : 'Unknown',
    likeCount
  };
}

// GET all posts (newest first)
router.get('/', (req, res) => {
  const db = readDB();
  const posts = [...db.posts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((p) => enrichPost(db, p));
  res.json(posts);
});

// GET a single post by id, with its comments
router.get('/:id', (req, res) => {
  const db = readDB();
  const postId = parseInt(req.params.id);
  const post = db.posts.find((p) => p.id === postId);

  if (!post) return res.status(404).json({ message: 'Post not found.' });

  const comments = db.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((c) => {
      const author = db.users.find((u) => u.id === c.authorId);
      return { ...c, author: author ? author.username : 'Unknown' };
    });

  res.json({ ...enrichPost(db, post), comments });
});

// CREATE a new post (protected route, supports image upload)
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const db = readDB();
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newPost = {
      id: db.nextPostId,
      title,
      content,
      image: imagePath,
      authorId: req.user.id,
      createdAt: new Date().toISOString()
    };

    db.posts.push(newPost);
    db.nextPostId += 1;
    writeDB(db);

    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating post.' });
  }
});

// DELETE a post (only the author can delete)
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const postId = parseInt(req.params.id);
  const post = db.posts.find((p) => p.id === postId);

  if (!post) return res.status(404).json({ message: 'Post not found.' });
  if (post.authorId !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own posts.' });
  }

  db.posts = db.posts.filter((p) => p.id !== postId);
  db.comments = db.comments.filter((c) => c.postId !== postId);
  db.likes = db.likes.filter((l) => l.postId !== postId);
  writeDB(db);

  res.json({ message: 'Post deleted successfully.' });
});

// ADD a comment to a post (protected route)
router.post('/:id/comments', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Comment text is required.' });

  const db = readDB();
  const postId = parseInt(req.params.id);
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return res.status(404).json({ message: 'Post not found.' });

  const newComment = {
    id: db.nextCommentId,
    text,
    postId,
    authorId: req.user.id,
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);
  db.nextCommentId += 1;
  writeDB(db);

  res.status(201).json({ ...newComment, author: req.user.username });
});

// LIKE / UNLIKE a post (toggle, protected route)
router.post('/:id/like', authMiddleware, (req, res) => {
  const db = readDB();
  const postId = parseInt(req.params.id);
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return res.status(404).json({ message: 'Post not found.' });

  const existingLike = db.likes.find(
    (l) => l.postId === postId && l.userId === req.user.id
  );

  let liked;
  if (existingLike) {
    db.likes = db.likes.filter((l) => l.id !== existingLike.id);
    liked = false;
  } else {
    db.likes.push({ id: db.nextLikeId, postId, userId: req.user.id });
    db.nextLikeId += 1;
    liked = true;
  }

  writeDB(db);
  const likeCount = db.likes.filter((l) => l.postId === postId).length;
  res.json({ liked, likeCount });
});

module.exports = router;
