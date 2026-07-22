import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../api.js';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Title and content cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      // We use FormData because we are sending a file (image) along with text fields
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (image) formData.append('image', image);

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/post/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create a New Post</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Cover Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <label>Content</label>
        <ReactQuill theme="snow" value={content} onChange={setContent} />

        <button type="submit" disabled={submitting} style={{ marginTop: '1rem' }}>
          {submitting ? 'Publishing...' : 'Publish Post'}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;
