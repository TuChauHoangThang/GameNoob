import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist } from '../api/wishlistApi';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch wishlist IDs on mount if user is logged in
  const fetchWishlist = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const data = await getWishlist();
      const ids = new Set(data.map(item => item.id));
      setWishlistIds(ids);
    } catch (err) {
      // Not logged in or error - silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback((gameId) => wishlistIds.has(gameId), [wishlistIds]);

  const toggleWishlist = useCallback(async (gameId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return false;
    }
    try {
      if (wishlistIds.has(gameId)) {
        await removeFromWishlist(gameId);
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.delete(gameId);
          return next;
        });
        return 'removed';
      } else {
        await addToWishlist(gameId);
        setWishlistIds(prev => new Set([...prev, gameId]));
        return 'added';
      }
    } catch (err) {
      console.error('Lỗi wishlist:', err);
      return false;
    }
  }, [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, isInWishlist, toggleWishlist, fetchWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
