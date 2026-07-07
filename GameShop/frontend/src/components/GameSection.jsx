import { Link } from 'react-router-dom';
import GameCard from './GameCard';
import './GameSection.css';

export default function GameSection({ title, games, variant = 'grid', cols = 5, viewMoreLink }) {
  return (
    <section className="game-section">
      <div className="section-title">
        <span>{title}</span>
        {viewMoreLink && (
          <Link to={viewMoreLink} className="view-more" style={{ textDecoration: 'none' }}>
            Xem thêm &rsaquo;
          </Link>
        )}
      </div>
      {variant === 'grid' ? (
        <div className="game-grid" style={{ '--cols': cols }}>
          {games.map(g => <GameCard key={g.id} game={g} />)}
        </div>
      ) : (
        <div className="game-list">
          {games.map(g => <GameCard key={g.id} game={g} variant="list" />)}
        </div>
      )}
    </section>
  );
}
