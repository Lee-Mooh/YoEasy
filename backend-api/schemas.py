from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: Optional[str] = None
    avatar: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class CategoryBase(BaseModel):
    name: str
    value: str
    sort_order: Optional[int] = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None
    sort_order: Optional[int] = None

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    title: str
    price: float
    category: str
    image: str
    description: str
    sellerContact: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    sellerContact: Optional[str] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    seller: str
    status: str
    publishDate: datetime

    class Config:
        from_attributes = True

class FavoriteToggle(BaseModel):
    productId: int

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

