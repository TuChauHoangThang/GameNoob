import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (newPassword && newPassword !== confirmPassword) {
      return showMsg('Mật khẩu mới không khớp!', 'error');
    }

    const payload = {};
    if (username.trim() && username.trim() !== user.username) {
      payload.username = username.trim();
    }
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (!Object.keys(payload).length) {
      return showMsg('Không có thay đổi nào để lưu.', 'error');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Cập nhật lại user trong context + localStorage
      login(res.data.user, token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMsg('Cập nhật thành công!', 'success');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <main className="profile-page page-wrapper">
      <div className="profile-container">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="avatar-block">
            <div className="avatar-circle">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <h2 className="avatar-name">{user?.username}</h2>
            <p className="avatar-email">{user?.email}</p>
          </div>
          <nav className="profile-nav">
            <button className="profile-nav-item active">👤 Thông tin cá nhân</button>
            <button className="profile-nav-item" onClick={() => navigate('/library')}>📚 Thư viện game</button>
            <button className="profile-nav-item" onClick={() => navigate('/wishlist')}>❤️ Wishlist</button>
            <button className="profile-nav-item logout-btn" onClick={handleLogout}>🚪 Đăng xuất</button>
          </nav>
        </aside>

        {/* Main content */}
        <section className="profile-main">
          <h1 className="profile-title">Thông Tin Cá Nhân</h1>

          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </div>
          )}

          <form className="profile-form" onSubmit={handleSubmit}>
            {/* Email (readonly) */}
            <div className="form-section">
              <h3 className="form-section-title">Tài Khoản</h3>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-disabled"
                />
                <span className="input-hint">Email không thể thay đổi</span>
              </div>
              <div className="form-group">
                <label>Tên hiển thị</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên hiển thị mới..."
                  minLength={3}
                  maxLength={30}
                />
              </div>
            </div>

            {/* Đổi mật khẩu */}
            <div className="form-section">
              <h3 className="form-section-title">Đổi Mật Khẩu</h3>
              <p className="form-section-desc">Để trống nếu không muốn đổi mật khẩu</p>
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự..."
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                />
              </div>
            </div>

            <button type="submit" className="profile-save-btn" disabled={loading}>
              {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </form>

          {/* Thống kê nhanh */}
          <div className="profile-stats">
            <div className="pstat-card">
              <span className="pstat-icon">🎮</span>
              <span className="pstat-label">Thư viện</span>
              <button className="pstat-link" onClick={() => navigate('/library')}>Xem ngay →</button>
            </div>
            <div className="pstat-card">
              <span className="pstat-icon">❤️</span>
              <span className="pstat-label">Wishlist</span>
              <button className="pstat-link" onClick={() => navigate('/wishlist')}>Xem ngay →</button>
            </div>
            <div className="pstat-card">
              <span className="pstat-icon">🛒</span>
              <span className="pstat-label">Giỏ hàng</span>
              <button className="pstat-link" onClick={() => navigate('/cart')}>Xem ngay →</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
