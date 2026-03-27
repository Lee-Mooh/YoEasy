# YoEasy 前端技术文档
<!--  -->
## 技术栈概览

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI 框架 |
| TypeScript | 5.2.2 | 类型系统 |
| Vite | 5.0.0 | 构建工具 |
| Ant Design | 6.3.2 | UI 组件库 |
| React Router DOM | 7.13.1 | 路由管理 |
| Axios | 1.13.6 | HTTP 客户端 |
| Day.js | 1.11.20 | 日期处理 |

## 项目结构

```
frontend/
├── src/
│   ├── context/        # React Context 状态管理
│   │   ├── AuthContext.tsx    # 用户认证状态
│   │   └── CartContext.tsx    # 购物车状态
│   ├── hooks/          # 自定义 Hooks
│   ├── layouts/        # 布局组件
│   │   └── AppLayout.tsx      # 应用主布局
│   ├── pages/          # 页面组件
│   │   ├── Home.tsx           # 首页
│   │   ├── Login.tsx          # 登录页
│   │   ├── UserCenter.tsx     # 个人中心
│   │   ├── Publish.tsx        # 发布商品
│   │   ├── CartPage.tsx       # 购物车
│   │   ├── Messages.tsx       # 消息中心
│   │   └── Admin.tsx          # 后台管理
│   ├── utils/          # 工具函数
│   │   ├── api.ts            # API 请求封装
│   │   └── data.ts           # 类型定义    
│   ├── App.tsx         # 应用入口
│   ├── main.tsx        # 渲染入口
│   └── index.css       # 全局样式
├── public/             # 静态资源
├── dist/               # 构建输出
└── index.html          # HTML 模板
```

## 核心概念

### 1. 路由配置

使用 React Router DOM v7 进行路由管理：

```typescript
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/publish" element={<ProtectedRoute><Publish /></ProtectedRoute>} />
    <Route path="/user" element={<ProtectedRoute><UserCenter /></ProtectedRoute>} />
    <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
  </Routes>
</BrowserRouter>
```

### 2. 状态管理

使用 React Context 进行全局状态管理：

#### AuthContext - 用户认证
```typescript
interface AuthContextType {
  user: User | null;           // 当前用户信息
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;  // 刷新用户信息
  unreadMessageCount: number;
}
```

#### CartContext - 购物车
```typescript
interface CartContextType {
  cart: Product[];             // 购物车商品列表
  cartCount: number;           // 购物车商品数量
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}
```

### 3. API 请求封装

使用 Axios 封装 API 请求，统一处理认证和错误：

```typescript
// utils/api.ts
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器 - 添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 4. 权限控制

使用 ProtectedRoute 组件实现路由权限控制：

```typescript
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  adminOnly?: boolean 
}> = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return <Spin tip="加载中..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};
```

## 页面详解

### 首页 (Home.tsx)

**功能**：商品展示、搜索筛选、收藏、加入购物车

**核心逻辑**：
- 瀑布流布局展示商品
- 支持分类筛选、价格区间筛选、关键词搜索
- 商品收藏/取消收藏
- 购物车添加/移除

**状态管理**：
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [filter, setFilter] = useState({ 
  category: 'all', 
  search: '', 
  priceRange: 'all' 
});
```

### 个人中心 (UserCenter.tsx)

**功能**：用户信息管理、我的发布、我的收藏

**Tab 切换**：
- Tab 1: 我的发布 - 展示用户发布的商品，支持编辑和删除
- Tab 2: 我的收藏 - 展示收藏的商品，支持取消收藏

**核心逻辑**：
```typescript
const [myPublishes, setMyPublishes] = useState<Product[]>([]);
const [myFavorites, setMyFavorites] = useState<Product[]>([]);

// 加载数据
const loadData = async () => {
  const res = await api.get('/products');
  const allProducts = res.data.data.items;
  
  // 筛选我的发布
  const pubs = allProducts.filter(p => p.seller === user.username);
  setMyPublishes(pubs);
  
  // 筛选我的收藏
  const favs = allProducts.filter(p => user.favorites.includes(p.id));
  setMyFavorites(favs);
};
```

### 发布商品 (Publish.tsx)

**功能**：发布二手商品，支持图片上传

**表单字段**：
- 商品标题
- 商品描述
- 商品价格
- 商品分类
- 商品图片

**图片上传**：
```typescript
const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return res.data.data.url;
};
```

## 样式规范

### CSS 架构

使用 Tailwind CSS + 自定义 CSS 的组合方案：

- **Tailwind CSS**: 用于快速布局和原子类样式
- **自定义 CSS**: 用于组件级样式和复杂动画

### 命名规范

```css
/* 组件样式 - 使用 BEM 命名 */
.product-card { }
.product-card__title { }
.product-card__price { }

/* 状态样式 */
.is-active { }
.is-disabled { }

/* 工具类 */
.text-center { }
.mt-16 { }
```

### 主题配置

在 `main.tsx` 中配置 Ant Design 主题：

```typescript
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#52c41a',      // 主题色
      colorSuccess: '#389e0d',
      borderRadius: 16,
      fontFamily: "'Nunito', 'PingFang SC', sans-serif",
    },
    components: {
      Card: { borderRadiusLG: 20 },
      Button: { borderRadius: 12 },
    }
  }}
>
```

## 开发规范

### 代码规范

1. **组件命名**: 使用 PascalCase，如 `UserCenter.tsx`
2. **Hook 命名**: 使用 camelCase 并以 `use` 开头，如 `useAuth`
3. **类型定义**: 使用 PascalCase，如 `interface Product { }`
4. **常量命名**: 使用 UPPER_SNAKE_CASE

### 文件组织

```
src/
├── components/     # 可复用组件
├── pages/          # 页面组件
├── hooks/          # 自定义 Hooks
├── context/        # Context 状态
├── utils/          # 工具函数
├── layouts/        # 布局组件
└── types/          # 类型定义
```

### Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 构建与部署

### 开发环境

```bash
npm run dev          # 启动开发服务器
npm run lint         # 代码检查
```

### 生产构建

```bash
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
```

### 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=YoEasy
```

## 常见问题

### 1. 跨域问题

在 `vite.config.ts` 中配置代理：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true
    }
  }
}
```

### 2. 图片上传失败

检查后端 `uploads` 目录是否存在且有写入权限

### 3. 登录状态丢失

检查 localStorage 中的 token 是否正确存储

## 性能优化

1. **组件懒加载**: 使用 `React.lazy()` 和 `Suspense`
2. **图片优化**: 使用适当尺寸的图片，考虑使用 WebP 格式
3. **状态优化**: 避免不必要的重渲染，使用 `useMemo` 和 `useCallback`
4. **代码分割**: Vite 自动进行代码分割

## 相关文档

- [React 官方文档](https://react.dev/)
- [Ant Design 文档](https://ant.design/)
- [Vite 文档](https://vitejs.dev/)
- [React Router 文档](https://reactrouter.com/)
