import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

// API base URL
const API_URL = 'http://localhost:5000/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'games', 'users'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for data
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);

  // Search states
  const [gameSearch, setGameSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Inline edit state for game price
  const [editingGameId, setEditingGameId] = useState(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editIsFree, setEditIsFree] = useState(false);

  // Helper to format currency
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Axios config with token
  const getAxiosConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Fetch Dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/admin/stats`, getAxiosConfig());
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all games
  const fetchGames = async (search = '') => {
    try {
      setLoading(true);
      setError(null);
      const url = search 
        ? `${API_URL}/admin/games?q=${encodeURIComponent(search)}&limit=100`
        : `${API_URL}/admin/games?limit=100`;
      const res = await axios.get(url, getAxiosConfig());
      if (res.data.success) {
        setGames(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải danh sách game.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async (search = '') => {
    try {
      setLoading(true);
      setError(null);
      const url = search 
        ? `${API_URL}/admin/users?q=${encodeURIComponent(search)}&limit=100`
        : `${API_URL}/admin/users?limit=100`;
      const res = await axios.get(url, getAxiosConfig());
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  // Effect to load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'games') {
      fetchGames(gameSearch);
    } else if (activeTab === 'users') {
      fetchUsers(userSearch);
    }
  }, [activeTab]);

  // Debounced search for games
  useEffect(() => {
    if (activeTab !== 'games') return;
    const delayDebounce = setTimeout(() => {
      fetchGames(gameSearch);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [gameSearch]);

  // Debounced search for users
  useEffect(() => {
    if (activeTab !== 'users') return;
    const delayDebounce = setTimeout(() => {
      fetchUsers(userSearch);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [userSearch]);

  // Handle delete game
  const handleDeleteGame = async (gameId, gameName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa game "${gameName}" khỏi hệ thống?`)) {
      try {
        const res = await axios.delete(`${API_URL}/admin/games/${gameId}`, getAxiosConfig());
        if (res.data.success) {
          alert(res.data.message);
          fetchGames(gameSearch);
        }
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Xóa game thất bại.');
      }
    }
  };

  // Trigger inline editing for game price
  const startEditPrice = (game) => {
    setEditingGameId(game.id);
    setEditPrice(game.price_vnd);
    setEditIsFree(game.is_free);
  };

  // Save updated game price
  const handleSavePrice = async (gameId) => {
    try {
      const finalPrice = editIsFree ? 0 : Number(editPrice);
      const res = await axios.patch(
        `${API_URL}/admin/games/${gameId}/price`,
        { price_vnd: finalPrice, is_free: editIsFree },
        getAxiosConfig()
      );
      if (res.data.success) {
        alert(res.data.message);
        setEditingGameId(null);
        fetchGames(gameSearch);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Cập nhật giá thất bại.');
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
          </svg>
          <span className="sidebar-title">GAMENOOB HUB</span>
        </div>
        <nav className="sidebar-menu">
          <button 
            className={`menu-item-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Tổng quan
          </button>
          <button 
            className={`menu-item-btn ${activeTab === 'games' ? 'active' : ''}`}
            onClick={() => setActiveTab('games')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
              <path d="M6 12h12M12 6v12"/>
            </svg>
            Kho Games
          </button>
          <button 
            className={`menu-item-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Khách hàng
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main-content">
        {/* Header */}
        <div className="content-header">
          <div>
            <h1>Trang Quản Trị</h1>
            <p>
              {activeTab === 'overview' && 'Hệ thống đo lường hiệu suất kinh doanh & hoạt động GameShop'}
              {activeTab === 'games' && 'Danh mục sản phẩm games đang hoạt động'}
              {activeTab === 'users' && 'Danh sách tài khoản khách hàng đã đăng ký'}
            </p>
          </div>
          {activeTab === 'overview' && (
            <button className="btn-price-save" style={{ padding: '10px 18px', borderRadius: '8px' }} onClick={fetchStats}>
              Làm mới dữ liệu
            </button>
          )}
        </div>

        {/* Global Error message */}
        {error && (
          <div style={{
            background: 'rgba(255, 65, 108, 0.1)',
            border: '1px solid #ff416c',
            color: '#ff416c',
            padding: '15px 20px',
            borderRadius: '10px',
            marginBottom: '30px',
            fontSize: '0.95rem'
          }}>
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <>
            {loading && !stats ? (
              <div className="admin-loading-spinner">
                <div className="double-spinner"></div>
              </div>
            ) : stats ? (
              <>
                {/* Stats cards Grid */}
                <section className="stats-grid">
                  <div className="stat-card revenue">
                    <div className="stat-info">
                      <span className="stat-label">Tổng doanh thu</span>
                      <span className="stat-value">{formatVND(stats.stats.totalRevenue)}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                  </div>

                  <div className="stat-card users">
                    <div className="stat-info">
                      <span className="stat-label">Tổng khách hàng</span>
                      <span className="stat-value">{stats.stats.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                  </div>

                  <div className="stat-card games">
                    <div className="stat-info">
                      <span className="stat-label">Tổng số Games</span>
                      <span className="stat-value">{stats.stats.totalGames.toLocaleString()}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>

                  <div className="stat-card orders">
                    <div className="stat-info">
                      <span className="stat-label">Tổng đơn hàng</span>
                      <span className="stat-value">{stats.stats.totalOrders.toLocaleString()}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                    </div>
                  </div>
                </section>

                {/* Dashboard sections (Grid 2:1) */}
                <div className="dashboard-sections-grid">
                  {/* Cột trái: Đơn hàng gần nhất */}
                  <div className="admin-section-box">
                    <div className="section-box-header">
                      <span className="section-box-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        Đơn hàng gần đây
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>Hiển thị 10 đơn gần nhất</span>
                    </div>
                    <div className="recent-orders-list">
                      {stats.recentOrders?.length === 0 ? (
                        <p style={{ color: 'var(--admin-text-secondary)', textAlign: 'center', padding: '20px 0' }}>Chưa có đơn hàng nào.</p>
                      ) : (
                        stats.recentOrders?.map((order) => (
                          <div key={order.id} className="recent-order-item">
                            <div className="order-customer">
                              <span className="order-customer-name">{order.username}</span>
                              <span className="order-customer-email">{order.email}</span>
                            </div>
                            <div className="order-meta-info">
                              <span className="order-time">{formatDate(order.created_at)}</span>
                              <span className="order-payment">
                                {order.payment_method === 'stripe' ? `Stripe (...${order.card_last_four || '****'})` : order.payment_method}
                              </span>
                              <span className="order-amt">{formatVND(order.total_amount)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Cột phải: Top game bán chạy */}
                  <div className="admin-section-box">
                    <div className="section-box-header">
                      <span className="section-box-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        Top Games bán chạy
                      </span>
                    </div>
                    <div className="top-games-list">
                      {stats.topGames?.length === 0 ? (
                        <p style={{ color: 'var(--admin-text-secondary)', textAlign: 'center', padding: '20px 0' }}>Chưa có doanh số.</p>
                      ) : (
                        stats.topGames?.map((game) => (
                          <div key={game.id} className="top-game-item">
                            <img src={game.header_image} alt={game.name} className="top-game-img" />
                            <div className="top-game-detail">
                              <span className="top-game-name">{game.name}</span>
                              <span className="top-game-stats">{game.sold_count} lượt bán</span>
                            </div>
                            <span className="top-game-rev">{formatVND(game.revenue)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}

        {/* ─── TAB 2: GAMES MANAGEMENT ─── */}
        {activeTab === 'games' && (
          <>
            <div className="admin-control-bar">
              <div className="search-box-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="Tìm kiếm game..." 
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                Tìm thấy <strong>{games.length}</strong> games
              </span>
            </div>

            {loading && games.length === 0 ? (
              <div className="admin-loading-spinner">
                <div className="double-spinner"></div>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Game</th>
                      <th style={{ width: '15%' }}>Steam ID</th>
                      <th style={{ width: '25%' }}>Giá hiển thị (VND)</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '30px' }}>
                          Không tìm thấy game nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      games.map((game) => (
                        <tr key={game.id}>
                          <td>
                            <div className="admin-game-cell">
                              <img src={game.header_image} alt={game.name} className="admin-game-thumb" />
                              <div className="admin-game-title-info">
                                <span className="admin-game-title">{game.name}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="admin-game-appid">{game.steam_appid || 'N/A'}</span>
                          </td>
                          <td>
                            {editingGameId === game.id ? (
                              <div className="price-edit-form">
                                <input 
                                  type="number" 
                                  className="price-input-small"
                                  value={editPrice}
                                  disabled={editIsFree}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={editIsFree} 
                                    onChange={(e) => setEditIsFree(e.target.checked)}
                                  />
                                  Free
                                </label>
                                <button className="btn-price-save" onClick={() => handleSavePrice(game.id)}>
                                  Lưu
                                </button>
                                <button className="btn-price-cancel" onClick={() => setEditingGameId(null)}>
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: '600', color: game.is_free ? '#38ef7d' : '#fff' }}>
                                {game.is_free ? 'Miễn Phí' : formatVND(game.price_vnd)}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="admin-btn-action edit" 
                              title="Sửa giá tiền"
                              onClick={() => startEditPrice(game)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button 
                              className="admin-btn-action delete" 
                              title="Xóa game khỏi hệ thống"
                              onClick={() => handleDeleteGame(game.id, game.name)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ─── TAB 3: USERS MANAGEMENT ─── */}
        {activeTab === 'users' && (
          <>
            <div className="admin-control-bar">
              <div className="search-box-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="Tìm kiếm tài khoản..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                Tổng cộng <strong>{users.length}</strong> khách hàng
              </span>
            </div>

            {loading && users.length === 0 ? (
              <div className="admin-loading-spinner">
                <div className="double-spinner"></div>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>ID</th>
                      <th style={{ width: '30%' }}>Tên tài khoản</th>
                      <th style={{ width: '30%' }}>Địa chỉ Email</th>
                      <th style={{ width: '15%' }}>Vai trò</th>
                      <th style={{ width: '15%' }}>Ngày tham gia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '30px' }}>
                          Không tìm thấy người dùng nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      users.map((userObj) => (
                        <tr key={userObj.id}>
                          <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>#{userObj.id}</td>
                          <td>
                            <strong style={{ color: '#fff' }}>{userObj.username}</strong>
                          </td>
                          <td>{userObj.email}</td>
                          <td>
                            {userObj.is_admin ? (
                              <span className="badge-admin">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 8h2v2h-2v-2zm0-4h2v2h-2v-2z"/>
                                </svg>
                                ADMIN
                              </span>
                            ) : (
                              <span className="badge-user">USER</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                              {formatDate(userObj.created_at)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
