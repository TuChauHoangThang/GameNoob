import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './CartPage.css';

export default function CartPage() {
  const { cartItems, cartCount, totalPrice, removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Lấy danh sách game gợi ý
    const fetchRecommended = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/games?limit=6');
        if (res.data.success) {
          // Lọc bỏ game đã có trong giỏ
          const cartGameIds = cartItems.map(item => item.game_id);
          const filtered = res.data.data.filter(g => !cartGameIds.includes(g.id));
          setRecommended(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecommended();
  }, [cartItems]);

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  if (!user) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty-state">
            <h2>🛒 Giỏ hàng của bạn</h2>
            <p>Bạn cần đăng nhập để xem giỏ hàng.</p>
            <Link to="/login" className="cart-login-link">Đăng nhập</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-page-title">GIỎ HÀNG CỦA BẠN</h1>

        {loading ? (
          <div className="cart-loading">Đang tải giỏ hàng...</div>
        ) : cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <span className="cart-empty-icon">🎮</span>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Hãy duyệt cửa hàng và thêm game yêu thích vào đây!</p>
            <Link to="/" className="cart-continue-btn">Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <>
            {/* Thông báo */}
            <div className="cart-notice">
              <span className="notice-icon">ℹ️</span>
              <span>Sản phẩm trong giỏ hàng không được giữ chỗ — hãy hoàn tất thanh toán sớm nhất có thể.</span>
            </div>

            <div className="cart-layout">
              {/* Danh sách game */}
              <div className="cart-main">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-game-row">
                    <Link to={`/game/${item.game_id}`} className="cart-game-img-link">
                      <img src={item.header_image} alt={item.name} className="cart-game-img" />
                    </Link>
                    <div className="cart-game-details">
                      <Link to={`/game/${item.game_id}`} className="cart-game-name">
                        {item.name}
                      </Link>
                      <div className="cart-game-meta">
                        <span className="cart-game-platform">🖥️</span>
                      </div>
                      <div className="cart-game-actions">
                        <span className="cart-action-link" onClick={() => removeFromCart(item.id)}>Gỡ bỏ</span>
                      </div>
                    </div>
                    <div className="cart-game-price">
                      <span className="cart-price-final">{formatPrice(item.price_vnd)}</span>
                    </div>
                  </div>
                ))}

                <div className="cart-bottom-actions">
                  <Link to="/" className="cart-continue-shopping">Tiếp tục mua sắm</Link>
                  <span className="cart-remove-all" onClick={clearCart}>Gỡ bỏ tất cả sản phẩm</span>
                </div>
              </div>

              {/* Sidebar - Tổng tiền */}
              <aside className="cart-sidebar">
                <div className="cart-summary-card">
                  <div className="cart-summary-row">
                    <span className="cart-summary-label">Tổng ước tính</span>
                    <span className="cart-summary-total">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="cart-summary-note">
                    Thuế tiêu thụ sẽ được tính trong quá trình thanh toán nếu có
                  </p>
                  <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                    Tiếp tục tới bước thanh toán
                  </button>
                </div>
              </aside>
            </div>

            {/* Gợi ý game */}
            {recommended.length > 0 && (
              <section className="cart-recommendations">
                <h2 className="cart-rec-title">KHUYẾN NGHỊ CHO BẠN</h2>
                <div className="cart-rec-grid">
                  {recommended.map(game => (
                    <Link to={`/game/${game.id}`} key={game.id} className="cart-rec-card">
                      <img src={game.header_image} alt={game.name} className="cart-rec-img" />
                      <div className="cart-rec-info">
                        <span className="cart-rec-platform">🖥️</span>
                        <span className="cart-rec-price">{formatPrice(game.price_vnd)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
