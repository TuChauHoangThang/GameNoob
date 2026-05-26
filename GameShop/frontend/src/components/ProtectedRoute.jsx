import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bảo vệ các route yêu cầu đăng nhập.
 * Nếu chưa đăng nhập → redirect về /login và lưu lại trang hiện tại vào state
 * để sau khi login xong có thể quay lại đúng trang.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Chờ AuthContext kiểm tra localStorage xong mới quyết định redirect
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        color: 'var(--text-secondary, #aaa)',
        fontSize: '1rem',
      }}>
        Đang xác thực...
      </div>
    );
  }

  if (!user) {
    // Lưu lại URL hiện tại để sau khi login có thể redirect về đúng trang
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
