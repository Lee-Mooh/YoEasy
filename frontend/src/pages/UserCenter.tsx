import React, { useState, useEffect } from 'react';
import { Tabs, Avatar, List, Card, Tag, Button, Modal, Form, Input, message, Typography, Upload, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, UploadOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Product } from '../utils/data';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './styles/UserCenter.css';

const { Title } = Typography;

export const UserCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState('1');
    const { user, refreshUser } = useAuth();
    const [myPublishes, setMyPublishes] = useState<Product[]>([]);
    const [myFavorites, setMyFavorites] = useState<Product[]>([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editProductModalVisible, setEditProductModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form] = Form.useForm();
    const [productForm] = Form.useForm();
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [productImageUrl, setProductImageUrl] = useState<string>('');
    const [productUploading, setProductUploading] = useState(false);

    const loadData = async () => {
        if (!user) return;
        try {
            const res = await api.get('/products');
            const allProducts = res.data.data.items || [];
            
            // Note: backend uses username as seller
            const pubs = allProducts.filter((p: Product) => p.seller === user.username);
            setMyPublishes(pubs);

            const favs = allProducts.filter((p: Product) => user.favorites.includes(p.id));
            setMyFavorites(favs);
        } catch (error) {
            message.error('加载数据失败');
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

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
                form.setFieldsValue({ avatar: res.data.data.url });
                message.success('头像上传成功');
            }
        } catch (error) {
            message.error('头像上传失败');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (values: any) => {
        if (!user) return;
        try {
            const res = await api.put('/users/profile', values);
            if (res.data.code === 200) {
                await refreshUser(); // Update context
                setEditModalVisible(false);
                setAvatarUrl('');
                message.success('个人信息更新成功');
            }
        } catch (error) {
            message.error('更新失败');
        }
    };

    const handleDeletePublish = (id: number) => {
        Modal.confirm({
            title: '确定要删除这个商品吗？',
            onOk: async () => {
                try {
                    await api.delete(`/products/${id}`);
                    await loadData();
                    message.success('删除成功');
                } catch (error) {
                    message.error('删除失败');
                }
            }
        });
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductImageUrl(product.image);
        productForm.setFieldsValue({
            title: product.title,
            price: product.price,
            description: product.description,
            sellerContact: product.sellerContact,
            status: product.status
        });
        setEditProductModalVisible(true);
    };

    const handleProductImageUpload = async (file: File) => {
        setProductUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.code === 200) {
                setProductImageUrl(res.data.data.url);
                message.success('图片上传成功');
            }
        } catch (error) {
            message.error('图片上传失败');
        } finally {
            setProductUploading(false);
        }
    };

    const handleUpdateProduct = async (values: any) => {
        if (!editingProduct) return;
        try {
            const updateData = {
                ...values,
                image: productImageUrl || editingProduct.image
            };
            const res = await api.put(`/products/${editingProduct.id}`, updateData);
            if (res.data.code === 200) {
                setEditProductModalVisible(false);
                setEditingProduct(null);
                setProductImageUrl('');
                await loadData();
                message.success('商品更新成功');
            }
        } catch (error) {
            message.error('更新失败');
        }
    };

    if (!user) {
        return <div style={{ padding: 50, textAlign: 'center' }}>请先登录</div>;
    }

    const [favoritesCount, setFavoritesCount] = useState<Record<number, number>>({});

    // 获取每个商品的收藏数量
    useEffect(() => {
        const loadFavoritesCount = async () => {
            const counts: Record<number, number> = {};
            for (const item of myPublishes) {
                try {
                    const res = await api.get(`/products/${item.id}/favorites/count`);
                    if (res.data.code === 200) {
                        counts[item.id] = res.data.data.count;
                    }
                } catch (error) {
                    counts[item.id] = 0;
                }
            }
            setFavoritesCount(counts);
        };
        if (myPublishes.length > 0) {
            loadFavoritesCount();
        }
    }, [myPublishes]);

    const tabItems = [
        {
            key: '1',
            label: '我的发布',
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={myPublishes}
                    renderItem={item => (
                        <List.Item className="user-list-item">
                            <Avatar shape="square" src={item.image} style={{ borderRadius: 8 }} />
                            <div className="user-list-item-content">
                                <div className="user-list-item-header">
                                    <Title level={5} className="user-list-item-title">{item.title}</Title>
                                    <Tag color={item.status === 'active' ? 'green' : 'red'}>
                                        {item.status === 'active' ? '在售' : '已下架'}
                                    </Tag>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: 18, color: '#ff4d4f', lineHeight: '24px', display: 'flex', alignItems: 'center' }}>¥{item.price}</span>
                                    <span style={{ color: '#999', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, height: '24px' }}>
                                        <HeartOutlined style={{ fontSize: 14 }} /> {favoritesCount[item.id] || 0}
                                    </span>
                                </div>
                            </div>
                            <div className="user-list-item-actions">
                                <Button 
                                    type="text" 
                                    icon={<EditOutlined />} 
                                    onClick={() => handleEditProduct(item)}
                                    size="small"
                                />
                                <Popconfirm
                                    title="确定删除吗？"
                                    onConfirm={() => handleDeletePublish(item.id)}
                                >
                                    <Button type="text" danger icon={<DeleteOutlined />} size="small" style={{ margin: 0 }} />
                                </Popconfirm>
                            </div>
                        </List.Item>
                    )}
                />
            )
        },
        {
            key: '2',
            label: '我的收藏',
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={myFavorites}
                    renderItem={item => {
                        const isFavorited = user?.favorites?.includes(item.id) ?? false;
                        return (
                            <List.Item className="user-list-item">
                                <Avatar shape="square" src={item.image} style={{ borderRadius: 8 }} />
                                <div className="user-list-item-content">
                                    <div className="user-list-item-header">
                                        <Title level={5} className="user-list-item-title">{item.title}</Title>
                                    </div>
                                    <span style={{ color: '#999' }} className="ant-list-item-meta-description">
                                        <span style={{color: '#ff4d4f', fontWeight: 'bold', marginRight: 4}}>¥{item.price}</span> 
                                        {item.description}
                                    </span>
                                </div>
                                <div className="user-list-item-actions">
                                    <Button 
                                        type="text" 
                                        danger={isFavorited}
                                        icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                        onClick={async () => {
                                            try {
                                                await api.post('/favorites/toggle', { productId: item.id });
                                                await refreshUser();
                                                message.success(isFavorited ? '已取消收藏' : '已收藏');
                                            } catch (error) {
                                                message.error('操作失败');
                                            }
                                        }}
                                        size="small"
                                    >
                                        取消
                                    </Button>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            )
        }
    ];

    return (
        <div className="user-center-container">
            <Card className="profile-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <Avatar size={80} src={user.avatar} />
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Title level={4} style={{ margin: 0 }}>{user.name}</Title>
                            <Tag color={user.role === 'admin' ? 'blue' : 'green'} style={{ borderRadius: 12, margin: 0 }}>
                                {user.role === 'admin' ? '管理员' : '普通用户'}
                            </Tag>
                        </div>
                        <p style={{ margin: '8px 0', color: '#666' }}>ID: {user.id}</p>
                        <Button 
                            type="primary" 
                            ghost
                            style={{ borderRadius: 16, marginTop: 4 }}
                            onClick={() => {
                                form.setFieldsValue(user);
                                setEditModalVisible(true);
                            }}
                        >
                            编辑资料
                        </Button>
                    </div>
                </div>
            </Card>

            <div style={{ marginTop: 24, background: '#fff', padding: 24, borderRadius: 8 }}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </div>

            <Modal
                title="编辑个人资料"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setAvatarUrl('');
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleUpdateProfile} layout="vertical">
                    <Form.Item name="name" label="昵称" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="avatar" label="头像" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Avatar 
                                src={avatarUrl || form.getFieldValue('avatar')} 
                                size={64}
                                style={{ border: '2px solid #f0f0f0' }}
                            />
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
                                <Button 
                                    icon={<UploadOutlined />} 
                                    loading={uploading}
                                    style={{ borderRadius: 8 }}
                                >
                                    {uploading ? '上传中...' : '上传新头像'}
                                </Button>
                            </Upload>
                        </div>
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" block>保存</Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑商品弹窗 */}
            <Modal
                title="编辑商品"
                open={editProductModalVisible}
                onCancel={() => {
                    setEditProductModalVisible(false);
                    setEditingProduct(null);
                    setProductImageUrl('');
                }}
                footer={null}
                width={600}
            >
                <Form form={productForm} onFinish={handleUpdateProduct} layout="vertical">
                    <Form.Item name="title" label="商品标题" rules={[{ required: true, message: '请输入商品标题' }]}>
                        <Input placeholder="请输入商品标题" />
                    </Form.Item>
                    
                    <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
                        <Input type="number" prefix="¥" placeholder="请输入价格" />
                    </Form.Item>
                    
                    <Form.Item name="description" label="商品描述" rules={[{ required: true, message: '请输入商品描述' }]}>
                        <Input.TextArea rows={4} placeholder="请输入商品描述" />
                    </Form.Item>
                    
                    <Form.Item name="sellerContact" label="联系方式" rules={[{ required: true, message: '请输入联系方式' }]}>
                        <Input placeholder="请输入联系方式" />
                    </Form.Item>
                    
                    <Form.Item label="商品图片">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <Avatar 
                                src={productImageUrl} 
                                shape="square" 
                                size={100}
                                style={{ borderRadius: 8, border: '2px solid #f0f0f0' }}
                            />
                            <Upload
                                name="productImage"
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
                                    handleProductImageUpload(file);
                                    return false;
                                }}
                            >
                                <Button 
                                    icon={<UploadOutlined />} 
                                    loading={productUploading}
                                    style={{ borderRadius: 8 }}
                                >
                                    {productUploading ? '上传中...' : '上传新图片'}
                                </Button>
                            </Upload>
                        </div>
                    </Form.Item>
                    
                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" block>保存修改</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
