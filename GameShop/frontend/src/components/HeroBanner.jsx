import { useState, useEffect, useCallback } from 'react';
import './HeroBanner.css';

const SLIDES = [
  {
    id: 1,
    title: 'CyberPunk 2099',
    subtitle: 'Trải nghiệm thế giới tương lai đen tối trong tựa game nhập vai hành động mãn nhãn nhất năm',
    image: '/hero_banner.png',
    tags: ['Action', 'RPG', 'Open World'],
    price: 599000,
    originalPrice: 999000,
    discount: 40,
    badge: 'MỚI RA MẮT',
  },
  {
    id: 2,
    title: "Dragon's Lair Online",
    subtitle: 'Cuộc phiêu lưu kỳ ảo đỉnh cao — Chinh phục rồng cổ đại và giải cứu vương quốc',
    image: '/game_dragon.png',
    tags: ['RPG', 'Fantasy', 'Multiplayer'],
    price: 299000,
    originalPrice: 499000,
    discount: 40,
    badge: 'GIẢM GIÁ',
  },
  {
    id: 3,
    title: 'Stellar Conquest',
    subtitle: 'Chiến lược vũ trụ — Xây dựng đế chế, chinh phục các hành tinh và tiêu diệt kẻ thù',
    image: '/game_space.png',
    tags: ['Strategy', 'Sci-Fi', 'Multiplayer'],
    price: 199000,
    originalPrice: null,
    discount: 0,
    badge: 'KHUYẾN NGHỊ',
  },
];

function formatPrice(p) {
  return p.toLocaleString('vi-VN') + '₫';
}

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((idx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section className="hero-section">
      <div className="hero-slides">
        {/* Main slide */}
        <div className={`hero-slide ${isAnimating ? 'fade-out' : 'fade-in-slide'}`}>
          <div className="hero-bg" style={{ backgroundImage: `url(${slide.image})` }} />
          <div className="hero-overlay" />
          <div className="hero-content container">
            <div className="hero-info">
              {slide.badge && <span className="hero-badge">{slide.badge}</span>}
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-desc">{slide.subtitle}</p>
              <div className="hero-tags">
                {slide.tags.map(t => <span key={t} className="hero-tag">{t}</span>)}
              </div>
              <div className="hero-actions">
                <div className="hero-price-block">
                  {slide.discount > 0 && (
                    <>
                      <span className="discount-badge">-{slide.discount}%</span>
                      <span className="price-original">{formatPrice(slide.originalPrice)}</span>
                    </>
                  )}
                  <span className="price-final">{formatPrice(slide.price)}</span>
                </div>
                <button className="btn btn-green hero-buy-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM17 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2h2l3.6 7.59L5.25 14A2 2 0 007 17h12v-2H7.42c-.14 0-.25-.11-.25-.25L7.2 14h9.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0020.76 5H5.21L4.27 3H1V2z"/>
                  </svg>
                  Thêm vào giỏ
                </button>
                <button className="btn btn-secondary">Xem chi tiết</button>
              </div>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="hero-thumbs">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                className={`hero-thumb ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i)}
              >
                <img src={s.image} alt={s.title} />
                <span className="thumb-title">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Arrows */}
        <button className="hero-arrow left" onClick={prev}>&#8249;</button>
        <button className="hero-arrow right" onClick={next}>&#8250;</button>

        {/* Dots */}
        <div className="hero-dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
