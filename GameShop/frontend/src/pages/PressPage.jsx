import './InfoPage.css';

const PRESS_ITEMS = [
  {
    icon: '📰',
    source: 'VnExpress',
    title: 'GameNoob vượt mốc 500,000 người dùng sau 4 năm hoạt động',
    date: 'Tháng 3, 2024',
  },
  {
    icon: '🖥️',
    source: 'GameK',
    title: 'Đánh giá GameNoob: Nền tảng phân phối game bản quyền tốt nhất Việt Nam?',
    date: 'Tháng 1, 2024',
  },
  {
    icon: '📱',
    source: 'Báo Thanh Niên',
    title: 'Xu hướng mua game bản quyền tăng mạnh, GameNoob hưởng lợi lớn',
    date: 'Tháng 11, 2023',
  },
  {
    icon: '🏆',
    source: 'TechInAsia',
    title: 'GameNoob raises Series A to expand Vietnamese gaming platform',
    date: 'Tháng 8, 2023',
  },
  {
    icon: '🎮',
    source: 'ICTNews',
    title: 'GameNoob ký kết hợp tác với 50 nhà phát hành game quốc tế',
    date: 'Tháng 5, 2023',
  },
  {
    icon: '💡',
    source: 'Forbes Vietnam',
    title: 'Top 10 startup công nghệ nổi bật nhất Việt Nam 2023',
    date: 'Tháng 2, 2023',
  },
];

const KITS = [
  { icon: '🖼️', title: 'Logo & Brand Assets', desc: 'Bộ logo, màu sắc và font chữ thương hiệu GameNoob.' },
  { icon: '📋', title: 'Fact Sheet', desc: 'Thông tin công ty, số liệu và thành tựu nổi bật.' },
  { icon: '🖼️', title: 'Screenshot & Media', desc: 'Ảnh chụp màn hình và media kit chất lượng cao.' },
];

export default function PressPage() {
  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-hero__icon">📰</span>
        <h1 className="info-hero__title">Báo chí</h1>
        <p className="info-hero__subtitle">
          Tin tức mới nhất về GameNoob từ các nguồn báo chí uy tín trong và ngoài nước.
        </p>
      </div>

      <div className="container">
        {/* Press coverage */}
        <div className="info-section">
          <h2 className="info-section__title">Báo chí nói gì về chúng tôi</h2>
          <div className="press-grid">
            {PRESS_ITEMS.map(item => (
              <div key={item.title} className="press-card">
                <div className="press-card__img">{item.icon}</div>
                <div className="press-card__body">
                  <div className="press-card__source">{item.source}</div>
                  <div className="press-card__title">{item.title}</div>
                  <div className="press-card__date">{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Press kit */}
        <div className="info-section">
          <h2 className="info-section__title">Bộ tài liệu báo chí</h2>
          <p className="info-section__text">
            Phóng viên và nhà báo có thể tải xuống bộ tài liệu báo chí GameNoob để sử dụng trong các bài viết.
          </p>
          <div className="info-cards">
            {KITS.map(k => (
              <div key={k.title} className="info-card">
                <span className="info-card__icon">{k.icon}</span>
                <div className="info-card__title">{k.title}</div>
                <p className="info-card__text">{k.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact for press */}
        <div className="info-section">
          <h2 className="info-section__title">Liên hệ truyền thông</h2>
          <p className="info-section__text">
            Để phỏng vấn, yêu cầu thông tin hoặc hợp tác truyền thông, vui lòng liên hệ:
            <strong style={{ color: 'var(--steam-blue)' }}> press@gamenoob.vn</strong>
          </p>
          <p className="info-section__text">
            Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
          </p>
        </div>
      </div>
    </div>
  );
}
