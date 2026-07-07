import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

// API base URL
const API_URL = 'http://localhost:5000/api';

// ── Biểu đồ CỘT — Top game bán chạy ────────────────────────────────────────
function BarChart({ data }) {
  if (!data || data.length === 0) return <p style={{color:'#666',textAlign:'center',padding:'30px 0'}}>Chưa có dữ liệu</p>;
  const max = Math.max(...data.map(d => Number(d.sold_count)));
  const COLORS = ['#5cc8f8','#6dcc3f','#f8c840','#f04a4a','#a78bfa','#fb923c','#34d399','#f472b6','#60a5fa','#facc15'];
  return (
    <div style={{padding:'8px 0 0'}}>
      {data.map((d, i) => {
        const pct = max > 0 ? (Number(d.sold_count) / max) * 100 : 0;
        const shortName = d.name.length > 28 ? d.name.slice(0, 26) + '…' : d.name;
        return (
          <div key={i} style={{marginBottom:'10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
              <span style={{fontSize:'12px',color:'#c8dff0',fontWeight:500}}>{shortName}</span>
              <span style={{fontSize:'12px',color:COLORS[i % COLORS.length],fontWeight:700}}>{d.sold_count} lượt</span>
            </div>
            <div style={{height:'10px',background:'rgba(255,255,255,0.06)',borderRadius:'5px',overflow:'hidden'}}>
              <div style={{
                height:'100%', width:`${pct}%`, borderRadius:'5px',
                background:`linear-gradient(90deg, ${COLORS[i % COLORS.length]}99, ${COLORS[i % COLORS.length]})`,
                transition:'width 0.8s ease',
              }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Biểu đồ TRÒN (Donut) ─────────────────────────────────────────────────────
function DonutChart({ data, colors }) {
  if (!data || data.length === 0) return <p style={{color:'#666',textAlign:'center',padding:'30px 0'}}>Chưa có dữ liệu</p>;
  const COLORS = colors || ['#5cc8f8','#6dcc3f','#f8c840','#f04a4a','#a78bfa','#fb923c','#34d399','#f472b6'];
  const total = data.reduce((s, d) => s + Number(d.count), 0);
  const size = 160; const cx = size / 2; const cy = size / 2;
  const r = 58; const innerR = 34;

  let segments = [];
  let currentAngle = -90;
  data.forEach((d, i) => {
    const pct = total > 0 ? Number(d.count) / total : 0;
    const angle = pct * 360;
    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = ((currentAngle + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad); const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);   const y2 = cy + r * Math.sin(endRad);
    const xi1 = cx + innerR * Math.cos(startRad); const yi1 = cy + innerR * Math.sin(startRad);
    const xi2 = cx + innerR * Math.cos(endRad);   const yi2 = cy + innerR * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    if (pct > 0.005) {
      segments.push({ path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1} Z`, color: COLORS[i % COLORS.length], label: d.genre_name, count: d.count, pct: Math.round(pct * 100) });
    }
    currentAngle += angle;
  });

  return (
    <div style={{display:'flex',alignItems:'center',gap:'20px',padding:'8px 0'}}>
      <svg width={size} height={size} style={{flexShrink:0}}>
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.9}
            style={{transition:'opacity 0.2s',cursor:'default'}}
            onMouseEnter={e => e.target.style.opacity = 1}
            onMouseLeave={e => e.target.style.opacity = 0.9}>
            <title>{s.label}: {s.count} ({s.pct}%)</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#e8f4fd" fontSize="13" fontWeight="700">{total.toLocaleString()}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#8ab4d4" fontSize="9">tổng</text>
      </svg>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:'6px',overflow:'auto',maxHeight:`${size}px`}}>
        {segments.map((s, i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:'7px'}}>
            <div style={{width:'10px',height:'10px',borderRadius:'2px',background:s.color,flexShrink:0}}/>
            <span style={{fontSize:'11px',color:'#c8dff0',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.label}</span>
            <span style={{fontSize:'11px',color:s.color,fontWeight:700,flexShrink:0}}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Biểu đồ cột — Người dùng mới theo tháng ─────────────────────────────────
function UserGrowthChart({ data }) {
  if (!data || data.length === 0) return <p style={{color:'#666',textAlign:'center',padding:'30px 0'}}>Chưa có dữ liệu</p>;
  const max = Math.max(...data.map(d => Number(d.count)), 1);
  const chartH = 120; const barW = 36;
  const total = data.reduce((s, d) => s + Number(d.count), 0);
  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:'10px',height:`${chartH + 28}px`,padding:'0 4px'}}>
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((Number(d.count) / max) * chartH));
          return (
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,gap:'4px'}}>
              <span style={{fontSize:'11px',color:'#5cc8f8',fontWeight:700}}>{d.count}</span>
              <div style={{width:'100%',height:`${h}px`,background:'linear-gradient(180deg,#5cc8f8,#3a6a9a)',borderRadius:'4px 4px 0 0',minHeight:'4px',transition:'height 0.6s ease',cursor:'default'}} title={`${d.month}: ${d.count} người`}/>
              <span style={{fontSize:'10px',color:'#8ab4d4',whiteSpace:'nowrap'}}>{d.month}</span>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:'10px',padding:'10px 0 0',borderTop:'1px solid rgba(58,106,154,0.3)',display:'flex',gap:'16px'}}>
        <div><span style={{fontSize:'11px',color:'#8ab4d4'}}>Tổng mới: </span><span style={{fontSize:'13px',color:'#5cc8f8',fontWeight:700}}>{total.toLocaleString()}</span></div>
        <div><span style={{fontSize:'11px',color:'#8ab4d4'}}>Cao nhất: </span><span style={{fontSize:'13px',color:'#6dcc3f',fontWeight:700}}>{max.toLocaleString()}</span></div>
      </div>
    </div>
  );
}

// ── Bảng Top người dùng chi tiêu ────────────────────────────────────────────
function TopSpendersChart({ data, formatVND }) {
  if (!data || data.length === 0) return (
    <p style={{color:'#666',textAlign:'center',padding:'30px 0'}}>Chưa có dữ liệu giao dịch</p>
  );
  const maxSpent = Math.max(...data.map(d => Number(d.total_spent)));
  const medals = ['🥇','🥈','🥉'];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'9px',paddingTop:'4px'}}>
      {data.map((u, i) => {
        const pct = maxSpent > 0 ? (Number(u.total_spent) / maxSpent) * 100 : 0;
        const colors = ['#f8c840','#c0c0c0','#cd7f32'];
        const color = i < 3 ? colors[i] : '#5cc8f8';
        return (
          <div key={u.id} style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {/* Rank */}
            <div style={{
              width:'24px',textAlign:'center',fontSize:i < 3 ? '16px' : '12px',
              color: i >= 3 ? '#8ab4d4' : undefined, fontWeight:700, flexShrink:0
            }}>
              {i < 3 ? medals[i] : `#${i+1}`}
            </div>
            {/* Avatar + name */}
            <div style={{
              width:'28px',height:'28px',borderRadius:'50%',
              background:`rgba(${i===0?'248,200,64':i===1?'192,192,192':'205,127,50'},0.2)`,
              border:`1px solid ${color}44`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'12px',fontWeight:700,color,flexShrink:0
            }}>
              {u.username?.[0]?.toUpperCase() || '?'}
            </div>
            {/* Info + bar */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                <span style={{fontSize:'12px',color:'#e8f4fd',fontWeight:600,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'120px'
                }}>{u.username}</span>
                <span style={{fontSize:'11px',color,fontWeight:700,flexShrink:0,marginLeft:'4px'}}>
                  {formatVND(u.total_spent)}
                </span>
              </div>
              <div style={{height:'5px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,borderRadius:'3px',
                  background:`linear-gradient(90deg,${color}66,${color})`,transition:'width 0.7s ease'
                }}/>
              </div>
              <div style={{fontSize:'10px',color:'#8ab4d4',marginTop:'2px'}}>
                {u.order_count} đơn · {u.game_count} game
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Phân trang ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function Pagination({ page, totalPages, total, onPageChange, loading }) {
  if (total === 0) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        Hiển thị <strong>{start}–{end}</strong> / {total.toLocaleString()} mục
      </span>
      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-page-btn"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          ← Trước
        </button>
        <span className="admin-page-indicator">Trang {page} / {totalPages}</span>
        <button
          type="button"
          className="admin-page-btn"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // States for data
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);

  // Search & filter states
  const [gameSearch, setGameSearch] = useState('');
  const [gameSearchDebounced, setGameSearchDebounced] = useState('');
  const [gamePage, setGamePage] = useState(1);
  const [gameTotal, setGameTotal] = useState(0);
  const [gameTotalPages, setGameTotalPages] = useState(1);
  const [gamePriceFilter, setGamePriceFilter] = useState('all');
  const [gameSort, setGameSort] = useState('newest');

  const [userSearch, setUserSearch] = useState('');
  const [userSearchDebounced, setUserSearchDebounced] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSort, setUserSort] = useState('newest');

  // Inline edit state for game price
  const [editingGameId, setEditingGameId] = useState(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editIsFree, setEditIsFree] = useState(false);

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSearchDebounced, setOrderSearchDebounced] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderMethodFilter, setOrderMethodFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');

  // VNPay tab
  const [vnpayOrders, setVnpayOrders] = useState([]);
  const [vnpayPage, setVnpayPage] = useState(1);
  const [vnpayTotal, setVnpayTotal] = useState(0);
  const [vnpayTotalPages, setVnpayTotalPages] = useState(1);

  // Reviews tab
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewSearchDebounced, setReviewSearchDebounced] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  // Posts tab
  const [posts, setPosts] = useState([]);
  const [postSearch, setPostSearch] = useState('');
  const [postSearchDebounced, setPostSearchDebounced] = useState('');
  const [postPage, setPostPage] = useState(1);
  const [postTotal, setPostTotal] = useState(0);
  const [postTotalPages, setPostTotalPages] = useState(1);

  // Add game form
  const [addGameForm, setAddGameForm] = useState({ name: '', short_description: '', header_image: '', price_vnd: '', is_free: false, genres: '', developers: '', release_date: '' });
  const [steamAppId, setSteamAppId] = useState('');
  const [addGameLoading, setAddGameLoading] = useState(false);
  const [addGameMsg, setAddGameMsg] = useState(null);

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
      setOverviewLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/admin/stats`, getAxiosConfig());
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê.');
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      setTableLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: PAGE_SIZE,
        page: gamePage,
        sort: gameSort,
      });
      if (gameSearchDebounced) params.set('q', gameSearchDebounced);
      if (gamePriceFilter !== 'all') params.set('price', gamePriceFilter);

      const res = await axios.get(`${API_URL}/admin/games?${params}`, getAxiosConfig());
      if (res.data.success) {
        setGames(res.data.data);
        setGameTotal(res.data.pagination.total);
        setGameTotalPages(res.data.pagination.totalPages);
        if (gamePage > res.data.pagination.totalPages && res.data.pagination.totalPages > 0) {
          setGamePage(res.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải danh sách game.');
    } finally {
      setTableLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setTableLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: PAGE_SIZE,
        page: userPage,
        sort: userSort,
      });
      if (userSearchDebounced) params.set('q', userSearchDebounced);
      if (userRoleFilter !== 'all') params.set('role', userRoleFilter);

      const res = await axios.get(`${API_URL}/admin/users?${params}`, getAxiosConfig());
      if (res.data.success) {
        setUsers(res.data.data);
        setUserTotal(res.data.pagination.total);
        setUserTotalPages(res.data.pagination.totalPages);
        if (userPage > res.data.pagination.totalPages && res.data.pagination.totalPages > 0) {
          setUserPage(res.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setTableLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({ limit: PAGE_SIZE, page: orderPage, sort: orderSort });
      if (orderSearchDebounced) params.set('q', orderSearchDebounced);
      if (orderMethodFilter !== 'all') params.set('method', orderMethodFilter);
      const res = await axios.get(`${API_URL}/admin/orders?${params}`, getAxiosConfig());
      if (res.data.success) {
        setOrders(res.data.data);
        setOrderTotal(res.data.pagination.total);
        setOrderTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) { console.error(err); }
    finally { setTableLoading(false); }
  };

  const fetchVNPay = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({ limit: PAGE_SIZE, page: vnpayPage });
      const res = await axios.get(`${API_URL}/admin/vnpay-orders?${params}`, getAxiosConfig());
      if (res.data.success) {
        setVnpayOrders(res.data.data);
        setVnpayTotal(res.data.pagination.total);
        setVnpayTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) { console.error(err); }
    finally { setTableLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({ limit: PAGE_SIZE, page: reviewPage });
      if (reviewSearchDebounced) params.set('q', reviewSearchDebounced);
      const res = await axios.get(`${API_URL}/admin/reviews?${params}`, getAxiosConfig());
      if (res.data.success) {
        setReviews(res.data.data);
        setReviewTotal(res.data.pagination.total);
        setReviewTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) { console.error(err); }
    finally { setTableLoading(false); }
  };

  const fetchPosts = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({ limit: PAGE_SIZE, page: postPage });
      if (postSearchDebounced) params.set('q', postSearchDebounced);
      const res = await axios.get(`${API_URL}/admin/posts?${params}`, getAxiosConfig());
      if (res.data.success) {
        setPosts(res.data.data);
        setPostTotal(res.data.pagination.total);
        setPostTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) { console.error(err); }
    finally { setTableLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'games') return;
    const timer = setTimeout(() => setGameSearchDebounced(gameSearch.trim()), 400);
    return () => clearTimeout(timer);
  }, [gameSearch, activeTab]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    const timer = setTimeout(() => setUserSearchDebounced(userSearch.trim()), 400);
    return () => clearTimeout(timer);
  }, [userSearch, activeTab]);

  useEffect(() => {
    if (activeTab !== 'games') return;
    setGamePage(1);
  }, [gameSearchDebounced, activeTab]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    setUserPage(1);
  }, [userSearchDebounced, activeTab]);

  useEffect(() => {
    if (activeTab !== 'games') return;
    fetchGames();
  }, [activeTab, gamePage, gameSearchDebounced, gamePriceFilter, gameSort]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    fetchUsers();
  }, [activeTab, userPage, userSearchDebounced, userRoleFilter, userSort]);

  useEffect(() => {
    if (activeTab !== 'orders') return;
    const t = setTimeout(() => setOrderSearchDebounced(orderSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [orderSearch, activeTab]);

  useEffect(() => {
    if (activeTab !== 'orders') return;
    fetchOrders();
  }, [activeTab, orderPage, orderSearchDebounced, orderMethodFilter, orderSort]);

  useEffect(() => {
    if (activeTab !== 'vnpay') return;
    fetchVNPay();
  }, [activeTab, vnpayPage]);

  useEffect(() => {
    if (activeTab !== 'moderation') return;
    const t = setTimeout(() => setReviewSearchDebounced(reviewSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [reviewSearch, activeTab]);

  useEffect(() => {
    if (activeTab !== 'moderation') return;
    fetchReviews();
  }, [activeTab, reviewPage, reviewSearchDebounced]);

  useEffect(() => {
    if (activeTab !== 'moderation') return;
    const t = setTimeout(() => setPostSearchDebounced(postSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [postSearch, activeTab]);

  useEffect(() => {
    if (activeTab !== 'moderation') return;
    fetchPosts();
  }, [activeTab, postPage, postSearchDebounced]);


  const handleDeleteGame = async (gameId, gameName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa game "${gameName}" khỏi hệ thống?`)) {
      try {
        const res = await axios.delete(`${API_URL}/admin/games/${gameId}`, getAxiosConfig());
        if (res.data.success) { alert(res.data.message); fetchGames(); }
      } catch (err) { alert(err.response?.data?.message || 'Xóa game thất bại.'); }
    }
  };

  const startEditPrice = (game) => { setEditingGameId(game.id); setEditPrice(game.price_vnd); setEditIsFree(game.is_free); };

  const handleSavePrice = async (gameId) => {
    try {
      const res = await axios.patch(`${API_URL}/admin/games/${gameId}/price`, { price_vnd: editIsFree ? 0 : Number(editPrice), is_free: editIsFree }, getAxiosConfig());
      if (res.data.success) { alert(res.data.message); setEditingGameId(null); fetchGames(); }
    } catch (err) { alert(err.response?.data?.message || 'Cập nhật giá thất bại.'); }
  };

  // User management handlers
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Xóa tài khoản "${username}"? Hành động này không thể hoàn tác!`)) return;
    try {
      const res = await axios.delete(`${API_URL}/admin/users/${userId}`, getAxiosConfig());
      if (res.data.success) { alert(res.data.message); fetchUsers(); }
    } catch (err) { alert(err.response?.data?.message || 'Xóa user thất bại.'); }
  };

  const handleToggleAdmin = async (userId, username, currentIsAdmin) => {
    const action = currentIsAdmin ? 'thu hồi quyền admin' : 'cấp quyền admin';
    if (!window.confirm(`Bạn có muốn ${action} của "${username}"?`)) return;
    try {
      const res = await axios.patch(`${API_URL}/admin/users/${userId}/role`, { is_admin: !currentIsAdmin }, getAxiosConfig());
      if (res.data.success) { alert(res.data.message); fetchUsers(); }
    } catch (err) { alert(err.response?.data?.message || 'Thất bại.'); }
  };

  const handleToggleBan = async (userId, username, currentIsBanned) => {
    const action = currentIsBanned ? 'mở khóa' : 'khóa';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản "${username}"?`)) return;
    try {
      const res = await axios.patch(`${API_URL}/admin/users/${userId}/ban`, { is_banned: !currentIsBanned }, getAxiosConfig());
      if (res.data.success) { alert(res.data.message); fetchUsers(); }
    } catch (err) { alert(err.response?.data?.message || 'Thất bại.'); }
  };

  // Review/Post moderation
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Xóa review này?')) return;
    try {
      const res = await axios.delete(`${API_URL}/admin/reviews/${id}`, getAxiosConfig());
      if (res.data.success) { fetchReviews(); }
    } catch (err) { alert('Xóa thất bại.'); }
  };

  const handleDeletePost = async (id, title) => {
    if (!window.confirm(`Xóa bài "${title}"?`)) return;
    try {
      const res = await axios.delete(`${API_URL}/admin/posts/${id}`, getAxiosConfig());
      if (res.data.success) { fetchPosts(); }
    } catch (err) { alert('Xóa thất bại.'); }
  };

  // Add game handlers
  const handleAddGame = async (e) => {
    e.preventDefault();
    setAddGameLoading(true); setAddGameMsg(null);
    try {
      const res = await axios.post(`${API_URL}/admin/games`, addGameForm, getAxiosConfig());
      if (res.data.success) {
        setAddGameMsg({ type: 'success', text: res.data.message });
        setAddGameForm({ name: '', short_description: '', header_image: '', price_vnd: '', is_free: false, genres: '', developers: '', release_date: '' });
      }
    } catch (err) {
      setAddGameMsg({ type: 'error', text: err.response?.data?.message || 'Thêm game thất bại.' });
    } finally {
      setAddGameLoading(false);
    }
  };



  const handleImportSteam = async () => {
    if (!steamAppId) return;
    setAddGameLoading(true); setAddGameMsg(null);
    try {
      const res = await axios.post(`${API_URL}/admin/games/import-steam`, { steam_appid: steamAppId }, getAxiosConfig());
      if (res.data.success) {
        setAddGameMsg({ type: 'success', text: res.data.message });
        setSteamAppId('');
      }
    } catch (err) { setAddGameMsg({ type: 'error', text: err.response?.data?.message || 'Import thất bại.' }); }
    finally { setAddGameLoading(false); }
  };

  // Export CSV
  const handleExport = (type) => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/admin/export/${type}?token=${token}`;
    window.open(`${API_URL}/admin/export/${type}`, '_blank');
    // Dùng fetch với auth header để download
    fetch(`${API_URL}/admin/export/${type}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}_export.csv`;
        a.click();
      })
      .catch(() => alert('Xuất dữ liệu thất bại.'));
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
            className={`menu-item-btn ${activeTab === 'add-game' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-game')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Thêm Game
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
            Quản lý Users
          </button>
          <button 
            className={`menu-item-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Đơn hàng
          </button>
          <button 
            className={`menu-item-btn ${activeTab === 'vnpay' ? 'active' : ''}`}
            onClick={() => setActiveTab('vnpay')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            VNPay
          </button>
          <button 
            className={`menu-item-btn ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Kiểm duyệt
          </button>
          <button 
            className={`menu-item-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Xuất dữ liệu
          </button>
        </nav>

        {/* Admin info + exit buttons */}
        <div style={{
          marginTop: 'auto',
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
            Đang đăng nhập:
          </div>
          <div style={{ fontSize: '13px', color: '#ff4655', fontWeight: 700, marginBottom: '8px' }}>
            👤 {user?.username || 'Admin'}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(92,200,248,0.1)',
              border: '1px solid rgba(92,200,248,0.3)',
              color: '#5cc8f8',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(92,200,248,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(92,200,248,0.1)'}
          >
            🏪 Về cửa hàng
          </button>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,70,85,0.1)',
              border: '1px solid rgba(255,70,85,0.3)',
              color: '#ff4655',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,70,85,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,70,85,0.1)'}
          >
            🚪 Đăng xuất
          </button>
        </div>
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
              {activeTab === 'add-game' && 'Thêm game mới thủ công hoặc import từ Steam AppID'}
              {activeTab === 'users' && 'Quản lý tài khoản: phân quyền, khóa, xóa'}
              {activeTab === 'orders' && 'Danh sách tất cả đơn hàng của hệ thống'}
              {activeTab === 'vnpay' && 'Trạng thái giao dịch thanh toán qua VNPay'}
              {activeTab === 'moderation' && 'Kiểm duyệt reviews và bài viết cộng đồng'}
              {activeTab === 'export' && 'Xuất dữ liệu hệ thống ra file CSV'}
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
            {overviewLoading && !stats ? (
              <div className="admin-loading-spinner">
                <div className="double-spinner"></div>
              </div>
            ) : stats ? (
              <>
                {/* ── KPI Cards ── */}
                <section className="stats-grid">
                  <div className="stat-card revenue">
                    <div className="stat-info">
                      <span className="stat-label">Tổng doanh thu</span>
                      <span className="stat-value">{formatVND(stats.stats.totalRevenue)}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                    </div>
                  </div>
                </section>

                {/* ── Row 1: Biểu đồ cột game hot + Biểu đồ tròn thanh toán ── */}
                <div className="charts-row">
                  <div className="admin-section-box chart-box">
                    <div className="section-box-header">
                      <span className="section-box-title">🏆 Top 10 Game Bán Chạy</span>
                      <span style={{fontSize:'0.75rem',color:'var(--admin-text-secondary)'}}>Lượt mua</span>
                    </div>
                    <BarChart data={stats.topGamesFull || []} />
                  </div>

                  <div className="admin-section-box chart-box">
                    <div className="section-box-header">
                      <span className="section-box-title">💳 Phương thức thanh toán</span>
                    </div>
                    <DonutChart data={(stats.paymentStats || []).map(p => ({
                      genre_name: p.payment_method || 'Khác',
                      count: p.count
                    }))} colors={['#5cc8f8','#6dcc3f','#f8c840','#f04a4a','#a78bfa','#fb923c']} />
                  </div>
                </div>

                {/* ── Row 2: Người dùng theo tháng + Top spenders ── */}
                <div className="charts-row">
                  <div className="admin-section-box chart-box">
                    <div className="section-box-header">
                      <span className="section-box-title">👥 Người dùng mới theo tháng</span>
                      <span style={{fontSize:'0.75rem',color:'var(--admin-text-secondary)'}}>6 tháng gần nhất</span>
                    </div>
                    <UserGrowthChart data={stats.userGrowth || []} />
                  </div>

                  <div className="admin-section-box chart-box">
                    <div className="section-box-header">
                      <span className="section-box-title">💰 Top người dùng chi tiêu nhiều nhất</span>
                    </div>
                    <TopSpendersChart data={stats.topSpenders || []} formatVND={formatVND} />
                  </div>
                </div>

                {/* ── Row 3: Đơn hàng gần đây + Top game bán chạy ── */}
                <div className="dashboard-sections-grid">
                  <div className="admin-section-box">
                    <div className="section-box-header">
                      <span className="section-box-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        Đơn hàng gần đây
                      </span>
                      <span style={{fontSize:'0.8rem',color:'var(--admin-text-secondary)'}}>10 đơn mới nhất</span>
                    </div>
                    <div className="recent-orders-list">
                      {stats.recentOrders?.length === 0 ? (
                        <p style={{color:'var(--admin-text-secondary)',textAlign:'center',padding:'20px 0'}}>Chưa có đơn hàng.</p>
                      ) : stats.recentOrders?.map((order) => (
                        <div key={order.id} className="recent-order-item">
                          <div className="order-customer">
                            <span className="order-customer-name">{order.username}</span>
                            <span className="order-customer-email">{order.email}</span>
                          </div>
                          <div className="order-meta-info">
                            <span className="order-time">{formatDate(order.created_at)}</span>
                            <span className="order-payment">{order.payment_method}</span>
                            <span className="order-amt">{formatVND(order.total_amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

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
                        <p style={{color:'var(--admin-text-secondary)',textAlign:'center',padding:'20px 0'}}>Chưa có doanh số.</p>
                      ) : stats.topGames?.map((game) => (
                        <div key={game.id} className="top-game-item">
                          <img src={game.header_image} alt={game.name} className="top-game-img" />
                          <div className="top-game-detail">
                            <span className="top-game-name">{game.name}</span>
                            <span className="top-game-stats">{game.sold_count} lượt bán</span>
                          </div>
                          <span className="top-game-rev">{formatVND(game.revenue)}</span>
                        </div>
                      ))}
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
              <div className="admin-control-filters">
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
                <select
                  className="admin-filter-select"
                  value={gamePriceFilter}
                  onChange={(e) => { setGamePriceFilter(e.target.value); setGamePage(1); }}
                >
                  <option value="all">Tất cả giá</option>
                  <option value="free">Miễn phí</option>
                  <option value="paid">Có phí</option>
                </select>
                <select
                  className="admin-filter-select"
                  value={gameSort}
                  onChange={(e) => { setGameSort(e.target.value); setGamePage(1); }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name_asc">Tên A → Z</option>
                  <option value="name_desc">Tên Z → A</option>
                  <option value="price_asc">Giá thấp → cao</option>
                  <option value="price_desc">Giá cao → thấp</option>
                </select>
              </div>
              <span className="admin-result-count">
                Tổng <strong>{gameTotal.toLocaleString()}</strong> games
              </span>
            </div>

            {tableLoading && games.length === 0 ? (
              <div className="admin-loading-spinner">
                <div className="double-spinner"></div>
              </div>
            ) : (
              <>
                <div className={`table-responsive-wrapper ${tableLoading ? 'admin-table-loading' : ''}`}>
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
                                <img
                                  src={game.header_image}
                                  alt={game.name}
                                  className="admin-game-thumb"
                                  loading="lazy"
                                  decoding="async"
                                />
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
                <Pagination
                  page={gamePage}
                  totalPages={gameTotalPages}
                  total={gameTotal}
                  onPageChange={setGamePage}
                  loading={tableLoading}
                />
              </>
            )}
          </>
        )}

        {/* ─── TAB 3: USERS MANAGEMENT ─── */}
        {activeTab === 'users' && (
          <>
            <div className="admin-control-bar">
              <div className="admin-control-filters">
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
                <select
                  className="admin-filter-select"
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <select
                  className="admin-filter-select"
                  value={userSort}
                  onChange={(e) => { setUserSort(e.target.value); setUserPage(1); }}
                >
                  <option value="newest">Mới đăng ký</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name_asc">Tên A → Z</option>
                  <option value="name_desc">Tên Z → A</option>
                </select>
              </div>
              <span className="admin-result-count">
                Tổng <strong>{userTotal.toLocaleString()}</strong> khách hàng
              </span>
            </div>

            {tableLoading && users.length === 0 ? (
              <div className="admin-loading-spinner">
                <div className="double-spinner"></div>
              </div>
            ) : (
              <>
                <div className={`table-responsive-wrapper ${tableLoading ? 'admin-table-loading' : ''}`}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '8%' }}>ID</th>
                        <th style={{ width: '22%' }}>Tên tài khoản</th>
                        <th style={{ width: '28%' }}>Địa chỉ Email</th>
                        <th style={{ width: '12%' }}>Vai trò</th>
                        <th style={{ width: '12%' }}>Trạng thái</th>
                        <th style={{ width: '12%' }}>Ngày tham gia</th>
                        <th style={{ width: '16%', textAlign: 'center' }}>Hành động</th>

                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '30px' }}>
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
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: userObj.is_banned ? '#ff4655' : '#6dcc3f' }}>
                                {userObj.is_banned ? '🔒 Bị khóa' : '✓ Hoạt động'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                                {formatDate(userObj.created_at)}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleToggleAdmin(userObj.id, userObj.username, userObj.is_admin)}
                                  title={userObj.is_admin ? 'Thu hồi Admin' : 'Cấp Admin'}
                                  style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: userObj.is_admin ? 'rgba(248,200,64,0.2)' : 'rgba(92,200,248,0.15)', color: userObj.is_admin ? '#f8c840' : '#5cc8f8', fontWeight: 600 }}
                                >
                                  {userObj.is_admin ? '👑 Thu hồi' : '⬆ Admin'}
                                </button>
                                <button
                                  onClick={() => handleToggleBan(userObj.id, userObj.username, userObj.is_banned)}
                                  title={userObj.is_banned ? 'Mở khóa' : 'Khóa tài khoản'}
                                  style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: userObj.is_banned ? 'rgba(109,204,63,0.15)' : 'rgba(248,200,64,0.15)', color: userObj.is_banned ? '#6dcc3f' : '#f8c840', fontWeight: 600 }}
                                >
                                  {userObj.is_banned ? '🔓 Mở' : '🔒 Khóa'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(userObj.id, userObj.username)}
                                  title="Xóa tài khoản"
                                  style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: 'rgba(255,70,85,0.15)', color: '#ff4655', fontWeight: 600 }}
                                >
                                  🗑 Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={userPage}
                  totalPages={userTotalPages}
                  total={userTotal}
                  onPageChange={setUserPage}
                  loading={tableLoading}
                />
              </>
            )}
          </>
        )}
        {/* ─── TAB: ADD GAME ─── */}
        {activeTab === 'add-game' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Import từ Steam */}
            <div className="admin-section-box">
              <div className="section-box-header">
                <span className="section-box-title">🎮 Import từ Steam AppID</span>
              </div>
              <p style={{ color: 'var(--admin-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>Nhập Steam AppID để tự động lấy thông tin game từ Steam Store.</p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input className="admin-search-input" style={{ flex: 1 }} placeholder="VD: 570 (Dota 2), 730 (CS2)..." value={steamAppId} onChange={e => setSteamAppId(e.target.value)} />
                <button className="btn-price-save" onClick={handleImportSteam} disabled={addGameLoading} style={{ whiteSpace: 'nowrap' }}>
                  {addGameLoading ? '⏳ Đang import...' : '⬇️ Import'}
                </button>
              </div>
              {addGameMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: addGameMsg.type === 'success' ? 'rgba(109,204,63,0.15)' : 'rgba(255,70,85,0.15)', color: addGameMsg.type === 'success' ? '#6dcc3f' : '#ff4655', border: `1px solid ${addGameMsg.type === 'success' ? '#6dcc3f44' : '#ff465544'}` }}>
                  {addGameMsg.text}
                </div>
              )}
            </div>

            {/* Thêm thủ công */}
            <div className="admin-section-box">
              <div className="section-box-header">
                <span className="section-box-title">✏️ Thêm thủ công</span>
              </div>
              <form onSubmit={handleAddGame} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input className="admin-search-input" placeholder="Tên game *" required value={addGameForm.name} onChange={e => setAddGameForm(f => ({ ...f, name: e.target.value }))} />
                <input className="admin-search-input" placeholder="Mô tả ngắn" value={addGameForm.short_description} onChange={e => setAddGameForm(f => ({ ...f, short_description: e.target.value }))} />
                <input className="admin-search-input" placeholder="URL ảnh bìa" value={addGameForm.header_image} onChange={e => setAddGameForm(f => ({ ...f, header_image: e.target.value }))} />
                <input className="admin-search-input" placeholder="Nhà phát hành" value={addGameForm.developers} onChange={e => setAddGameForm(f => ({ ...f, developers: e.target.value }))} />
                <input className="admin-search-input" placeholder="Ngày phát hành (VD: 2024-01-15)" value={addGameForm.release_date} onChange={e => setAddGameForm(f => ({ ...f, release_date: e.target.value }))} />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input className="admin-search-input" type="number" placeholder="Giá (VND)" style={{ flex: 1 }} disabled={addGameForm.is_free} value={addGameForm.price_vnd} onChange={e => setAddGameForm(f => ({ ...f, price_vnd: e.target.value }))} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={addGameForm.is_free} onChange={e => setAddGameForm(f => ({ ...f, is_free: e.target.checked }))} /> Miễn phí
                  </label>
                </div>
                <button type="submit" className="btn-price-save" disabled={addGameLoading} style={{ padding: '11px', borderRadius: '8px' }}>
                  {addGameLoading ? '⏳ Đang thêm...' : '➕ Thêm game'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── TAB: ORDERS ─── */}
        {activeTab === 'orders' && (
          <>
            <div className="admin-control-bar">
              <div className="admin-control-filters">
                <div className="search-box-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="admin-search-input" placeholder="Tìm theo username, email..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
                </div>
                <select className="admin-filter-select" value={orderMethodFilter} onChange={e => { setOrderMethodFilter(e.target.value); setOrderPage(1); }}>
                  <option value="all">Tất cả thanh toán</option>
                  <option value="VNPay">VNPay</option>
                  <option value="Thẻ ngân hàng">Thẻ ngân hàng</option>
                </select>
                <select className="admin-filter-select" value={orderSort} onChange={e => { setOrderSort(e.target.value); setOrderPage(1); }}>
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="amount_desc">Giá trị cao → thấp</option>
                  <option value="amount_asc">Giá trị thấp → cao</option>
                </select>
              </div>
              <span className="admin-result-count">Tổng <strong>{orderTotal.toLocaleString()}</strong> đơn hàng</span>
            </div>
            <div className="table-responsive-wrapper">
              <table className="admin-table">
                <thead><tr>
                  <th>ID</th><th>Khách hàng</th><th>Số game</th><th>Tổng tiền</th><th>Thanh toán</th><th>Ngày đặt</th>
                </tr></thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '30px' }}>Chưa có đơn hàng nào.</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>#{o.id}</td>
                      <td>
                        <strong style={{ color: '#fff' }}>{o.username}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{o.email}</div>
                      </td>
                      <td><span style={{ color: '#5cc8f8', fontWeight: 700 }}>{o.item_count} game</span></td>
                      <td><span className="order-amt">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.total_amount)}</span></td>
                      <td><span className="badge-user" style={{ background: o.payment_method?.includes('VNPay') ? 'rgba(92,200,248,0.15)' : 'rgba(109,204,63,0.15)', color: o.payment_method?.includes('VNPay') ? '#5cc8f8' : '#6dcc3f' }}>{o.payment_method || 'N/A'}</span></td>
                      <td style={{ fontSize: '0.83rem', color: 'var(--admin-text-secondary)' }}>{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={orderPage} totalPages={orderTotalPages} total={orderTotal} onPageChange={setOrderPage} loading={tableLoading} />
          </>
        )}

        {/* ─── TAB: VNPAY ─── */}
        {activeTab === 'vnpay' && (
          <>
            <div className="table-responsive-wrapper">
              <table className="admin-table">
                <thead><tr>
                  <th>Mã GD (txn_ref)</th><th>Khách hàng</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th>
                </tr></thead>
                <tbody>
                  {vnpayOrders.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '30px' }}>Chưa có giao dịch VNPay nào.</td></tr>
                  ) : vnpayOrders.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontFamily: 'monospace', color: '#5cc8f8', fontSize: '12px' }}>{v.txn_ref || v.id}</td>
                      <td>
                        <strong style={{ color: '#fff' }}>{v.username || 'N/A'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{v.email}</div>
                      </td>
                      <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.amount)}</td>
                      <td>
                        <span className="badge-user" style={{ background: v.status === 'completed' ? 'rgba(109,204,63,0.15)' : v.status === 'pending' ? 'rgba(248,200,64,0.15)' : 'rgba(255,70,85,0.15)', color: v.status === 'completed' ? '#6dcc3f' : v.status === 'pending' ? '#f8c840' : '#ff4655' }}>
                          {v.status === 'completed' ? '✓ Thành công' : v.status === 'pending' ? '⏳ Chờ xử lý' : '✗ Thất bại'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.83rem', color: 'var(--admin-text-secondary)' }}>{formatDate(v.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={vnpayPage} totalPages={vnpayTotalPages} total={vnpayTotal} onPageChange={setVnpayPage} loading={tableLoading} />
          </>
        )}

        {/* ─── TAB: MODERATION ─── */}
        {activeTab === 'moderation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Reviews */}
            <div>
              <div className="admin-control-bar" style={{ marginBottom: '12px' }}>
                <div className="admin-control-filters">
                  <div className="search-box-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input className="admin-search-input" placeholder="Tìm reviews..." value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} />
                  </div>
                </div>
                <span className="admin-result-count">⭐ <strong>{reviewTotal}</strong> reviews</span>
              </div>
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead><tr><th>Game</th><th>Người dùng</th><th>Nội dung</th><th>Rating</th><th>Ngày</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '20px' }}>Chưa có review nào.</td></tr>
                    ) : reviews.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontSize: '12px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.game_name}</td>
                        <td><strong style={{ color: '#fff' }}>{r.username}</strong></td>
                        <td style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.content}</td>
                        <td><span style={{ color: '#f8c840', fontWeight: 700 }}>{'★'.repeat(Math.min(r.rating || 0, 5))}</span></td>
                        <td style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{formatDate(r.created_at)}</td>
                        <td><button className="btn-price-cancel" onClick={() => handleDeleteReview(r.id)} style={{ fontSize: '11px', padding: '4px 10px' }}>Xóa</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={reviewPage} totalPages={reviewTotalPages} total={reviewTotal} onPageChange={setReviewPage} loading={tableLoading} />
            </div>

            {/* Posts */}
            <div>
              <div className="admin-control-bar" style={{ marginBottom: '12px' }}>
                <div className="admin-control-filters">
                  <div className="search-box-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input className="admin-search-input" placeholder="Tìm bài viết..." value={postSearch} onChange={e => setPostSearch(e.target.value)} />
                  </div>
                </div>
                <span className="admin-result-count">💬 <strong>{postTotal}</strong> bài viết</span>
              </div>
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead><tr><th>Nội dung</th><th>Tác giả</th><th>Likes</th><th>Bình luận</th><th>Ngày</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {posts.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '20px' }}>Chưa có bài viết nào.</td></tr>
                    ) : posts.map(p => {
                      const displayTitle = p.content && p.content.length > 50 ? p.content.slice(0, 48) + '...' : p.content || 'Không có nội dung';
                      return (
                        <tr key={p.id}>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.content}>
                            <strong>{displayTitle}</strong>
                          </td>
                          <td>{p.username}</td>
                          <td><span style={{ color: '#f472b6' }}>❤ {p.like_count}</span></td>
                          <td><span style={{ color: '#5cc8f8' }}>💬 {p.comment_count}</span></td>
                          <td style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{formatDate(p.created_at)}</td>
                          <td><button className="btn-price-cancel" onClick={() => handleDeletePost(p.id, displayTitle)} style={{ fontSize: '11px', padding: '4px 10px' }}>Xóa</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={postPage} totalPages={postTotalPages} total={postTotal} onPageChange={setPostPage} loading={tableLoading} />
            </div>
          </div>
        )}

        {/* ─── TAB: EXPORT ─── */}
        {activeTab === 'export' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="admin-section-box">
              <div className="section-box-header">
                <span className="section-box-title">👥 Xuất danh sách Users</span>
              </div>
              <p style={{ color: 'var(--admin-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Xuất toàn bộ danh sách tài khoản (ID, username, email, quyền, trạng thái, ngày tham gia) ra file CSV.</p>
              <button className="btn-price-save" onClick={() => handleExport('users')} style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '14px', width: '100%' }}>
                ⬇️ Tải xuống users.csv
              </button>
            </div>
            <div className="admin-section-box">
              <div className="section-box-header">
                <span className="section-box-title">📦 Xuất danh sách Đơn hàng</span>
              </div>
              <p style={{ color: 'var(--admin-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Xuất toàn bộ lịch sử đơn hàng (ID, khách hàng, tổng tiền, phương thức, trạng thái, ngày đặt) ra file CSV.</p>
              <button className="btn-price-save" onClick={() => handleExport('orders')} style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '14px', width: '100%' }}>
                ⬇️ Tải xuống orders.csv
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: USERS (enhanced) - override previous users tab with action buttons ─── */}
      </main>
    </div>
  );
}
