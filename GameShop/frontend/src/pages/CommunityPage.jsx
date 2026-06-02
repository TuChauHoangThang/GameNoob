import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CommunityPage.css';

const API = 'http://localhost:5000/api/posts';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <img
        src={src}
        alt="full"
        className="lightbox-img"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onDelete, onComment, onPostUpdated }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(parseInt(post.like_count) || 0);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Edit post
  const [editingPost, setEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState(post.content);
  const [editPostSaving, setEditPostSaving] = useState(false);

  // Edit comment
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentSaving, setEditCommentSaving] = useState(false);

  // Current displayed content (may change after edit)
  const [postContent, setPostContent] = useState(post.content);
  const [commentCount, setCommentCount] = useState(parseInt(post.comment_count) || 0);

  const isOwner = currentUser && currentUser.username === post.username;

  const mediaUrl = post.image_url
    ? (post.image_url.startsWith('http') ? post.image_url : `http://localhost:5000${post.image_url}`)
    : null;

  const handleToggleComments = async () => {
    if (!commentsLoaded) {
      try {
        const res = await axios.get(`${API}/${post.id}/comments`);
        if (res.data.success) setComments(res.data.data);
        setCommentsLoaded(true);
      } catch (e) { console.error(e); }
    }
    setShowComments(v => !v);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const prev = liked;
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
    try {
      await axios.post(`${API}/${post.id}/like`, {}, { headers: getAuthHeader() });
    } catch (e) {
      setLiked(prev);
      setLikeCount(c => prev ? c + 1 : c - 1);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/${post.id}/comments`,
        { content: commentText.trim() },
        { headers: getAuthHeader() }
      );
      if (res.data.success) {
        const newComment = { ...res.data.data, username: currentUser.username };
        setComments(prev => [...prev, newComment]);
        setCommentText('');
        setCommentCount(c => c + 1);
        onComment(post.id);
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  // ── Edit post ──
  const handleSavePost = async () => {
    if (!editPostText.trim() || editPostSaving) return;
    setEditPostSaving(true);
    try {
      const res = await axios.put(
        `${API}/${post.id}`,
        { content: editPostText.trim() },
        { headers: getAuthHeader() }
      );
      if (res.data.success) {
        setPostContent(res.data.data.content);
        setEditingPost(false);
        if (onPostUpdated) onPostUpdated(post.id, res.data.data.content);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Không thể sửa bài.');
    } finally {
      setEditPostSaving(false);
    }
  };

  // ── Edit comment ──
  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditCommentText(c.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleSaveComment = async (commentId) => {
    if (!editCommentText.trim() || editCommentSaving) return;
    setEditCommentSaving(true);
    try {
      const res = await axios.put(
        `${API}/comments/${commentId}`,
        { content: editCommentText.trim() },
        { headers: getAuthHeader() }
      );
      if (res.data.success) {
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, content: res.data.data.content } : c
        ));
        cancelEditComment();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Không thể sửa bình luận.');
    } finally {
      setEditCommentSaving(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      await axios.delete(`${API}/comments/${commentId}`, { headers: getAuthHeader() });
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentCount(c => Math.max(0, c - 1));
    } catch (e) {
      alert(e.response?.data?.message || 'Không thể xóa bình luận.');
    }
  };

  return (
    <div className="post-card">
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Header */}
      <div className="post-header">
        <div className="post-avatar">
          <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.username}`} alt={post.username} />
        </div>
        <div className="post-meta">
          <span className="post-username">{post.username}</span>
          <span className="post-time">{timeAgo(post.created_at)}</span>
        </div>
        {isOwner && !editingPost && (
          <div className="post-owner-actions">
            <button className="post-icon-btn edit" onClick={() => { setEditingPost(true); setEditPostText(postContent); }} title="Sửa bài">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="post-icon-btn delete" onClick={() => onDelete(post.id)} title="Xóa bài">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content / Edit form */}
      <div className="post-content">
        {editingPost ? (
          <div className="post-edit-form">
            <textarea
              className="post-edit-textarea"
              value={editPostText}
              onChange={e => setEditPostText(e.target.value)}
              maxLength={2000}
              rows={4}
              autoFocus
            />
            <div className="post-edit-actions">
              <button
                className="btn btn-green"
                onClick={handleSavePost}
                disabled={!editPostText.trim() || editPostSaving}
              >
                {editPostSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingPost(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <p className="post-text">{postContent}</p>
        )}

        {mediaUrl && !editingPost && (
          <div className="post-image-wrapper">
            {post.media_type === 'video' ? (
              <video src={mediaUrl} controls className="post-video" preload="metadata" />
            ) : (
              <img
                src={mediaUrl}
                alt="post"
                className="post-image"
                loading="lazy"
                onClick={() => setLightboxSrc(mediaUrl)}
                title="Bấm để xem ảnh đầy đủ"
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="post-actions">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike} disabled={!currentUser}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span>{likeCount > 0 ? likeCount : ''} Thích</span>
        </button>

        <button className="post-action-btn" onClick={handleToggleComments}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{commentCount > 0 ? commentCount : ''} Bình luận</span>
        </button>

        <button className="post-action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>Chia sẻ</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="post-comments">
          {comments.length === 0 ? (
            <p className="no-comments">Chưa có bình luận nào.</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="comment-item">
                <img
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${c.username}`}
                  alt={c.username}
                  className="comment-avatar"
                />
                <div className="comment-body">
                  <div className="comment-header-row">
                    <span className="comment-username">{c.username}</span>
                    <span className="comment-time">{timeAgo(c.created_at)}</span>
                    {currentUser && currentUser.username === c.username && editingCommentId !== c.id && (
                      <div className="comment-owner-actions">
                        <button className="comment-icon-btn" onClick={() => startEditComment(c)} title="Sửa">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="comment-icon-btn delete" onClick={() => handleDeleteComment(c.id)} title="Xóa">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === c.id ? (
                    <div className="comment-edit-form">
                      <input
                        type="text"
                        className="comment-edit-input"
                        value={editCommentText}
                        onChange={e => setEditCommentText(e.target.value)}
                        maxLength={500}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveComment(c.id);
                          if (e.key === 'Escape') cancelEditComment();
                        }}
                      />
                      <div className="comment-edit-actions">
                        <button
                          className="comment-edit-save"
                          onClick={() => handleSaveComment(c.id)}
                          disabled={!editCommentText.trim() || editCommentSaving}
                        >
                          {editCommentSaving ? '...' : 'Lưu'}
                        </button>
                        <button className="comment-edit-cancel" onClick={cancelEditComment}>Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-text">{c.content}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {currentUser && (
            <form className="comment-form" onSubmit={handleComment}>
              <img
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.username}`}
                alt="me"
                className="comment-avatar"
              />
              <input
                type="text"
                className="comment-input"
                placeholder="Viết bình luận..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                maxLength={500}
              />
              <button type="submit" className="comment-submit" disabled={!commentText.trim() || submitting}>
                {submitting ? '...' : 'Gửi'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create Post Box ──────────────────────────────────────────────────────────
function CreatePostBox({ currentUser, onPostCreated }) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError('File quá lớn. Tối đa 100MB.'); return; }
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) { setError('Chỉ chấp nhận ảnh hoặc video.'); return; }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(isVideo ? 'video' : 'image');
    setError('');
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (mediaFile) formData.append('media', mediaFile);

      const res = await axios.post(API, formData, {
        headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setContent('');
        removeMedia();
        onPostCreated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="create-post-box create-post-login">
        <p>
          <Link to="/login">Đăng nhập</Link> để chia sẻ bài viết với cộng đồng.
        </p>
      </div>
    );
  }

  return (
    <div className="create-post-box">
      <div className="create-post-header">
        <img
          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.username}`}
          alt="avatar"
          className="create-post-avatar"
        />
        <span className="create-post-username">{currentUser.username}</span>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          className="create-post-textarea"
          placeholder="Bạn đang nghĩ gì? Chia sẻ với cộng đồng game thủ..."
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        {mediaPreview && (
          <div className="create-post-preview">
            {mediaType === 'video' ? (
              <video src={mediaPreview} controls className="preview-video" />
            ) : (
              <img src={mediaPreview} alt="preview" />
            )}
            <button type="button" className="remove-preview-btn" onClick={removeMedia}>✕</button>
          </div>
        )}
        {error && <p className="create-post-error">{error}</p>}
        <div className="create-post-footer">
          <label className="attach-image-btn" title="Đính kèm ảnh hoặc video">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Ảnh / Video</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
              style={{ display: 'none' }}
              onChange={handleMediaChange}
            />
          </label>
          <span className="attach-hint">Tối đa 100MB</span>
          <span className="char-count">{content.length}/2000</span>
          <button
            type="submit"
            className="btn btn-green create-post-submit"
            disabled={(!content.trim() && !mediaFile) || submitting}
          >
            {submitting ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const fetchPosts = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await axios.get(`${API}?limit=${LIMIT}&offset=${currentOffset}`, {
        headers: getAuthHeader(),
      });
      if (res.data.success) {
        const newPosts = res.data.data;
        setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
        setOffset(currentOffset + newPosts.length);
        setHasMore(newPosts.length === LIMIT);
      }
    } catch (err) {
      console.error('Lỗi tải posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePostCreated = () => {
    setOffset(0);
    fetchPosts(true);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await axios.delete(`${API}/${postId}`, { headers: getAuthHeader() });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa bài viết.');
    }
  };

  const handleCommentAdded = (postId) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comment_count: parseInt(p.comment_count) + 1 } : p
    ));
  };

  return (
    <div className="community-page page-wrapper">
      <div className="community-layout">
        {/* ── Left sidebar ── */}
        <aside className="community-sidebar-left">
          <div className="community-sidebar-card">
            <h3 className="sidebar-card-title">🎮 Cộng Đồng</h3>
            <p className="sidebar-card-desc">
              Nơi các game thủ chia sẻ trải nghiệm, thảo luận và kết nối với nhau.
            </p>
          </div>
          {user && (
            <div className="community-sidebar-card user-sidebar-card">
              <img
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`}
                alt="avatar"
                className="sidebar-user-avatar"
              />
              <div>
                <p className="sidebar-user-name">{user.username}</p>
                <p className="sidebar-user-sub">Thành viên cộng đồng</p>
              </div>
            </div>
          )}
          <div className="community-sidebar-card">
            <h4 className="sidebar-card-title">📋 Quy tắc cộng đồng</h4>
            <ul className="community-rules">
              <li>Tôn trọng lẫn nhau</li>
              <li>Không spam hoặc quảng cáo</li>
              <li>Không nội dung 18+</li>
              <li>Chia sẻ nội dung liên quan đến game</li>
              <li>Không tiết lộ spoiler không có cảnh báo</li>
            </ul>
          </div>
        </aside>

        {/* ── Main feed ── */}
        <main className="community-feed">
          <div className="community-feed-header">
            <h1 className="community-title">Hoạt Động Cộng Đồng</h1>
            <p className="community-subtitle">Chia sẻ trải nghiệm game của bạn với cộng đồng</p>
          </div>

          <CreatePostBox currentUser={user} onPostCreated={handlePostCreated} />

          {loading ? (
            <div className="community-loading">
              {[1,2,3].map(i => <div key={i} className="post-skeleton" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="community-empty">
              <span className="community-empty-icon">💬</span>
              <p>Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onDelete={handleDelete}
                  onComment={handleCommentAdded}
                  onPostUpdated={(postId, newContent) => {
                    setPosts(prev => prev.map(p =>
                      p.id === postId ? { ...p, content: newContent } : p
                    ));
                  }}
                />
              ))}
              {hasMore && (
                <button
                  className="load-more-btn"
                  onClick={() => fetchPosts(false)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Đang tải...' : 'Xem thêm bài viết'}
                </button>
              )}
            </>
          )}
        </main>

        {/* ── Right sidebar ── */}
        <aside className="community-sidebar-right">
          <div className="community-sidebar-card">
            <h4 className="sidebar-card-title">🔥 Xu hướng</h4>
            <ul className="trending-tags">
              {['#ResidentEvil', '#Indie', '#RPG', '#FPS', '#OpenWorld', '#Multiplayer', '#Horror', '#Strategy'].map(tag => (
                <li key={tag} className="trending-tag">{tag}</li>
              ))}
            </ul>
          </div>
          <div className="community-sidebar-card">
            <h4 className="sidebar-card-title">📊 Thống kê</h4>
            <div className="community-stats">
              <div className="community-stat-item">
                <span className="community-stat-value">{posts.length}+</span>
                <span className="community-stat-label">Bài viết</span>
              </div>
              <div className="community-stat-item">
                <span className="community-stat-value">250K+</span>
                <span className="community-stat-label">Thành viên</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
