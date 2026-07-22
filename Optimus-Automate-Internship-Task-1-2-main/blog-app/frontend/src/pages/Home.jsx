import React, { useEffect, useState } from 'react';
import api from '../api.js';
import PostCard from '../components/PostCard.jsx';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/posts')
      .then((res) => setPosts(res.data))
      .catch(() => setError('Failed to load posts. Is the backend server running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Latest Posts</h1>
      {posts.length === 0 ? (
        <p>No posts yet. Be the first to create one!</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}

export default Home;
