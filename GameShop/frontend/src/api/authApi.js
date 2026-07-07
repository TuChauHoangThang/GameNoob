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
    // Trả về toàn bộ response data nếu cần verification
    if (error.response?.data?.needVerification) {
      const err = new Error(error.response.data.message);
      err.needVerification = true;
      err.email = error.response.data.email;
      throw err;
    }
    throw error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng nhập';
  }
};

export const verifyOtpApi = async (email, otp) => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Đã có lỗi xảy ra khi xác thực OTP';
  }
};

export const resendOtpApi = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/resend-otp`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Đã có lỗi xảy ra khi gửi lại OTP';
  }
};

export const forgotPasswordApi = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Đã có lỗi xảy ra';
  }
};

export const verifyForgotOtpApi = async (email, otp) => {
  try {
    const response = await axios.post(`${API_URL}/verify-forgot-otp`, { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Đã có lỗi xảy ra khi xác thực OTP';
  }
};

export const resetPasswordApi = async (email, otp, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, { email, otp, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Đã có lỗi xảy ra khi đặt lại mật khẩu';
  }
};
