import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../api/wishlistApi';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import './WishlistPage.css';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('date_added');
  const [addedMap, setAddedMap] = useState({});
  const { toggleWishlist, fetchWishlist: refreshContext } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = async (gameId) => {
    const ok = await addToCart(gameId);
    if (ok) {
      setAddedMap(prev => ({ ...prev, [gameId]: true }));
      setTimeout(() => setAddedMap(prev => ({ ...prev, [gameId]: false })), 2000);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setWishlist(data);
    } catch (error) {
      console.error('Lỗi khi tải wishlist:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (gameId) => {
    try {
      // Cập nhật UI local ngay lập tức
      setWishlist(prev => prev.filter(item => item.id !== gameId));
      // Đồng bộ với context (cập nhật nút tim trên GameCard)
      await toggleWishlist(gameId);
    } catch (error) {
      console.error('Lỗi khi xóa khỏi wishlist:', error);
      // Reload lại nếu lỗi
      fetchWishlist();
    }
  };

  const filteredGames = wishlist.filter(game => {
    const term = search.toLowerCase();
    const gameName = game.name ? game.name.toLowerCase() : '';
    return gameName.includes(term);
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortOrder === 'price_asc') return (a.price_vnd || 0) - (b.price_vnd || 0);
    if (sortOrder === 'price_desc') return (b.price_vnd || 0) - (a.price_vnd || 0);
    if (sortOrder === 'name') return a.name.localeCompare(b.name);
    // default: date_added (which is returned descending from backend)
    return 0;
  });

  // Giả lập lấy tên user từ token
  const username = "CỦA BẠN"; 
  try {
    const token = localStorage.getItem('token');
    if (token) {
       const payload = JSON.parse(atob(token.split('.')[1]));
       if (payload.user?.username) {
           // Có thể set state nếu cần, hiện tại just keep logic simple
       }
    }
  } catch(e) {}

  return (
    <div className="wishlist-page page-wrapper">
      <div className="container">
        <h1 className="wishlist-header">DANH SÁCH ƯỚC {username}</h1>
        
        <div className="wishlist-controls">
          <input 
            type="text" 
            className="wishlist-search" 
            placeholder="Tìm theo tên hoặc nhãn" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="wishlist-filters">
            <button className="btn btn-dark">Tùy chọn ▾</button>
            <select 
              className="btn btn-dark wishlist-sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="date_added">Sắp xếp theo: Ngày thêm</option>
              <option value="name">Sắp xếp theo: Tên</option>
              <option value="price_asc">Sắp xếp theo: Giá tăng dần</option>
              <option value="price_desc">Sắp xếp theo: Giá giảm dần</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-text">Đang tải...</div>
        ) : sortedGames.length === 0 ? (
          <div className="empty-wishlist">Không có trò chơi nào trong danh sách ước của bạn.</div>
        ) : (
          <div className="wishlist-list">
            {sortedGames.map((game) => {
              const dateAdded = new Date(game.added_at).toLocaleDateString('vi-VN');
              const price = game.price_vnd ? parseInt(game.price_vnd).toLocaleString('vi-VN') + 'đ' : (game.is_free ? 'MIỄN PHÍ' : 'Chưa có giá');
              
              let reviews = "CHƯA CÓ ĐÁNH GIÁ";
              if (game.positive_ratings > 0 || game.negative_ratings > 0) {
                 const total = game.positive_ratings + game.negative_ratings;
                 const ratio = game.positive_ratings / total;
                 if (ratio >= 0.9) reviews = "CỰC KỲ TÍCH CỰC";
                 else if (ratio >= 0.8) reviews = "RẤT TÍCH CỰC";
                 else if (ratio >= 0.7) reviews = "TÍCH CỰC";
                 else if (ratio >= 0.4) reviews = "TRÁI CHIỀU";
                 else reviews = "TIÊU CỰC";
              }

              let tags = [];
              if (game.genres && Array.isArray(game.genres)) {
                  tags = game.genres.slice(0, 4);
              }

              return (
                <div key={game.wishlist_id || game.id} className="wishlist-item">
                  <Link to={`/game/${game.id}`} className="wishlist-img-wrapper">
                    <img src={game.header_image || 'https://via.placeholder.com/260x120'} alt={game.name} />
                  </Link>
                  
                  <div className="wishlist-info">
                    <Link to={`/game/${game.id}`} className="wishlist-title-link">
                      <h2 className="wishlist-title">{game.name}</h2>
                    </Link>
                    <div className="wishlist-tags">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="tag-badge">{tag}</span>
                      ))}
                    </div>
                    <div className="wishlist-meta">
                      <div className="meta-row">
                        <span className="meta-label">ĐÁNH GIÁ TỔNG THỂ:</span>
                        <span className="meta-value text-blue">{reviews}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">NGÀY PHÁT HÀNH:</span>
                        <span className="meta-value">{game.release_date || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="wishlist-actions">
                    <div className="wishlist-added-info">
                      Được thêm vào {dateAdded} (<button className="btn-link" onClick={() => handleRemove(game.id)}>bỏ</button>)
                    </div>
                    
                    <div className="wishlist-purchase-box">
                      <div className="wishlist-price">
                        {game.price_vnd && <span className="current-price">{price}</span>}
                        {!game.price_vnd && game.is_free && <span className="current-price text-free">MIỄN PHÍ</span>}
                      </div>
                      <button
                        className={`btn ${addedMap[game.id] ? 'btn-cart-added' : 'btn-green'} add-to-cart-btn`}
                        onClick={() => handleAddToCart(game.id)}
                        disabled={addedMap[game.id]}
                      >
                        {addedMap[game.id] ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
