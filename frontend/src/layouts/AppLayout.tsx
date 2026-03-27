import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { 
    UserOutlined, 
    BellOutlined, 
    DownOutlined, 
    LogoutOutlined, 
    AppstoreOutlined, 
    PlusCircleOutlined, 
    SettingOutlined,
    ShoppingCartOutlined,
    LoginOutlined
} from '@ant-design/icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { Header, Content, Footer } = Layout;

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { cartCount } = useCart();
    const { user, logout, unreadMessageCount } = useAuth();
    
    // Define menu items based on user role
    const items = [
        { label: <Link to="/"><AppstoreOutlined /> 首页</Link>, key: '/' },
        { label: <Link to="/publish"><PlusCircleOutlined /> 发布闲置</Link>, key: '/publish' },
        { label: <Link to="/user"><UserOutlined /> 个人中心</Link>, key: '/user' },
    ];

    // Only add Admin menu for admin users
    // Note: In real app, we might want to hide regular user items or keep them
    // For now, let's keep all but ensure Admin is protected

    const userMenu = {
        items: [
            { label: <Link to="/user">个人资料</Link>, key: 'profile', icon: <UserOutlined /> },
            ...(user?.role === 'admin' ? [{ label: <Link to="/admin">后台管理</Link>, key: 'admin', icon: <SettingOutlined /> }] : []),
            { type: 'divider' as const },
            { label: <span onClick={logout}>退出登录</span>, key: 'logout', icon: <LogoutOutlined />, danger: true },
        ]
    };

    return (
        <Layout className="layout" style={{minHeight: '100vh', background: 'transparent'}}>
            <div className="top-mask"></div>
            <Header className="app-header">
                <div className="header-inner">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="logo-wrapper">
                            <img src="/uploads/logo-text.png" alt="YoEasy" style={{ height: 95, objectFit: 'contain' }} />
                        </div>
                    </Link>
                    
                    <Menu
                        theme="light"
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
                        items={!user || location.pathname === '/login' ? items.filter(item => item.key === '/') : items}
                        className="nav-menu"
                    />
                    
                    <div className="header-right">
                        {user ? (
                            <>
                                <Link to="/cart" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Badge count={cartCount} size="small">
                                        <ShoppingCartOutlined style={{ fontSize: 24, cursor: 'pointer', color: '#666' }} />
                                    </Badge>
                                </Link>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Link to="/messages" style={{ display: 'flex', alignItems: 'center' }}>
                                        <Badge count={unreadMessageCount} size="small" style={{ cursor: 'pointer' }}>
                                            <BellOutlined style={{ fontSize: 24, cursor: 'pointer', color: '#666' }} />
                                        </Badge>
                                    </Link>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Dropdown menu={userMenu} placement="bottomRight">
                                        <div className="user-dropdown" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <Avatar src={user.avatar} icon={<UserOutlined />} className="user-avatar" style={{ marginRight: 8 }} />
                                            <span className="user-name" style={{ color: '#333', fontWeight: 500 }}>{user.name}</span>
                                            <DownOutlined className="user-dropdown-icon" style={{ fontSize: 12, marginLeft: 8, color: '#999' }} />
                                        </div>
                                    </Dropdown>
                                </div>
                            </>
                        ) : location.pathname !== '/login' ? (
                            <Link to="/login" style={{ display: 'flex', alignItems: 'center' }}>
                                <Button type="primary" icon={<LoginOutlined />} style={{ borderRadius: 20 }}>登录</Button>
                            </Link>
                        ) : null}
                    </div>
                </div>
            </Header>
            <Content style={{ padding: '0 50px', marginTop: 88 }}>
                <div className="site-layout-content">
                    {children}
                </div>
            </Content>
            <Footer style={{ textAlign: 'center', color: '#999', background: 'transparent' }}>
                YoEasy ©2026 Created with React & Ant Design
            </Footer>
        </Layout>
    );
};
