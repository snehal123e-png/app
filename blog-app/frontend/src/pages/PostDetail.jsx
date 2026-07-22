import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';

function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);

  const loadPost = () => {
    api.get(`/posts/${id}`)
      .then((res) => setPost(res.data))
      .catch(() => setError('Post not found.'));
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await api.post(`/posts/${id}/comments`, { text: commentText });
      setCommentText('');
      loadPost(); // refresh to show the new comment
    } catch (err) {
      setError('Failed to add comment.');
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/posts/${id}/like`);
      setLiked(res.data.liked);
      setPost((prev) => ({ ...prev, likeCount: res.data.likeCount }));
    } catch (err) {
      setError('Failed to like post.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err) {
      setError('Failed to delete post.');
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!post) return <p>Loading...</p>;

  return (
    <div className="post-detail">
      <h1>{post.title}</h1>
      <p className="post-meta">
        By {post.author} • {new Date(post.createdAt).toLocaleDateString()}
      </p>

      {post.image && (
        <img
          src={`http://localhost:5000${post.image}`}
          alt={post.title}
          className="post-detail-image"
        />
      )}

      {/* dangerouslySetInnerHTML is needed here because content comes from a rich text editor (Quill) and contains HTML formatting */}
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      <div className="post-actions">
        <button onClick={handleLike}>
          {liked ? '❤️ Liked' : '🤍 Like'} ({post.likeCount})
        </button>
        {user && user.id === post.authorId && (
          <button onClick={handleDelete} className="btn-danger">Delete Post</button>
        )}
      </div>

      <hr />

      <h3>Comments ({post.comments.length})</h3>

      <form onSubmit={handleAddComment} className="comment-form">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={user ? 'Write a comment...' : 'Log in to comment'}
          rows={3}
        />
        <button type="submit">Post Comment</button>
      </form>

      <div className="comments-list">
        {post.comments.map((c) => (
          <div key={c.id} className="comment">
            <strong>{c.author}</strong>
            <p>{c.text}</p>
            <span className="comment-date">{new Date(c.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostDetail;
