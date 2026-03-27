import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Input, Tag, Space, Modal, Descriptions, Button, message, Empty, Spin } from 'antd';
import { HeartOutlined, HeartFilled, EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Product, Category } from '../utils/data';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import { useNavigate } from 'react-router-dom';
import './styles/Home.css';

dayjs.extend(relativeTime);

const { Meta } = Card;
const { Option } = Select;
const { Search } = Input;

export const Home: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ category: 'all', search: '', priceRange: 'all' });
    const [detailVisible, setDetailVisible] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const { user, refreshUser } = useAuth();
    const { addToCart, cart, removeFromCart } = useCart();
    const navigate = useNavigate();

    // Check if a product is already in the cart
    const isInCart = (productId: number | string) => {
        return cart.some(item => item.id === productId);
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data.items || []);
        } catch (error) {
            console.error('加载分类失败', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products', {
                params: {
                    category: filter.category !== 'all' ? filter.category : undefined,
                    search: filter.search || undefined,
                }
            });
            let result = res.data.data.items || [];
            
            if (filter.priceRange !== 'all') {
                const [min, max] = filter.priceRange.split('-').map(Number);
                if (max) {
                    result = result.filter((p: Product) => p.price >= min && p.price <= max);
                } else {
                    result = result.filter((p: Product) => p.price >= min);
                }
            }
            setProducts(result);
        } catch (error) {
            message.error('加载商品失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [filter.category, filter.search, filter.priceRange]);

    const getCategoryName = (value: string) => {
        const cat = categories.find(c => c.value === value);
        return cat ? cat.name : value;
    };

    const handleFavorite = async (e: React.MouseEvent, productId: number) => {
        e.stopPropagation();
        if (!user) {
            message.warning('请先登录');
            navigate('/login');
            return;
        }
        try {
            const res = await api.post('/favorites/toggle', { productId });
            if (res.data.code === 200) {
                await refreshUser();
                message.success(res.data.data.isFavorite ? '已收藏' : '已取消收藏');
            }
        } catch (error) {
            message.error('操作失败');
        }
    };

    return (
        <div className="home-container">
            <div className="filter-container">
                <div className="filter-space-mobile-wrapper">
                    <div className="filter-selects-wrapper">
                        <Select 
                            defaultValue="all" 
                            className="custom-select filter-select-item"
                            onChange={v => setFilter({...filter, category: v})}
                            popupClassName="custom-select-dropdown"
                        >
                            <Option value="all">全部分类</Option>
                            {categories.map(c => (
                                <Option key={c.value} value={c.value}>{c.name}</Option>
                            ))}
                        </Select>

                        <Select 
                            defaultValue="all" 
                            className="custom-select filter-select-item"
                            onChange={v => setFilter({...filter, priceRange: v})}
                            popupClassName="custom-select-dropdown"
                        >
                            <Option value="all">所有价格</Option>
                            <Option value="0-100">100元以下</Option>
                            <Option value="100-500">100-500元</Option>
                            <Option value="500-1000">500-1000元</Option>
                            <Option value="1000-999999">1000元以上</Option>
                        </Select>
                    </div>

                    <Search
                        placeholder="搜索你想要的宝贝..."
                        onSearch={v => setFilter({...filter, search: v})}
                        className="custom-search"
                        allowClear
                    />
                </div>
            </div>

            <div className="product-list">
                {loading ? <Spin size="large" style={{ display: 'block', margin: '50px auto' }} /> : products.length === 0 ? <Empty description="暂无商品" /> : (
                    <div className="waterfall-container">
                        {/* 左列 */}
                        <div className="waterfall-column">
                            {products.filter((_, index) => index % 2 === 0).map((product: Product) => (
                                <Card
                                    key={product.id}
                                    className="waterfall-card"
                                    hoverable
                                    cover={<img alt={product.title} src={product.image} className="waterfall-img" />} 
                                    actions={[
                                        user && user.favorites.includes(product.id) ? 
                                            <HeartFilled key="fav" style={{ color: '#ff4d4f' }} onClick={(e) => handleFavorite(e, product.id)} /> : 
                                            <HeartOutlined key="fav" onClick={(e) => handleFavorite(e, product.id)} />,
                                        isInCart(product.id) ? (
                                            <ShoppingCartOutlined 
                                                key="cart" 
                                                style={{ color: '#52c41a' }} 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    removeFromCart(product.id); 
                                                }} 
                                            />
                                        ) : (
                                            <ShoppingCartOutlined 
                                                key="cart" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (!user) {
                                                        message.warning('请先登录');
                                                        navigate('/login');
                                                        return;
                                                    }
                                                    addToCart(product); 
                                                }} 
                                            />
                                        ),
                                        <EyeOutlined key="view" onClick={(e) => { e.stopPropagation(); setCurrentProduct(product); setDetailVisible(true); }} />,
                                    ]}
                                    onClick={() => {
                                        setCurrentProduct(product);
                                        setDetailVisible(true);
                                    }}
                                >
                                    <Meta 
                                        title={<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span title={product.title} className="product-title">{product.title}</span>
                                            <span className="product-price">¥{product.price}</span>
                                        </div>}
                                        description={
                                            <div className="product-meta">
                                                <Tag color="cyan" className="category-tag">{getCategoryName(product.category)}</Tag>
                                                <span className="time-text">{dayjs(product.publishDate).fromNow()}</span>
                                            </div>
                                        }
                                    />
                                </Card>
                            ))}
                        </div>
                        {/* 右列 */}
                        <div className="waterfall-column">
                            {products.filter((_, index) => index % 2 !== 0).map((product: Product) => (
                                <Card
                                    key={product.id}
                                    className="waterfall-card"
                                    hoverable
                                    cover={<img alt={product.title} src={product.image} className="waterfall-img" />} 
                                    actions={[
                                        user && user.favorites.includes(product.id) ? 
                                            <HeartFilled key="fav" style={{ color: '#ff4d4f' }} onClick={(e) => handleFavorite(e, product.id)} /> : 
                                            <HeartOutlined key="fav" onClick={(e) => handleFavorite(e, product.id)} />,
                                        isInCart(product.id) ? (
                                            <ShoppingCartOutlined 
                                                key="cart" 
                                                style={{ color: '#52c41a' }} 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    removeFromCart(product.id); 
                                                }} 
                                            />
                                        ) : (
                                            <ShoppingCartOutlined 
                                                key="cart" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (!user) {
                                                        message.warning('请先登录');
                                                        navigate('/login');
                                                        return;
                                                    }
                                                    addToCart(product); 
                                                }} 
                                            />
                                        ),
                                        <EyeOutlined key="view" onClick={(e) => { e.stopPropagation(); setCurrentProduct(product); setDetailVisible(true); }} />,
                                    ]}
                                    onClick={() => {
                                        setCurrentProduct(product);
                                        setDetailVisible(true);
                                    }}
                                >
                                    <Meta 
                                        title={<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span title={product.title} className="product-title">{product.title}</span>
                                            <span className="product-price">¥{product.price}</span>
                                        </div>}
                                        description={
                                            <div className="product-meta">
                                                <Tag color="cyan" className="category-tag">{getCategoryName(product.category)}</Tag>
                                                <span className="time-text">{dayjs(product.publishDate).fromNow()}</span>
                                            </div>
                                        }
                                    />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal
                title="商品详情"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={700}
            >
                {currentProduct && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Row gutter={24}>
                            <Col span={10}>
                                <img src={currentProduct.image} style={{width: '100%', borderRadius: 8}} />
                            </Col>
                            <Col span={14}>
                                <Descriptions column={1} labelStyle={{ alignItems: 'center' }}>
                                     <Descriptions.Item label="商品名称">{currentProduct.title}</Descriptions.Item>
                                     <Descriptions.Item label="价格" contentStyle={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{color: '#ff4d4f', fontSize: 18, fontWeight: 'bold', lineHeight: 1}}>¥{currentProduct.price}</span>
                                    </Descriptions.Item>
                                     <Descriptions.Item label="分类">{getCategoryName(currentProduct.category)}</Descriptions.Item>
                                    <Descriptions.Item label="卖家">{currentProduct.seller}</Descriptions.Item>
                                    <Descriptions.Item label="联系方式">{currentProduct.sellerContact}</Descriptions.Item>
                                    <Descriptions.Item label="发布时间">{currentProduct.publishDate}</Descriptions.Item>
                                    <Descriptions.Item label="描述">{currentProduct.description}</Descriptions.Item>
                                </Descriptions>
                            </Col>
                        </Row>
                        <div style={{marginTop: 32, display: 'flex', justifyContent: 'center', width: '100%'}}>
                            <Space size="large" align="center">
                                <Button 
                                    size="large" 
                                    style={{ 
                                        width: 160, 
                                        borderRadius: 24, 
                                        height: 48, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        backgroundColor: '#52c41a', // Darker Green background
                                        color: '#fff', // White text
                                        border: 'none',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)' // Darker shadow
                                    }}
                                    onClick={() => {
                                        if (!user) {
                                            message.warning('请先登录');
                                            navigate('/login');
                                            return;
                                        }
                                        message.success('联系卖家功能开发中');
                                    }}
                                >
                                    立即购买
                                </Button>
                                <Button 
                                        size="large" 
                                        style={{ 
                                            width: 160, 
                                            borderRadius: 24,
                                            height: 48,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        borderColor: isInCart(currentProduct.id) ? '#52c41a' : '#52c41a', 
                                        color: isInCart(currentProduct.id) ? '#52c41a' : '#52c41a',
                                        backgroundColor: isInCart(currentProduct.id) ? '#f6ffed' : 'transparent',
                                        transition: 'all 0.3s',
                                        fontWeight: 600
                                    }}
                                        className="btn-add-cart"
                                        onClick={() => {
                                            if (!user) {
                                                message.warning('请先登录');
                                                navigate('/login');
                                                return;
                                            }
                                            if (isInCart(currentProduct.id)) {
                                                removeFromCart(currentProduct.id);
                                            } else {
                                                addToCart(currentProduct);
                                                message.success('已加入购物车');
                                            }
                                        }}
                                    >
                                        {isInCart(currentProduct.id) ? '已加入' : '加入购物车'}
                                    </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
