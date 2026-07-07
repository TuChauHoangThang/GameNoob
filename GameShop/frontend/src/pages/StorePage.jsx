import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import GameSection from '../components/GameSection';
import './StorePage.css';

const CATEGORIES = [
  { icon: '⚔️', label: 'Action', count: 2450 },
  { icon: '🧙', label: 'RPG', count: 1820 },
  { icon: '♟️', label: 'Strategy', count: 980 },
  { icon: '🏎️', label: 'Racing', count: 640 },
  { icon: '👻', label: 'Horror', count: 730 },
  { icon: '🚀', label: 'Sci-Fi', count: 590 },
  { icon: '⚽', label: 'Sports', count: 410 },
  { icon: '🎮', label: 'Indie', count: 3100 },
];

const SORT_OPTIONS = [
  { value: 'default',    label: '🔀 Mặc định' },
  { value: 'price_asc',  label: '💰 Giá tăng dần' },
  { value: 'price_desc', label: '💸 Giá giảm dần' },
  { value: 'rating',     label: '⭐ Đánh giá cao nhất' },
  { value: 'name_asc',   label: '🔤 Tên A → Z' },
];

const PAGE_LIMIT = 20; // số game mỗi lần tải

// Hàm sắp xếp client-side
function sortGames(games, sortBy) {
  const arr = [...games];
  switch (sortBy) {
    case 'price_asc':
      return arr.sort((a, b) => (a.is_free ? 0 : (a.price_vnd || 0)) - (b.is_free ? 0 : (b.price_vnd || 0)));
    case 'price_desc':
      return arr.sort((a, b) => (b.is_free ? 0 : (b.price_vnd || 0)) - (a.is_free ? 0 : (a.price_vnd || 0)));
    case 'rating':
      return arr.sort((a, b) => (b.positive_ratings || 0) - (a.positive_ratings || 0));
    case 'name_asc':
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    default:
      return arr;
  }
}

export default function StorePage() {
  const [games, setGames]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]     = useState(true);
  const [offset, setOffset]       = useState(0);
  const [activeGenre, setActiveGenre] = useState('');
  const [sortBy, setSortBy]       = useState('default');
  const location = useLocation();

  // Các state cho phần hiển thị trang chủ riêng biệt
  const [homeNewReleases, setHomeNewReleases] = useState([]);
  const [homeOnSale, setHomeOnSale]           = useState([]);
  const [homeTopSellers, setHomeTopSellers]   = useState([]);
  const [homeSuggested, setHomeSuggested]     = useState([]);
  const [homeLoading, setHomeLoading]         = useState(true);

  const params      = new URLSearchParams(location.search);
  const searchQuery = params.get('q');
  const urlGenre    = params.get('genre');
  const urlTag      = params.get('tag');

  const isFiltered = !!(searchQuery || urlGenre || activeGenre || urlTag);

  // Khi filter/search thay đổi → reset về trang đầu
  useEffect(() => {
    if (urlGenre) setActiveGenre(urlGenre);
    else if (!searchQuery && !urlTag) setActiveGenre('');
    setOffset(0);
    setGames([]);
    setHasMore(true);
  }, [urlGenre, searchQuery, urlTag]);

  // Luôn load trending/top sellers trên sidebar khi mount
  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/games?tag=top&limit=10');
        if (res.data.success) {
          setHomeTopSellers(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching top sellers:', err);
      }
    };
    fetchTopSellers();
  }, []);

  // Tải dữ liệu các phần trang chủ riêng biệt nếu không dùng bộ lọc
  useEffect(() => {
    if (isFiltered) return;

    const fetchHomeData = async () => {
      setHomeLoading(true);
      try {
        const [resNew, resSale, resSuggested] = await Promise.all([
          axios.get('http://localhost:5000/api/games?tag=new&limit=5'),
          axios.get('http://localhost:5000/api/games?tag=sale&limit=12'),
          axios.get('http://localhost:5000/api/games?limit=10&offset=20'),
        ]);

        if (resNew.data.success) setHomeNewReleases(resNew.data.data);
        if (resSale.data.success) setHomeOnSale(resSale.data.data);
        if (resSuggested.data.success) setHomeSuggested(resSuggested.data.data);
      } catch (err) {
        console.error('Error fetching homepage sections:', err);
      } finally {
        setHomeLoading(false);
      }
    };

    fetchHomeData();
  }, [isFiltered]);

  // Build URL helper
  const buildUrl = useCallback((currentOffset) => {
    const base = 'http://localhost:5000/api/games';
    if (searchQuery) {
      return `${base}?q=${encodeURIComponent(searchQuery)}&limit=${PAGE_LIMIT}&offset=${currentOffset}`;
    }
    const genre = urlGenre || activeGenre;
    if (genre) {
      return `${base}?genre=${encodeURIComponent(genre)}&limit=${PAGE_LIMIT}&offset=${currentOffset}`;
    }
    if (urlTag) {
      return `${base}?tag=${urlTag}&limit=${PAGE_LIMIT}&offset=${currentOffset}`;
    }
    return `${base}?limit=${PAGE_LIMIT}&offset=${currentOffset}`;
  }, [searchQuery, urlGenre, activeGenre, urlTag]);

  // Load trang đầu khi filter thay đổi
  useEffect(() => {
    if (!isFiltered) return;
    const fetchGames = async () => {
      setLoading(true);
      try {
        const res = await axios.get(buildUrl(0));
        if (res.data.success) {
          setGames(res.data.data);
          setHasMore(res.data.data.length === PAGE_LIMIT);
          setOffset(PAGE_LIMIT);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [buildUrl, isFiltered]);

  // Load thêm khi bấm "Xem thêm"
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await axios.get(buildUrl(offset));
      if (res.data.success) {
        setGames(prev => [...prev, ...res.data.data]);
        setHasMore(res.data.data.length === PAGE_LIMIT);
        setOffset(prev => prev + PAGE_LIMIT);
      }
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const sortedGames  = sortGames(games, sortBy);

  const getActiveLabel = () => {
    if (searchQuery) return null;
    if (urlGenre || activeGenre) return `🎮 Thể loại: ${urlGenre || activeGenre}`;
    if (urlTag === 'sale') return '💸 Đang Giảm Giá';
    if (urlTag === 'new')  return '🆕 Siêu Phẩm Mới';
    if (urlTag === 'top')  return '🏆 Bán Chạy Nhất';
    if (urlTag === 'free') return '🆓 Game Miễn Phí';
    return null;
  };

  const activeLabel = getActiveLabel();

  const handleGenreClick = (genre) => {
    setActiveGenre(genre);
    setOffset(0);
    setGames([]);
    setHasMore(true);
    window.history.pushState({}, '', genre ? `/?genre=${encodeURIComponent(genre)}` : '/');
  };

  return (
    <main className="store-page page-wrapper">
      {!searchQuery && !activeLabel && <HeroBanner />}

      <div className="container">
        <div className="category-bar">
          <button
            className={`cat-pill ${!activeGenre && !searchQuery && !urlTag ? 'active' : ''}`}
            onClick={() => handleGenreClick('')}
          >
            <span className="cat-icon">🏠</span>
            <span className="cat-label">Tất cả</span>
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.label}
              className={`cat-pill ${(activeGenre === c.label || urlGenre === c.label) ? 'active' : ''}`}
              onClick={() => handleGenreClick(c.label)}
            >
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container store-layout">
        <div className="store-main">
          {/* Toolbar: sort + kết quả */}
          {!loading && (
            <div className="store-toolbar">
              <span className="result-count">
                {games.length} tựa game{hasMore ? '+' : ''}
              </span>
              <div className="sort-group">
                <label className="sort-label">Sắp xếp:</label>
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isFiltered ? (
            loading ? (
              <div className="section-loading">Đang tải danh sách game...</div>
            ) : (
              <>
                {searchQuery ? (
                  <GameSection title={`🔍 Kết quả tìm kiếm cho: "${searchQuery}"`} games={sortedGames} cols={5} />
                ) : (
                  <GameSection
                    title={activeLabel}
                    games={sortedGames}
                    cols={5}
                  />
                )}

                {/* Nút xem thêm — chỉ hiện khi đang filter hoặc search */}
                {(isFiltered || games.length >= PAGE_LIMIT) && (
                  <div className="load-more-wrap">
                    {hasMore ? (
                      <button
                        className="load-more-btn"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <span className="load-spinner">⏳ Đang tải...</span>
                        ) : (
                          '⬇️ Xem thêm game'
                        )}
                      </button>
                    ) : (
                      <p className="no-more-text">✅ Đã hiển thị tất cả {games.length} tựa game</p>
                    )}
                  </div>
                )}
              </>
            )
          ) : (
            homeLoading ? (
              <div className="section-loading">Đang tải cửa hàng...</div>
            ) : (
              <>
                <GameSection title="🆕 Siêu Phẩm Mới" games={homeNewReleases} cols={5} viewMoreLink="/?tag=new" />
                <GameSection title="💸 Đang Giảm Giá" games={homeOnSale} variant="grid" cols={4} viewMoreLink="/?tag=sale" />
                <GameSection title="🏆 Bán Chạy Nhất" games={homeTopSellers} cols={5} viewMoreLink="/?tag=top" />
                <GameSection title="🎮 Gợi Ý Cho Bạn" games={homeSuggested} cols={5} viewMoreLink="/?genre=Action" />
              </>
            )
          )}
        </div>

        <aside className="store-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">🔥 Trending Hôm Nay</h3>
            <div className="trending-list">
              {homeTopSellers.slice(0, 6).map((g, i) => (
                <div key={g.id} className="trending-item">
                  <span className="trending-rank">{i + 1}</span>
                  <img src={g.header_image} alt={g.name} className="trending-img" />
                  <div className="trending-info">
                    <span className="trending-name">{g.name}</span>
                    <span className="trending-price">
                      {g.is_free ? 'MIỄN PHÍ' : new Intl.NumberFormat('vi-VN').format(typeof g.price_vnd === 'string' ? parseInt(g.price_vnd) : g.price_vnd) + '₫'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">📊 Thống Kê</h3>
            <div className="store-stats-grid">
              {[
                { label: 'Tựa game', value: isFiltered ? (games.length + (hasMore ? '+' : '')) : '320+' },
                { label: 'Người dùng', value: '250K+' },
                { label: 'Giao dịch', value: '1.2M+' },
                { label: 'Đánh giá', value: '4.8 ⭐' },
              ].map(s => (
                <div key={s.label} className="stat-item">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
