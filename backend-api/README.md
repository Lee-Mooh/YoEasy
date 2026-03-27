# YoEasy 后端技术文档

## 技术栈概览

| 技术 | 版本 | 用途 |
|------|------|------|
| FastAPI | 最新 | Web 框架 |
| SQLAlchemy | 最新 | ORM 数据库操作 |
| SQLite | 3.x | 数据库 |
| Pydantic | 最新 | 数据校验 |
| PyJWT | 最新 | JWT 认证 |
| bcrypt | 最新 | 密码加密 |
| python-multipart | 最新 | 文件上传 |
| Uvicorn | 最新 | ASGI 服务器 |

## 项目结构

```
backend-api/
├── main.py            # 主程序入口，API 路由定义
├── models.py          # SQLAlchemy 数据模型
├── schemas.py         # Pydantic 数据校验模型
├── database.py        # 数据库连接配置
├── init_db.py         # 数据库初始化脚本
├── requirements.txt   # Python 依赖
├── shopping.db        # SQLite 数据库文件
├── uploads/           # 上传文件存储目录
├── static/            # 静态文件目录
└── venv/              # Python 虚拟环境
```

## 核心模块详解

### 1. 数据库模型 (models.py)

#### User 模型 - 用户表
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)      # 用户名
    hashed_password = Column(String)                         # 加密密码
    name = Column(String)                                    # 显示名称
    avatar = Column(String)                                  # 头像 URL
    role = Column(String, default="user")                   # 角色: user/admin
    favorites = Column(String, default="")                  # 收藏商品ID，逗号分隔
```

#### Product 模型 - 商品表
```python
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)                       # 标题
    description = Column(Text)                               # 描述
    price = Column(Float)                                    # 价格
    category = Column(String, index=True)                   # 分类
    image = Column(String)                                   # 图片 URL
    seller = Column(String, index=True)                     # 卖家用户名
    status = Column(String, default="active")              # 状态: active/sold
    publish_date = Column(DateTime, default=datetime.utcnow) # 发布时间
```

#### Category 模型 - 分类表
```python
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)                       # 分类名称
    value = Column(String, unique=True)                      # 分类值
    icon = Column(String)                                    # 图标
```

#### Message 模型 - 消息表
```python
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))       # 接收用户ID
    type = Column(String)                                    # 消息类型
    title = Column(String)                                   # 标题
    content = Column(Text)                                   # 内容
    read = Column(Boolean, default=False)                   # 是否已读
    create_time = Column(DateTime, default=datetime.utcnow) # 创建时间
```

### 2. 数据校验模型 (schemas.py)

使用 Pydantic 进行请求/响应数据校验：

```python
# 登录请求
class LoginRequest(BaseModel):
    username: str
    password: str

# 注册请求
class RegisterRequest(BaseModel):
    username: str
    password: str
    name: Optional[str] = None
    avatar: Optional[str] = None

# 创建商品请求
class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str
    image: Optional[str] = None

# 收藏切换请求
class FavoriteToggle(BaseModel):
    productId: int
```

### 3. 数据库配置 (database.py)

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite 数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./shopping.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # SQLite 必需
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 依赖注入 - 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 4. 认证系统

#### JWT Token 生成
```python
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

#### 密码加密
```python
def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
```

#### 当前用户获取
```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(database.get_db)
):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    username: str = payload.get("sub")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user
```

## API 接口详解

### 认证接口

#### POST /api/v1/auth/register
用户注册
```json
{
  "username": "test",
  "password": "123456",
  "name": "测试用户",
  "avatar": "https://example.com/avatar.png"
}
```

#### POST /api/v1/auth/login
用户登录
```json
{
  "username": "test",
  "password": "123456"
}
```
响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

#### GET /api/v1/auth/me
获取当前用户信息
- Header: `Authorization: Bearer <token>`

### 商品接口

#### GET /api/v1/products
获取商品列表
- Query 参数：
  - `category`: 分类筛选
  - `search`: 关键词搜索
  - `skip`: 分页偏移
  - `limit`: 每页数量

#### POST /api/v1/products
创建商品
```json
{
  "title": "iPhone 14",
  "description": "全新未拆封",
  "price": 5999.00,
  "category": "electronics",
  "image": "/uploads/xxx.jpg"
}
```

#### PUT /api/v1/products/{product_id}
更新商品

#### DELETE /api/v1/products/{product_id}
删除商品

### 收藏接口

#### POST /api/v1/favorites/toggle
切换收藏状态
```json
{
  "productId": 1
}
```
响应：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "isFavorite": true,
    "favoritesList": [1, 2, 3]
  }
}
```

### 文件上传接口

#### POST /api/v1/upload/image
图片上传
- Content-Type: `multipart/form-data`
- Field: `file`

响应：
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/xxx.jpg",
    "filename": "xxx.jpg"
  }
}
```

### 消息接口

#### GET /api/v1/messages
获取消息列表

#### POST /api/v1/messages/{message_id}/read
标记消息已读

## 数据库操作示例

### 查询操作
```python
# 查询所有用户
users = db.query(models.User).all()

# 条件查询
user = db.query(models.User).filter(models.User.username == "test").first()

# 模糊查询
products = db.query(models.Product).filter(
    models.Product.title.contains("iPhone")
).all()

# 分页查询
products = db.query(models.Product).offset(0).limit(10).all()
```

### 增删改操作
```python
# 创建
new_user = models.User(username="test", hashed_password="xxx")
db.add(new_user)
db.commit()
db.refresh(new_user)

# 更新
user.name = "新名称"
db.commit()

# 删除
db.delete(user)
db.commit()
```

## 开发规范

### 代码规范

1. **模型定义**: 使用 SQLAlchemy 声明式基类
2. **API 路由**: 使用 `@app.get/post/put/delete` 装饰器
3. **依赖注入**: 使用 `Depends` 进行依赖管理
4. **异常处理**: 使用 `HTTPException` 返回标准错误

### 响应格式

统一响应格式：
```python
{
    "code": 200,           # 状态码
    "message": "成功",     # 提示信息
    "data": { ... }        # 响应数据
}
```

### 错误处理

```python
@app.get("/api/v1/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"code": 200, "message": "成功", "data": user}
```

## 部署指南

### 开发环境

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python init_db.py

# 启动服务
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 生产环境

```bash
# 使用生产级服务器
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# 或使用 gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker 部署

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 性能优化

1. **数据库索引**: 在常用查询字段上添加索引
2. **连接池**: SQLAlchemy 自动管理连接池
3. **异步操作**: 使用 `async/await` 处理 I/O 操作
4. **缓存**: 考虑使用 Redis 缓存热点数据

## 安全建议

1. **密钥管理**: 使用环境变量存储 SECRET_KEY
2. **密码策略**: 实施密码复杂度要求
3. **限流**: 使用慢速限速防止暴力破解
4. **HTTPS**: 生产环境强制使用 HTTPS
5. **CORS**: 限制允许的源地址

## 相关文档

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)
- [Pydantic 文档](https://docs.pydantic.dev/)
- [JWT 文档](https://pyjwt.readthedocs.io/)
