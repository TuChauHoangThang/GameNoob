import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const registerApi = async (username, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký';
  }
};

export const loginApi = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng nhập';
  }
};
