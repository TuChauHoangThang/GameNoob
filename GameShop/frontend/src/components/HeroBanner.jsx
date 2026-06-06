import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

function formatPrice(p) {
  if (!p || p === 0) return 'MIỄN PHÍ';
  const num = typeof p === 'string' ? parseInt(p) : p;
  return new Intl.NumberFormat('vi-VN').format(num) + '₫';
}

export default function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroGames = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/games?limit=50');
        if (res.data.success && res.data.data.length > 0) {
          const allGames = res.data.data;

          // Hàm lấy ảnh chất lượng cao làm banner (Ưu tiên screenshot đầu tiên)
          const getImage = (g) => {
            try {
              if (g.screenshots) {
                const scr = typeof g.screenshots === 'string'
                  ? JSON.parse(g.screenshots)
                  : g.screenshots;
                if (Array.isArray(scr) && scr.length > 0) {
                  const firstScr = scr[0].full || scr[0].path_full;
                  if (firstScr && firstScr.startsWith('http') && !firstScr.includes('undefined')) {
                    return firstScr;
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing screenshots:', e);
            }
            // Fallback 1: header_image sắc nét và đầy đủ màu sắc
            if (g.header_image && g.header_image.startsWith('http') && !g.header_image.includes('undefined')) {
              return g.header_image;
            }
            // Fallback 2: background (ảnh nền của Steam, thường mờ và tối màu)
            return g.background || '';
          };

          // Lọc các game có ảnh hợp lệ
          const validGames = allGames.filter(g => getImage(g));

          // Hàm xáo trộn mảng ngẫu nhiên
          const shuffleArray = (array) => {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
          };

          // Random lấy tối đa 5 game ngẫu nhiên từ danh sách game hợp lệ
          const picks = shuffleArray(validGames).slice(0, 5);

          const badges = ['TÂM ĐIỂM CỬA HÀNG', 'SIÊU PHẨM GỢI Ý', 'XU HƯỚNG MỚI', 'ĐỀ XUẤT CHO BẠN', 'BÁN CHẠY NHẤT'];

          const games = picks.map((g, idx) => ({
            id:            g.id,
            title:         g.name,
            subtitle:      g.short_description || '',
            image:         getImage(g),
            fallback:      g.header_image || '',
            tags:          (typeof g.genres === 'string'
                             ? JSON.parse(g.genres || '[]')
                             : (g.genres || [])).slice(0, 3),
            price:         g.price_vnd,
            originalPrice: Math.round((g.price_vnd || 0) / 0.8),
            discount:      g.price_vnd > 0 ? 20 : 0,
            badge:         badges[idx] || 'TRENDING',
          }));

          setSlides(games);
        }
      } catch (err) {
        console.error('Error fetching hero games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeroGames();
  }, []);

  const goTo = useCallback((idx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current + 1) % slides.length);
  }, [current, goTo, slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo, slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next, slides.length]);

  if (loading || slides.length === 0) return <div className="hero-loading"></div>;

  const slide = slides[current];

  return (
    <section className="hero-section">
      <div className="hero-slides">
        <div className={`hero-slide ${isAnimating ? 'fade-out' : 'fade-in-slide'}`}>
          {/* Dùng img tag thay vì CSS background để tránh bị block */}
          {slide.image && (
            <img
              src={slide.image}
              alt=""
              className="hero-bg-img"
              onError={e => {
                if (slide.fallback && e.target.src !== slide.fallback) {
                  e.target.src = slide.fallback;
                } else {
                  e.target.style.display = 'none';
                }
              }}
            />
          )}
          <div className="hero-bg-fallback" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-info">
              {slide.badge && <span className="hero-badge">{slide.badge}</span>}
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-desc">{slide.subtitle}</p>
              <div className="hero-tags">
                {slide.tags.map(t => <span key={t} className="hero-tag">{t}</span>)}
              </div>
              <div className="hero-actions">
                <div className="hero-price-block">
                  {slide.discount > 0 && slide.price > 0 && (
                    <>
                      <span className="discount-badge">-{slide.discount}%</span>
                      <span className="price-original">{formatPrice(slide.originalPrice)}</span>
                    </>
                  )}
                  <span className="price-final">{formatPrice(slide.price)}</span>
                </div>
                <button className="btn btn-green hero-buy-btn">Thêm vào giỏ</button>
                <Link to={`/game/${slide.id}`} className="btn btn-secondary">Xem chi tiết</Link>
              </div>
            </div>
          </div>

          <div className="hero-thumbs">
            {slides.map((s, i) => (
              <button
                key={s.id}
                className={`hero-thumb ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i)}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  onError={e => {
                    if (s.fallback && e.target.src !== s.fallback) {
                      e.target.src = s.fallback;
                    }
                  }}
                />
                <span className="thumb-title">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="hero-arrow left" onClick={prev}>&#8249;</button>
        <button className="hero-arrow right" onClick={next}>&#8250;</button>

        <div className="hero-dots">
          {slides.map((_, i) => (
            <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

