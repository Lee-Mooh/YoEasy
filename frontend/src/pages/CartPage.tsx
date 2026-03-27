import React, { useRef, useEffect, useState } from 'react';
import { List, Card, Button, Typography, Empty, Row, Col } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useCart } from '../context/CartContext';
import './styles/Cart.css';

const { Title, Text } = Typography;

export const CartPage: React.FC = () => {
    const { cart, removeFromCart, cartCount } = useCart();
    const [checkoutHeight, setCheckoutHeight] = useState(0);
    const checkoutRef = useRef<HTMLDivElement>(null);

    // 动态计算底部结算栏的高度
    useEffect(() => {
        const updateHeight = () => {
            if (checkoutRef.current) {
                setCheckoutHeight(checkoutRef.current.offsetHeight);
            }
        };

        // 初始计算
        updateHeight();

        // 监听窗口大小变化
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [cartCount]); // 当购物车数量变化可能影响高度时也重新计算

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cartCount === 0) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <Empty description="购物车空空如也，快去选购吧！" />
                <Button type="primary" href="/" style={{ marginTop: 20 }}>去首页逛逛</Button>
            </div>
        );
    }

    return (
        <div 
            className="cart-container" 
            style={{ 
                // 在移动端，动态增加底部 padding，使其等于结算栏高度 + 16px 的间隙
                paddingBottom: window.innerWidth <= 768 && checkoutHeight ? `${checkoutHeight + 16}px` : undefined 
            }}
        >
            <Title level={2}>我的购物车 ({cartCount})</Title>
            
            <Row gutter={24}>
                <Col xs={24} md={16}>
                    <List
                        itemLayout="horizontal"
                        dataSource={cart}
                        renderItem={item => (
                            <Card className="cart-item-card">
                                <div className="cart-item-layout">
                                    <img 
                                        src={item.image} 
                                        alt={item.title} 
                                        className="cart-item-image"
                                    />
                                    <div className="cart-item-info">
                                        <Title level={4} className="cart-item-title">{item.title}</Title>
                                        <Text type="secondary" className="cart-item-desc">{item.description}</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>¥{item.price}</Text>
                                        </div>
                                    </div>
                                    <div className="cart-item-actions">
                                        <Button 
                                            type="text" 
                                            danger 
                                            icon={<DeleteOutlined />} 
                                            onClick={() => removeFromCart(item.id)}
                                            size="small"
                                        >
                                            删除
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    />
                </Col>
            </Row>

            {/* 将结算栏移出 Row/Col，使其成为独立的固定元素 */}
            <div className="cart-checkout-wrapper" ref={checkoutRef}>
                <Card className="cart-checkout-card" bordered={false}>
                    <Title level={3} className="cart-checkout-title">结算</Title>
                    <div className="cart-checkout-info">
                        <Text type="secondary" style={{ fontSize: 12 }}>共 {cartCount} 件商品</Text>
                        <div className="cart-checkout-total">
                            <Text>合计:</Text>
                            <Text strong style={{ fontSize: 20, color: '#ff4d4f', marginLeft: 4 }}>¥{total.toFixed(2)}</Text>
                        </div>
                    </div>
                    <Button type="primary" block size="large" className="cart-checkout-btn">立即结算</Button>
                </Card>
            </div>
        </div>
    );
};
