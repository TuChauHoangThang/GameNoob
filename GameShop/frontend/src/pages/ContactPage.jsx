import { useState } from 'react';
import './InfoPage.css';

const CONTACT_INFO = [
  { icon: '📧', label: 'Email hỗ trợ', value: 'support@gamenoob.vn' },
  { icon: '📞', label: 'Hotline', value: '1800 6868 (miễn phí)' },
  { icon: '📍', label: 'Địa chỉ', value: '123 Đường Láng, Đống Đa, Hà Nội' },
  { icon: '🕐', label: 'Giờ làm việc', value: 'T2–T6: 8:00–18:00 | T7: 8:00–12:00' },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-hero__icon">📬</span>
        <h1 className="info-hero__title">Liên hệ</h1>
        <p className="info-hero__subtitle">
          Có câu hỏi hoặc muốn hợp tác? Chúng tôi luôn sẵn sàng lắng nghe.
        </p>
      </div>

      <div className="container">
        <div className="contact-grid">
          {/* Contact info */}
          <div>
            <div className="info-section">
              <h2 className="info-section__title">Thông tin liên hệ</h2>
              {CONTACT_INFO.map(item => (
                <div key={item.label} className="contact-info__item">
                  <span className="contact-info__icon">{item.icon}</span>
                  <div>
                    <div className="contact-info__label">{item.label}</div>
                    <div className="contact-info__value">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="info-section">
              <h2 className="info-section__title">Mạng xã hội</h2>
              <div className="info-cards" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {[
                  { icon: '📘', label: 'Facebook', href: '#' },
                  { icon: '💬', label: 'Discord', href: '#' },
                  { icon: '▶️', label: 'YouTube', href: '#' },
                  { icon: '🐦', label: 'Twitter/X', href: '#' },
                ].map(s => (
                  <a key={s.label} href={s.href} className="info-card" style={{ textDecoration: 'none' }}>
                    <span className="info-card__icon">{s.icon}</span>
                    <div className="info-card__title">{s.label}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          {sent ? (
            <div className="contact-form">
              <div className="form-success">
                <span className="form-success__icon">✅</span>
                <div className="form-success__title">Tin nhắn đã được gửi!</div>
                <p className="form-success__text">
                  Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                </p>
              </div>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <h3 style={{ color: 'var(--steam-highlight)', margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Gửi tin nhắn
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Chủ đề *</label>
                <select
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                >
                  <option value="">-- Chọn chủ đề --</option>
                  <option>Hỗ trợ kỹ thuật</option>
                  <option>Vấn đề thanh toán</option>
                  <option>Hợp tác kinh doanh</option>
                  <option>Báo chí & truyền thông</option>
                  <option>Tuyển dụng</option>
                  <option>Góp ý, phản hồi</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nội dung *</label>
                <textarea
                  rows={6}
                  placeholder="Mô tả chi tiết vấn đề hoặc yêu cầu của bạn..."
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-submit">Gửi tin nhắn</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
