import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordApi, verifyForgotOtpApi, resetPasswordApi, resendOtpApi } from '../api/authApi';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP, 3: đặt mật khẩu mới
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  // Đếm ngược
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Bước 1: Gửi email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return setError('Vui lòng nhập đầy đủ mã OTP 6 số.');
    }
    setError('');
    setLoading(true);
    try {
      await verifyForgotOtpApi(email, otpCode);
      setStep(3);
      setSuccess('');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp!');
    }
    if (newPassword.length < 6) {
      return setError('Mật khẩu phải có ít nhất 6 ký tự.');
    }
    setError('');
    setLoading(true);
    try {
      const otpCode = otp.join('');
      await resetPasswordApi(email, otpCode, newPassword);
      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    try {
      await forgotPasswordApi(email);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setSuccess('Đã gửi lại mã OTP đến email của bạn.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err);
    }
  };

  // Xử lý nhập OTP
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

  const stepTitles = {
    1: 'Quên Mật Khẩu',
    2: 'Nhập Mã OTP',
    3: 'Đặt Mật Khẩu Mới',
  };

  const stepDescriptions = {
    1: 'Nhập email tài khoản của bạn để nhận mã xác thực.',
    2: <>Mã OTP đã được gửi đến <strong className="highlight-email">{email}</strong></>,
    3: 'Tạo mật khẩu mới cho tài khoản của bạn.',
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Progress Steps */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'completed' : ''} ${step === 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'completed' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'completed' : ''} ${step === 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'completed' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'completed' : ''} ${step === 3 ? 'active' : ''}`}>3</div>
        </div>

        <h2>{stepTitles[step]}</h2>
        <p className="auth-subtitle">{stepDescriptions[step]}</p>

        {error && <div className="auth-message error-msg">❌ {error}</div>}
        {success && <div className="auth-message success-msg">✅ {success}</div>}

        {/* Bước 1: Nhập email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email tài khoản..."
                required
                autoFocus
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi Mã OTP'}
            </button>
          </form>
        )}

        {/* Bước 2: Nhập OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
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
              {loading ? 'Đang xác thực...' : 'Xác Thực OTP'}
            </button>

            <div className="resend-section">
              <p className="resend-text">Không nhận được mã?</p>
              <button
                type="button"
                className={`resend-btn ${countdown > 0 ? 'disabled' : ''}`}
                onClick={handleResendOtp}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Bước 3: Đặt mật khẩu mới */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự..."
                required
                minLength={6}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
