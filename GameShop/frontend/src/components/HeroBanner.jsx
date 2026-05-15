import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

function formatPrice(p) {
  if (p === 0) return 'MIỄN PHÍ';
  return p.toLocaleString('vi-VN') + '₫';
}

export default function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroGames = async () => {
      try {
        // Fetch specific modern AAA games for the hero banner
        const res = await axios.get('http://localhost:5000/api/games?limit=50');
        if (res.data.success && res.data.data.length > 0) {
          const allGames = res.data.data;
          
          // Find specific favorites
          const re9 = allGames.find(g => g.name.includes('Resident Evil 9')) || allGames[0];
          const pragmata = allGames.find(g => g.name.includes('Pragmata')) || allGames[1];
          const third = allGames.find(g => !g.name.includes('Resident Evil 9') && !g.name.includes('Pragmata')) || allGames[2];

          const games = [re9, pragmata, third].map((g, idx) => ({
            id: g.id,
            title: g.name,
            subtitle: g.short_description,
            image: g.background || g.header_image,
            tags: typeof g.genres === 'string' ? JSON.parse(g.genres).slice(0, 3) : g.genres.slice(0, 3),
            price: g.price_vnd,
            originalPrice: Math.round(g.price_vnd / 0.8),
            discount: 20,
            badge: idx === 0 ? 'TÂM ĐIỂM 2026' : (idx === 1 ? 'SIÊU PHẨM MỚI' : 'TRENDING')
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
                <img src={s.image} alt={s.title} />
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

