import { API_PATH } from '@/constants/apis.constant';
import { notification } from 'antd';
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_END_POINT,
  // timeout: 10000,
});

// Request interceptor
axiosClient.interceptors.request.use((config) => {
  const access_token = localStorage.getItem('accessToken');
  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

// // Response interceptor — unwrap data
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      const originalRequest = error.config;
      try {
        await axiosClient.post<void>(
          API_PATH.AUTHENTICATE.REFRESH_TOKEN.API_PATH,
        );
        return axiosClient(originalRequest);
      } catch (err) {
        notification.error({
          message: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
        });
        window.location.href = '/login';
      }
    }

    return Promise.reject(
      new Error(
        error.response?.data?.message || error.response?.data?.Message || '',
      ),
    );
  },
);

export default axiosClient;
