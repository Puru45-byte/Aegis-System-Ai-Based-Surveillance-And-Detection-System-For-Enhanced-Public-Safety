import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});

// Response interceptor to handle errors globally
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized globally
        if (error.response && error.response.status === 401) {
            console.log('🔴 401 Unauthorized - clearing token and redirecting to login');
            localStorage.removeItem('token');
            // Clear any other auth data
            localStorage.removeItem('user');
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
