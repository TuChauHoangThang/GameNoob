import './InfoPage.css';

const CASES = [
  { icon: '✅', title: 'Được hoàn tiền', items: [
    'Mua game chưa tới 14 ngày và thời gian chơi dưới 2 giờ',
    'Game không chạy được do lỗi kỹ thuật từ phía nhà phát hành',
    'Bị tính tiền nhầm hoặc thanh toán trùng lặp',
    'Game bị gỡ khỏi nền tảng trong vòng 30 ngày sau khi mua',
  ]},
  { icon: '❌', title: 'Không được hoàn tiền', items: [
    'Thời gian chơi vượt quá 2 giờ',
    'Đã quá 14 ngày kể từ ngày mua',
    'Game được mua trong chương trình khuyến mãi đặc biệt có ghi rõ "không hoàn tiền"',
    'Tài khoản vi phạm điều khoản dịch vụ',
    'Lý do cá nhân (không thích game, máy yếu, v.v.) sau khi đã chơi trên 2 giờ',
  ]},
];

const STEPS = [
  { step: '01', title: 'Đăng nhập tài khoản', desc: 'Vào trang Thư viện và tìm game muốn hoàn tiền.' },
  { step: '02', title: 'Gửi yêu cầu', desc: 'Nhấn "Yêu cầu hoàn tiền" và điền lý do.' },
  { step: '03', title: 'Chờ xét duyệt', desc: 'Đội ngũ xử lý trong vòng 3–5 ngày làm việc.' },
  { step: '04', title: 'Nhận tiền', desc: 'Tiền hoàn về theo phương thức thanh toán gốc trong 5–10 ngày.' },
];

export default function RefundPolicyPage() {
  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-hero__icon">♻️</span>
        <h1 className="info-hero__title">Chính sách hoàn tiền</h1>
        <p className="info-hero__subtitle">
          GameNoob cam kết đảm bảo trải nghiệm mua sắm công bằng và minh bạch.
        </p>
      </div>

      <div className="container">
        {/* Cases */}
        <div className="info-section">
          <h2 className="info-section__title">Điều kiện hoàn tiền</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {CASES.map(c => (
              <div key={c.title} className="contact-form">
                <h3 style={{ color: 'var(--steam-highlight)', margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  {c.icon} {c.title}
                </h3>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {c.items.map(item => (
                    <li key={item} className="info-section__text" style={{ marginBottom: 0 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="info-section">
          <h2 className="info-section__title">Cách yêu cầu hoàn tiền</h2>
          <div className="info-cards">
            {STEPS.map(s => (
              <div key={s.step} className="info-card">
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--steam-blue)', marginBottom: '8px', display: 'block' }}>
                  {s.step}
                </span>
                <div className="info-card__title">{s.title}</div>
                <p className="info-card__text">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="info-section">
          <h2 className="info-section__title">Lưu ý quan trọng</h2>
          <p className="info-section__text">
            Chính sách này áp dụng cho tất cả game mua lẻ trên GameNoob. Các gói subscription
            có chính sách riêng được ghi rõ tại trang mô tả dịch vụ.
          </p>
          <p className="info-section__text">
            Nếu yêu cầu hoàn tiền bị từ chối và bạn không đồng ý, hãy liên hệ trực tiếp
            với đội ngũ hỗ trợ qua hotline <strong style={{ color: 'var(--steam-blue)' }}>1800 6868</strong> để
            được xem xét lại.
          </p>
        </div>
      </div>
    </div>
  );
}
