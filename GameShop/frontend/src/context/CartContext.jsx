import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();
const API_URL = 'http://localhost:5000/api/cart';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Lấy giỏ hàng khi user đăng nhập
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartCount(0);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, { headers: getAuthHeader() });
      if (res.data.success) {
        setCartItems(res.data.data);
        setCartCount(res.data.count);
      }
    } catch (err) {
      console.error('Lỗi lấy giỏ hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (gameId) => {
    if (!user) {
      alert('Bạn cần đăng nhập để thêm vào giỏ hàng!');
      return false;
    }
    // Kiểm tra đã có trong giỏ chưa (client-side check)
    const alreadyIn = cartItems.some(item => item.game_id === gameId);
    if (alreadyIn) return 'already';
    try {
      const res = await axios.post(`${API_URL}/add`, { gameId }, { headers: getAuthHeader() });
      if (res.data.success) {
        setCartCount(res.data.count);
        await fetchCart();
        return true;
      }
    } catch (err) {
      if (err.response?.status === 409) return 'already';
      console.error('Lỗi thêm giỏ hàng:', err);
    }
    return false;
  };

  const removeFromCart = async (cartId) => {
    try {
      const res = await axios.delete(`${API_URL}/${cartId}`, { headers: getAuthHeader() });
      if (res.data.success) {
        setCartCount(res.data.count);
        setCartItems(prev => prev.filter(item => item.id !== cartId));
      }
    } catch (err) {
      console.error('Lỗi xóa giỏ hàng:', err);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(API_URL, { headers: getAuthHeader() });
      setCartItems([]);
      setCartCount(0);
    } catch (err) {
      console.error('Lỗi xóa giỏ hàng:', err);
    }
  };

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.is_free ? 0 : (item.price_vnd || 0) * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, totalPrice, loading, addToCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
