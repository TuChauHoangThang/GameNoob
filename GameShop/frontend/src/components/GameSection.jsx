import GameCard from './GameCard';
import './GameSection.css';

export default function GameSection({ title, games, variant = 'grid', cols = 5 }) {
  return (
    <section className="game-section">
      <div className="section-title">
        <span>{title}</span>
        <span className="view-more">Xem thêm &rsaquo;</span>
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
