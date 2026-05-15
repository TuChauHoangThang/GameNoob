import { Link } from 'react-router-dom';
import './GameCard.css';

function formatPrice(p) {
  if (p === 0) return 'MIỄN PHÍ';
  return p.toLocaleString('vi-VN') + '₫';
}

export default function GameCard({ game, variant = 'default' }) {
  const {
    id, name, header_image, price_vnd, is_free,
    genres = [], rating, positive_ratings, negative_ratings,
  } = game;

  const parsedGenres = typeof genres === 'string' ? JSON.parse(genres) : genres;
  const image = header_image;
  const title = name;
  const price = price_vnd;
  
  // Calculate a mock discount for visual flair if price exists
  const hasDiscount = price > 0 && id % 3 === 0;
  const discount = hasDiscount ? 25 : 0;
  const originalPrice = hasDiscount ? Math.round(price / 0.75) : price;

  if (variant === 'list') {
    return (
      <Link to={`/game/${id}`} className="game-card-list-link">
        <div className="game-card-list">
          <div className="gcl-img">
            <img src={image} alt={title} loading="lazy" />
          </div>
          <div className="gcl-info">
            <h3 className="gcl-title">{title}</h3>
            <div className="gcl-tags">
              {parsedGenres.slice(0, 3).map(t => <span key={t} className="gcl-tag">{t}</span>)}
            </div>
            <div className="gcl-rating">
              <span className="rating-dot" style={{ background: rating >= 80 ? 'var(--steam-green-bright)' : '#e6bc2f' }} />
              <span className="rating-text">{rating >= 80 ? 'Rất tích cực' : 'Tích cực'}</span>
              <span className="rating-count">({(positive_ratings + negative_ratings).toLocaleString()} đánh giá)</span>
            </div>
          </div>
          <div className="gcl-price">
            {is_free ? (
              <span className="price-free">MIỄN PHÍ</span>
            ) : discount > 0 ? (
              <div className="price-with-discount">
                <span className="discount-badge-sm">-{discount}%</span>
                <div>
                  <div className="price-original">{formatPrice(originalPrice)}</div>
                  <div className="price-final">{formatPrice(price)}</div>
                </div>
              </div>
            ) : (
              <span className="price-final">{formatPrice(price)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/game/${id}`} className="game-card-link">
      <div className="game-card">
        <div className="gc-img-wrapper">
          <img src={image} alt={title} loading="lazy" className="gc-img" />
          <div className="gc-overlay">
            <button className="gc-wishlist" title="Thêm vào danh sách" onClick={(e) => { e.preventDefault(); /* wish logic */ }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
          {discount > 0 && <span className="gc-badge sale">-{discount}%</span>}
        </div>
        <div className="gc-body">
          <h3 className="gc-title">{title}</h3>
          <div className="gc-tags">
            {parsedGenres.slice(0, 2).map(t => <span key={t} className="gc-tag">{t}</span>)}
          </div>
          <div className="gc-footer">
            {is_free ? (
              <span className="price-free">MIỄN PHÍ</span>
            ) : discount > 0 ? (
              <div className="price-block">
                <span className="price-original">{formatPrice(originalPrice)}</span>
                <span className="price-final">{formatPrice(price)}</span>
              </div>
            ) : (
              <span className="price-final">{formatPrice(price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

