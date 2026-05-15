import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './CheckoutPage.css';

const API_URL = 'http://localhost:5000/api/checkout';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Payment state
  const [paymentMode, setPaymentMode] = useState('new'); // 'new' or 'saved'
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    saveCard: false,
  });
  const [detectedCardType, setDetectedCardType] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [purchasedGames, setPurchasedGames] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 && !showSuccess) {
      navigate('/cart');
      return;
    }
    fetchSavedCards();
  }, [user]);

  // Lưu snapshot của game đang mua để hiển thị ở success modal
  useEffect(() => {
    if (cartItems.length > 0) {
      setPurchasedGames([...cartItems]);
    }
  }, [cartItems]);

  const fetchSavedCards = async () => {
    try {
      const res = await axios.get(`${API_URL}/cards`, { headers: getAuthHeader() });
      if (res.data.success && res.data.data.length > 0) {
        setSavedCards(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy thẻ đã lưu:', err);
    }
  };

  const deleteSavedCard = async (cardId) => {
    try {
      await axios.delete(`${API_URL}/cards/${cardId}`, { headers: getAuthHeader() });
      setSavedCards(prev => prev.filter(c => c.id !== cardId));
      if (selectedCardId === cardId) {
        setSelectedCardId(null);
        setPaymentMode('new');
      }
    } catch (err) {
      console.error('Lỗi xóa thẻ:', err);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  // Detect card type from number
  const detectCardType = (number) => {
    const clean = number.replace(/\s/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^6(?:011|5)/.test(clean)) return 'Discover';
    if (/^9704/.test(clean)) return 'Napas';
    return '';
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardForm(prev => ({ ...prev, cardNumber: formatted }));
    setDetectedCardType(detectCardType(formatted));
  };

  const handleInputChange = (field, value) => {
    setCardForm(prev => ({ ...prev, [field]: value }));
  };

  // Tính điểm GameNoob (mô phỏng)
  const gameNoobPoints = Math.floor(totalPrice / 1000);

  // Xử lý thanh toán
  const handleCheckout = async () => {
    setError('');

    if (!agreed) {
      setError('Bạn cần đồng ý với điều khoản trước khi thanh toán.');
      return;
    }

    if (paymentMode === 'saved') {
      if (!selectedCardId) {
        setError('Vui lòng chọn thẻ đã lưu.');
        return;
      }
      if (!cardForm.cvv || !/^\d{3,4}$/.test(cardForm.cvv)) {
        setError('Vui lòng nhập mã CVV hợp lệ (3-4 chữ số).');
        return;
      }
    } else {
      // Validate new card
      const cleanNumber = cardForm.cardNumber.replace(/\s/g, '');
      if (!/^\d{16}$/.test(cleanNumber)) {
        setError('Số thẻ không hợp lệ. Vui lòng nhập 16 chữ số.');
        return;
      }
      if (!cardForm.holderName.trim()) {
        setError('Vui lòng nhập tên chủ thẻ.');
        return;
      }
      if (!cardForm.expiryMonth || !cardForm.expiryYear) {
        setError('Vui lòng nhập ngày hết hạn thẻ.');
        return;
      }
      if (!cardForm.cvv || !/^\d{3,4}$/.test(cardForm.cvv)) {
        setError('Mã CVV không hợp lệ.');
        return;
      }
    }

    setProcessing(true);

    try {
      let res;
      if (paymentMode === 'saved') {
        res = await axios.post(`${API_URL}/saved-card`, {
          cardId: selectedCardId,
          cvv: cardForm.cvv,
        }, { headers: getAuthHeader() });
      } else {
        res = await axios.post(`${API_URL}/process`, {
          cardNumber: cardForm.cardNumber.replace(/\s/g, ''),
          holderName: cardForm.holderName,
          expiryMonth: parseInt(cardForm.expiryMonth),
          expiryYear: parseInt(cardForm.expiryYear),
          cvv: cardForm.cvv,
          saveCard: cardForm.saveCard,
        }, { headers: getAuthHeader() });
      }

      if (res.data.success) {
        setOrderResult(res.data.order);
        setShowSuccess(true);
        // Refresh cart (giờ sẽ trống)
        await fetchCart();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi khi thanh toán.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  // Card type icon
  const getCardIcon = (type) => {
    switch (type) {
      case 'Visa': return '💳';
      case 'Mastercard': return '💳';
      case 'Napas': return '🏦';
      default: return '💳';
    }
  };

  if (!user) return null;

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Breadcrumb Steps */}
        <div className="checkout-steps">
          <Link to="/cart" className="checkout-step completed">Giỏ hàng</Link>
          <span className="checkout-step-arrow">▸</span>
          <span className="checkout-step active">Thông tin thanh toán</span>
          <span className="checkout-step-arrow">▸</span>
          <span className="checkout-step">Duyệt lại + Mua</span>
        </div>

        {error && (
          <div className="checkout-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="checkout-layout">
          {/* Left Panel */}
          <div className="checkout-main">
            {/* Game Items */}
            <div className="checkout-items-card">
              <div className="checkout-items-header">
                <h3>Sản phẩm trong đơn hàng</h3>
                <span className="checkout-item-count">{cartItems.length} game</span>
              </div>
              {cartItems.map(item => (
                <div key={item.id} className="checkout-item-row">
                  <img src={item.header_image} alt={item.name} className="checkout-item-img" />
                  <span className="checkout-item-name">{item.name}</span>
                  <span className="checkout-item-platform">🖥️</span>
                  <span className="checkout-item-price">{formatPrice(item.price_vnd)}</span>
                </div>
              ))}
              <div className="checkout-totals">
                <div className="checkout-total-row">
                  <span className="checkout-total-label">Tổng phụ:</span>
                  <span className="checkout-total-value">{formatPrice(totalPrice)}</span>
                </div>
                <div className="checkout-total-row grand">
                  <span className="checkout-total-label">Tổng cộng:</span>
                  <span className="checkout-total-value">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* GameNoob Points */}
            {totalPrice > 0 && (
              <div className="checkout-points-bar">
                <span className="checkout-points-icon">✅</span>
                <span>Nhận điểm GameNoob cho đơn hàng này</span>
                <span className="checkout-points-value">{gameNoobPoints.toLocaleString('vi-VN')}</span>
              </div>
            )}

            {/* Payment Method */}
            <div className="checkout-payment-card">
              <div className="checkout-payment-header">
                <h3>Phương thức thanh toán</h3>
              </div>
              <div className="checkout-payment-body">
                {/* Saved Cards */}
                {savedCards.length > 0 && (
                  <div className="saved-cards-section">
                    <div className="saved-cards-title">Thẻ đã lưu</div>
                    {savedCards.map(card => (
                      <div
                        key={card.id}
                        className={`saved-card-item ${paymentMode === 'saved' && selectedCardId === card.id ? 'selected' : ''}`}
                        onClick={() => {
                          setPaymentMode('saved');
                          setSelectedCardId(card.id);
                        }}
                      >
                        <input
                          type="radio"
                          className="saved-card-radio"
                          checked={paymentMode === 'saved' && selectedCardId === card.id}
                          onChange={() => {
                            setPaymentMode('saved');
                            setSelectedCardId(card.id);
                          }}
                        />
                        <span className="saved-card-icon">{getCardIcon(card.card_type)}</span>
                        <div className="saved-card-info">
                          <div className="saved-card-type">{card.card_type}</div>
                          <div className="saved-card-number">có số cuối: **{card.last_four}</div>
                        </div>
                        <button
                          className="saved-card-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedCard(card.id);
                          }}
                          title="Xóa thẻ"
                        >🗑️</button>
                      </div>
                    ))}

                    {/* CVV for saved card */}
                    {paymentMode === 'saved' && selectedCardId && (
                      <div className="card-form" style={{ marginTop: '12px' }}>
                        <div className="card-form-group half">
                          <label className="card-form-label">Mã CVV</label>
                          <input
                            type="password"
                            className="card-form-input"
                            placeholder="•••"
                            maxLength={4}
                            value={cardForm.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* New Card Toggle */}
                <div
                  className={`new-card-toggle ${paymentMode === 'new' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMode('new');
                    setSelectedCardId(null);
                  }}
                >
                  <span>➕</span>
                  <span>Sử dụng thẻ ngân hàng mới</span>
                </div>

                {/* New Card Form */}
                {paymentMode === 'new' && (
                  <div className="card-form">
                    {/* Card Number */}
                    <div className="card-form-group">
                      <label className="card-form-label">Số thẻ</label>
                      <div className="card-number-wrapper">
                        <input
                          type="text"
                          className="card-form-input"
                          placeholder="0000 0000 0000 0000"
                          value={cardForm.cardNumber}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                        />
                        {detectedCardType && (
                          <span className="card-type-badge">{detectedCardType}</span>
                        )}
                      </div>
                    </div>

                    {/* Holder Name */}
                    <div className="card-form-group">
                      <label className="card-form-label">Tên chủ thẻ</label>
                      <input
                        type="text"
                        className="card-form-input"
                        placeholder="NGUYEN VAN A"
                        value={cardForm.holderName}
                        onChange={(e) => handleInputChange('holderName', e.target.value.toUpperCase())}
                        style={{ fontFamily: 'inherit' }}
                      />
                    </div>

                    {/* Expiry + CVV */}
                    <div className="card-form-row">
                      <div className="card-form-group half">
                        <label className="card-form-label">Tháng hết hạn</label>
                        <select
                          className="card-form-input"
                          value={cardForm.expiryMonth}
                          onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                          style={{ fontFamily: 'inherit' }}
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="card-form-group half">
                        <label className="card-form-label">Năm hết hạn</label>
                        <select
                          className="card-form-input"
                          value={cardForm.expiryYear}
                          onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                          style={{ fontFamily: 'inherit' }}
                        >
                          <option value="">YYYY</option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="card-form-group half">
                        <label className="card-form-label">CVV</label>
                        <input
                          type="password"
                          className="card-form-input"
                          placeholder="•••"
                          maxLength={4}
                          value={cardForm.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    {/* Save card */}
                    <label className="save-card-option">
                      <input
                        type="checkbox"
                        checked={cardForm.saveCard}
                        onChange={(e) => handleInputChange('saveCard', e.target.checked)}
                      />
                      Lưu thẻ này cho lần thanh toán sau
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="checkout-account-card">
              <div className="checkout-account-header">
                <h3>Tài khoản GameNoob</h3>
              </div>
              <div className="checkout-account-body">
                <div className="checkout-account-row">
                  <span className="checkout-account-label">Tài khoản:</span>
                  <span className="checkout-account-value">{user.username}</span>
                </div>
                <div className="checkout-account-row">
                  <span className="checkout-account-label">Email:</span>
                  <span className="checkout-account-value">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div className="checkout-agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                id="checkout-agree"
              />
              <label htmlFor="checkout-agree">
                Tôi đồng ý với các điều khoản của{' '}
                <a href="#" onClick={(e) => e.preventDefault()}>Thỏa thuận người dùng GameNoob</a>
                {' '}(cập nhật lần cuối 15 Thg05, 2026).
              </label>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="checkout-sidebar">
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-title">MUA HÀNG TRÊN GAMENOOB</h2>
              <p className="checkout-summary-info">
                Một khi hoàn thành giao dịch này, phương thức thanh toán của bạn sẽ được ghi nợ
                và một email xác nhận đơn mua hàng sẽ được gửi tới bạn.
              </p>

              <button
                className={`checkout-buy-btn ${processing ? 'processing' : ''}`}
                disabled={!agreed || processing}
                onClick={handleCheckout}
              >
                {processing ? (
                  <><span className="btn-spinner"></span> Đang xử lý...</>
                ) : (
                  'Mua'
                )}
              </button>

              <p className="checkout-email-note">
                Xác nhận đơn hàng sẽ được gửi tới email của bạn tại {user.email}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && orderResult && (
        <div className="checkout-success-overlay">
          <div className="checkout-success-modal">
            <div className="success-icon">🎉</div>
            <h2>Thanh toán thành công!</h2>
            <p>Game đã được thêm vào thư viện của bạn.</p>
            <p className="success-order-id">Mã đơn hàng: #{orderResult.id} • {orderResult.paymentMethod} có số cuối **{orderResult.cardLastFour}</p>

            <div className="success-games-list">
              {purchasedGames.map(game => (
                <div key={game.id} className="success-game-item">
                  <img src={game.header_image} alt={game.name} className="success-game-img" />
                  <span className="success-game-name">{game.name}</span>
                </div>
              ))}
            </div>

            <div className="success-actions">
              <Link to="/" className="success-btn primary">Tiếp tục mua sắm</Link>
              <Link to="/" className="success-btn secondary">Về trang chủ</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
