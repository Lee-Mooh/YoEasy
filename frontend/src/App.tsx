import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Home } from './pages/Home';
import { Publish } from './pages/Publish';
import { UserCenter } from './pages/UserCenter';
import { Admin } from './pages/Admin';
import { CartPage } from './pages/CartPage';
import { Login } from './pages/Login';
import { Messages } from './pages/Messages';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Spin } from 'antd';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
    const { user, isLoading } = useAuth();
    const token = localStorage.getItem('token');

    // 如果没有 token，直接跳转登录，不等待
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 在有 token 且正在验证时，显示加载动画
    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" tip="加载中..." />
            </div>
        );
    }

    // 验证结束且没有获取到用户（Token 失效或错误）
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/publish" element={
                <ProtectedRoute>
                  <Publish />
                </ProtectedRoute>
              } />
              <Route path="/user" element={
                <ProtectedRoute>
                  <UserCenter />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
            </Routes>
          </AppLayout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
