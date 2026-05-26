import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StorePage from './pages/StorePage';
import GameDetailPage from './pages/GameDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CartDrawer from './components/CartDrawer';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import CommunityPage from './pages/CommunityPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className="app-root">
            <Navbar onCart={() => setCartOpen(true)} />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<StorePage />} />
              <Route path="/game/:id" element={<GameDetailPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/community" element={<CommunityPage />} />

              {/* Protected routes — yêu cầu đăng nhập */}
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            </Routes>
            <Footer />
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
          </div>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}