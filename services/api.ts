import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Dynamic URL: IP for Native/Mobile, Proxy (/api) for Web.
const API_URL = import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform()
    ? 'http://10.161.12.13:5000/api'
    : '/api');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Optional: Redirect to login or trigger an auth state change
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
