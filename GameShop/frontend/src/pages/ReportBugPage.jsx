import { useState } from 'react';
import './InfoPage.css';

const SEVERITY_LEVELS = [
  { key: 'low',      label: 'Thấp',   desc: 'Lỗi nhỏ, không ảnh hưởng nhiều' },
  { key: 'medium',   label: 'Trung bình', desc: 'Gây bất tiện nhưng vẫn dùng được' },
  { key: 'high',     label: 'Cao',    desc: 'Tính năng quan trọng bị ảnh hưởng' },
  { key: 'critical', label: 'Nghiêm trọng', desc: 'Không thể sử dụng, mất dữ liệu' },
];

const BUG_TYPES = [
  { icon: '💳', label: 'Thanh toán / mua hàng' },
  { icon: '🔑', label: 'Đăng nhập / tài khoản' },
  { icon: '🎮', label: 'Thư viện / tải game' },
  { icon: '🖥️', label: 'Giao diện / hiển thị' },
  { icon: '⚡', label: 'Hiệu suất / tốc độ' },
  { icon: '🔔', label: 'Thông báo' },
];

export default function ReportBugPage() {
  const [severity, setSeverity] = useState('');
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    title: '', bugType: '', description: '', steps: '', email: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-hero__icon">🐛</span>
        <h1 className="info-hero__title">Báo cáo lỗi</h1>
        <p className="info-hero__subtitle">
          Phát hiện lỗi? Hãy báo cáo để chúng tôi khắc phục nhanh nhất có thể.
        </p>
      </div>

      <div className="container">
        <div className="contact-grid">
          {/* Left info */}
          <div>
            <div className="info-section">
              <h2 className="info-section__title">Mức độ nghiêm trọng</h2>
              <div className="job-list">
                {SEVERITY_LEVELS.map(s => (
                  <div key={s.key} className="job-card" style={{ cursor: 'pointer', borderColor: severity === s.key ? 'var(--steam-blue)' : '' }}
                    onClick={() => setSeverity(s.key)}>
                    <div>
                      <div className="job-card__title">{s.label}</div>
                      <div className="info-section__text" style={{ margin: 0, fontSize: 13 }}>{s.desc}</div>
                    </div>
                    <span className={`severity-badge ${s.key}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-section">
              <h2 className="info-section__title">Mẹo báo cáo tốt</h2>
              {[
                '📝 Mô tả chi tiết các bước để tái hiện lỗi',
                '📸 Đính kèm ảnh chụp màn hình nếu có thể',
                '🌐 Ghi rõ trình duyệt và hệ điều hành',
                '⏰ Ghi thời điểm xảy ra lỗi',
              ].map(t => (
                <p key={t} className="info-section__text" style={{ marginBottom: 8 }}>{t}</p>
              ))}
            </div>
          </div>

          {/* Report form */}
          {sent ? (
            <div className="contact-form">
              <div className="form-success">
                <span className="form-success__icon">✅</span>
                <div className="form-success__title">Báo cáo đã được gửi!</div>
                <p className="form-success__text">
                  Cảm ơn bạn đã giúp GameNoob tốt hơn. Chúng tôi sẽ xem xét và phản hồi trong
                  vòng 48 giờ làm việc.
                </p>
              </div>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <h3 style={{ color: 'var(--steam-highlight)', margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Thông tin lỗi
              </h3>

              <div className="form-group">
                <label>Tiêu đề lỗi *</label>
                <input
                  type="text"
                  placeholder="Mô tả ngắn gọn lỗi bạn gặp phải"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Loại lỗi *</label>
                <select required value={form.bugType}
                  onChange={e => setForm({ ...form, bugType: e.target.value })}>
                  <option value="">-- Chọn loại lỗi --</option>
                  {BUG_TYPES.map(b => (
                    <option key={b.label}>{b.icon} {b.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mức độ nghiêm trọng</label>
                <div className="severity-badges">
                  {SEVERITY_LEVELS.map(s => (
                    <button key={s.key} type="button"
                      className={`severity-badge ${s.key}`}
                      style={{ opacity: severity && severity !== s.key ? 0.4 : 1 }}
                      onClick={() => setSeverity(s.key)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả chi tiết *</label>
                <textarea rows={4}
                  placeholder="Lỗi xảy ra như thế nào? Bạn thấy gì trên màn hình?"
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Các bước tái hiện lỗi</label>
                <textarea rows={3}
                  placeholder="Ví dụ:&#10;1. Vào trang game&#10;2. Nhấn 'Mua ngay'&#10;3. Lỗi xuất hiện"
                  value={form.steps}
                  onChange={e => setForm({ ...form, steps: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email nhận phản hồi</label>
                <input type="email" placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-submit">Gửi báo cáo lỗi</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
