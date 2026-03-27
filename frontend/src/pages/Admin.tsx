import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Popconfirm, Button, Modal, Form, Input, Select, message, Tabs, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Product, User, Category } from '../utils/data';
import api from '../utils/api';
import './styles/Admin.css';

export const Admin: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [adminModalVisible, setAdminModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [form] = Form.useForm();
    const [adminForm] = Form.useForm();
    const [categoryForm] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [pageSize, setPageSize] = useState(5);

    // 动态计算表格每页显示数量
    useEffect(() => {
        const calculatePageSize = () => {
            // 获取窗口高度
            const windowHeight = window.innerHeight;
            // 减去头部(约64px)、标题和Tab区(约120px)、搜索栏(约60px)、分页器(约60px)和底部留白
            // 大约剩下可用于显示表格主体的高度
            const availableHeight = windowHeight - 350;
            // 假设每行高度约 60px (包含 padding)
            const rowHeight = 60;
            
            // 计算出的数量，最小为 3，最大为 15
            let calculatedSize = Math.floor(availableHeight / rowHeight);
            calculatedSize = Math.max(3, Math.min(calculatedSize, 15));
            
            setPageSize(calculatedSize);
        };

        // 初始计算
        calculatePageSize();

        // 监听窗口大小变化
        window.addEventListener('resize', calculatePageSize);
        return () => window.removeEventListener('resize', calculatePageSize);
    }, []);

    useEffect(() => {
        if (adminModalVisible || editModalVisible || categoryModalVisible) return; // 弹窗打开时不刷新
        loadData();
        loadUsers();
        loadCategories();
    }, [adminModalVisible, editModalVisible, categoryModalVisible]);

    useEffect(() => {
        loadData();
        loadUsers();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setCategoryLoading(true);
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data.items || []);
        } catch (error) {
            message.error('加载分类数据失败');
        } finally {
            setCategoryLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            setProducts(res.data.data.items || []);
        } catch (error) {
            message.error('加载商品数据失败');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await api.get('/users');
            if (res.data.code === 200) {
                setUsers(res.data.data.items || []);
            }
        } catch (error: any) {
            message.error('获取用户列表失败');
        }
    };

    const handleTabChange = (key: string) => {
        if (key === '1') loadData();
        if (key === '2') loadUsers();
        if (key === '3') loadCategories();
    };

    const handleAddAdmin = async (values: any) => {
        if (values.password !== values.confirmPassword) {
            message.error('两次密码输入不一致');
            return;
        }
        try {
            await api.post('/users/admin', { username: values.username, password: values.password, name: values.name });
            message.success('添加管理员成功');
            setAdminModalVisible(false);
            adminForm.resetFields();
            await loadUsers(); // 确保添加成功后刷新列表
        } catch (error: any) {
            message.error(error.message || '添加管理员失败');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/products/${id}`);
            message.success('删除成功');
            loadData();
        } catch (error) {
            message.error('删除失败');
        }
    };

    const handleEdit = (record: Product) => {
        setEditingProduct(record);
        setImageUrl(record.image || '');
        form.setFieldsValue(record);
        setEditModalVisible(true);
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

    const handleUpdate = async (values: Partial<Product>) => {
        if (!imageUrl && !editingProduct) {
            message.error('请上传图片');
            return;
        }
        try {
            const submitData = { ...values, image: imageUrl || values.image };
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, submitData);
                message.success('更新成功');
            } else {
                await api.post('/products', submitData);
                message.success('添加成功');
            }
            setEditModalVisible(false);
            setEditingProduct(null);
            setImageUrl('');
            form.resetFields();
            await loadData(); // 确保添加成功后刷新列表
        } catch (error) {
            message.error('操作失败');
        }
    };

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setEditModalVisible(true);
    };

    const handleCategoryAdd = () => {
        setEditingCategory(null);
        categoryForm.resetFields();
        setCategoryModalVisible(true);
    };

    const handleCategoryEdit = (record: Category) => {
        setEditingCategory(record);
        categoryForm.setFieldsValue(record);
        setCategoryModalVisible(true);
    };

    const handleCategoryDelete = async (id: number) => {
        try {
            await api.delete(`/categories/${id}`);
            message.success('删除分类成功');
            loadCategories();
        } catch (error: any) {
            message.error(error.message || '删除分类失败');
        }
    };

    const handleCategoryUpdate = async (values: Partial<Category>) => {
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, values);
                message.success('更新分类成功');
            } else {
                await api.post('/categories', values);
                message.success('添加分类成功');
            }
            setCategoryModalVisible(false);
            setEditingCategory(null);
            categoryForm.resetFields();
            loadCategories();
        } catch (error: any) {
            message.error(error.message || '操作失败');
        }
    };

    const handleUserDelete = async (id: number) => {
        try {
            const res = await api.delete(`/users/${id}`);
            if (res.data.code === 200) {
                message.success('删除用户成功');
                loadUsers();
            } else {
                message.error(res.data.message || '删除失败');
            }
        } catch (error) {
            message.error('删除用户请求失败');
        }
    };

    const filteredProducts = products.filter(p => 
        p.title.includes(searchText) || 
        p.seller.includes(searchText) || 
        (p.category && p.category.includes(searchText))
    );

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            align: 'center' as const,
        },
        {
            title: '图片',
            dataIndex: 'image',
            key: 'image',
            align: 'center' as const,
            render: (src: string) => <img src={src} style={{width: 50, height: 50, objectFit: 'cover'}} />
        },
        {
            title: '商品名称',
            dataIndex: 'title',
            key: 'title',
            align: 'center' as const,
            render: (text: string) => <a>{text}</a>,
        },
        {
            title: '价格',
            dataIndex: 'price',
            key: 'price',
            align: 'center' as const,
            render: (price: number) => `¥${price}`,
            sorter: (a: Product, b: Product) => a.price - b.price,
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            align: 'center' as const,
            filters: categories.map(c => ({ text: c.name, value: c.value })),
            onFilter: (value: any, record: Product) => record.category === value,
            render: (value: string) => {
                const category = categories.find(c => c.value === value);
                return category ? category.name : value;
            }
        },
        {
            title: '卖家',
            dataIndex: 'seller',
            key: 'seller',
            align: 'center' as const,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            align: 'center' as const,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '在售' : '已下架'}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: Product) => (
                <Space size="small">
                    <a onClick={() => handleEdit(record)}>编辑</a>
                    <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
                        <a style={{color: 'red'}}>删除</a>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const userColumns = [
        { title: '用户ID', dataIndex: 'id', key: 'id', align: 'center' as const },
        { 
            title: '头像', 
            dataIndex: 'avatar', 
            key: 'avatar',
            align: 'center' as const,
            render: (text: string) => <img src={text} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        },
        { title: '用户名', dataIndex: 'username', key: 'username', align: 'center' as const },
        { title: '昵称', dataIndex: 'name', key: 'name', align: 'center' as const },
        { 
            title: '角色', 
            dataIndex: 'role', 
            key: 'role',
            align: 'center' as const,
            render: (text: string) => <Tag color={text === 'admin' ? 'blue' : 'green'}>{text === 'admin' ? '管理员' : '普通用户'}</Tag>
        },
        {
            title: '操作',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: User) => (
                <Popconfirm 
                    title="确定删除此用户吗?" 
                    onConfirm={() => handleUserDelete(record.id)}
                >
                    <a style={{color: 'red'}}>删除</a>
                </Popconfirm>
            ),
        }
    ];

    const categoryColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', align: 'center' as const },
        { title: '分类名称', dataIndex: 'name', key: 'name', align: 'center' as const },
        { title: '分类标识', dataIndex: 'value', key: 'value', align: 'center' as const },
        { title: '排序', dataIndex: 'sort_order', key: 'sort_order', align: 'center' as const, sorter: (a: Category, b: Category) => a.sort_order - b.sort_order },
        {
            title: '操作',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: Category) => (
                <Space size="small">
                    <a onClick={() => handleCategoryEdit(record)}>编辑</a>
                    <Popconfirm title="确定删除吗?" onConfirm={() => handleCategoryDelete(record.id)}>
                        <a style={{color: 'red'}}>删除</a>
                    </Popconfirm>
                </Space>
            ),
        }
    ];

    return (
        <div className="admin-container">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0 }}>后台管理</h2>
            </div>
            
            <Tabs defaultActiveKey="1" onChange={handleTabChange} items={[
                {
                    key: '1',
                    label: '商品管理',
                    children: (
                        <>
                            <div className="admin-header-actions">
                                <Input.Search 
                                    placeholder="搜索商品名称、卖家..." 
                                    className="custom-search"
                                    onSearch={setSearchText}
                                    onChange={e => setSearchText(e.target.value)}
                                    enterButton
                                    allowClear
                                />
                                <Button type="primary" onClick={handleAdd} className="admin-add-btn">新增商品</Button>
                            </div>
                            <Table 
                                columns={columns} 
                                dataSource={filteredProducts} 
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: pageSize }}
                            />
                        </>
                    )
                },
                {
                    key: '2',
                    label: '人员管理',
                    children: (
                        <>
                            <div className="admin-header-actions end">
                                <Button type="primary" onClick={() => setAdminModalVisible(true)}>添加管理员</Button>
                            </div>
                            <Table 
                                columns={userColumns} 
                                dataSource={users} 
                                rowKey="id" 
                                pagination={{ pageSize: pageSize }}
                            />
                        </>
                    )
                },
                {
                    key: '3',
                    label: '分类管理',
                    children: (
                        <>
                            <div className="admin-header-actions end">
                                <Button type="primary" onClick={handleCategoryAdd}>新增分类</Button>
                            </div>
                            <Table 
                                columns={categoryColumns} 
                                dataSource={categories} 
                                rowKey="id"
                                loading={categoryLoading}
                                pagination={{ pageSize: pageSize }}
                            />
                        </>
                    )
                }
            ]} />

            <Modal
                title={editingProduct ? "编辑商品" : "新增商品"}
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setImageUrl('');
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item name="title" label="标题" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="price" label="价格" rules={[{ required: true }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                        <Select>
                            {categories.map(c => (
                                <Select.Option key={c.value} value={c.value}>{c.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="seller" label="卖家ID" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label="状态" initialValue="active">
                        <Select>
                            <Select.Option value="active">在售</Select.Option>
                            <Select.Option value="sold">已下架</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="商品图片" name="image" rules={[{ required: !editingProduct, message: '请上传图片' }]}>
                        <Upload customRequest={customRequest} showUploadList={false}>
                            <Button icon={<UploadOutlined />}>点击上传图片</Button>
                        </Upload>
                        {imageUrl && <div style={{ marginTop: 16 }}><img src={imageUrl} alt="preview" style={{ width: 100, borderRadius: 8, objectFit: 'cover' }} /></div>}
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>保存</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="添加管理员"
                open={adminModalVisible}
                onCancel={() => {
                    setAdminModalVisible(false);
                    adminForm.resetFields();
                }}
                footer={null}
            >
                <Form form={adminForm} onFinish={handleAddAdmin} layout="vertical">
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="name" label="昵称">
                        <Input placeholder="选填，默认同用户名" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请确认密码' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>确认添加</Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={editingCategory ? "编辑分类" : "新增分类"}
                open={categoryModalVisible}
                onCancel={() => {
                    setCategoryModalVisible(false);
                    categoryForm.resetFields();
                }}
                footer={null}
            >
                <Form form={categoryForm} onFinish={handleCategoryUpdate} layout="vertical">
                    <Form.Item name="name" label="分类名称 (如：数码产品)" rules={[{ required: true, message: '请输入分类名称' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="value" label="分类标识 (如：digital)" rules={[{ required: true, message: '请输入分类标识' }]}>
                        <Input disabled={!!editingCategory} />
                    </Form.Item>
                    <Form.Item name="sort_order" label="排序权重 (越小越靠前)" initialValue={0}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>保存分类</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
