export interface Product {
    id: number;
    title: string;
    category: string;
    price: number;
    description: string;
    image: string;
    seller: string;
    sellerContact: string;
    publishDate: string;
    status: 'active' | 'sold';
}

export interface User {
    id: number;
    name: string;
    avatar: string;
    favorites: number[];
    role: 'user' | 'admin';
    username: string;
}

export interface Category {
    id: number;
    name: string;
    value: string;
    sort_order: number;
}

export interface CartItem extends Product {
    quantity: number;
}

