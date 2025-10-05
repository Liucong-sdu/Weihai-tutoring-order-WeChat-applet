import { useState, useEffect, createContext, useContext, useMemo } from 'react'; // <-- 引入 useMemo
import apiClient from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            setIsAdmin(true);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const url = `/admin/login?_t=${new Date().getTime()}`;
            const response = await apiClient.post(url, { username, password });
            if (response.data.success) {
                localStorage.setItem('admin_token', response.data.token);
                setIsAdmin(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setIsAdmin(false);
    };

    // 使用 useMemo 缓存 context 的 value，仅在依赖项变化时才重新创建对象
    const value = useMemo(
        () => ({ isAdmin, login, logout, loading }),
        [isAdmin, loading] // <-- 依赖项数组
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
