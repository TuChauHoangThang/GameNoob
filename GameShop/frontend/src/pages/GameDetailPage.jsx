import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ReviewSection from '../components/ReviewSection';
import { useAuth } from '../context/AuthContext';
import './GameDetailPage.css';

export default function GameDetailPage() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistMsg, setWishlistMsg] = useState('');
  const { addToCart, cartItems } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  // Rating states
  const [ratingStats, setRatingStats] = useState(null);
  const [ratingsList, setRatingsList] = useState([]);
  const [myRating, setMyRating] = useState(null);
  const [isOwned, setIsOwned] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingForm, setRatingForm] = useState({ is_positive: true, stars: 5, comment: '' });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMsg, setRatingMsg] = useState('');

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/games/${id}`);
        if (res.data.success) {
          setGame(res.data.data);
          setActiveImage(res.data.data.header_image);
        }
      } catch (err) {
        console.error('Error fetching game details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch ratings + ownership khi có game và user
  useEffect(() => {
    if (!id) return;
    fetchRatings();
    if (user) {
      checkOwnershipAndMyRating();
    }
  }, [id, user]);

  const fetchRatings = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/ratings/${id}`);
      if (res.data.success) {
        setRatingStats(res.data.stats);
        setRatingsList(res.data.ratings);
      }
    } catch (err) {
      console.error('Lỗi tải ratings:', err);
    }
  };

  const checkOwnershipAndMyRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [ownershipRes, myRatingRes] = await Promise.all([
        axios.post('http://localhost:5000/api/checkout/check-ownership', { gameIds: [parseInt(id)] }, { headers }),
        axios.get(`http://localhost:5000/api/ratings/${id}/my`, { headers }),
      ]);
      if (ownershipRes.data.ownedGameIds?.includes(parseInt(id))) {
        setIsOwned(true);
      }
      if (myRatingRes.data.rating) {
        setMyRating(myRatingRes.data.rating);
      }
    } catch (err) {
      // Không đăng nhập hoặc lỗi — bỏ qua
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setRatingSubmitting(true);
    setRatingMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/ratings/${id}`,
        ratingForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMyRating(res.data.rating);
        setShowRatingForm(false);
        setRatingMsg('✓ Đánh giá của bạn đã được ghi nhận!');
        fetchRatings(); // Refresh stats + list
        setTimeout(() => setRatingMsg(''), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      setRatingMsg(msg);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen">Đang tải chi tiết game...</div>;
  if (!game) return <div className="error-screen">Không tìm thấy game! <Link to="/">Quay lại cửa hàng</Link></div>;

  const screenshots = typeof game.screenshots === 'string' ? JSON.parse(game.screenshots) : game.screenshots || [];
  const genres = typeof game.genres === 'string' ? JSON.parse(game.genres) : game.genres || [];
  const categories = typeof game.categories === 'string' ? JSON.parse(game.categories) : game.categories || [];
  const platforms = typeof game.platforms === 'string' ? JSON.parse(game.platforms) : game.platforms || {};

  return (
    <div className="game-detail-page">
      {/* Background Overlay */}
      <div className="detail-bg" style={{ backgroundImage: `url(${game.background || game.header_image})` }}></div>
      
      <div className="container detail-content">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs">
          <Link to="/">Cửa hàng</Link> <span>›</span> {game.name}
        </nav>

        <h1 className="game-title">{game.name}</h1>

        <div className="detail-grid">
          {/* Main Visuals */}
          <div className="detail-main">
            <div className="main-image-container">
              <img src={activeImage} alt={game.name} className="main-image" />
            </div>
            
            <div className="screenshot-strip">
              {[game.header_image, ...screenshots.map(s => s.full)].slice(0, 6).map((img, idx) => (
                <div 
                  key={idx} 
                  className={`thumb-container ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt="screenshot" />
                </div>
              ))}
            </div>

            <div className="detail-info-card">
              <div dangerouslySetInnerHTML={{ __html: game.detailed_description }} className="game-description" />
              {/* === Phần đánh giá người dùng === */}
              <ReviewSection gameId={id} />
            </div>

            {/* ===== RATING SECTION ===== */}
            <div className="rating-section">
              <h3 className="rating-section-title">ĐÁNH GIÁ CỦA NGƯỜI DÙNG</h3>

              {/* Stats bar */}
              {ratingStats && ratingStats.total_ratings > 0 ? (
                <div className="rating-stats-bar">
                  <div className="rating-avg-stars">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`star-icon ${s <= Math.round(ratingStats.avg_stars) ? 'star-filled' : 'star-empty'}`}>★</span>
                    ))}
                    <span className="rating-avg-num">{ratingStats.avg_stars.toFixed(1)}</span>
                    <span className="rating-total-count">({ratingStats.total_ratings} đánh giá)</span>
                  </div>
                  <div className="rating-sentiment">
                    <span className="sentiment-positive">👍 {ratingStats.positive_count} Tích cực</span>
                    <span className="sentiment-negative">👎 {ratingStats.negative_count} Tiêu cực</span>
                  </div>
                </div>
              ) : (
                <div className="rating-empty-stats">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
              )}

              {/* Rating form / status */}
              {user ? (
                isOwned ? (
                  myRating ? (
                    <div className="my-rating-display">
                      <span className="my-rating-label">Đánh giá của bạn:</span>
                      <span className={`my-rating-sentiment ${myRating.is_positive ? 'positive' : 'negative'}`}>
                        {myRating.is_positive ? '👍 Tích cực' : '👎 Tiêu cực'}
                      </span>
                      <span className="my-rating-stars">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={s <= myRating.stars ? 'star-filled' : 'star-empty'}>★</span>
                        ))}
                      </span>
                      {myRating.comment && <p className="my-rating-comment">"{myRating.comment}"</p>}
                    </div>
                  ) : (
                    <div className="rating-form-wrapper">
                      {!showRatingForm ? (
                        <button className="btn btn-green rating-open-btn" onClick={() => setShowRatingForm(true)}>
                          ✍️ Viết đánh giá của bạn
                        </button>
                      ) : (
                        <form className="rating-form" onSubmit={handleSubmitRating}>
                          <div className="rating-form-row">
                            <label className="rating-form-label">Cảm nhận:</label>
                            <div className="sentiment-btns">
                              <button
                                type="button"
                                className={`sentiment-btn ${ratingForm.is_positive ? 'active-positive' : ''}`}
                                onClick={() => setRatingForm(f => ({ ...f, is_positive: true }))}
                              >👍 Tích cực</button>
                              <button
                                type="button"
                                className={`sentiment-btn ${!ratingForm.is_positive ? 'active-negative' : ''}`}
                                onClick={() => setRatingForm(f => ({ ...f, is_positive: false }))}
                              >👎 Tiêu cực</button>
                            </div>
                          </div>

                          <div className="rating-form-row">
                            <label className="rating-form-label">Số sao:</label>
                            <div className="star-picker">
                              {[1,2,3,4,5].map(s => (
                                <span
                                  key={s}
                                  className={`star-pick ${s <= ratingForm.stars ? 'star-filled' : 'star-empty'}`}
                                  onClick={() => setRatingForm(f => ({ ...f, stars: s }))}
                                >★</span>
                              ))}
                            </div>
                          </div>

                          <div className="rating-form-row">
                            <label className="rating-form-label">Nhận xét:</label>
                            <textarea
                              className="rating-textarea"
                              placeholder="Chia sẻ trải nghiệm của bạn về game này... (không bắt buộc)"
                              value={ratingForm.comment}
                              onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))}
                              rows={3}
                              maxLength={500}
                            />
                          </div>

                          <div className="rating-form-actions">
                            <button type="submit" className="btn btn-green" disabled={ratingSubmitting}>
                              {ratingSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                            <button type="button" className="btn btn-dark" onClick={() => setShowRatingForm(false)}>
                              Hủy
                            </button>
                          </div>
                        </form>
                      )}
                      {ratingMsg && <div className="rating-msg">{ratingMsg}</div>}
                    </div>
                  )
                ) : (
                  <div className="rating-not-owned">
                    🔒 Bạn cần mua game này để có thể đánh giá.
                  </div>
                )
              ) : (
                <div className="rating-not-owned">
                  <Link to="/login">Đăng nhập</Link> để đánh giá game (yêu cầu đã mua game).
                </div>
              )}

              {ratingMsg && myRating && <div className="rating-msg success">{ratingMsg}</div>}

              {/* Reviews list */}
              {ratingsList.length > 0 && (
                <div className="reviews-list">
                  <h4 className="reviews-list-title">Tất cả đánh giá ({ratingsList.length})</h4>
                  {ratingsList.map(r => (
                    <div key={r.id} className="review-item">
                      <div className="review-header">
                        <span className="review-username">{r.username}</span>
                        <span className={`review-sentiment ${r.is_positive ? 'positive' : 'negative'}`}>
                          {r.is_positive ? '👍 Tích cực' : '👎 Tiêu cực'}
                        </span>
                        <span className="review-stars">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={s <= r.stars ? 'star-filled' : 'star-empty'}>★</span>
                          ))}
                        </span>
                        <span className="review-date">
                          {new Date(r.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {r.comment && <p className="review-comment">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* ===== END RATING SECTION ===== */}
          </div>

          {/* Sidebar Info */}
          <aside className="detail-sidebar">
            <img src={game.header_image} alt={game.name} className="sidebar-header-img" />
            
            <div className="sidebar-summary">
              <p className="short-desc">{game.short_description}</p>
              
              <div className="info-rows">
                <div className="info-row">
                  <span className="label">Đánh giá:</span>
                  <span className="value status-positive">
                    {ratingStats && ratingStats.total_ratings > 0
                      ? `${ratingStats.avg_stars.toFixed(1)}★ (${ratingStats.total_ratings} đánh giá)`
                      : game.rating > 0
                        ? `${game.rating.toFixed(0)}% tích cực`
                        : 'Chưa có đánh giá'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Ngày phát hành:</span>
                  <span className="value">{game.release_date}</span>
                </div>
                <div className="info-row">
                  <span className="label">Nhà phát triển:</span>
                  <span className="value">{Array.isArray(game.developers) ? game.developers.join(', ') : game.developers}</span>
                </div>
                <div className="info-row">
                  <span className="label">Nhà phát hành:</span>
                  <span className="value">{Array.isArray(game.publishers) ? game.publishers.join(', ') : game.publishers}</span>
                </div>
              </div>

              <div className="tags-container">
                {genres.map(g => <span key={g} className="tag">{g}</span>)}
              </div>
            </div>

            <div className="purchase-card">
              <h3>Mua {game.name}</h3>
              <div className="platform-icons">
                {platforms.windows && <i className="fab fa-windows"></i>}
                {platforms.mac && <i className="fab fa-apple"></i>}
                {platforms.linux && <i className="fab fa-linux"></i>}
              </div>
              <div className="price-box">
                <div className="price-box-top">
                  {game.is_free ? (
                    <span className="final-price">Miễn phí</span>
                  ) : (
                    <>
                      {game.price_vnd > 0 && <span className="final-price">{new Intl.NumberFormat('vi-VN').format(typeof game.price_vnd === 'string' ? parseInt(game.price_vnd) : game.price_vnd)}₫</span>}
                    </>
                  )}
                  <button 
                    className={`btn ${cartItems.some(i => i.game_id === game.id) ? 'btn-added' : addedToCart ? 'btn-added' : 'btn-green'} add-to-cart`}
                    onClick={async () => {
                      const ok = await addToCart(game.id);
                      if (ok === true) {
                        setAddedToCart(true);
                        setTimeout(() => setAddedToCart(false), 2000);
                      }
                    }}
                    disabled={cartItems.some(i => i.game_id === game.id)}
                  >
                    {cartItems.some(i => i.game_id === game.id) ? '✓ Đã có trong giỏ' : addedToCart ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
                  </button>
                </div>
                <button
                  className={`btn btn-wishlist-detail${isInWishlist(game.id) ? ' btn-wishlist-detail--active' : ''}`}
                  onClick={async () => {
                    const result = await toggleWishlist(game.id);
                    if (result === 'added') {
                      setWishlistMsg('✓ Đã thêm vào danh sách ước!');
                    } else if (result === 'removed') {
                      setWishlistMsg('Đã xóa khỏi danh sách ước');
                    }
                    setTimeout(() => setWishlistMsg(''), 2500);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24"
                    fill={isInWishlist(game.id) ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth={isInWishlist(game.id) ? 0 : 2}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {isInWishlist(game.id) ? 'Trong danh sách ước' : 'Thêm vào danh sách ước'}
                </button>
                {wishlistMsg && <div className="wishlist-toast">{wishlistMsg}</div>}
              </div>
            </div>

            <div className="sidebar-card">
              <h4>Tính năng</h4>
              <ul className="category-list">
                {categories.slice(0, 8).map(c => <li key={c}>{c}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
