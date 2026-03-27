# YoEasy 二手交易平台

一个基于 React + FastAPI 的全栈二手交易平台，支持商品发布、收藏、购物车、即时通讯等功能。

## 项目结构

```
shopping/
├── frontend/          # 前端项目 (React + TypeScript + Vite)
├── backend-api/       # 后端项目 (FastAPI + SQLite)
└── .trae/documents/   # 项目文档
```

## 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+

### 1. 克隆项目

```bash
git clone <repository-url>
cd shopping
```

### 2. 启动后端服务

```bash
cd backend-api
source venv/bin/activate
./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

后端服务将运行在: http://localhost:8000

### 3. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在: http://localhost:5173

### 4. 访问应用

打开浏览器访问: http://localhost:5173

### Windows 启动（PowerShell）

如果你使用的是 Windows，推荐在 PowerShell 中按下面步骤启动：

```powershell
# 终端 1：启动后端
cd backend-api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

```powershell
# 终端 2：启动前端
cd frontend
npm install
npm run dev
```

访问地址：
- 前端: http://localhost:5173
- 后端: http://localhost:8000

## 功能特性

### 用户功能
- 🔐 用户注册/登录/登出
- 👤 个人资料管理
- 📝 发布二手商品
- ❤️ 商品收藏/取消收藏
- 🛒 购物车管理
- 💬 即时消息通知

### 商品功能
- 🔍 商品搜索与筛选
- 📂 商品分类浏览
- 📷 商品图片上传
- ✏️ 商品编辑/删除
- 📱 响应式瀑布流展示

### 管理功能
- 📊 后台管理面板
- 📋 商品审核管理
- 🏷️ 商品分类管理
- 👥 用户管理

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design 6
- **路由**: React Router DOM 7
- **状态管理**: React Context
- **HTTP 客户端**: Axios
- **日期处理**: Day.js

### 后端
- **框架**: FastAPI
- **数据库**: SQLite + SQLAlchemy ORM
- **认证**: JWT + bcrypt
- **数据校验**: Pydantic
- **文件上传**: Python-multipart

## 项目文档

- [前端技术文档](./frontend/README.md)
- [后端技术文档](./backend-api/README.md)
- [API 接口文档](./API_DOCUMENTATION.md)

## 开发规范

### 前端开发
- 使用 TypeScript 进行类型检查
- 组件文件使用 PascalCase 命名
- 使用函数组件 + Hooks
- CSS 使用 Tailwind CSS 类名

### 后端开发
- 遵循 RESTful API 设计规范
- 使用 Pydantic 模型进行数据校验
- 数据库操作使用 SQLAlchemy ORM
- 敏感信息使用环境变量管理

## 部署说明

### 前端构建
```bash
cd frontend
npm run build
```

构建产物将生成在 `frontend/dist` 目录

### 后端部署
```bash
cd backend-api
source venv/bin/activate
./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。
