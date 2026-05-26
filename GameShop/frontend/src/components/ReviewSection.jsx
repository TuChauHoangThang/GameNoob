import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './ReviewSection.css';

const API = 'http://localhost:5000/api/reviews';
const STARS = [1, 2, 3, 4, 5];

function StarRating({ value, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-row">
      {STARS.map(s => (
        <button
          key={s}
          type="button"
          className={`star-btn ${s <= (hover || value) ? 'filled' : ''}`}
          onClick={() => !readOnly && onChange && onChange(s)}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
          disabled={readOnly}
          aria-label={`${s} sao`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className="star-label">
          {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][value]}
        </span>
      )}
    </div>
  );
}

function RatingBar({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rating-bar-row">
      <span className="rbar-label">{label}</span>
      <div className="rbar-track">
        <div className="rbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rbar-pct">{pct}%</span>
    </div>
  );
}

export default function ReviewSection({ gameId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ text: '', type: '' });
  const [editing, setEditing] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchReviews = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/game/${gameId}`);
      if (res.data.success) {
        setReviews(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Lỗi lấy reviews:', err);
    }
  }, [gameId]);

  const fetchMyReview = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/game/${gameId}/my`, { headers: authHeader });
      if (res.data.success && res.data.data) {
        setMyReview(res.data.data);
        setRating(res.data.data.rating);
        setContent(res.data.data.content);
      }
    } catch (err) {
      console.error('Lỗi lấy my review:', err);
    }
  }, [gameId, user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchReviews(), fetchMyReview()]);
      setLoading(false);
    };
    load();
  }, [fetchReviews, fetchMyReview]);

  const showMsg = (text, type = 'success') => {
    setFormMsg({ text, type });
    setTimeout(() => setFormMsg({ text: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return showMsg('Vui lòng chọn số sao.', 'error');
    if (content.trim().length < 10) return showMsg('Nội dung phải có ít nhất 10 ký tự.', 'error');

    setSubmitting(true);
    try {
      if (editing && myReview) {
        await axios.put(`${API}/${myReview.id}`, { rating, content }, { headers: authHeader });
        showMsg('Đã cập nhật đánh giá!');
      } else {
        await axios.post(`${API}/game/${gameId}`, { rating, content }, { headers: authHeader });
        showMsg('Đánh giá thành công!');
      }
      setEditing(false);
      await Promise.all([fetchReviews(), fetchMyReview()]);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await axios.delete(`${API}/${myReview.id}`, { headers: authHeader });
      setMyReview(null);
      setRating(0);
      setContent('');
      setEditing(false);
      showMsg('Đã xóa đánh giá.');
      await fetchReviews();
    } catch (err) {
      showMsg('Có lỗi khi xóa.', 'error');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <section className="review-section">
      <h2 className="review-section-title">💬 Đánh Giá Người Dùng</h2>

      {/* Rating overview */}
      {stats && parseInt(stats.total_reviews) > 0 && (
        <div className="rating-overview">
          <div className="rating-big">
            <span className="rating-score">{stats.avg_rating}</span>
            <StarRating value={Math.round(stats.avg_rating)} readOnly />
            <span className="rating-total">{stats.total_reviews} đánh giá</span>
          </div>
          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map(s => {
              const count = reviews.filter(r => r.rating === s).length;
              return (
                <RatingBar
                  key={s}
                  label={`${s} ★`}
                  value={count}
                  total={parseInt(stats.total_reviews)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Form viết review */}
      <div className="review-form-wrap">
        {!user ? (
          <div className="review-login-prompt">
            <span>🔐 Bạn cần </span>
            <Link to="/login" state={{ from: { pathname: `/game/${gameId}` } }}>đăng nhập</Link>
            <span> để viết đánh giá</span>
          </div>
        ) : myReview && !editing ? (
          <div className="my-review-display">
            <div className="my-review-header">
              <span className="my-review-tag">📝 Đánh giá của bạn</span>
              <div className="my-review-actions">
                <button className="review-action-btn edit" onClick={() => setEditing(true)}>✏️ Sửa</button>
                <button className="review-action-btn delete" onClick={handleDelete}>🗑️ Xóa</button>
              </div>
            </div>
            <StarRating value={myReview.rating} readOnly />
            <p className="my-review-content">{myReview.content}</p>
            <span className="review-date">{formatDate(myReview.created_at)}</span>
          </div>
        ) : (
          <form className="review-form" onSubmit={handleSubmit}>
            <h3 className="form-title">
              {editing ? '✏️ Chỉnh sửa đánh giá' : '✍️ Viết đánh giá của bạn'}
            </h3>
            {formMsg.text && (
              <div className={`review-msg ${formMsg.type}`}>
                {formMsg.type === 'success' ? '✅' : '❌'} {formMsg.text}
              </div>
            )}
            <div className="form-group">
              <label>Số sao đánh giá</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="form-group">
              <label>Nhận xét của bạn <span className="char-count">({content.length}/500)</span></label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 500))}
                placeholder="Chia sẻ trải nghiệm của bạn về game này... (tối thiểu 10 ký tự)"
                rows={4}
                className="review-textarea"
              />
            </div>
            <div className="form-btns">
              <button type="submit" className="submit-review-btn" disabled={submitting}>
                {submitting ? 'Đang gửi...' : editing ? 'Cập nhật' : 'Gửi đánh giá'}
              </button>
              {editing && (
                <button type="button" className="cancel-btn" onClick={() => { setEditing(false); setRating(myReview.rating); setContent(myReview.content); }}>
                  Hủy
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Danh sách review */}
      {loading ? (
        <div className="review-loading">Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="review-empty">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
      ) : (
        <div className="review-list">
          {reviews.map(r => (
            <div key={r.id} className={`review-card ${r.user_id === user?.id ? 'mine' : ''}`}>
              <div className="review-card-header">
                <div className="reviewer-avatar">
                  {r.username?.[0]?.toUpperCase()}
                </div>
                <div className="reviewer-info">
                  <span className="reviewer-name">{r.username}</span>
                  <span className="review-date">{formatDate(r.created_at)}</span>
                </div>
                <StarRating value={r.rating} readOnly />
              </div>
              <p className="review-content">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
