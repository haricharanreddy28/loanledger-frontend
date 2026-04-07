import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // If the response follows our ApiResponse structure
    if (response.data && (response.data.success === true || response.data.status === 'success')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API SUCCESS] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data.message);
      }
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Check if it's our ApiResponse error format
    const errorMessage = response?.data?.message || error.message;

    if (response) {
      if (response.status === 401) {
        logOutAndRedirect();
      } else if (response.status === 403) {
        console.error('Authorization Error (403):', errorMessage);
      } else if (response.status >= 500) {
        console.error('Server Fault (500+):', errorMessage);
      }
    } else if (error.request) {
      console.error('Network Error:', errorMessage);
    }

    return Promise.reject(error);
  }
);


const logOutAndRedirect = () => {
  localStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login?expired=true';
  }
};

export default axiosInstance;