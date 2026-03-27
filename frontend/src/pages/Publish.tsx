import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Product, Category } from '../utils/data';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export const Publish: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                if (isMounted) {
                    setCategories(res.data.data.items || []);
                }
            } catch (error) {
                console.error('加载分类失败', error);
            }
        };
        fetchCategories();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const onFinish = async (values: Partial<Product>) => {
        if (!user) {
            message.error('请先登录');
            return;
        }
        if (!imageUrl) {
            message.error('请上传商品图片');
            return;
        }
        setLoading(true);
        try {
            await api.post('/products', { ...values, image: imageUrl });
            message.success('发布成功！');
            form.resetFields();
            setImageUrl('');
            navigate('/');
        } catch (error) {
            message.error('发布失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const customRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data.data.url;
            setImageUrl(url);
            form.setFieldsValue({ image: url });
            onSuccess(res.data);
            message.success('图片上传成功');
        } catch (err) {
            onError(err);
            message.error('图片上传失败');
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '20px auto', background: '#fff', padding: 24, borderRadius: 8 }}>
            <Title level={3} style={{ marginBottom: 24, textAlign: 'center' }}>发布闲置物品</Title>
            
            <Form
                form={form}
                name="publish_product"
                onFinish={onFinish}
                layout="vertical"
                initialValues={{ category: 'digital', condition: '9' }}
            >
                <Form.Item
                    name="title"
                    label="商品标题"
                    rules={[{ required: true, message: '请输入商品标题' }]}
                >
                    <Input placeholder="例如：iPhone 14 Pro Max 256G" />
                </Form.Item>

                <Form.Item
                    name="category"
                    label="分类"
                    rules={[{ required: true }]}
                >
                    <Select>
                        {categories.map(c => (
                            <Select.Option key={c.value} value={c.value}>{c.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="price"
                    label="价格 (元)"
                    rules={[{ required: true, message: '请输入价格' }]}
                >
                    <Input type="number" prefix="¥" placeholder="0.00" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="详细描述"
                    rules={[{ required: true, message: '请描述商品细节' }]}
                >
                    <Input.TextArea rows={4} placeholder="描述一下宝贝的品牌型号、新旧程度、入手渠道、转手原因等..." />
                </Form.Item>

                <Form.Item label="商品图片" name="image" rules={[{ required: true, message: '请上传商品图片' }]}>
                    <Upload customRequest={customRequest} showUploadList={false}>
                        <Button icon={<UploadOutlined />}>点击上传图片</Button>
                    </Upload>
                    {imageUrl && <div style={{ marginTop: 16 }}><img src={imageUrl} alt="preview" style={{ width: 100, borderRadius: 8, objectFit: 'cover' }} /></div>}
                </Form.Item>

                <Form.Item
                    name="sellerContact"
                    label="联系方式"
                    rules={[{ required: true, message: '方便买家联系您' }]}
                >
                    <Input placeholder="微信号/手机号" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                        立即发布
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};
