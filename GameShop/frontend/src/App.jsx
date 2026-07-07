import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StorePage from './pages/StorePage';
import GameDetailPage from './pages/GameDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CartDrawer from './components/CartDrawer';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import CommunityPage from './pages/CommunityPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import PaymentResultPage from './pages/PaymentResultPage';
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import PressPage from './pages/PressPage';
import ContactPage from './pages/ContactPage';
import SupportPage from './pages/SupportPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import ReportBugPage from './pages/ReportBugPage';
import './App.css';
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import ScrollToTop from './components/ScrollToTop';

function AppShell() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-root">
      <ScrollToTop />
      {/* Chỉ hiện Navbar/Footer cửa hàng khi không ở trang admin */}
      {!isAdminRoute && <Navbar onCart={() => setCartOpen(true)} />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<StorePage />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/community" element={<CommunityPage />} />

        {/* Protected routes — yêu cầu đăng nhập */}
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Admin routes — layout riêng, không có Navbar cửa hàng */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        <Route path="/checkout/result" element={<PaymentResultPage />} />

        {/* Về GameNoob */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Hỗ trợ */}
        <Route path="/support" element={<SupportPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/report-bug" element={<ReportBugPage />} />
      </Routes>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}