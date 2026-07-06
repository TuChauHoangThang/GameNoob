import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginApi, resendOtpApi, verifyOtpApi } from '../api/authApi';
import './Auth.css';

import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const otpRefs = useRef([]);
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Đếm ngược
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNeedVerification(false);
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      login(data.user, data.token);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.needVerification) {
        setNeedVerification(true);
        setUnverifiedEmail(err.email);
        setError(err.message);
      } else {
        setError(typeof err === 'string' ? err : err.message || 'Đã có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  // Gửi OTP xác thực cho tài khoản chưa verify
  const handleSendVerifyOtp = async () => {
    setError('');
    try {
      await resendOtpApi(unverifiedEmail);
      setShowOtpForm(true);
      setCountdown(60);
      setSuccess('Mã OTP đã được gửi đến email của bạn.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err);
    }
  };

  // Xác thực OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return setError('Vui lòng nhập đầy đủ mã OTP 6 số.');
    }
    setError('');
    setLoading(true);
    try {
      await verifyOtpApi(unverifiedEmail, otpCode);
      setSuccess('Xác thực thành công! Vui lòng đăng nhập lại.');
      setShowOtpForm(false);
      setNeedVerification(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng Nhập</h2>

        {error && <div className="auth-message error-msg">❌ {error}</div>}
        {success && <div className="auth-message success-msg">✅ {success}</div>}

        {/* OTP Form cho tài khoản chưa verify */}
        {showOtpForm ? (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <p className="auth-subtitle">
              Nhập mã OTP đã gửi đến <strong className="highlight-email">{unverifiedEmail}</strong>
            </p>
            <div className="otp-container" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-input ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Xác Thực'}
            </button>
            <div className="resend-section">
              <button
                type="button"
                className={`resend-btn ${countdown > 0 ? 'disabled' : ''}`}
                onClick={handleSendVerifyOtp}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
              </button>
            </div>
            <button type="button" className="back-link" onClick={() => { setShowOtpForm(false); setError(''); }}>
              ← Quay lại đăng nhập
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Nhập email..."
                  required 
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Nhập mật khẩu..."
                  required 
                />
              </div>

              {/* Nút xác thực cho tài khoản chưa verify */}
              {needVerification && (
                <button
                  type="button"
                  className="verify-btn"
                  onClick={handleSendVerifyOtp}
                >
                  📧 Gửi mã OTP xác thực
                </button>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>

              <div className="auth-links">
                <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
              </div>
            </form>
            <p className="auth-switch">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
