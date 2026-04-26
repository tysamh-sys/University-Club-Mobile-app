import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://university-club-app.onrender.com';

let logoutHandler: (() => void) | null = null;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (logoutHandler) {
        logoutHandler();
      } else {
        await SecureStore.deleteItemAsync('userToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
