import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../utils/data';
import api from '../utils/api';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, name?: string, avatar?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    unreadMessageCount: number;
    fetchUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // 初始状态设为 true
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                if (isMounted) {
                    setIsLoading(false); // 没有 token，直接结束加载
                }
                return;
            }

            try {
                const res = await api.get('/auth/me');
                //你发了一个异步请求（比如 await api.get(...)），请求返回前这段时间里，用户可能已经切页面了，当前组件可能已经被销毁（卸载）。
                if (res.data.code === 200) {
                    if (isMounted) {
                        setUser(res.data.data);
                        // 并行或稍后请求其他依赖接口，避免阻塞渲染
                        fetchUnreadCount();
                    }
                } else {
                    if (isMounted) {
                        localStorage.removeItem('token');
                        setUser(null);
                        // 初始化时不强制跳转，让 ProtectedRoute 自己决定
                    }
                }
            } catch (error) {
                console.error('Failed to init user', error);
                if (isMounted) {
                    localStorage.removeItem('token');
                    setUser(null);
                    // 初始化时不强制跳转，让 ProtectedRoute 自己决定
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        initAuth();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/messages');
            if (res.data.code === 200) {
                const unread = res.data.data.items.filter((msg: any) => !msg.read).length;
                setUnreadMessageCount(unread);
            }
        } catch (error) {
            // Ignore fetch messages error during init
        }
    };

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await api.post('/auth/login', { username, password });
            const data = res.data;
            if (data.code === 200) {
                localStorage.setItem('token', data.data.token);
                setUser(data.data.user);
                message.success(data.message || '登录成功');
                navigate('/');
            } else {
                message.error(data.message || '登录失败');
            }
        } catch (error: any) {
            message.error(error.message || '登录失败');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, password: string, name?: string, avatar?: string) => {
        setIsLoading(true);
        try {
            const res = await api.post('/auth/register', { username, password, name, avatar });
            const data = res.data;
            if (data.code === 200) {
                message.success('注册成功，请登录');
            } else {
                message.error(data.message || '注册失败');
            }
        } catch (error: any) {
            message.error(error.message || '注册失败');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsLoading(false); // 确保在登出时结束加载状态
        navigate('/login');
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.code === 200) {
                setUser(res.data.data);
            } else {
                localStorage.removeItem('token');
                setUser(null);
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser, unreadMessageCount, fetchUnreadCount }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
