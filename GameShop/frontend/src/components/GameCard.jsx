import './GameCard.css';

function formatPrice(p) {
  return p.toLocaleString('vi-VN') + '₫';
}

export default function GameCard({ game, variant = 'default' }) {
  const {
    title, image, price, originalPrice, discount,
    tags = [], rating, reviewCount, isNew, isFree,
  } = game;

  if (variant === 'list') {
    return (
      <div className="game-card-list">
        <div className="gcl-img">
          <img src={image} alt={title} loading="lazy" />
        </div>
        <div className="gcl-info">
          <h3 className="gcl-title">{title}</h3>
          <div className="gcl-tags">
            {tags.slice(0, 3).map(t => <span key={t} className="gcl-tag">{t}</span>)}
          </div>
          {rating && (
            <div className="gcl-rating">
              <span className="rating-dot" style={{ background: rating >= 80 ? 'var(--steam-green-bright)' : rating >= 60 ? '#e6bc2f' : '#c75b5b' }} />
              <span className="rating-text">{rating >= 80 ? 'Rất tích cực' : rating >= 60 ? 'Tạm được' : 'Tiêu cực'}</span>
              <span className="rating-count">({reviewCount?.toLocaleString()} đánh giá)</span>
            </div>
          )}
        </div>
        <div className="gcl-price">
          {isFree ? (
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
    );
  }

  return (
    <div className="game-card">
      <div className="gc-img-wrapper">
        <img src={image} alt={title} loading="lazy" className="gc-img" />
        <div className="gc-overlay">
          <button className="gc-wishlist" title="Thêm vào danh sách">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
        {isNew && <span className="gc-badge new">MỚI</span>}
        {discount > 0 && <span className="gc-badge sale">-{discount}%</span>}
      </div>
      <div className="gc-body">
        <h3 className="gc-title">{title}</h3>
        <div className="gc-tags">
          {tags.slice(0, 2).map(t => <span key={t} className="gc-tag">{t}</span>)}
        </div>
        <div className="gc-footer">
          {isFree ? (
            <span className="price-free">MIỄN PHÍ</span>
          ) : discount > 0 ? (
            <div className="price-block">
              <span className="price-original">{formatPrice(originalPrice)}</span>
              <span className="price-final">{formatPrice(price)}</span>
            </div>
          ) : (
            <span className="price-final">{formatPrice(price)}</span>
          )}
          <button className="gc-add-cart" title="Thêm vào giỏ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63H17c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021.46 4H5.21l-.94-2H1v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
