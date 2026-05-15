import React, { useState, useEffect } from 'react';
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

export default function StorePage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const searchQuery = params.get('q');
        
        let url = 'http://localhost:5000/api/games?limit=100';
        if (searchQuery) {
          url = `http://localhost:5000/api/games?q=${encodeURIComponent(searchQuery)}&limit=50`;
        } else if (activeGenre) {
          url = `http://localhost:5000/api/games?genre=${activeGenre}&limit=40`;
        }
        
        const res = await axios.get(url);
        if (res.data.success) {
          setGames(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [activeGenre, location.search]);

  const newReleases  = games.slice(0, 10);
  const topSellers   = [...games].sort((a, b) => (b.positive_ratings + b.negative_ratings) - (a.positive_ratings + a.negative_ratings)).slice(0, 15);
  const onSaleGames  = games.filter((g, i) => i % 3 === 0).slice(0, 12);

  const searchQuery = new URLSearchParams(location.search).get('q');

  return (
    <main className="store-page page-wrapper">
      {!searchQuery && <HeroBanner />}

      <div className="container">
        <div className="category-bar">
          <button 
            className={`cat-pill ${activeGenre === '' && !searchQuery ? 'active' : ''}`}
            onClick={() => { setActiveGenre(''); window.history.pushState({}, '', '/'); }}
          >
            <span className="cat-icon">🏠</span>
            <span className="cat-label">Tất cả</span>
          </button>
          {CATEGORIES.map(c => (
            <button 
              key={c.label} 
              className={`cat-pill ${activeGenre === c.label ? 'active' : ''}`}
              onClick={() => { setActiveGenre(c.label); }}
            >
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container store-layout">
        <div className="store-main">
          {loading ? (
            <div className="section-loading">Đang tải danh sách game...</div>
          ) : (
            <>
              {searchQuery ? (
                <GameSection title={`🔍 Kết quả tìm kiếm cho: "${searchQuery}"`} games={games} cols={5} />
              ) : activeGenre ? (
                <GameSection title={`🎮 Thể loại: ${activeGenre}`} games={games} cols={5} />
              ) : (
                <>
                  <GameSection title="🆕 Siêu Phẩm Mới (2026)" games={newReleases.slice(0, 5)} cols={5} />
                  <GameSection title="💸 Đang Giảm Giá" games={onSaleGames} variant="grid" cols={4} />
                  <GameSection title="🏆 Bán Chạy Nhất" games={topSellers.slice(0, 10)} cols={5} />
                  <GameSection title="🎮 Gợi Ý Cho Bạn" games={games.slice(10, 30)} cols={5} />
                </>
              )}
            </>
          )}
        </div>


        <aside className="store-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">🔥 Trending Hôm Nay</h3>
            <div className="trending-list">
              {topSellers.slice(0, 6).map((g, i) => (
                <div key={g.id} className="trending-item">
                  <span className="trending-rank">{i + 1}</span>
                  <img src={g.header_image} alt={g.name} className="trending-img" />
                  <div className="trending-info">
                    <span className="trending-name">{g.name}</span>
                    <span className="trending-price">
                      {g.is_free ? 'MIỄN PHÍ' : g.price_vnd.toLocaleString('vi-VN') + '₫'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">📊 Thống Kê</h3>
            <div className="stats-grid">
              {[
                { label: 'Tựa game', value: games.length + '+' },
                { label: 'Người dùng', value: '250K+' },
                { label: 'Giao dịch', value: '1.2M+' },
                { label: 'Đánh giá', value: '4.8/5 ⭐' },
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

