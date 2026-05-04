import './Footer.css';

const FOOTER_LINKS = {
  'Về GameNoob': ['Giới thiệu', 'Tuyển dụng', 'Báo chí', 'Liên hệ'],
  'Hỗ trợ': ['Trung tâm hỗ trợ', 'Chính sách hoàn tiền', 'Báo cáo lỗi', 'Diễn đàn'],
  'Dịch vụ': ['Tặng quà', 'Thẻ quà tặng', 'Mobile App', 'API cho devs'],
  'Pháp lý': ['Điều khoản dịch vụ', 'Chính sách bảo mật', 'Cookie', 'GDPR'],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--steam-blue)">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
              <span className="footer-brand-name">GAMENOOB</span>
            </div>
            <p className="footer-tagline">
              Nền tảng phân phối game bản quyền hàng đầu Việt Nam. Hơn 10,000 tựa game đang chờ bạn khám phá.
            </p>
            <div className="footer-socials">
              {['Facebook', 'Discord', 'YouTube', 'Twitter'].map(s => (
                <a key={s} href="#" className="social-btn" title={s}>{s[0]}</a>
              ))}
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="footer-col">
              <h4 className="footer-col-title">{section}</h4>
              <ul className="footer-links">
                {links.map(l => (
                  <li key={l}><a href="#" className="footer-link">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2026 GameNoob. Tất cả quyền được bảo lưu.</p>
          <p className="footer-note">Trò chơi trực tuyến chỉ dành cho người trên 18 tuổi. Hãy chơi game có trách nhiệm.</p>
        </div>
      </div>
    </footer>
  );
}
