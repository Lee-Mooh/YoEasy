from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
from jwt.exceptions import InvalidTokenError
import bcrypt
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import shutil
import uuid

import models, schemas, database

app = FastAPI(title="YoEasy API")

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 配置 CORS 跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT 配置
SECRET_KEY = "shopping_app_super_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1天

security = HTTPBearer()

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="无效的凭证")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的凭证")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user

@app.post("/api/v1/auth/register")
def register(req: schemas.RegisterRequest, db: Session = Depends(database.get_db)):
    # 检查用户名是否已存在
    existing_user = db.query(models.User).filter(models.User.username == req.username).first()
    if existing_user:
        return {"code": 400, "message": "用户名已存在"}
    
    # 创建新用户，如果有上传头像则使用上传的头像，否则使用默认头像
    avatar_url = req.avatar if req.avatar else f"https://api.dicebear.com/7.x/avataaars/svg?seed={req.username}"
    
    new_user = models.User(
        username=req.username,
        hashed_password=get_password_hash(req.password),
        name=req.name or req.username,
        avatar=avatar_url,
        role="user",
        favorites=""
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "code": 200,
        "message": "注册成功",
        "data": {
            "username": new_user.username
        }
    }

@app.post("/api/v1/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{extension}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"code": 200, "message": "上传成功", "data": {"url": f"/uploads/{filename}"}}

@app.get("/api/v1/users")
def get_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="无权操作")
    users = db.query(models.User).all()
    return {"code": 200, "data": {"items": users}}

@app.post("/api/v1/users/admin")
def create_admin(req: schemas.RegisterRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="无权操作")
    
    existing_user = db.query(models.User).filter(models.User.username == req.username).first()
    if existing_user:
        return {"code": 400, "message": "用户名已存在"}
    
    new_user = models.User(
        username=req.username,
        hashed_password=get_password_hash(req.password),
        name=req.name or req.username,
        avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={req.username}",
        role="admin",
        favorites=""
    )
    db.add(new_user)
    db.commit()
    return {"code": 200, "message": "管理员添加成功"}

@app.delete("/api/v1/users/{user_id}")
def delete_user(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="无权操作")
    
    # 防止管理员删除自己
    if current_user.id == user_id:
        return {"code": 400, "message": "不能删除当前登录账号"}
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
        
    db.delete(user)
    db.commit()
    return {"code": 200, "message": "删除成功"}

@app.post("/api/v1/auth/login")
def login(req: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        return {"code": 400, "message": "用户名或密码错误"}
    
    access_token = create_access_token(data={"sub": user.username})
    favs = [int(f) for f in user.favorites.split(',') if f] if user.favorites else []
    
    return {
        "code": 200,
        "message": "登录成功",
        "data": {
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "avatar": user.avatar,
                "role": user.role,
                "favorites": favs
            }
        }
    }

@app.get("/api/v1/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    favs = [int(f) for f in current_user.favorites.split(',') if f] if current_user.favorites else []
    return {
        "code": 200,
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "name": current_user.name,
            "avatar": current_user.avatar,
            "role": current_user.role,
            "favorites": favs
        }
    }

@app.put("/api/v1/users/profile")
def update_profile(profile: schemas.UserProfileUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if profile.name is not None:
        current_user.name = profile.name
    if profile.avatar is not None:
        current_user.avatar = profile.avatar
    
    db.commit()
    db.refresh(current_user)
    favs = [int(f) for f in current_user.favorites.split(',') if f] if current_user.favorites else []
    
    return {
        "code": 200,
        "message": "更新成功",
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "name": current_user.name,
            "avatar": current_user.avatar,
            "role": current_user.role,
            "favorites": favs
        }
    }

@app.get("/api/v1/categories")
def get_categories(db: Session = Depends(database.get_db)):
    categories = db.query(models.Category).order_by(models.Category.sort_order.asc(), models.Category.id.asc()).all()
    return {
        "code": 200,
        "data": {
            "items": categories
        }
    }

@app.post("/api/v1/categories")
def create_category(category: schemas.CategoryCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="无权操作")
    
    existing = db.query(models.Category).filter(models.Category.value == category.value).first()
    if existing:
        return {"code": 400, "message": "分类值已存在"}
        
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return {"code": 200, "message": "添加分类成功", "data": db_category}

@app.put("/api/v1/categories/{category_id}")
def update_category(category_id: int, category: schemas.CategoryUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="无权操作")
        
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="分类不存在")
        
    if category.value and category.value != db_category.value:
        existing = db.query(models.Category).filter(models.Category.value == category.value).first()
        if existing:
            return {"code": 400, "message": "分类值已存在"}
            
    update_data = category.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
        
    db.commit()
    db.refresh(db_category)
    return {"code": 200, "message": "更新分类成功", "data": db_category}

@app.delete("/api/v1/categories/{category_id}")
def delete_category(category_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="无权操作")
        
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="分类不存在")
        
    # 可选：检查是否有关联商品
    has_products = db.query(models.Product).filter(models.Product.category == db_category.value).first()
    if has_products:
        return {"code": 400, "message": "该分类下还有商品，不能删除"}
        
    db.delete(db_category)
    db.commit()
    return {"code": 200, "message": "删除分类成功"}

@app.get("/api/v1/products")
def get_products(category: Optional[str] = None, search: Optional[str] = None, status: Optional[str] = 'active', db: Session = Depends(database.get_db)):
    query = db.query(models.Product)
    
    if category and category != 'all':
        query = query.filter(models.Product.category == category)
    if search:
        query = query.filter(models.Product.title.contains(search))
    if status:
        query = query.filter(models.Product.status == status)
        
    products = query.order_by(models.Product.id.desc()).all()
    return {
        "code": 200,
        "data": {
            "total": len(products),
            "items": products
        }
    }

@app.post("/api/v1/products")
def create_product(product: schemas.ProductCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_product = models.Product(**product.model_dump(), seller=current_user.username)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return {"code": 200, "message": "发布成功", "data": db_product}

@app.put("/api/v1/products/{product_id}")
def update_product(product_id: int, product: schemas.ProductUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    # 只有卖家自己或者管理员可以修改
    if db_product.seller != current_user.username and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="没有权限修改此商品")
        
    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return {"code": 200, "message": "更新成功", "data": db_product}

@app.delete("/api/v1/products/{product_id}")
def delete_product(product_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    # 只有卖家自己或者管理员可以删除
    if db_product.seller != current_user.username and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="没有权限删除此商品")
        
    db.delete(db_product)
    db.commit()
    return {"code": 200, "message": "删除成功"}

@app.post("/api/v1/favorites/toggle")
def toggle_favorite(req: schemas.FavoriteToggle, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    favs = [int(f) for f in current_user.favorites.split(',') if f] if current_user.favorites else []
    
    is_favorite = False
    if req.productId in favs:
        favs.remove(req.productId)
    else:
        favs.append(req.productId)
        is_favorite = True
        
    current_user.favorites = ",".join(map(str, favs))
    db.commit()
    db.refresh(current_user)
    
    return {
        "code": 200,
        "message": "操作成功",
        "data": {
            "isFavorite": is_favorite,
            "favoritesList": favs
        }
    }

@app.get("/api/v1/products/{product_id}/favorites/count")
def get_product_favorites_count(product_id: int, db: Session = Depends(database.get_db)):
    """获取商品的收藏数量"""
    users = db.query(models.User).all()
    count = 0
    for user in users:
        favs = [int(f) for f in user.favorites.split(',') if f] if user.favorites else []
        if product_id in favs:
            count += 1
    
    return {
        "code": 200,
        "data": {
            "productId": product_id,
            "count": count
        }
    }

@app.get("/api/v1/messages")
def get_messages(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    messages = db.query(models.Message).filter(models.Message.user_id == current_user.id).order_by(models.Message.id.desc()).all()
    
    # 转换格式以匹配前端
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "title": msg.title,
            "description": msg.description,
            "type": msg.type,
            "time": msg.created_at.strftime("%Y-%m-%d %H:%M"),
            "read": bool(msg.is_read)
        })
        
    return {"code": 200, "data": {"items": result}}

@app.put("/api/v1/messages/{msg_id}/read")
def read_message(msg_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    msg = db.query(models.Message).filter(models.Message.id == msg_id, models.Message.user_id == current_user.id).first()
    if msg:
        msg.is_read = 1
        db.commit()
    return {"code": 200, "message": "已读"}

@app.put("/api/v1/messages/read-all")
def read_all_messages(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    db.query(models.Message).filter(models.Message.user_id == current_user.id, models.Message.is_read == 0).update({"is_read": 1})
    db.commit()
    return {"code": 200, "message": "全部已读"}

@app.get("/api/v1/cart")
def get_cart(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    
    result = []
    for item in cart_items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            result.append({
                "id": product.id,
                "title": product.title,
                "category": product.category,
                "price": product.price,
                "description": product.description,
                "image": product.image,
                "seller": product.seller,
                "sellerContact": product.sellerContact,
                "status": product.status,
                "quantity": item.quantity,
                "cart_item_id": item.id
            })
            
    return {"code": 200, "data": {"items": result}}

@app.post("/api/v1/cart")
def add_to_cart(req: schemas.CartItemAdd, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(models.Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
        
    existing_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == req.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += req.quantity
    else:
        new_item = models.CartItem(
            user_id=current_user.id,
            product_id=req.product_id,
            quantity=req.quantity
        )
        db.add(new_item)
        
    db.commit()
    return {"code": 200, "message": "已添加到购物车"}

@app.put("/api/v1/cart/{product_id}")
def update_cart_item(product_id: int, req: schemas.CartItemUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    item = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == product_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="购物车中不存在该商品")
        
    if req.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = req.quantity
        
    db.commit()
    return {"code": 200, "message": "更新成功"}

@app.delete("/api/v1/cart/{product_id}")
def remove_from_cart(product_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    item = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == product_id
    ).first()
    
    if item:
        db.delete(item)
        db.commit()
        
    return {"code": 200, "message": "已移除"}

# 挂载前端静态文件
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # 排除 api 和 uploads 路由
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        # 如果请求的具体文件存在，则返回该文件
        file_path = os.path.join("static", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # 否则返回 index.html，交由前端 React Router 处理路由
        return FileResponse("static/index.html")
