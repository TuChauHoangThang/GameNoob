import React, { useState } from 'react';
import './CommunityPage.css';

// Dữ liệu bài đăng mẫu (mock data) để demo diễn đàn game
const INITIAL_POSTS = [
  {
    id: 1,
    author: 'hoang_thang99',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=thang',
    title: 'Góc thảo luận: Valorant bản cập nhật mới nerf Chamber quá tay?',
    content: 'Mọi người nghĩ sao về bản cập nhật 8.08 vừa rồi? Lại tiếp tục nerf chiêu dịch chuyển và bẫy của Chamber. Cá nhân mình thấy Chamber giờ phế quá, không còn cơ động như trước nữa. Các main Chamber chuyển sang chơi Agent nào rồi?',
    tag: 'Thảo Luận',
    likes: 42,
    comments: 18,
    time: '2 giờ trước',
    isLiked: false
  },
  {
    id: 2,
    author: 'manh_hung_gamer',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=hung',
    title: 'Đánh giá chi tiết Elden Ring: Shadow of the Erdtree sau 50 giờ chơi',
    content: 'Đúng là siêu phẩm của FromSoftware! Bản DLC này bản đồ cực rộng, độ khó thì thôi rồi, boss phụ thôi cũng đủ hành ra bã. Đồ họa và âm nhạc thì không có điểm gì để chê. Đánh giá cá nhân: 9.5/10. Khuyên anh em chuẩn bị tinh thần thép trước khi vào game nhé!',
    tag: 'Đánh Giá',
    likes: 128,
    comments: 45,
    time: '5 giờ trước',
    isLiked: false
  },
  {
    id: 3,
    author: 'admin_noob',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=admin',
    title: '[Tin Tức] GameNoob chính thức mở đợt siêu khuyến mãi mùa hè 2026!',
    content: 'Chào mừng các game thủ đến với Summer Sale 2026. Hàng loạt bom tấn AAA giảm giá sập sàn lên tới 75%. Đặc biệt, khi mua các tựa game RPG trong tuần này, các bạn sẽ được tặng ngay coupon giảm giá 10% cho đơn hàng kế tiếp. Săn deal ngay thôi anh em ơi!',
    tag: 'Thông Báo',
    likes: 256,
    comments: 92,
    time: '1 ngày trước',
    isLiked: true
  }
];

export default function CommunityPage() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeTag, setActiveTag] = useState('Tất Cả');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('Thảo Luận');

  // Handle like post
  const handleLike = (id) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  // Handle create post
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung bài viết!');
      return;
    }

    const newPost = {
      id: posts.length + 1,
      author: 'Gamer_Noob_Local',
      avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=localgamer',
      title: newTitle.trim(),
      content: newContent.trim(),
      tag: newTag,
      likes: 1,
      comments: 0,
      time: 'Vừa xong',
      isLiked: true
    };

    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewContent('');
    setShowCreateModal(false);
  };

  // Filter posts by tag
  const filteredPosts = activeTag === 'Tất Cả' 
    ? posts 
    : posts.filter(p => p.tag === activeTag);

  return (
    <div className="community-page-container">
      {/* Background Glow */}
      <div className="community-bg-glow"></div>

      <div className="container community-content">
        {/* Banner Section */}
        <section className="community-banner">
          <div className="banner-text">
            <span className="banner-badge">DIỄN ĐÀN GAME THỦ</span>
            <h1>Cộng Đồng GameNoob</h1>
            <p>Nơi trao đổi thảo luận, chia sẻ kinh nghiệm chơi game và cập nhật những tin tức sốt dẻo nhất giới gaming.</p>
          </div>
          <button className="btn-create-post" onClick={() => setShowCreateModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tạo bài thảo luận
          </button>
        </section>

        {/* Categories Tab & Grid */}
        <div className="community-grid">
          {/* Cột trái: Nhóm chủ đề & Bộ lọc */}
          <aside className="community-sidebar">
            <div className="sidebar-box">
              <h3>Chủ đề thảo luận</h3>
              <div className="filter-buttons">
                {['Tất Cả', 'Thảo Luận', 'Đánh Giá', 'Thông Báo'].map(tag => (
                  <button 
                    key={tag}
                    className={`filter-btn ${activeTag === tag ? 'active' : ''}`}
                    onClick={() => setActiveTag(tag)}
                  >
                    <span className="dot"></span>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-box rules-box">
              <h3>Nội quy cộng đồng</h3>
              <ul>
                <li>Tôn trọng các thành viên khác.</li>
                <li>Không đăng tải nội dung toxic, spam.</li>
                <li>Tránh thảo luận các vấn đề chính trị nhạy cảm.</li>
                <li>Chia sẻ thông tin hữu ích và văn minh.</li>
              </ul>
            </div>
          </aside>

          {/* Cột phải: Danh sách bài đăng */}
          <main className="community-main">
            <div className="posts-header">
              <h2>Bài đăng thảo luận ({filteredPosts.length})</h2>
              <span className="active-filter-label">Đang xem: {activeTag}</span>
            </div>

            <div className="posts-list">
              {filteredPosts.length === 0 ? (
                <div className="empty-posts">
                  <p>Chưa có bài đăng nào trong chủ đề này.</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <article key={post.id} className="post-card">
                    <div className="post-header">
                      <div className="author-info">
                        <img src={post.avatar} alt="avatar" className="author-avatar" />
                        <div className="author-meta">
                          <span className="author-name">{post.author}</span>
                          <span className="post-time">{post.time}</span>
                        </div>
                      </div>
                      <span className={`post-tag-badge ${post.tag.toLowerCase().replace(' ', '-')}`}>
                        {post.tag}
                      </span>
                    </div>

                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-body">{post.content}</p>

                    <div className="post-footer">
                      <button 
                        className={`action-btn-like ${post.isLiked ? 'liked' : ''}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span>{post.likes} Thích</span>
                      </button>

                      <div className="post-comments-count">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>{post.comments} Bình luận</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-post-modal">
            <div className="modal-header">
              <h2>Tạo Bài Viết Thảo Luận Mới</h2>
              <button className="btn-close-modal" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePost} className="modal-form">
              <div className="form-group">
                <label>Chủ đề bài đăng:</label>
                <select 
                  className="modal-select" 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)}
                >
                  <option value="Thảo Luận">Thảo Luận</option>
                  <option value="Đánh Giá">Đánh Giá</option>
                  <option value="Thông Báo">Thông Báo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tiêu đề bài viết:</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Nhập tiêu đề thảo luận..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nội dung thảo luận:</label>
                <textarea 
                  className="modal-textarea" 
                  placeholder="Viết nội dung bài đăng của bạn tại đây..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit-post">Đăng bài viết</button>
                <button type="button" className="btn-cancel-post" onClick={() => setShowCreateModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
