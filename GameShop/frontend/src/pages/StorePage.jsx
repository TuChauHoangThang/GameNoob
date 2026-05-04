import HeroBanner from '../components/HeroBanner';
import GameSection from '../components/GameSection';
import './StorePage.css';

/* ───── MOCK DATA ───── */
const ALL_GAMES = [
  { id: 1,  title: "Dragon's Lair Online",  image: '/game_dragon.png',   price: 299000, originalPrice: 499000, discount: 40, tags: ['RPG','Fantasy'],    rating: 85, reviewCount: 12400, isNew: false },
  { id: 2,  title: 'Shadow Ops: Warfare',   image: '/game_shooter.png',  price: 199000, originalPrice: 399000, discount: 50, tags: ['Action','FPS'],     rating: 72, reviewCount: 8500,  isNew: false },
  { id: 3,  title: 'Turbo Rush GT',         image: '/game_racing.png',   price: 149000, originalPrice: null,   discount: 0,  tags: ['Racing','Sports'],  rating: 90, reviewCount: 5200,  isNew: true  },
  { id: 4,  title: 'Dead Frontier: Survive',image: '/game_survival.png', price: 0,      originalPrice: null,   discount: 0,  tags: ['Survival','Horror'],rating: 78, reviewCount: 21000, isFree: true },
  { id: 5,  title: 'Stellar Conquest',      image: '/game_space.png',    price: 199000, originalPrice: null,   discount: 0,  tags: ['Strategy','Sci-Fi'],rating: 88, reviewCount: 3100,  isNew: true  },
  { id: 6,  title: "Dragon's Lair Online 2",image: '/game_dragon.png',   price: 349000, originalPrice: 499000, discount: 30, tags: ['RPG','Action'],     rating: 82, reviewCount: 6700,  isNew: false },
  { id: 7,  title: 'Alpha Strike Force',    image: '/game_shooter.png',  price: 249000, originalPrice: null,   discount: 0,  tags: ['Action','FPS'],     rating: 65, reviewCount: 4300,  isNew: false },
  { id: 8,  title: 'Drift King Online',     image: '/game_racing.png',   price: 99000,  originalPrice: 199000, discount: 50, tags: ['Racing'],           rating: 80, reviewCount: 9800,  isNew: false },
  { id: 9,  title: 'Galactic Wars',         image: '/game_space.png',    price: 299000, originalPrice: 449000, discount: 33, tags: ['Strategy','Space'], rating: 76, reviewCount: 2800,  isNew: false },
  { id: 10, title: 'Zombie Outbreak 3',     image: '/game_survival.png', price: 129000, originalPrice: null,   discount: 0,  tags: ['Horror','Action'],  rating: 68, reviewCount: 15600, isNew: false },
];

const CATEGORIES = [
  { icon: '⚔️', label: 'Action', count: 2450 },
  { icon: '🧙', label: 'RPG', count: 1820 },
  { icon: '♟️', label: 'Chiến lược', count: 980 },
  { icon: '🏎️', label: 'Đua xe', count: 640 },
  { icon: '👻', label: 'Kinh dị', count: 730 },
  { icon: '🚀', label: 'Khoa học viễn tưởng', count: 590 },
  { icon: '⚽', label: 'Thể thao', count: 410 },
  { icon: '🎮', label: 'Indie', count: 3100 },
];

export default function StorePage() {
  const newReleases  = ALL_GAMES.filter(g => g.isNew || g.id <= 3);
  const topSellers   = [...ALL_GAMES].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 10);
  const onSaleGames  = ALL_GAMES.filter(g => g.discount > 0);

  return (
    <main className="store-page page-wrapper">
      {/* Hero */}
      <HeroBanner />

      {/* Category quick links */}
      <div className="container">
        <div className="category-bar">
          {CATEGORIES.map(c => (
            <a key={c.label} href="#" className="cat-pill">
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-label">{c.label}</span>
              <span className="cat-count">{c.count.toLocaleString()}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="container store-layout">
        <div className="store-main">

          {/* NEW RELEASES */}
          <GameSection title="🆕 Mới Ra Mắt" games={newReleases} cols={5} />

          {/* ON SALE */}
          <section className="sale-banner-section">
            <div className="sale-banner">
              <div className="sale-banner-content">
                <span className="sale-banner-tag">🔥 KHUYẾN MÃI HOT</span>
                <h2 className="sale-banner-title">Ưu đãi cuối tuần — Giảm đến 70%</h2>
                <p className="sale-banner-sub">Hàng trăm tựa game đang được giảm giá sốc trong thời gian giới hạn</p>
              </div>
              <button className="btn btn-green" style={{ fontSize: '15px', padding: '12px 28px' }}>
                Xem tất cả ưu đãi
              </button>
            </div>
          </section>

          <GameSection title="💸 Đang Giảm Giá" games={onSaleGames} variant="grid" cols={4} />

          {/* TOP SELLERS */}
          <GameSection title="🏆 Bán Chạy Nhất" games={topSellers.slice(0, 5)} cols={5} />

          {/* ALL GAMES */}
          <GameSection title="🎮 Tất Cả Trò Chơi" games={ALL_GAMES} cols={5} />
        </div>

        {/* SIDEBAR */}
        <aside className="store-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">🔥 Trending Hôm Nay</h3>
            <div className="trending-list">
              {topSellers.slice(0, 5).map((g, i) => (
                <div key={g.id} className="trending-item">
                  <span className="trending-rank">{i + 1}</span>
                  <img src={g.image} alt={g.title} className="trending-img" />
                  <div className="trending-info">
                    <span className="trending-name">{g.title}</span>
                    <span className="trending-price">
                      {g.isFree ? 'MIỄN PHÍ' : g.price.toLocaleString('vi-VN') + '₫'}
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
                { label: 'Tựa game', value: '10,000+' },
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

          <div className="sidebar-card promo-card">
            <h3 className="sidebar-title">🎁 Ưu Đãi Đặc Biệt</h3>
            <p className="promo-text">Đăng ký tài khoản Premium — nhận ngay 3 tháng miễn phí và 200,000₫ credit!</p>
            <button className="btn btn-green" style={{ width: '100%', marginTop: '8px' }}>
              Nâng cấp ngay
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
