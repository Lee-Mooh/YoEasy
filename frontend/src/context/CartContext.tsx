import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../utils/data';
import { message } from 'antd';
import api from '../utils/api';
import { useAuth } from './AuthContext';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => Promise<void>;
    updateQuantity: (productId: number | string, quantity: number) => Promise<void>;
    removeFromCart: (productId: number | string) => Promise<void>;
    cartCount: number;
    fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            setCart([]);
        }
    }, [user]);

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart');
            if (res.data.code === 200) {
                setCart(res.data.data.items || []);
            }
        } catch (error) {
            console.error('Failed to fetch cart', error);
        }
    };

    const addToCart = async (product: Product) => {
        if (!user) {
            message.warning('请先登录');
            return;
        }
        try {
            const res = await api.post('/cart', { product_id: product.id, quantity: 1 });
            if (res.data.code === 200) {
                message.success('已添加到购物车');
                fetchCart();
            }
        } catch (error) {
            message.error('添加失败');
        }
    };

    const updateQuantity = async (productId: number | string, quantity: number) => {
        if (!user) return;
        try {
            const res = await api.put(`/cart/${productId}`, { quantity });
            if (res.data.code === 200) {
                fetchCart();
            }
        } catch (error) {
            message.error('更新失败');
        }
    };

    const removeFromCart = async (productId: number | string) => {
        if (!user) return;
        try {
            const res = await api.delete(`/cart/${productId}`);
            if (res.data.code === 200) {
                message.success('已从购物车移除');
                fetchCart();
            }
        } catch (error) {
            message.error('移除失败');
        }
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, cartCount, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

