import { useState } from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const CATEGORIES = [
  { icon: '🔑', title: 'Tài khoản', desc: 'Đăng nhập, đổi mật khẩu, bảo mật 2 lớp.', link: '#account' },
  { icon: '💳', title: 'Thanh toán', desc: 'Phương thức thanh toán, hóa đơn, lịch sử mua.', link: '#payment' },
  { icon: '🎮', title: 'Thư viện game', desc: 'Kích hoạt game, tải về, lỗi khởi chạy.', link: '#library' },
  { icon: '♻️', title: 'Hoàn tiền', desc: 'Chính sách hoàn tiền và cách yêu cầu.', link: '/refund-policy' },
  { icon: '🐛', title: 'Báo cáo lỗi', desc: 'Gặp lỗi? Hãy báo cáo để chúng tôi khắc phục.', link: '/report-bug' },
  { icon: '👥', title: 'Cộng đồng', desc: 'Diễn đàn, Discord và các kênh hỗ trợ cộng đồng.', link: '/community' },
];

const FAQS = [
  {
    q: 'Tôi quên mật khẩu, phải làm gì?',
    a: 'Truy cập trang Đăng nhập và nhấn "Quên mật khẩu". Nhập email đăng ký và chúng tôi sẽ gửi link đặt lại mật khẩu trong vài phút.',
  },
  {
    q: 'GameNoob hỗ trợ những phương thức thanh toán nào?',
    a: 'Hiện tại chúng tôi hỗ trợ: VNPay (ATM, QR, Internet Banking), thẻ Visa/Mastercard, ví MoMo và ZaloPay.',
  },
  {
    q: 'Tôi mua game xong có thể chơi ngay không?',
    a: 'Có! Sau khi thanh toán thành công, game sẽ được thêm vào thư viện của bạn ngay lập tức. Nhấn "Tải về" để bắt đầu.',
  },
  {
    q: 'Chính sách hoàn tiền của GameNoob như thế nào?',
    a: 'Bạn có thể yêu cầu hoàn tiền trong vòng 14 ngày kể từ ngày mua, với điều kiện chơi dưới 2 giờ. Xem chi tiết tại trang Chính sách hoàn tiền.',
  },
  {
    q: 'Game tôi mua không chạy được, phải làm gì?',
    a: 'Vui lòng kiểm tra cấu hình máy tính so với yêu cầu tối thiểu của game. Nếu máy đủ cấu hình nhưng game vẫn lỗi, hãy thử cài lại DirectX/Visual C++ Redistributable hoặc liên hệ hỗ trợ.',
  },
  {
    q: 'Tôi có thể chơi game đã mua trên nhiều thiết bị không?',
    a: 'Có, tài khoản GameNoob của bạn có thể đăng nhập trên nhiều thiết bị. Tuy nhiên chỉ được chơi trên 1 thiết bị cùng lúc.',
  },
  {
    q: 'Làm sao để liên hệ hỗ trợ trực tiếp?',
    a: 'Bạn có thể gửi ticket tại trang Liên hệ, gọi hotline 1800 6868 (miễn phí), hoặc chat trực tiếp qua Discord của GameNoob.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)}>
        {q}
        <span className={`faq-question__arrow ${open ? 'open' : ''}`}>▼</span>
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-hero__icon">🛟</span>
        <h1 className="info-hero__title">Trung tâm hỗ trợ</h1>
        <p className="info-hero__subtitle">
          Tìm câu trả lời nhanh chóng hoặc liên hệ đội ngũ hỗ trợ GameNoob.
        </p>
      </div>

      <div className="container">
        {/* Categories */}
        <div className="info-section">
          <h2 className="info-section__title">Chọn danh mục hỗ trợ</h2>
          <div className="info-cards">
            {CATEGORIES.map(c => (
              <Link key={c.title} to={c.link} className="info-card" style={{ textDecoration: 'none' }}>
                <span className="info-card__icon">{c.icon}</span>
                <div className="info-card__title">{c.title}</div>
                <p className="info-card__text">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="info-section">
          <h2 className="info-section__title">Câu hỏi thường gặp</h2>
          <div className="faq-list">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* Still need help */}
        <div className="info-section">
          <h2 className="info-section__title">Vẫn cần trợ giúp?</h2>
          <p className="info-section__text">
            Đội ngũ hỗ trợ GameNoob sẵn sàng giúp bạn 24/7.
          </p>
          <div className="info-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <Link to="/contact" className="info-card" style={{ textDecoration: 'none' }}>
              <span className="info-card__icon">📬</span>
              <div className="info-card__title">Gửi ticket</div>
              <p className="info-card__text">Phản hồi trong 24 giờ làm việc</p>
            </Link>
            <div className="info-card">
              <span className="info-card__icon">📞</span>
              <div className="info-card__title">Gọi hotline</div>
              <p className="info-card__text">1800 6868 — miễn phí T2–T7</p>
            </div>
            <div className="info-card">
              <span className="info-card__icon">💬</span>
              <div className="info-card__title">Discord</div>
              <p className="info-card__text">Cộng đồng và hỗ trợ thời gian thực</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
