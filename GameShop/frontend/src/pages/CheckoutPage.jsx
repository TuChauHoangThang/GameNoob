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

const formatPrice = (price) => {
  if (!price || price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(price) + '₫';
};

const detectCardType = (number) => {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^9704/.test(n)) return 'Napas';
  return '';
};

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

// ── Payment method list ────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'card',    label: 'Thẻ ngân hàng', desc: 'Visa, Mastercard, Napas', icon: '💳' },
  { id: 'vnpay',   label: 'VNPay',         desc: 'Cổng thanh toán VNPay',   color: '#005baa' },
];

// ── EWallet confirm step ──────────────────────────────────────────────────
function EWalletStep({ provider, totalPrice, onBack, onConfirm, processing }) {
  const [step, setStep] = useState('qr');
  const [otp, setOtp] = useState('');
  const method = PAYMENT_METHODS.find(m => m.id === provider);

  return (
    <div className="ewallet-step">
      {step === 'qr' ? (
        <>
          <div className="ewallet-qr-header">
            <div className="ewallet-logo-big" style={{ background: method.color }}>{method.label}</div>
            <h3>Thanh toán qua {method.label}</h3>
            <p className="ewallet-amount">{formatPrice(totalPrice)}</p>
          </div>
          <div className="ewallet-qr-box">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <rect width="160" height="160" fill="#fff" rx="8"/>
              <rect x="10" y="10" width="50" height="50" fill="none" stroke={method.color} strokeWidth="4" rx="4"/>
              <rect x="100" y="10" width="50" height="50" fill="none" stroke={method.color} strokeWidth="4" rx="4"/>
              <rect x="10" y="100" width="50" height="50" fill="none" stroke={method.color} strokeWidth="4" rx="4"/>
              <rect x="20" y="20" width="30" height="30" fill={method.color} rx="2"/>
              <rect x="110" y="20" width="30" height="30" fill={method.color} rx="2"/>
              <rect x="20" y="110" width="30" height="30" fill={method.color} rx="2"/>
              {[60,70,80,90,100].map(x => [60,70,80,90,100].map(y =>
                Math.abs(x - y) % 20 === 0
                  ? <rect key={`${x}${y}`} x={x} y={y} width="8" height="8" fill={method.color} rx="1"/>
                  : null
              ))}
            </svg>
            <p className="ewallet-qr-hint">Mở app {method.label} và quét mã QR</p>
          </div>
          <div className="ewallet-divider"><span>hoặc</span></div>
          <button className="btn btn-primary ewallet-otp-btn" onClick={() => setStep('otp')}>
            Nhập mã OTP / xác nhận thủ công
          </button>
          <button className="ewallet-back-btn" onClick={onBack}>← Quay lại</button>
        </>
      ) : (
        <>
          <div className="ewallet-otp-header">
            <div className="ewallet-logo-big" style={{ background: method.color }}>{method.label}</div>
            <h3>Xác nhận thanh toán</h3>
            <p className="ewallet-otp-sub">Nhập mã OTP từ {method.label}</p>
          </div>
          <div className="ewallet-otp-form">
            <input
              type="text"
              className="otp-input"
              placeholder="Nhập mã OTP"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            />
            <p className="otp-hint">Demo: nhập bất kỳ 4-6 số để xác nhận</p>
          </div>
          <div className="ewallet-otp-actions">
            <button
              className="btn btn-green"
              style={{ background: method.color, borderColor: method.color, justifyContent: 'center' }}
              disabled={otp.length < 4 || processing}
              onClick={() => onConfirm(otp)}
            >
              {processing ? 'Đang xử lý...' : `Xác nhận ${method.label}`}
            </button>
            <button className="ewallet-back-btn" onClick={() => setStep('qr')}>← Quay lại QR</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { cartItems, totalPrice, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState('card');
  const [savedCards, setSavedCards]         = useState([]);
  const [paymentMode, setPaymentMode]       = useState('new');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [eWalletStep, setEWalletStep]       = useState(false);

  const [cardForm, setCardForm] = useState({
    cardNumber: '', holderName: '', expiryMonth: '', expiryYear: '', cvv: '', saveCard: false,
  });
  const [detectedCardType, setDetectedCardType] = useState('');
  const [agreed, setAgreed]         = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [purchasedGames, setPurchasedGames] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) { navigate('/login'); return; }
    if (cartItems.length === 0 && !showSuccess) { navigate('/cart'); return; }
    fetchSavedCards();
  }, [user]);

  useEffect(() => {
    if (cartItems.length > 0) setPurchasedGames([...cartItems]);
  }, [cartItems]);

  const fetchSavedCards = async () => {
    try {
      const res = await axios.get(`${API_URL}/cards`, { headers: getAuthHeader() });
      if (res.data.success) setSavedCards(res.data.data);
    } catch (e) {}
  };

  const deleteSavedCard = async (id) => {
    try {
      await axios.delete(`${API_URL}/cards/${id}`, { headers: getAuthHeader() });
      setSavedCards(p => p.filter(c => c.id !== id));
      if (selectedCardId === id) { setSelectedCardId(null); setPaymentMode('new'); }
    } catch (e) {}
  };

  const handleInput = (f, v) => setCardForm(p => ({ ...p, [f]: v }));

  const gameNoobPoints = Math.floor(totalPrice / 1000);

  // ── Thanh toán thẻ ngân hàng ──────────────────────────────────────────────
  const handleCardCheckout = async () => {
    setError('');
    if (!agreed) { setError('Bạn cần đồng ý điều khoản trước khi thanh toán.'); return; }

    if (paymentMode === 'saved') {
      if (!selectedCardId) { setError('Vui lòng chọn thẻ đã lưu.'); return; }
      if (!/^\d{3,4}$/.test(cardForm.cvv)) { setError('CVV không hợp lệ.'); return; }
      setProcessing(true);
      try {
        const res = await axios.post(`${API_URL}/saved-card`,
          { cardId: selectedCardId, cvv: cardForm.cvv },
          { headers: getAuthHeader() });
        if (res.data.success) { setOrderResult(res.data.order); setShowSuccess(true); await fetchCart(); }
      } catch (e) { setError(e.response?.data?.message || 'Lỗi thanh toán.'); }
      finally { setProcessing(false); }
      return;
    }

    const clean = cardForm.cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(clean)) { setError('Số thẻ phải đủ 16 chữ số.'); return; }
    if (!cardForm.holderName.trim()) { setError('Vui lòng nhập tên chủ thẻ.'); return; }
    if (!cardForm.expiryMonth || !cardForm.expiryYear) { setError('Vui lòng nhập ngày hết hạn.'); return; }
    if (!/^\d{3,4}$/.test(cardForm.cvv)) { setError('CVV không hợp lệ.'); return; }

    setProcessing(true);
    try {
      const res = await axios.post(`${API_URL}/process`, {
        cardNumber: clean, holderName: cardForm.holderName,
        expiryMonth: parseInt(cardForm.expiryMonth), expiryYear: parseInt(cardForm.expiryYear),
        cvv: cardForm.cvv, saveCard: cardForm.saveCard,
      }, { headers: getAuthHeader() });
      if (res.data.success) { setOrderResult(res.data.order); setShowSuccess(true); await fetchCart(); }
    } catch (e) { setError(e.response?.data?.message || 'Lỗi thanh toán.'); }
    finally { setProcessing(false); }
  };

  // ── Thanh toán VNPay (thật) ───────────────────────────────────────────────
  const handleVNPayCheckout = async () => {
    setError('');
    if (!agreed) { setError('Bạn cần đồng ý điều khoản trước khi thanh toán.'); return; }
    setProcessing(true);
    try {
      const res = await axios.post(`${API_URL}/vnpay/create`, {}, { headers: getAuthHeader() });
      if (res.data.success && res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (e) { setError(e.response?.data?.message || 'Lỗi tạo thanh toán VNPay.'); }
    finally { setProcessing(false); }
  };

  // ── Thanh toán ví điện tử (MoMo/ZaloPay demo) ────────────────────────────
  const handleEWalletConfirm = async (confirmCode) => {
    setError('');
    setProcessing(true);
    try {
      const res = await axios.post(`${API_URL}/ewallet`,
        { provider: selectedMethod, confirmCode },
        { headers: getAuthHeader() });
      if (res.data.success) {
        setOrderResult(res.data.order);
        setShowSuccess(true);
        setEWalletStep(false);
        await fetchCart();
      }
    } catch (e) { setError(e.response?.data?.message || 'Lỗi thanh toán.'); }
    finally { setProcessing(false); }
  };

  const handleCheckout = () => {
    if (selectedMethod === 'vnpay') handleVNPayCheckout();
    else if (selectedMethod === 'card') handleCardCheckout();
    else setEWalletStep(true);
  };

  const getCardIcon = (t) => ({ Visa: '💳', Mastercard: '💳', Napas: '🏦' }[t] || '💳');

  if (!user) return null;

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Steps */}
        <div className="checkout-steps">
          <Link to="/cart" className="checkout-step completed">Giỏ hàng</Link>
          <span className="checkout-step-arrow">▸</span>
          <span className="checkout-step active">Thanh toán</span>
          <span className="checkout-step-arrow">▸</span>
          <span className="checkout-step">Hoàn tất</span>
        </div>

        {error && <div className="checkout-error"><span>⚠️</span><span>{error}</span></div>}

        <div className="checkout-layout">
          <div className="checkout-main">

            {/* Order summary */}
            <div className="checkout-items-card">
              <div className="checkout-items-header">
                <h3>Đơn hàng</h3>
                <span className="checkout-item-count">{cartItems.length} game</span>
              </div>
              {cartItems.map(item => (
                <div key={item.id} className="checkout-item-row">
                  <img src={item.header_image} alt={item.name} className="checkout-item-img"/>
                  <span className="checkout-item-name">{item.name}</span>
                  <span className="checkout-item-platform">🖥️</span>
                  <span className="checkout-item-price">{formatPrice(item.price_vnd)}</span>
                </div>
              ))}
              <div className="checkout-totals">
                <div className="checkout-total-row grand">
                  <span className="checkout-total-label">Tổng cộng:</span>
                  <span className="checkout-total-value">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            {totalPrice > 0 && (
              <div className="checkout-points-bar">
                <span className="checkout-points-icon">⭐</span>
                <span>Nhận điểm GameNoob từ đơn hàng này</span>
                <span className="checkout-points-value">+{gameNoobPoints.toLocaleString('vi-VN')} điểm</span>
              </div>
            )}

            {/* Payment section */}
            {!eWalletStep ? (
              <div className="checkout-payment-card">
                <div className="checkout-payment-header"><h3>Phương thức thanh toán</h3></div>
                <div className="checkout-payment-body">

                  {/* Method tabs */}
                  <div className="payment-method-tabs">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.id}
                        className={`payment-method-tab ${selectedMethod === m.id ? 'active' : ''}`}
                        onClick={() => { setSelectedMethod(m.id); setError(''); }}
                      >
                        {m.icon
                          ? <span className="payment-tab-icon">{m.icon}</span>
                          : <span className="payment-tab-logo-text" style={{ color: m.color, fontWeight: 700, fontSize: 15 }}>{m.label}</span>
                        }
                        <span className="payment-tab-label">{m.label}</span>
                        <span className="payment-tab-desc">{m.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Card panel */}
                  {selectedMethod === 'card' && (
                    <div className="payment-panel">
                      {savedCards.length > 0 && (
                        <div className="saved-cards-section">
                          <div className="saved-cards-title">Thẻ đã lưu</div>
                          {savedCards.map(card => (
                            <div key={card.id}
                              className={`saved-card-item ${paymentMode === 'saved' && selectedCardId === card.id ? 'selected' : ''}`}
                              onClick={() => { setPaymentMode('saved'); setSelectedCardId(card.id); }}>
                              <input type="radio" className="saved-card-radio"
                                checked={paymentMode === 'saved' && selectedCardId === card.id}
                                onChange={() => { setPaymentMode('saved'); setSelectedCardId(card.id); }}/>
                              <span className="saved-card-icon">{getCardIcon(card.card_type)}</span>
                              <div className="saved-card-info">
                                <div className="saved-card-type">{card.card_type}</div>
                                <div className="saved-card-number">•••• •••• •••• {card.last_four}</div>
                              </div>
                              <button className="saved-card-delete"
                                onClick={e => { e.stopPropagation(); deleteSavedCard(card.id); }}>🗑️</button>
                            </div>
                          ))}
                          {paymentMode === 'saved' && selectedCardId && (
                            <div style={{ marginTop: 10, maxWidth: 200 }}>
                              <div className="card-form-group">
                                <label className="card-form-label">CVV</label>
                                <input type="password" className="card-form-input" placeholder="•••" maxLength={4}
                                  value={cardForm.cvv} onChange={e => handleInput('cvv', e.target.value.replace(/\D/g, ''))}/>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`new-card-toggle ${paymentMode === 'new' ? 'active' : ''}`}
                        onClick={() => { setPaymentMode('new'); setSelectedCardId(null); }}>
                        <span>➕</span><span>Thêm thẻ ngân hàng mới</span>
                      </div>
                      {paymentMode === 'new' && (
                        <div className="card-form">
                          <div className="card-form-group">
                            <label className="card-form-label">Số thẻ</label>
                            <div className="card-number-wrapper">
                              <input type="text" className="card-form-input" placeholder="0000 0000 0000 0000"
                                value={cardForm.cardNumber}
                                onChange={e => { const f = formatCardNumber(e.target.value); handleInput('cardNumber', f); setDetectedCardType(detectCardType(f)); }}
                                maxLength={19}/>
                              {detectedCardType && <span className="card-type-badge">{detectedCardType}</span>}
                            </div>
                          </div>
                          <div className="card-form-group">
                            <label className="card-form-label">Tên chủ thẻ</label>
                            <input type="text" className="card-form-input" placeholder="NGUYEN VAN A"
                              value={cardForm.holderName}
                              onChange={e => handleInput('holderName', e.target.value.toUpperCase())}
                              style={{ fontFamily: 'inherit' }}/>
                          </div>
                          <div className="card-form-row">
                            <div className="card-form-group half">
                              <label className="card-form-label">Tháng HH</label>
                              <select className="card-form-input" value={cardForm.expiryMonth}
                                onChange={e => handleInput('expiryMonth', e.target.value)} style={{ fontFamily: 'inherit' }}>
                                <option value="">MM</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m =>
                                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                              </select>
                            </div>
                            <div className="card-form-group half">
                              <label className="card-form-label">Năm HH</label>
                              <select className="card-form-input" value={cardForm.expiryYear}
                                onChange={e => handleInput('expiryYear', e.target.value)} style={{ fontFamily: 'inherit' }}>
                                <option value="">YYYY</option>
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y =>
                                  <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                            <div className="card-form-group half">
                              <label className="card-form-label">CVV</label>
                              <input type="password" className="card-form-input" placeholder="•••" maxLength={4}
                                value={cardForm.cvv} onChange={e => handleInput('cvv', e.target.value.replace(/\D/g, ''))}/>
                            </div>
                          </div>
                          <label className="save-card-option">
                            <input type="checkbox" checked={cardForm.saveCard}
                              onChange={e => handleInput('saveCard', e.target.checked)}/>
                            Lưu thẻ cho lần sau
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VNPay panel */}
                  {selectedMethod === 'vnpay' && (
                    <div className="payment-panel ewallet-panel">
                      <div className="ewallet-preview">
                        <div className="ewallet-preview-logo">
                          <div style={{ background: '#005baa', color: '#fff', fontWeight: 700, fontSize: 16, padding: '8px 20px', borderRadius: 6 }}>VNPay</div>
                        </div>
                        <div className="ewallet-preview-info">
                          <p className="ewallet-preview-title">
                            Thanh toán qua VNPay
                            <span className="badge-real">✓ Tích hợp thật</span>
                          </p>
                          <p className="ewallet-preview-desc">Bạn sẽ được chuyển sang cổng VNPay để hoàn tất giao dịch an toàn.</p>
                          <div className="vnpay-test-card">
                            <p className="test-card-title">🧪 Thẻ test Sandbox:</p>
                            <p>NH: <strong>NCB</strong> | Số thẻ: <strong>9704 1985 2619 1432 198</strong></p>
                            <p>Tên: <strong>NGUYEN VAN A</strong> | HH: <strong>07/15</strong> | OTP: <strong>123456</strong></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MoMo / ZaloPay panel */}
                  {['momo', 'zalopay'].includes(selectedMethod) && (
                    <div className="payment-panel ewallet-panel">
                      <div className="ewallet-preview">
                        <div className="ewallet-preview-info">
                          <p className="ewallet-preview-title">Thanh toán qua {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}</p>
                          <p className="ewallet-preview-desc">Bạn sẽ được chuyển sang màn hình xác nhận QR / OTP</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="checkout-payment-card">
                <div className="checkout-payment-body">
                  <EWalletStep provider={selectedMethod} totalPrice={totalPrice}
                    onBack={() => { setEWalletStep(false); setError(''); }}
                    onConfirm={handleEWalletConfirm} processing={processing}/>
                </div>
              </div>
            )}

            {/* Account */}
            <div className="checkout-account-card">
              <div className="checkout-account-header"><h3>Tài khoản</h3></div>
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

          </div>

          {/* Sidebar */}
          <aside className="checkout-sidebar">
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-title">XÁC NHẬN MUA HÀNG</h2>
              <div className="checkout-summary-method">
                <span className="summary-method-label">Thanh toán qua</span>
                <strong className="summary-method-value">
                  {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
                </strong>
              </div>
              <div className="checkout-summary-amount">
                <span>Tổng thanh toán</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
              <p className="checkout-summary-info">
                Sau khi hoàn tất, game sẽ được thêm ngay vào thư viện của bạn.
              </p>
              {!eWalletStep && (
                <div className="checkout-sidebar-agreement">
                  <input type="checkbox" id="checkout-agree" checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}/>
                  <label htmlFor="checkout-agree">
                    Tôi đồng ý với <a href="#" onClick={e => e.preventDefault()}>Điều khoản dịch vụ GameNoob</a>.
                  </label>
                </div>
              )}
              {!eWalletStep && (
                <button
                  className={`checkout-buy-btn ${processing ? 'processing' : ''}`}
                  disabled={!agreed || processing}
                  onClick={handleCheckout}
                >
                  {processing
                    ? <><span className="btn-spinner"></span> Đang xử lý...</>
                    : selectedMethod === 'card'
                      ? 'Thanh toán ngay'
                      : `Tiếp tục với ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}`
                  }
                </button>
              )}
              <p className="checkout-email-note">Xác nhận sẽ gửi đến: {user.email}</p>
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
            <p className="success-order-id">
              Đơn #{orderResult.id} • {orderResult.paymentMethod}
              {orderResult.cardLastFour ? ` •••• ${orderResult.cardLastFour}` : ''}
            </p>
            <div className="success-games-list">
              {purchasedGames.map(game => (
                <div key={game.id} className="success-game-item">
                  <img src={game.header_image} alt={game.name} className="success-game-img"/>
                  <span className="success-game-name">{game.name}</span>
                </div>
              ))}
            </div>
            <div className="success-actions">
              <Link to="/" className="success-btn primary">Tiếp tục mua sắm</Link>
              <Link to="/library" className="success-btn secondary">Vào Thư Viện</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
