import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi, verifyOtpApi, resendOtpApi } from '../api/authApi';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1); // 1: form đăng ký, 2: nhập OTP
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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

  // Đếm ngược cho nút gửi lại OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Bước 1: Đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp!');
    }
    setError('');
    setLoading(true);
    try {
      await registerApi(username, email, password);
      setStep(2);
      setCountdown(60);
      setSuccess('');
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
      await verifyOtpApi(email, otpCode);
      setSuccess('Xác thực thành công! Đang chuyển đến trang đăng nhập...');
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
      await resendOtpApi(email);
      setCountdown(60);
      setSuccess('Đã gửi lại mã OTP đến email của bạn.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err);
    }
  };

  // Xử lý nhập OTP
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Chỉ cho phép số
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Chỉ lấy 1 ký tự
    setOtp(newOtp);

    // Auto-focus sang ô tiếp theo
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Xóa → focus ô trước
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
        {/* Step Indicator */}
        {step === 2 && (
          <div className="step-indicator">
            <div className="step completed">1</div>
            <div className="step-line completed"></div>
            <div className="step active">2</div>
          </div>
        )}

        <h2>{step === 1 ? 'Đăng Ký' : 'Xác Thực Email'}</h2>
        
        {step === 2 && (
          <p className="auth-subtitle">
            Mã OTP đã được gửi đến <strong className="highlight-email">{email}</strong>
          </p>
        )}

        {error && <div className="auth-message error-msg">❌ {error}</div>}
        {success && <div className="auth-message success-msg">✅ {success}</div>}

        {step === 1 ? (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Tên hiển thị</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Nhập tên..."
                required 
              />
            </div>
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
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Nhập lại mật khẩu..."
                required 
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </form>
        ) : (
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
              {loading ? 'Đang xác thực...' : 'Xác Thực'}
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

        <p className="auth-switch">
          {step === 1 ? (
            <>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></>
          ) : (
            <button className="back-link" onClick={() => setStep(1)}>
              ← Quay lại đăng ký
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default Register;
