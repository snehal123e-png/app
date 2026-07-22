import React from 'react';
import { Link } from 'react-router-dom';

function PostCard({ post }) {
  // Strip HTML tags from the rich text content to show a plain text preview
  const plainText = post.content.replace(/<[^>]+>/g, '');
  const preview = plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText;

  return (
    <div className="post-card">
      {post.image && (
        <img
          src={`http://localhost:5000${post.image}`}
          alt={post.title}
          className="post-card-image"
        />
      )}
      <div className="post-card-body">
        <h2>
          <Link to={`/post/${post.id}`}>{post.title}</Link>
        </h2>
        <p className="post-meta">
          By {post.author} • {new Date(post.createdAt).toLocaleDateString()}
        </p>
        <p>{preview}</p>
        <div className="post-card-footer">
          <Link to={`/post/${post.id}`} className="btn-link">Read More →</Link>
          <span className="like-count">❤️ {post.likeCount}</span>
        </div>
      </div>
    </div>
  );
}

export default PostCard;
