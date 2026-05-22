import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './LibraryPage.css';

const API = 'http://localhost:5000/api';

/* ─── Helpers ─── */
function formatPlayTime(hours) {
  if (!hours || hours === 0) return 'Chưa chơi';
  if (hours < 1) return `${Math.round(hours * 60)} phút`;
  return `${hours.toFixed(1)} giờ`;
}

function formatLastPlayed(dateStr) {
  if (!dateStr) return 'Chưa chơi lần nào';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((now - d) / (1000 * 3600 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAcquired(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function parseGenres(genres) {
  if (!genres) return [];
  try {
    const parsed = typeof genres === 'string' ? JSON.parse(genres) : genres;
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch { return []; }
}

/* Fake achievement colors */
const ACH_COLORS = ['#d4af37','#c0392b','#2980b9','#27ae60','#8e44ad','#e67e22','#1abc9c','#2c3e50'];
const ACH_ICONS  = ['🏆','⚔️','🛡️','🔥','💎','🗡️','👑','🌟','🎯','🔑','💫','🎮'];

/* ─── Install Button Component ─── */
function InstallButton({ game, onStatusChange }) {
  const [status, setStatus] = useState(game.install_status || 'not_installed');
  const [progress, setProgress] = useState(0);

  const handleInstall = useCallback(async () => {
    if (status === 'installed') {
      // Gỡ cài đặt
      setStatus('not_installed');
      setProgress(0);
      await onStatusChange(game.game_id, 'not_installed');
      return;
    }
    if (status === 'installing') return;

    // Bắt đầu cài đặt
    setStatus('installing');
    setProgress(0);
    await onStatusChange(game.game_id, 'installing');

    // Giả lập tiến trình cài đặt (frontend simulation)
    let prog = 0;
    const interval = setInterval(async () => {
      prog += Math.random() * 12 + 5;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setProgress(100);
        setStatus('installed');
        await onStatusChange(game.game_id, 'installed');
      } else {
        setProgress(Math.round(prog));
      }
    }, 400);
  }, [status, game.game_id, onStatusChange]);

  if (status === 'installing') {
    return (
      <div className="install-progress-wrap">
        <div className="install-progress-bar">
          <div className="install-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="install-progress-label">
          <span>Đang cài đặt...</span>
          <span>{progress}%</span>
        </div>
      </div>
    );
  }

  if (status === 'installed') {
    return (
      <div className="install-btn-group">
        <button className="lib-play-btn" onClick={() => {}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          CHƠI
        </button>
        <button className="lib-icon-btn uninstall-btn" onClick={handleInstall} title="Gỡ cài đặt">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Gỡ cài đặt
        </button>
      </div>
    );
  }

  // not_installed
  return (
    <div className="install-btn-group">
      <button className="lib-install-btn" onClick={handleInstall}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
        </svg>
        Cài đặt
      </button>
    </div>
  );
}

/* ─── Main Component ─── */
export default function LibraryPage() {
  const [user, setUser]                 = useState(null);
  const [library, setLibrary]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeTab, setActiveTab]       = useState('store');
  const [favCollapsed, setFavCollapsed] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);

  /* Load user */
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch (e) {}
    }
  }, []);

  /* Fetch library from DB */
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchLibrary = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/checkout/library`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          const games = res.data.data;
          setLibrary(games);
          if (games.length > 0) setSelectedGame(games[0]);
        }
      } catch (err) {
        console.error('Lỗi tải thư viện:', err);
        setError('Không thể tải thư viện. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [user]);

  /* Update install status via API */
  const handleInstallStatusChange = useCallback(async (gameId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/checkout/library/${gameId}/install`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state
      setLibrary(prev =>
        prev.map(g => g.game_id === gameId ? { ...g, install_status: status } : g)
      );
      setSelectedGame(prev =>
        prev?.game_id === gameId ? { ...prev, install_status: status } : prev
      );
    } catch (err) {
      console.error('Lỗi cập nhật install:', err);
    }
  }, []);

  /* Update favorite status via API */
  const handleToggleFavorite = useCallback(async (gameId, isFavorite) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/checkout/library/${gameId}/favorite`,
        { isFavorite },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state
      setLibrary(prev =>
        prev.map(g => g.game_id === gameId ? { ...g, is_favorite: isFavorite } : g)
      );
      setSelectedGame(prev =>
        prev?.game_id === gameId ? { ...prev, is_favorite: isFavorite } : prev
      );
    } catch (err) {
      console.error('Lỗi cập nhật yêu thích:', err);
    }
  }, []);

  /* Filtered list */
  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return library;
    return library.filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [library, searchQuery]);

  /* Favorite list */
  const favoriteGames = useMemo(() => {
    return filteredLibrary.filter(g => g.is_favorite);
  }, [filteredLibrary]);

  /* Recent (last 5 by acquired_at) */
  const recentGames = useMemo(() =>
    [...library].sort((a, b) => new Date(b.acquired_at) - new Date(a.acquired_at)).slice(0, 5),
    [library]
  );

  /* Achievement mock based on game_id for consistency */
  const achEarned = selectedGame ? (selectedGame.game_id % 15) + 3 : 0;
  const achTotal  = selectedGame ? (selectedGame.game_id % 20) + 15 : 1;
  const achPercent = Math.round((achEarned / achTotal) * 100);

  const TABS = [
    { id: 'store',      label: 'Trang cửa hàng' },
    { id: 'dlc',        label: 'DLC' },
    { id: 'community',  label: 'Trung tâm cộng đồng' },
    { id: 'discussion', label: 'Thảo luận' },
    { id: 'guide',      label: 'Hướng dẫn' },
    { id: 'support',    label: 'Hỗ trợ' },
  ];

  /* ─── NOT LOGGED IN ─── */
  if (!user) {
    return (
      <div className="library-page">
        <aside className="library-sidebar">
          <div className="library-sidebar-header">
            <p className="library-sidebar-title">Trò chơi</p>
            <div className="library-search-bar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input type="text" placeholder="Tìm kiếm" disabled />
            </div>
          </div>
        </aside>
        <div className="library-login-prompt">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#2a475e">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          <h2>Đăng nhập để xem thư viện</h2>
          <p>Thư viện của bạn chứa tất cả các game đã mua. Đăng nhập để truy cập và chơi ngay!</p>
          <Link to="/login" className="lib-play-btn" style={{ textDecoration: 'none', fontSize: '14px', padding: '10px 28px' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="library-page">
        <aside className="library-sidebar">
          <div className="library-sidebar-header">
            <p className="library-sidebar-title">Trò chơi</p>
            <div className="library-search-bar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input type="text" placeholder="Tìm kiếm" disabled />
            </div>
          </div>
          <div className="library-game-list">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="lib-game-item">
                <div className="skeleton lib-game-icon" style={{ width: 34, height: 16 }} />
                <div className="skeleton" style={{ flex: 1, height: 12, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </aside>
        <div className="library-empty" style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 4, marginTop: 12 }} />
          <div className="skeleton" style={{ width: 300, height: 14, borderRadius: 4 }} />
        </div>
      </div>
    );
  }

  /* ─── MAIN RENDER ─── */
  return (
    <div className="library-page">
      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="library-sidebar">
        <div className="library-sidebar-header">
          <p className="library-sidebar-title">
            Trò chơi
            {library.length > 0 && (
              <span className="lib-category-count" style={{ marginLeft: 8 }}>{library.length}</span>
            )}
          </p>
          <div className="library-search-bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="library-game-list">
          {/* Yêu thích (nếu có) */}
          {favoriteGames.length > 0 && (
            <>
              <div
                className="lib-category-header fav-category-header"
                onClick={() => setFavCollapsed(v => !v)}
                style={{ marginTop: '4px', marginBottom: '4px' }}
              >
                <span style={{ color: '#f5b041' }}>{favCollapsed ? '▶ YÊU THÍCH' : '▼ YÊU THÍCH'}</span>
                <span className="lib-category-count fav-category-count" style={{ background: 'rgba(245, 176, 65, 0.15)', color: '#f5b041' }}>
                  {favoriteGames.length}
                </span>
              </div>

              {!favCollapsed && favoriteGames.map(game => (
                <div
                  key={`fav-${game.game_id}`}
                  className={`lib-game-item fav-game-item ${selectedGame?.game_id === game.game_id ? 'active' : ''}`}
                  onClick={() => setSelectedGame(game)}
                >
                  <img
                    src={game.header_image}
                    alt={game.name}
                    className="lib-game-icon"
                    onError={e => { e.target.onerror = null; e.target.style.background = '#2a475e'; e.target.src = ''; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lib-game-name" style={{ color: '#f5c56c' }}>★ {game.name}</div>
                    {game.play_time > 0 && (
                      <div className="lib-playtime-small">{formatPlayTime(game.play_time)}</div>
                    )}
                  </div>
                  {/* Install indicator dot */}
                  {game.install_status === 'installed' && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#a4d007', flexShrink: 0,
                    }} title="Đã cài đặt" />
                  )}
                </div>
              ))}
              
              <div style={{ height: '1px', background: 'var(--steam-border)', margin: '10px 16px 6px' }} />
            </>
          )}

          {/* Tất cả game đã mua */}
          {filteredLibrary.length > 0 ? (
            <>
              <div
                className="lib-category-header"
                onClick={() => setAllCollapsed(v => !v)}
              >
                <span>{allCollapsed ? '▶ TẤT CẢ TRÒ CHƠI' : '▼ TẤT CẢ TRÒ CHƠI'}</span>
                <span className="lib-category-count">{filteredLibrary.length}</span>
              </div>

              {!allCollapsed && filteredLibrary.map(game => (
                <div
                  key={game.game_id}
                  className={`lib-game-item ${selectedGame?.game_id === game.game_id ? 'active' : ''}`}
                  onClick={() => setSelectedGame(game)}
                >
                  <img
                    src={game.header_image}
                    alt={game.name}
                    className="lib-game-icon"
                    onError={e => { e.target.onerror = null; e.target.style.background = '#2a475e'; e.target.src = ''; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lib-game-name">{game.name}</div>
                    {game.play_time > 0 && (
                      <div className="lib-playtime-small">{formatPlayTime(game.play_time)}</div>
                    )}
                  </div>
                  {/* Install indicator dot */}
                  {game.install_status === 'installed' && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#a4d007', flexShrink: 0,
                    }} title="Đã cài đặt" />
                  )}
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: '20px 16px', color: '#5a7a90', fontSize: '12px', textAlign: 'center' }}>
              {searchQuery ? 'Không tìm thấy game nào' : 'Thư viện trống'}
            </div>
          )}

          {/* Add more games */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--steam-border)', marginTop: '6px' }}>
            <Link to="/" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: '#5a7a90', textDecoration: 'none',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Thêm trò chơi vào tài khoản
            </Link>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="library-main">
        {error && (
          <div style={{
            padding: '16px 24px', background: 'rgba(226,0,26,0.15)',
            borderBottom: '1px solid rgba(226,0,26,0.3)',
            color: '#ff6060', fontSize: '13px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {library.length === 0 && !error ? (
          /* EMPTY LIBRARY */
          <div className="library-empty">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.18 }}>
              <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            <h3>Thư viện trống</h3>
            <p>
              Bạn chưa mua game nào. Hãy ghé cửa hàng và mua game để chúng xuất hiện ở đây!
            </p>
            <Link to="/" className="lib-play-btn" style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 28px', marginTop: '8px' }}>
              🛒 Khám phá cửa hàng
            </Link>
          </div>
        ) : selectedGame ? (
          <>
            {/* ─── HERO BANNER ─── */}
            <div className="lib-hero">
              <div
                className="lib-hero-bg"
                style={{ backgroundImage: `url(${selectedGame.background || selectedGame.header_image})` }}
              />
              <div className="lib-hero-gradient" />
              <div className="lib-hero-content">
                <h1 className="lib-game-title-text">{selectedGame.name}</h1>

                {/* Stats row */}
                <div className="lib-stats-row">
                  <div className="lib-stat">
                    <span className="lib-stat-label">Trạng thái Cloud</span>
                    <span className="lib-stat-value" style={{ color: '#a4d007' }}>✓ Đã cập nhật</span>
                  </div>
                  <div className="lib-stat">
                    <span className="lib-stat-label">Lần cuối chơi</span>
                    <span className="lib-stat-value">{formatLastPlayed(selectedGame.last_played)}</span>
                  </div>
                  <div className="lib-stat">
                    <span className="lib-stat-label">Thời gian chơi</span>
                    <span className="lib-stat-value">{formatPlayTime(selectedGame.play_time)}</span>
                  </div>
                  <div className="lib-stat">
                    <span className="lib-stat-label">Mua lúc</span>
                    <span className="lib-stat-value">{formatAcquired(selectedGame.acquired_at)}</span>
                  </div>
                  <div className="lib-stat">
                    <span className="lib-stat-label">Thành tựu</span>
                    <span className="lib-stat-value">{achEarned}/{achTotal}</span>
                  </div>
                </div>

                {/* ─── ACTION BUTTONS (Install / Play / Wishlist...) ─── */}
                <div className="lib-hero-actions">
                  <InstallButton game={selectedGame} onStatusChange={handleInstallStatusChange} />
                  <button
                    className={`lib-icon-btn fav-btn ${selectedGame.is_favorite ? 'favorited' : ''}`}
                    onClick={() => handleToggleFavorite(selectedGame.game_id, !selectedGame.is_favorite)}
                    style={{
                      borderColor: selectedGame.is_favorite ? '#f5b041' : 'rgba(255,255,255,0.12)',
                      color: selectedGame.is_favorite ? '#f5b041' : 'var(--steam-text)',
                      background: selectedGame.is_favorite ? 'rgba(245, 176, 65, 0.1)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      {selectedGame.is_favorite ? (
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      ) : (
                        <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.37L12 6.1l1.7 4.02 4.38.37-3.32 2.88 1 4.28L12 15.4z" />
                      )}
                    </svg>
                    {selectedGame.is_favorite ? 'Đã yêu thích' : 'Yêu thích'}
                  </button>
                  <button className="lib-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    Danh sách ước
                  </button>
                  <button className="lib-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>

            {/* ─── TABS ─── */}
            <div className="lib-nav-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`lib-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ─── DETAIL PANELS ─── */}
            <div className="lib-detail">
              {/* LEFT: ACHIEVEMENTS + GAME INFO */}
              <div className="lib-achievements-section">

                {/* Achievement Panel */}
                <div className="lib-panel">
                  <div className="lib-panel-header">
                    <span>⭐ Thành Tựu</span>
                    <span style={{ color: '#66c0f4', fontWeight: 700 }}>
                      {achEarned}/{achTotal} ({achPercent}%)
                    </span>
                  </div>
                  <div className="lib-panel-body">
                    <div className="lib-achievement-bar-wrap">
                      <div className="lib-achievement-label">
                        <span>Tiến độ hoàn thành</span>
                        <span>{achPercent}%</span>
                      </div>
                      <div className="lib-achievement-bar">
                        <div className="lib-achievement-fill" style={{ width: `${achPercent}%` }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#7a9bb5', marginBottom: '10px' }}>
                      Bạn đã đạt {achEarned}/{achTotal} ({achPercent}%)
                    </div>
                    <div className="lib-achievement-icons">
                      {Array.from({ length: Math.min(achTotal, 12) }, (_, i) => (
                        <div
                          key={i}
                          title={i < achEarned ? `Thành tựu #${i+1} (Đạt được)` : `Thành tựu #${i+1} (Chưa đạt)`}
                          style={{
                            width: 44, height: 44, borderRadius: 4,
                            background: ACH_COLORS[i % ACH_COLORS.length],
                            border: `2px solid ${i < achEarned ? ACH_COLORS[i % ACH_COLORS.length] : 'rgba(255,255,255,0.1)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20,
                            filter: i >= achEarned ? 'grayscale(1) brightness(0.35)' : 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.15s, filter 0.15s',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => { if (i < achEarned) e.currentTarget.style.transform = 'scale(1.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          {ACH_ICONS[i % ACH_ICONS.length]}
                        </div>
                      ))}
                      {achTotal > 12 && (
                        <div style={{
                          width: 44, height: 44, borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)',
                          border: '2px solid var(--steam-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, color: '#7a9bb5', fontWeight: 700,
                        }}>+{achTotal - 12}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Game Info Panel */}
                <div className="lib-panel" style={{ marginTop: 16 }}>
                  <div className="lib-panel-header">
                    <span>🎮 Thông Tin Game</span>
                  </div>
                  <div className="lib-panel-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {[
                        { label: 'Trạng thái cài đặt', value: selectedGame.install_status === 'installed' ? '✅ Đã cài đặt' : selectedGame.install_status === 'installing' ? '⏳ Đang cài đặt' : '⬜ Chưa cài đặt' },
                        { label: 'Tổng giờ chơi', value: formatPlayTime(selectedGame.play_time) },
                        { label: 'Mua lúc', value: formatAcquired(selectedGame.acquired_at) },
                        { label: 'Lần cuối chơi', value: formatLastPlayed(selectedGame.last_played) },
                        { label: 'Nhà phát triển', value: (selectedGame.developers?.[0] || selectedGame.developers || 'N/A') },
                        { label: 'Ngày phát hành', value: selectedGame.release_date || 'N/A' },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#7a9bb5', letterSpacing: '0.06em', marginBottom: '3px' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--steam-highlight)' }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tags / Genres */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
                      {parseGenres(selectedGame.genres).map(tag => (
                        <span key={tag} style={{
                          padding: '3px 9px', borderRadius: '2px',
                          background: 'rgba(102,192,244,0.1)',
                          border: '1px solid rgba(102,192,244,0.2)',
                          fontSize: '11px', color: '#66c0f4',
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: ACTIVITY + RECENT */}
              <div className="lib-activity-section">

                {/* Activity Panel */}
                <div className="lib-panel">
                  <div className="lib-panel-header">
                    <span>📋 Hoạt Động</span>
                  </div>
                  <div className="lib-panel-body">
                    <div style={{ fontSize: '12px', color: '#5a7a90', marginBottom: '10px' }}>
                      Bạn đã chơi trong <strong style={{ color: 'var(--steam-highlight)' }}>{formatPlayTime(selectedGame.play_time)}</strong> tổng cộng.
                    </div>

                    {/* Rating buttons */}
                    <div style={{
                      background: 'rgba(0,0,0,0.25)', border: '1px solid var(--steam-border)',
                      borderRadius: '3px', padding: '10px 12px',
                      display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap',
                    }}>
                      <span style={{ fontSize: '12px', color: '#7a9bb5', flex: 1 }}>
                        Bạn đã chơi được {formatPlayTime(selectedGame.play_time)}.
                        <br/>Bạn có muốn đề nghị trò chơi này tới người khác?
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['👍 Có', '👎 Không', '⏱ Để sau'].map(label => (
                          <button key={label} style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--steam-border)',
                            color: '#7a9bb5', fontSize: '11px', padding: '4px 10px',
                            borderRadius: '2px', cursor: 'pointer', transition: 'all 0.12s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#c7d5e0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7a9bb5'; }}
                          >{label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Acquisition info */}
                    <div className="lib-activity-item">
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#27ae60', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 16, flexShrink: 0,
                      }}>🛒</div>
                      <div className="lib-activity-text">
                        Bạn đã mua <strong>{selectedGame.name}</strong>
                      </div>
                      <span className="lib-activity-time">{formatAcquired(selectedGame.acquired_at)}</span>
                    </div>

                    {selectedGame.last_played && (
                      <div className="lib-activity-item">
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#2980b9', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 16, flexShrink: 0,
                        }}>🎮</div>
                        <div className="lib-activity-text">
                          Chơi lần cuối: <strong>{selectedGame.name}</strong>
                        </div>
                        <span className="lib-activity-time">{formatLastPlayed(selectedGame.last_played)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Games Panel */}
                {recentGames.length > 1 && (
                  <div className="lib-panel" style={{ marginTop: 16 }}>
                    <div className="lib-panel-header">
                      <span>🕐 Mua Gần Đây</span>
                      <span style={{ fontSize: '11px', color: '#66c0f4' }}>{library.length} game</span>
                    </div>
                    <div className="lib-panel-body" style={{ padding: '8px' }}>
                      {recentGames.filter(g => g.game_id !== selectedGame?.game_id).slice(0, 4).map(game => (
                        <div
                          key={game.game_id}
                          className="lib-game-item"
                          style={{ padding: '7px 8px', borderRadius: '3px', margin: '2px 0' }}
                          onClick={() => setSelectedGame(game)}
                        >
                          <img
                            src={game.header_image}
                            alt={game.name}
                            className="lib-game-icon"
                            style={{ width: 54, height: 25 }}
                            onError={e => { e.target.onerror = null; e.target.style.background = '#2a475e'; e.target.src = ''; }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="lib-game-name">{game.name}</div>
                            <div className="lib-playtime-small">
                              {game.play_time > 0 ? formatPlayTime(game.play_time) : `Mua ${formatAcquired(game.acquired_at)}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}