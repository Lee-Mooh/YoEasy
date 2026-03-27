import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Tabs, message, Upload, Avatar } from 'antd';
import { UserOutlined, LockOutlined, SmileOutlined, CrownOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './styles/Login.css';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
    const { login, register, isLoading } = useAuth();
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.code === 200) {
                setAvatarUrl(res.data.data.url);
                message.success('头像上传成功');
            }
        } catch (error) {
            message.error('头像上传失败');
        } finally {
            setUploading(false);
        }
    };

    const onFinish = async (values: any) => {
        if (mode === 'login') {
            await login(values.username, values.password);
        } else {
            if (values.password !== values.confirmPassword) {
                message.error('两次输入的密码不一致');
                return;
            }
            await register(values.username, values.password, values.name, avatarUrl);
            setMode('login'); // Switch back to login mode on success
            setAvatarUrl(''); // Reset avatar
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                <Card 
                style={{ 
                    width: 400,  
                    borderRadius: 32,
                    boxShadow: '0 8px 32px rgba(82, 196, 26, 0.15)', // Darker shadow
                    border: '2px solid #b7eb8f', // Darker border
                    overflow: 'hidden'
                }}
                bodyStyle={{ padding: 40 }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ 
                        width: 80, 
                        height: 80, 
                        background: role === 'user' ? '#f6ffed' : '#f0f5ff', 
                        borderRadius: '50%', 
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 40,
                        color: role === 'user' ? '#52c41a' : '#1890ff', // Darker green
                        transition: 'all 0.3s'
                    }}>
                        {role === 'user' ? <SmileOutlined /> : <CrownOutlined />}
                    </div>
                    <Title level={2} style={{ marginBottom: 8, color: '#333' }}>
                        {mode === 'login' ? '欢迎回来' : '注册账号'}
                    </Title>
                    <Text type="secondary">
                        {mode === 'login' 
                            ? `请登录您的${role === 'user' ? '普通' : '管理员'}账号` 
                            : '创建一个新账号'}
                    </Text>
                </div>

                {mode === 'login' && (
                    <Tabs 
                        activeKey={role} 
                        onChange={(k) => setRole(k as 'user' | 'admin')}
                        centered
                        items={[
                            { label: '普通用户', key: 'user' },
                            { label: '管理员', key: 'admin' }
                        ]}
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Form
                    name="login"
                    key={`${mode}-${role}`}
                    initialValues={{ username: mode === 'login' ? (role === 'user' ? 'user' : 'admin') : '', password: mode === 'login' ? 'password' : '' }}
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名!' }]}
                    >
                        <Input 
                            prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
                            placeholder="用户名" 
                            style={{ borderRadius: 16, height: 48, background: '#f9f9f9', border: 'none' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码!' }]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
                            placeholder="密码" 
                            style={{ borderRadius: 16, height: 48, background: '#f9f9f9', border: 'none' }}
                        />
                    </Form.Item>

                    {mode === 'register' && (
                        <>
                            <Form.Item
                                name="confirmPassword"
                                rules={[{ required: true, message: '请确认密码!' }]}
                            >
                                <Input.Password 
                                    prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
                                    placeholder="确认密码" 
                                    style={{ borderRadius: 16, height: 48, background: '#f9f9f9', border: 'none' }}
                                />
                            </Form.Item>
                            
                            <Form.Item
                                name="name"
                                rules={[{ required: true, message: '请输入昵称!' }]}
                            >
                                <Input 
                                    prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
                                    placeholder="昵称" 
                                    style={{ borderRadius: 16, height: 48, background: '#f9f9f9', border: 'none' }}
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 16 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>上传头像（可选）</div>
                                    <Upload
                                        name="avatar"
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                            const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                                            if (!isJpgOrPng) {
                                                message.error('只支持 JPG/PNG 格式的图片!');
                                                return false;
                                            }
                                            const isLt2M = file.size / 1024 / 1024 < 2;
                                            if (!isLt2M) {
                                                message.error('图片大小不能超过 2MB!');
                                                return false;
                                            }
                                            handleAvatarUpload(file);
                                            return false;
                                        }}
                                    >
                                        {avatarUrl ? (
                                            <Avatar 
                                                src={avatarUrl} 
                                                size={80} 
                                                style={{ cursor: 'pointer', border: '2px solid #52c41a' }}
                                            />
                                        ) : (
                                            <div style={{ 
                                                width: 80, 
                                                height: 80, 
                                                borderRadius: '50%', 
                                                border: '2px dashed #d9d9d9',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                background: '#fafafa'
                                            }}>
                                                {uploading ? (
                                                    <div style={{ color: '#52c41a' }}>上传中...</div>
                                                ) : (
                                                    <>
                                                        <UploadOutlined style={{ fontSize: 24, color: '#999', marginBottom: 4 }} />
                                                        <div style={{ fontSize: 12, color: '#999' }}>点击上传</div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </Upload>
                                </div>
                            </Form.Item>
                        </>
                    )}

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={isLoading} 
                            block
                            className="login-button"
                            style={{ 
                                height: 48, 
                                borderRadius: 24, 
                                fontSize: 18, 
                                fontWeight: 'bold',
                                background: role === 'user' ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)', // Darker gradient
                                borderColor: 'transparent',
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease',
                                marginBottom: 8
                            }}
                        >
                            {mode === 'login' ? '登 录' : '注 册'}
                        </Button>
                        <div style={{ textAlign: 'right', marginTop: 12 }}>
                            {role === 'user' ? (
                                <span 
                                    style={{ 
                                        color: '#73d13d',
                                        cursor: 'pointer', 
                                        fontSize: 14,
                                        transition: 'color 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#389e0d'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#73d13d'}
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'register' : 'login');
                                    }}
                                >
                                    {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
                                </span>
                            ) : (
                                <span 
                                    style={{ 
                                        color: '#999',
                                        fontSize: 14,
                                    }}
                                >
                                    没有账号？请向管理员申请
                                </span>
                            )}
                        </div>
                    </Form.Item>
                </Form>
                </Card>
            </div>
        </div>
    );
};
