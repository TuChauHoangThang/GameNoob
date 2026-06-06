import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ReviewSection from '../components/ReviewSection';
import { useAuth } from '../context/AuthContext';
import './GameDetailPage.css';

export default function GameDetailPage() {
  const { id } = useParams();
  const [game, setGame]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistMsg, setWishlistMsg] = useState('');
  const [ratingStats, setRatingStats] = useState(null);

  const { addToCart, cartItems, isOwned } = useCart();
  const { isInWishlist, toggleWishlist }  = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/games/${id}`);
        if (res.data.success) {
          const gameData = res.data.data;
          setGame(gameData);
          
          // Ưu tiên screenshot đầu tiên làm ảnh hoạt động (activeImage) để tránh bị vỡ hình
          const scr = typeof gameData.screenshots === 'string'
            ? JSON.parse(gameData.screenshots)
            : gameData.screenshots || [];
          if (scr.length > 0) {
            setActiveImage(scr[0].full || scr[0].path_full || gameData.header_image);
          } else {
            setActiveImage(gameData.header_image);
          }
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

  // Lấy stats rating để hiển thị trên sidebar
  useEffect(() => {
    if (!id) return;
    axios.get(`http://localhost:5000/api/ratings/${id}`)
      .then(res => { if (res.data.success) setRatingStats(res.data.stats); })
      .catch(() => {});
  }, [id]);

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
              {/* Chỉ hiển thị các screenshots độ phân giải cao, nếu không có mới hiển thị header_image */}
              {(screenshots.length > 0 ? screenshots.map(s => s.full || s.path_full) : [game.header_image]).slice(0, 6).map((img, idx) => (
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
              {/* === Đánh giá người dùng — ReviewSection (hỗ trợ sửa/xóa + rating bars) === */}
              <ReviewSection gameId={id} />
            </div>
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
