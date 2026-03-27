import os
from database import engine, Base, SessionLocal
from models import User, Product, Message, Category
import bcrypt
from datetime import datetime

# 1. 创建数据库表
print("正在创建数据库表...")
Base.metadata.create_all(bind=engine)

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

db = SessionLocal()

# 2. 插入测试用户
print("正在生成测试用户...")
if not db.query(User).filter(User.username == "user").first():
    db.add(User(
        username="user", 
        hashed_password=get_password_hash("password"), 
        name="普通用户", 
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=user", 
        role="user", 
        favorites=""
    ))

if not db.query(User).filter(User.username == "admin").first():
    db.add(User(
        username="admin", 
        hashed_password=get_password_hash("password"), 
        name="管理员", 
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=admin", 
        role="admin", 
        favorites=""
    ))

# 3. 插入测试分类数据
print("正在生成测试分类数据...")
if db.query(Category).count() == 0:
    categories = [
        Category(name="数码产品", value="digital", sort_order=1),
        Category(name="书籍资料", value="book", sort_order=2),
        Category(name="生活用品", value="life", sort_order=3),
        Category(name="服饰鞋包", value="clothing", sort_order=4)
    ]
    db.add_all(categories)

# 4. 插入测试商品数据
print("正在生成测试商品数据...")
if db.query(Product).count() == 0:
    products = [
        Product(
            title="iPhone 14 Pro Max 256G", 
            price=6999, 
            category="digital", 
            image="/uploads/iphone.jpg", 
            description="99新，自用，无磕碰，电池效率95%", 
            seller="user", 
            sellerContact="wx_123456", 
            status="active"
        ),
        Product(
            title="《深入理解计算机系统》", 
            price=45, 
            category="book", 
            image="/uploads/book.jpg", 
            description="考研专业课用书，有部分笔记", 
            seller="admin", 
            sellerContact="13800138000", 
            status="active"
        ),
        Product(
            title="米家台灯", 
            price=89, 
            category="life", 
            image="/uploads/lamp.jpg", 
            description="毕业清仓，几乎全新，光线柔和", 
            seller="user", 
            sellerContact="wx_789", 
            status="active"
        ),
        Product(
            title="MacBook Pro M2 16G", 
            price=12999, 
            category="digital", 
            image="/uploads/macbook.jpg", 
            description="工作用机，无任何暗病，带原装充电器", 
            seller="admin", 
            sellerContact="13800138000", 
            status="active"
        )
    ]
    db.add_all(products)

print("正在生成测试消息数据...")
if db.query(Message).count() == 0:
    messages = [
        Message(user_id=1, title="系统通知", description="欢迎来到 YoEasy！您的账号已成功注册。", type="system", is_read=0),
        Message(user_id=1, title="交易提醒", description="您发布的闲置物品审核已通过。", type="trade", is_read=0),
        Message(user_id=1, title="互动消息", description="有买家收藏了您的商品。", type="interaction", is_read=1),
        Message(user_id=2, title="系统通知", description="欢迎管理员登录系统。", type="system", is_read=0)
    ]
    db.add_all(messages)

# 提交事务
db.commit()
db.close()
print("✅ 数据库初始化完成！文件已生成为 backend/shopping.db")
