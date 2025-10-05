import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api', // 您的后端API地址
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
