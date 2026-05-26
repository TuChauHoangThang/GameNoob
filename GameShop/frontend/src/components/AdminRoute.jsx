import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bảo vệ các route yêu cầu quyền quản trị (Admin).
 * Nếu chưa đăng nhập -> chuyển hướng về /login.
 * Nếu đã đăng nhập nhưng không phải admin -> chuyển hướng về trang chủ /.
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        color: '#ff4655',
        fontSize: '1.2rem',
        fontWeight: '600',
        letterSpacing: '1px',
        backgroundColor: '#0f1118',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div className="admin-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 70, 85, 0.1)',
            borderTop: '3px solid #ff4655',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>ĐANG XÁC THỰC QUYỀN ADMIN...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.is_admin) {
    alert('Bạn không có quyền truy cập trang quản trị!');
    return <Navigate to="/" replace />;
  }

  return children;
}
