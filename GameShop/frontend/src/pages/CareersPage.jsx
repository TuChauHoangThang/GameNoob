import './InfoPage.css';

const JOBS = [
  {
    title: 'Frontend Developer (React)',
    department: 'Kỹ thuật',
    type: 'Toàn thời gian',
    location: 'Hà Nội / Remote',
    level: 'Mid-Senior',
  },
  {
    title: 'Backend Developer (Node.js)',
    department: 'Kỹ thuật',
    type: 'Toàn thời gian',
    location: 'TP. HCM / Remote',
    level: 'Senior',
  },
  {
    title: 'Game Content Curator',
    department: 'Nội dung',
    type: 'Toàn thời gian',
    location: 'Hà Nội',
    level: 'Junior - Mid',
  },
  {
    title: 'UI/UX Designer',
    department: 'Thiết kế',
    type: 'Toàn thời gian',
    location: 'Remote',
    level: 'Mid',
  },
  {
    title: 'Customer Support Specialist',
    department: 'Hỗ trợ',
    type: 'Bán thời gian',
    location: 'TP. HCM',
    level: 'Entry',
  },
  {
    title: 'Marketing & Growth Manager',
    department: 'Marketing',
    type: 'Toàn thời gian',
    location: 'Hà Nội',
    level: 'Senior',
  },
];

const PERKS = [
  { icon: '💰', title: 'Lương cạnh tranh', text: 'Mức lương top 20% thị trường, review 2 lần/năm.' },
  { icon: '🏠', title: 'Làm việc linh hoạt', text: 'Remote-first, hybrid hoặc onsite tùy vị trí.' },
  { icon: '🎮', title: 'Free game hàng tháng', text: 'Nhân viên được nhận game miễn phí từ thư viện GameNoob.' },
  { icon: '📚', title: 'Học tập & phát triển', text: 'Ngân sách 10 triệu/năm cho khóa học và hội nghị.' },
  { icon: '🏥', title: 'Bảo hiểm sức khỏe', text: 'Gói bảo hiểm cao cấp cho nhân viên và gia đình.' },
  { icon: '🎉', title: 'Team building', text: 'Hoạt động team quarterly, du lịch công ty hàng năm.' },
];

export default function CareersPage() {
  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-hero__icon">💼</span>
        <h1 className="info-hero__title">Tuyển dụng</h1>
        <p className="info-hero__subtitle">
          Tham gia đội ngũ GameNoob — cùng nhau xây dựng tương lai gaming Việt Nam.
        </p>
      </div>

      <div className="container">
        {/* Perks */}
        <div className="info-section">
          <h2 className="info-section__title">Tại sao chọn GameNoob?</h2>
          <div className="info-cards">
            {PERKS.map(p => (
              <div key={p.title} className="info-card">
                <span className="info-card__icon">{p.icon}</span>
                <div className="info-card__title">{p.title}</div>
                <p className="info-card__text">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Job listings */}
        <div className="info-section">
          <h2 className="info-section__title">Vị trí đang tuyển</h2>
          <div className="job-list">
            {JOBS.map(j => (
              <div key={j.title} className="job-card">
                <div>
                  <div className="job-card__title">{j.title}</div>
                  <div className="job-card__meta">
                    <span className="job-badge">{j.department}</span>
                    <span className="job-badge">{j.type}</span>
                    <span className="job-badge">{j.location}</span>
                    <span className="job-badge">{j.level}</span>
                  </div>
                </div>
                <a href="mailto:careers@gamenoob.vn" className="btn-apply">
                  Ứng tuyển
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="info-section">
          <h2 className="info-section__title">Không tìm thấy vị trí phù hợp?</h2>
          <p className="info-section__text">
            Gửi CV của bạn đến <strong style={{ color: 'var(--steam-blue)' }}>careers@gamenoob.vn</strong> —
            chúng tôi luôn tìm kiếm những tài năng xuất sắc để bổ sung vào đội ngũ.
          </p>
        </div>
      </div>
    </div>
  );
}
