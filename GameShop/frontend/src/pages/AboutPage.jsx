import './InfoPage.css';

const STATS = [
  { value: '10,000+', label: 'Tựa game' },
  { value: '500K+',   label: 'Người chơi' },
  { value: '99.9%',   label: 'Uptime' },
  { value: '2020',    label: 'Năm thành lập' },
];

const VALUES = [
  { icon: '🎮', title: 'Đam mê game', text: 'Chúng tôi là những game thủ thực thụ, hiểu rõ điều bạn cần từ một nền tảng phân phối game.' },
  { icon: '🔒', title: 'Bản quyền chính hãng', text: 'Tất cả game trên GameNoob đều là bản quyền hợp lệ, đảm bảo trải nghiệm an toàn và ổn định nhất.' },
  { icon: '⚡', title: 'Tốc độ & hiệu suất', text: 'Hạ tầng đám mây hiện đại giúp tải game nhanh, thanh toán tức thì, không downtime.' },
  { icon: '🤝', title: 'Cộng đồng là trung tâm', text: 'GameNoob xây dựng không gian để game thủ Việt kết nối, chia sẻ và cùng nhau phát triển.' },
];

const MILESTONES = [
  { year: '2020', event: 'GameNoob ra mắt với 200 tựa game đầu tiên.' },
  { year: '2021', event: 'Đạt mốc 50,000 người dùng, mở rộng thư viện lên 2,000 game.' },
  { year: '2022', event: 'Tích hợp ví điện tử và thanh toán VNPay, phục vụ toàn quốc.' },
  { year: '2023', event: 'Ra mắt tính năng Cộng đồng và hệ thống đánh giá game.' },
  { year: '2024', event: 'Vượt mốc 500,000 người dùng, thư viện 10,000+ game.' },
  { year: '2026', event: 'Tiếp tục mở rộng với các nhà phát hành quốc tế lớn.' },
];

export default function AboutPage() {
  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-hero__icon">🎮</span>
        <h1 className="info-hero__title">Về GameNoob</h1>
        <p className="info-hero__subtitle">
          Nền tảng phân phối game bản quyền hàng đầu Việt Nam — nơi niềm đam mê game trở thành hiện thực.
        </p>
      </div>

      <div className="container">
        {/* Stats */}
        <div className="info-stats">
          {STATS.map(s => (
            <div key={s.label} className="stat-box">
              <div className="stat-box__value">{s.value}</div>
              <div className="stat-box__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Câu chuyện */}
        <div className="info-section">
          <h2 className="info-section__title">Câu chuyện của chúng tôi</h2>
          <p className="info-section__text">
            GameNoob được thành lập năm 2020 bởi nhóm những game thủ đam mê với một mục tiêu đơn giản:
            mang lại cho người chơi Việt Nam quyền truy cập vào kho game bản quyền khổng lồ với mức giá
            hợp lý và trải nghiệm mượt mà nhất có thể.
          </p>
          <p className="info-section__text">
            Khởi đầu từ một startup nhỏ, chúng tôi đã không ngừng lớn mạnh nhờ sự ủng hộ của cộng đồng
            game thủ Việt. Hôm nay, GameNoob tự hào phục vụ hơn 500,000 người chơi với thư viện
            hơn 10,000 tựa game từ các nhà phát hành lớn nhỏ trên toàn thế giới.
          </p>
        </div>

        {/* Giá trị cốt lõi */}
        <div className="info-section">
          <h2 className="info-section__title">Giá trị cốt lõi</h2>
          <div className="info-cards">
            {VALUES.map(v => (
              <div key={v.title} className="info-card">
                <span className="info-card__icon">{v.icon}</span>
                <div className="info-card__title">{v.title}</div>
                <p className="info-card__text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lịch sử phát triển */}
        <div className="info-section">
          <h2 className="info-section__title">Hành trình phát triển</h2>
          <div className="job-list">
            {MILESTONES.map(m => (
              <div key={m.year} className="job-card">
                <div>
                  <div className="job-card__title">{m.event}</div>
                </div>
                <span className="job-badge">{m.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
