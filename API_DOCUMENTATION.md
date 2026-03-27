# YoEasy (Shopping App) 后端接口文档

本文档描述了当前 Python (FastAPI) 后端的实际实现接口。后端基于 FastAPI 框架开发，提供完整的 RESTful API。

## 基础信息
- **Base URL**: `/api/v1`
- **静态资源代理**: `/uploads/` (用户上传图片)
- **数据交互格式**: `application/json`
- **认证方式**: JWT (JSON Web Token)，大部分接口在请求头中需携带 `Authorization: Bearer <token>`
- **在线接口文档**: FastAPI 自动提供 Swagger UI 调试文档，在后端服务运行时可访问 `http://127.0.0.1:8000/docs`

---

## 1. 用户与认证 (Auth & Users)

### 1.1 用户登录
- **接口**: `POST /auth/login`
- **说明**: 用户登录并获取 Token。
- **Request Body**:
  ```json
  {
    "username": "user",
    "password": "password"
  }
  ```
- **Response**:
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "token": "eyJhbG...",
      "user": {
        "id": 1,
        "username": "user",
        "name": "普通用户",
        "avatar": "https://api.dicebear.com/...",
        "role": "user",
        "favorites": [1, 2]
      }
    }
  }
  ```

### 1.2 用户注册 (普通用户)
- **接口**: `POST /auth/register`
- **说明**: 注册普通用户账号。
- **Request Body**:
  ```json
  {
    "username": "newuser",
    "password": "password",
    "name": "可选昵称"
  }
  ```
- **Response**: 
  ```json
  {
    "code": 200,
    "message": "注册成功",
    "data": { "username": "newuser" }
  }
  ```

### 1.3 获取当前用户信息
- **接口**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 返回当前登录用户的详细信息（包括最新的收藏列表 `favorites`）。

### 1.4 更新个人资料
- **接口**: `PUT /users/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: (支持部分更新)
  ```json
  {
    "name": "新昵称",
    "avatar": "新头像URL"
  }
  ```
- **Response**: 返回更新后的用户信息对象。

### 1.5 获取所有用户列表 (Admin Only)
- **接口**: `GET /users`
- **Headers**: `Authorization: Bearer <token>` (仅管理员)
- **Response**:
  ```json
  {
    "code": 200,
    "data": {
      "items": [ /* user objects */ ]
    }
  }
  ```

### 1.6 添加管理员 (Admin Only)
- **接口**: `POST /users/admin`
- **Headers**: `Authorization: Bearer <token>` (仅管理员)
- **Request Body**:
  ```json
  {
    "username": "newadmin",
    "password": "password",
    "name": "管理员昵称"
  }
  ```

---

## 2. 商品管理 (Products)

### 2.1 获取商品列表
- **接口**: `GET /products`
- **Query Params**:
  - `category` (可选): 分类筛选，例如 `digital`, `book`, `life`
  - `search` (可选): 关键词模糊搜索
  - `status` (可选): 状态筛选，默认 `active`
- **Response**:
  ```json
  {
    "code": 200,
    "data": {
      "total": 10,
      "items": [
        {
          "id": 1,
          "title": "iPhone 14",
          "price": 5000,
          "category": "digital",
          "image": "/uploads/xxx.jpg",
          "description": "九成新",
          "seller": "user",
          "sellerContact": "wx123",
          "status": "active"
        }
      ]
    }
  }
  ```

### 2.2 发布商品
- **接口**: `POST /products`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "title": "商品标题",
    "price": 99.9,
    "category": "digital",
    "image": "/uploads/xxx.jpg",
    "description": "详细描述",
    "sellerContact": "联系方式"
  }
  ```
- **Response**: 返回新创建的商品对象。

### 2.3 更新商品信息
- **接口**: `PUT /products/{product_id}`
- **Headers**: `Authorization: Bearer <token>` (仅限卖家本人或管理员)
- **Request Body**: 支持部分更新 (`title`, `price`, `status`, etc.)

### 2.4 删除商品
- **接口**: `DELETE /products/{product_id}`
- **Headers**: `Authorization: Bearer <token>` (仅限卖家本人或管理员)
- **Response**: `{ "code": 200, "message": "删除成功" }`

---

## 3. 购物车 (Cart)

### 3.1 获取购物车列表
- **接口**: `GET /cart`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 返回包含商品详情及购买数量的购物车项目列表。
  ```json
  {
    "code": 200,
    "data": {
      "items": [
        {
          "id": 1,
          "title": "iPhone 14",
          "price": 5000,
          "image": "/uploads/xxx.jpg",
          "quantity": 1,
          "cart_item_id": 1
        }
      ]
    }
  }
  ```

### 3.2 添加商品到购物车
- **接口**: `POST /cart`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "product_id": 1,
    "quantity": 1
  }
  ```

### 3.3 更新购物车商品数量
- **接口**: `PUT /cart/{product_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "quantity": 2
  }
  ```
  *(注：如果 `quantity <= 0`，则自动从购物车中移除该商品)*

### 3.4 从购物车移除商品
- **接口**: `DELETE /cart/{product_id}`
- **Headers**: `Authorization: Bearer <token>`

---

## 4. 收藏与消息 (Favorites & Messages)

### 4.1 切换收藏状态
- **接口**: `POST /favorites/toggle`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "productId": 1
  }
  ```
- **Response**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "isFavorite": true,
      "favoritesList": [1, 2]
    }
  }
  ```

### 4.2 获取个人消息列表
- **接口**: `GET /messages`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "code": 200,
    "data": {
      "items": [
        {
          "id": 1,
          "title": "系统通知",
          "description": "欢迎来到YoEasy",
          "type": "system",
          "time": "2023-10-01 12:00",
          "read": false
        }
      ]
    }
  }
  ```

### 4.3 标记单条消息已读
- **接口**: `PUT /messages/{msg_id}/read`
- **Headers**: `Authorization: Bearer <token>`

### 4.4 标记所有消息已读
- **接口**: `PUT /messages/read-all`
- **Headers**: `Authorization: Bearer <token>`

---

## 5. 文件上传 (Upload)

### 5.1 上传图片
- **接口**: `POST /upload/image`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request**:
  - `file`: 二进制文件数据
- **Response**:
  ```json
  {
    "code": 200,
    "message": "上传成功",
    "data": {
      "url": "/uploads/uuid-filename.jpg"
    }
  }
  ```