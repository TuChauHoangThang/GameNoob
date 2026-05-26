import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Cửa Hàng', to: '/' },
  { label: 'Thư Viện', to: '/library' },
  { label: 'Cộng Đồng', to: '/community' },
];

const CATEGORIES = ['Action', 'RPG', 'Strategy', 'Sports', 'Indie', 'Simulation', 'Horror', 'Adventure'];

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar({ onCart }) {
  const [searchVal, setSearchVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  const handleSearch = () => {
    if (searchVal.trim()) {
      navigate(`/?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="navbar-root">
      {/* Top bar omitted for brevity */}
      <div className="navbar-topbar">
        <div className="container navbar-topbar-inner">
          <Link to="/" className="topbar-brand" style={{ textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--steam-blue)">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            <span className="topbar-name">GAMENOOB</span>
          </Link>
          <nav className="topbar-links">
            {NAV_LINKS.map(l => (
              <Link key={l.label} to={l.to} className={`topbar-link ${isActive(l.to) ? 'active' : ''}`}>{l.label}</Link>
            ))}
          </nav>
          <div className="topbar-user">
            {user ? (
              <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={user.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer'} alt="avatar" className="user-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                <Link to="/profile" className="user-name" style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}>{user.username}</Link>
                <span className="topbar-sep">|</span>
                {user.is_admin && (
                  <>
                    <Link to="/admin" className="topbar-link" style={{ textDecoration: 'none', color: '#ff4655', fontWeight: 'bold' }}>Quản trị</Link>
                    <span className="topbar-sep">|</span>
                  </>
                )}
                <Link to="/profile" className="topbar-link" style={{ textDecoration: 'none', color: '#c6d4df' }}>Hồ sơ</Link>
                <span className="topbar-sep">|</span>
                <Link to="/wishlist" className="topbar-link" style={{ textDecoration: 'none', color: '#c6d4df' }}>Danh sách ước</Link>
                <span className="topbar-sep">|</span>
                <button onClick={handleLogout} className="topbar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>Đăng xuất</button>
              </div>
            ) : (
              <div className="auth-actions">
                <Link to="/login" className="btn-topbar" style={{ textDecoration: 'none' }}>Đăng nhập</Link>
                <span className="topbar-sep">|</span>
                <Link to="/register" className="topbar-link">Đăng ký</Link>
              </div>
            )}
            <Link to="/cart" className="cart-btn" title="Giỏ hàng">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.46 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      <nav className="navbar-main">
        <div className="container navbar-main-inner">
          <div className="nav-categories">
            <div className="nav-dropdown-trigger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
              Duyệt tìm
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              <div className="nav-dropdown">
                {CATEGORIES.map(c => <Link key={c} to={`/?genre=${encodeURIComponent(c)}`} className="dropdown-item">{c}</Link>)}
              </div>
            </div>
            <Link to="/?tag=sale" className="nav-link">Khuyến mãi</Link>
            <Link to="/?tag=new" className="nav-link">Mới ra mắt</Link>
            <Link to="/?tag=top" className="nav-link">Bán chạy</Link>
            <Link to="/?tag=free" className="nav-link">Miễn phí</Link>
          </div>
          <div className="nav-search">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm trong cửa hàng"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="search-btn" onClick={handleSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
