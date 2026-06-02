import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import './PaymentResultPage.css';

const API_URL = 'http://localhost:5000/api/checkout';
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const { fetchCart } = useCart();
  const [polling, setPolling] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const status  = searchParams.get('status');   // success | failed | invalid | error
  const txnRef  = searchParams.get('txnRef');
  const amount  = searchParams.get('amount');
  const bank    = searchParams.get('bank');
  const message = searchParams.get('message');
  const code    = searchParams.get('code');

  const isSuccess = status === 'success';

  // Return URL đã fulfill order rồi — chỉ cần refresh cart
  useEffect(() => {
    if (isSuccess) {
      fetchCart().finally(() => setPolling(false));
    } else {
      setPolling(false);
    }
  }, [isSuccess]);

  const formatPrice = (p) => p ? new Intl.NumberFormat('vi-VN').format(p) + '₫' : '';

  return (
    <div className="payment-result-page page-wrapper">
      <div className="payment-result-container">
        {isSuccess ? (
          <div className="result-card success">
            <div className="result-icon">
              {polling ? <div className="result-spinner" /> : <span>✅</span>}
            </div>
            <h1 className="result-title">
              {polling ? 'Đang xác nhận...' : 'Thanh toán thành công!'}
            </h1>
            {!polling && (
              <>
                <p className="result-sub">Game đã được thêm vào thư viện của bạn.</p>
                <div className="result-info-box">
                  {txnRef  && <div className="result-info-row"><span>Mã giao dịch</span><strong>{txnRef}</strong></div>}
                  {amount  && <div className="result-info-row"><span>Số tiền</span><strong>{formatPrice(amount)}</strong></div>}
                  {bank    && <div className="result-info-row"><span>Ngân hàng</span><strong>{bank}</strong></div>}
                </div>
                <div className="result-actions">
                  <Link to="/library" className="result-btn primary">📚 Vào Thư Viện</Link>
                  <Link to="/" className="result-btn secondary">🏠 Về Trang Chủ</Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="result-card failed">
            <div className="result-icon"><span>❌</span></div>
            <h1 className="result-title">Thanh toán thất bại</h1>
            <p className="result-sub">{decodeURIComponent(message || 'Giao dịch không thành công.')}</p>
            {code && <p className="result-code">Mã lỗi: {code}</p>}
            <div className="result-actions">
              <Link to="/checkout" className="result-btn primary">🔄 Thử lại</Link>
              <Link to="/cart" className="result-btn secondary">🛒 Về Giỏ Hàng</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
