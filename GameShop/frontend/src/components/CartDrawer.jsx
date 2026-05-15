import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './CartDrawer.css';

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, cartCount, totalPrice, removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <>
      {/* Overlay */}
      <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>🛒 Giỏ hàng ({cartCount})</h2>
          <button className="cart-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cart-body">
          {!user ? (
            <div className="cart-empty">
              <p>Bạn cần đăng nhập để xem giỏ hàng</p>
              <Link to="/login" className="cart-login-btn" onClick={onClose}>Đăng nhập</Link>
            </div>
          ) : loading ? (
            <div className="cart-empty"><p>Đang tải...</p></div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">🎮</span>
              <p>Giỏ hàng trống</p>
              <p className="cart-empty-sub">Hãy thêm game yêu thích vào giỏ hàng!</p>
            </div>
          ) : (
            <ul className="cart-list">
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <img src={item.header_image} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <Link to={`/game/${item.game_id}`} className="cart-item-name" onClick={onClose}>
                      {item.name}
                    </Link>
                    <span className="cart-item-price">{formatPrice(item.price_vnd)}</span>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} title="Xóa">
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {user && cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Tổng cộng:</span>
              <span className="cart-total-price">{formatPrice(totalPrice)}</span>
            </div>
            <button className="cart-checkout-btn">Thanh toán</button>
            <button className="cart-clear-btn" onClick={clearCart}>Xóa tất cả</button>
          </div>
        )}
      </div>
    </>
  );
}
