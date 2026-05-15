import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import './GameDetailPage.css';

export default function GameDetailPage() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

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
                  <span className="value status-positive">Rất tích cực ({game.rating.toFixed(0)}%)</span>
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
                {game.is_free ? (
                  <span className="final-price">Miễn phí</span>
                ) : (
                  <>
                    {game.price_vnd > 0 && <span className="final-price">{new Intl.NumberFormat('vi-VN').format(typeof game.price_vnd === 'string' ? parseInt(game.price_vnd) : game.price_vnd)}₫</span>}
                  </>
                )}
                <button 
                  className={`btn ${addedToCart ? 'btn-added' : 'btn-green'} add-to-cart`}
                  onClick={async () => {
                    const ok = await addToCart(game.id);
                    if (ok) {
                      setAddedToCart(true);
                      setTimeout(() => setAddedToCart(false), 2000);
                    }
                  }}
                >
                  {addedToCart ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
                </button>
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
