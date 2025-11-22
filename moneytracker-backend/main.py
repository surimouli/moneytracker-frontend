from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
)
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from dotenv import load_dotenv

# ─────────────────────────────────────────
# Load env (so we can reuse DATABASE_URL)
# ─────────────────────────────────────────
load_dotenv()  # will read from .env in this folder, or parent if configured

RAW_DB_URL = os.getenv("DATABASE_URL")

if not RAW_DB_URL:
  raise RuntimeError("DATABASE_URL is not set in environment variables.")

# SQLAlchemy expects "postgresql+psycopg://"
if RAW_DB_URL.startswith("postgresql://"):
  SQLALCHEMY_DATABASE_URL = "postgresql+psycopg://" + RAW_DB_URL[len("postgresql://"):]
else:
  SQLALCHEMY_DATABASE_URL = RAW_DB_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─────────────────────────────────────────
# SQLAlchemy models (match your Prisma schema)
# ─────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "Transaction"  # Prisma default table name

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # "EXPENSE" | "INCOME"
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "Category"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)


# Create tables if they don't exist (safe for dev)
Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────

class TransactionBase(BaseModel):
    userId: str
    amount: float
    type: str
    category: str
    description: Optional[str] = None
    date: Optional[datetime] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(BaseModel):
    id: int
    userId: str
    amount: float
    type: str
    category: str
    description: Optional[str]
    date: datetime

    class Config:
        orm_mode = True


class CategoryBase(BaseModel):
    userId: str
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(BaseModel):
    id: int
    userId: str
    name: str
    createdAt: datetime

    class Config:
        orm_mode = True


class CategoryDelete(BaseModel):
    userId: str
    id: int


# ─────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────

app = FastAPI(
    title="MoneyTracker Backend",
    description="FastAPI backend for MoneyTracker with Neon Postgres",
    version="1.0.0",
)

# Allow Next.js dev + your future Vercel domain
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # add your deployed frontend URL when ready, e.g. "https://moneytracker.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────
# Transactions endpoints
# ─────────────────────────────────────────

@app.get("/transactions", response_model=List[TransactionRead])
def list_transactions(userId: str, db: Session = Depends(get_db)):
    if not userId:
        raise HTTPException(status_code=400, detail="Missing userId")

    txs = (
        db.query(Transaction)
        .filter(Transaction.userId == userId)
        .order_by(Transaction.date.desc())
        .all()
    )
    return txs


@app.post("/transactions", response_model=TransactionRead)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    if not payload.userId:
        raise HTTPException(status_code=400, detail="Missing userId")
    if payload.type not in ("EXPENSE", "INCOME"):
        raise HTTPException(status_code=400, detail="type must be EXPENSE or INCOME")

    tx = Transaction(
        userId=payload.userId,
        amount=payload.amount,
        type=payload.type,
        category=payload.category,
        description=payload.description,
        date=payload.date or datetime.utcnow(),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


# ─────────────────────────────────────────
# Categories endpoints
# ─────────────────────────────────────────

@app.get("/categories", response_model=List[CategoryRead])
def list_categories(userId: str, db: Session = Depends(get_db)):
    if not userId:
        raise HTTPException(status_code=400, detail="Missing userId")

    cats = (
        db.query(Category)
        .filter(Category.userId == userId)
        .order_by(Category.name.asc())
        .all()
    )
    return cats


@app.post("/categories", response_model=CategoryRead)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    if not payload.userId:
        raise HTTPException(status_code=400, detail="Missing userId")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")

    # optional: avoid duplicates
    existing = (
        db.query(Category)
        .filter(Category.userId == payload.userId, Category.name == name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have this category")

    cat = Category(userId=payload.userId, name=name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@app.delete("/categories")
def delete_category(payload: CategoryDelete, db: Session = Depends(get_db)):
    if not payload.userId:
        raise HTTPException(status_code=400, detail="Missing userId")

    db.query(Category).filter(
        Category.id == payload.id,
        Category.userId == payload.userId,
    ).delete()

    db.commit()
    return {"success": True}