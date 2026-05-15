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
import './App.css';

import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-root">
          <Navbar onCart={() => setCartOpen(true)} />
          <Routes>
            <Route path="/" element={<StorePage />} />
            <Route path="/game/:id" element={<GameDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
          <Footer />
          <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
