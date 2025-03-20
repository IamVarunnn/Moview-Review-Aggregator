import axios from 'axios';

// Create Axios instance with correct baseURL
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Include /api to match backend route mounting
});

// Register user
export const register = async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
};

// Login user
export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

// Get current user
export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

// Set token in local storage and Axios headers
export const setToken = (token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Set Authorization header:', `Bearer ${token}`);
};

// Remove token from local storage and Axios headers
export const removeToken = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    console.log('Removed Authorization header');
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
};