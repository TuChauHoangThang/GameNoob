import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getWishlist = async () => {
  const response = await axios.get(`${API_URL}/wishlist`, getAuthHeaders());
  return response.data;
};

export const addToWishlist = async (gameId) => {
  const response = await axios.post(`${API_URL}/wishlist`, { gameId }, getAuthHeaders());
  return response.data;
};

export const removeFromWishlist = async (gameId) => {
  const response = await axios.delete(`${API_URL}/wishlist/${gameId}`, getAuthHeaders());
  return response.data;
};

// Also add a function to get all games from DB
export const getAllGames = async () => {
  const response = await axios.get(`${API_URL}/games`);
  return response.data;
};
