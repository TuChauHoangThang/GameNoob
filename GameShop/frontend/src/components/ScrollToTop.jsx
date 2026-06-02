import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component tự động cuộn trang lên đầu mỗi khi thay đổi Route (chuyển trang).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
