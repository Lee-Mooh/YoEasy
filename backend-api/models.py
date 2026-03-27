from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    avatar = Column(String)
    role = Column(String, default="user")
    favorites = Column(String, default="") # 逗号分隔的商品ID

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # 分类名称，如"数码产品"
    value = Column(String, unique=True, index=True) # 分类值，如"digital"
    sort_order = Column(Integer, default=0) # 排序权重

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(Float)
    category = Column(String, index=True)
    image = Column(String)
    description = Column(Text)
    seller = Column(String) # 卖家 username 或 id
    sellerContact = Column(String)
    status = Column(String, default="active") # active 或 sold
    publishDate = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # 接收消息的用户ID
    title = Column(String)
    description = Column(Text)
    type = Column(String) # system, trade, interaction
    is_read = Column(Integer, default=0) # 0 未读, 1 已读
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    product_id = Column(Integer, index=True)
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

