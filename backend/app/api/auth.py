from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import Token, UserCreate, UserOut
from app.core.auth import verify_password, hash_password, create_access_token, get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(username: str, password: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == username, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token({"sub": user.username, "role": user.role.value})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/register", response_model=UserOut)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    # Check username/email uniqueness
    existing = await db.execute(select(User).where(User.username == user_data.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=UserRole(user_data.role.value),
        full_name=user_data.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Issue a fresh token for an authenticated user."""
    token = create_access_token({"sub": current_user.username, "role": current_user.role.value})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(current_user))

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Issue a fresh token for an authenticated user."""
    token = create_access_token({"sub": current_user.username, "role": current_user.role.value})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(current_user)
    )

from pydantic import BaseModel as _PydanticBase

class ChangePasswordRequest(_PydanticBase):
    current_password: str
    new_password: str

@router.post("/change-password/")
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}
