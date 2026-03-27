import React, { useState, useEffect } from 'react';
import { List, Typography, Badge, Card, Button, message, Spin, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './styles/Messages.css';

const { Title, Text } = Typography;

interface MessageItem {
    id: number;
    title: string;
    description: string;
    type: string;
    time: string;
    read: boolean;
}

export const Messages: React.FC = () => {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { fetchUnreadCount } = useAuth();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/messages');
            setMessages(res.data.data.items || []);
        } catch (error) {
            message.error('获取消息失败');
        } finally {
            setLoading(false);
        }
    };



    const markAsRead = async (id: number) => {
        const msg = messages.find(m => m.id === id);
        if (!msg || msg.read) return;

        try {
            await api.put(`/messages/${id}/read`);
            setMessages(messages.map(m => 
                m.id === id ? { ...m, read: true } : m
            ));
            fetchUnreadCount();
        } catch (error) {
            message.error('操作失败');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/messages/read-all');
            setMessages(messages.map(m => ({ ...m, read: true })));
            message.success('已全部标为已读');
            fetchUnreadCount();
        } catch (error) {
            message.error('操作失败');
        }
    };

    return (
        <div className="messages-container">
            <Card 
                title="消息中心" 
                className="messages-card"
                extra={
                    <Button 
                        type="primary" 
                        onClick={markAllAsRead}
                        disabled={messages.every(m => m.read)}
                        className="mark-all-read-btn"
                    >
                        全部标为已读
                    </Button>
                }
            >
                {loading ? <Spin style={{ display: 'block', margin: '40px auto' }} /> : messages.length === 0 ? <Empty description="暂无消息" /> : (
                    <List
                        itemLayout="horizontal"
                        dataSource={messages}
                        renderItem={(item) => (
                            <List.Item 
                                className="message-item"
                                style={{ 
                                    opacity: item.read ? 0.6 : 1,
                                    cursor: 'pointer',
                                }}
                                onClick={() => !item.read && markAsRead(item.id)}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Badge dot={!item.read}>
                                            <BellOutlined style={{ fontSize: 24, color: item.read ? '#999' : '#1890ff' }} />
                                        </Badge>
                                    }
                                    title={
                                        <div className="message-header">
                                            <Title level={5} className="message-title">{item.title}</Title>
                                            <Text className="message-time">{item.time}</Text>
                                        </div>
                                    }
                                    description={<p className="message-content">{item.description}</p>}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
};