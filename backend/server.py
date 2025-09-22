from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import shutil
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

# Import our modules
from models import *
from security import *
from database import *
from email_service import email_service
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Ensure uploads directory exists
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(
    title="EarnWise - Student Finance & Side Hustle Platform",
    description="Production-ready platform for student financial management and side hustles",
    version="2.0.0",
    docs_url="/api/docs" if os.environ.get("ENVIRONMENT") != "production" else None,
    redoc_url="/api/redoc" if os.environ.get("ENVIRONMENT") != "production" else None
)

# Serve static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Create API router
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# LLM Chat instance
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Rate limiting setup
app.state.limiter = limiter

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Trust only specific hosts in production
if os.environ.get("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=os.environ.get("ALLOWED_HOSTS", "localhost").split(',')
    )

# Add rate limiting error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    response = JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"}
    )
    response = request.app.state.limiter._inject_headers(response, request.state.view_rate_limit)
    return response

# Global exception handler for better error messages
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."}
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current authenticated user"""
    user_id = verify_jwt_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if user exists and is active
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account deactivated")
    
    if not user.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Email not verified")
    
    return user_id

async def get_current_admin(user_id: str = Depends(get_current_user)) -> str:
    """Get current authenticated admin user"""
    user = await get_user_by_id(user_id)
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id

async def get_enhanced_ai_hustle_recommendations(user_skills: List[str], availability: int, recent_earnings: float, location: str = None) -> List[Dict]:
    """Generate enhanced AI-powered hustle recommendations"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"hustle_rec_{uuid.uuid4()}",
            system_message="""You are an AI advisor for student side hustles in India. Based on user skills, availability, recent earnings, and location, recommend 8 specific hustle opportunities. Focus on Indian market opportunities and use INR currency.
            
            Return ONLY a JSON array with this exact format:
            [
                {
                    "title": "Exact hustle title",
                    "description": "Brief description focusing on Indian market",
                    "category": "tutoring|freelance|content_creation|delivery|micro_tasks",
                    "estimated_pay": number (in INR per hour),
                    "time_commitment": "X hours/week",
                    "required_skills": ["skill1", "skill2"],
                    "difficulty_level": "beginner|intermediate|advanced",
                    "platform": "Platform name or method",
                    "match_score": number between 0-100
                }
            ]"""
        ).with_model("openai", "gpt-4o")
        
        location_context = f" in {location}" if location else " in India"
        earnings_context = f"Current monthly earnings: ₹{recent_earnings}" if recent_earnings > 0 else "No current side hustle earnings"
        
        user_message = UserMessage(
            text=f"User profile: Skills: {', '.join(user_skills) if user_skills else 'General skills'}. Available {availability} hours/week{location_context}. {earnings_context}. Recommend 8 personalized side hustle opportunities with Indian market focus and INR rates."
        )
        
        response = await chat.send_message(user_message)
        
        # Try to parse JSON response
        import json
        try:
            recommendations = json.loads(response)
            return recommendations[:8]  # Ensure max 8 recommendations
        except json.JSONDecodeError:
            # Fallback recommendations for Indian market
            return [
                {
                    "title": "Online Tutoring (BYJU'S/Vedantu)",
                    "description": "Teach subjects you excel in to students across India",
                    "category": "tutoring",
                    "estimated_pay": 300.0,
                    "time_commitment": "10-15 hours/week",
                    "required_skills": user_skills[:2] if user_skills else ["Subject Knowledge"],
                    "difficulty_level": "beginner",
                    "platform": "BYJU'S, Vedantu, Unacademy",
                    "match_score": 90.0
                },
                {
                    "title": "Content Writing (Hindi/English)",
                    "description": "Write articles, blogs, and social media content for Indian brands",
                    "category": "freelance",
                    "estimated_pay": 250.0,
                    "time_commitment": "8-12 hours/week",
                    "required_skills": ["Writing", "Research"],
                    "difficulty_level": "intermediate",
                    "platform": "Upwork, Freelancer, Truelancer",
                    "match_score": 85.0
                },
                {
                    "title": "Food Delivery Partner",
                    "description": "Deliver food orders in your local area with flexible timing",
                    "category": "delivery",
                    "estimated_pay": 200.0,
                    "time_commitment": "15-20 hours/week",
                    "required_skills": ["Time Management", "Local Knowledge"],
                    "difficulty_level": "beginner",
                    "platform": "Zomato, Swiggy, Dunzo",
                    "match_score": 75.0
                },
                {
                    "title": "Social Media Management",
                    "description": "Manage social media accounts for small Indian businesses",
                    "category": "content_creation",
                    "estimated_pay": 400.0,
                    "time_commitment": "6-10 hours/week",
                    "required_skills": ["Social Media", "Content Creation"],
                    "difficulty_level": "intermediate",
                    "platform": "Direct Client Outreach",
                    "match_score": 80.0
                }
            ]
            
    except Exception as e:
        logging.error(f"AI recommendation error: {e}")
        return []

async def get_financial_insights(user_id: str) -> Dict[str, Any]:
    """Generate AI-powered financial insights"""
    try:
        # Get user's recent transactions
        transactions = await get_user_transactions(user_id, limit=50)
        
        if not transactions:
            return {"insights": ["Start tracking your expenses to get personalized insights!"]}
        
        # Calculate basic stats
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"financial_insights_{user_id}",
            system_message="You are a financial advisor for Indian students. Provide 3-5 actionable insights based on their spending patterns. Use INR currency and be encouraging and specific to Indian context."
        ).with_model("openai", "gpt-4o")

        user_message = UserMessage(
            text=f"Indian student's financial summary: Total income: ₹{total_income}, Total expenses: ₹{total_expenses}. Recent transactions: {len(transactions)} entries. Provide personalized financial insights and tips for Indian students."
        )

        response = await chat.send_message(user_message)
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_savings": total_income - total_expenses,
            "insights": [response]
        }
        
    except Exception as e:
        logging.error(f"Financial insights error: {e}")
        return {"insights": ["Keep tracking your finances to unlock AI-powered insights!"]}

# Authentication Routes
@api_router.post("/auth/register")
@limiter.limit("5/minute")
async def register_user(request: Request, user_data: UserCreate):
    """Register new user with email verification"""
    try:
        # Check if user exists
        existing_user = await get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate and sanitize input
        user_dict = user_data.dict()
        user_dict["full_name"] = sanitize_input(user_dict["full_name"])
        user_dict["bio"] = sanitize_input(user_dict.get("bio", ""))
        user_dict["location"] = sanitize_input(user_dict.get("location", ""))
        
        # Hash password and create user
        hashed_password = hash_password(user_data.password)
        del user_dict["password"]
        
        user = User(**user_dict)
        user_doc = user.dict()
        user_doc["password_hash"] = hashed_password
        user_doc["email_verified"] = False
        user_doc["is_active"] = False  # Activate only after email verification
        
        await create_user(user_doc)
        
        # Generate and send verification code
        verification_code = generate_verification_code()
        expires_at = datetime.now(timezone.utc) + EMAIL_VERIFICATION_EXPIRY
        
        await store_verification_code(user_data.email, verification_code, expires_at)
        await email_service.send_verification_email(user_data.email, verification_code)
        
        return {
            "message": "Registration successful! Please check your email for verification code.",
            "email": user_data.email,
            "verification_required": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/verify-email")
@limiter.limit("10/minute")
async def verify_email(request: Request, verification: EmailVerificationConfirm):
    """Verify email with code"""
    try:
        # Get stored verification code
        stored_verification = await get_verification_code(verification.email)
        if not stored_verification:
            raise HTTPException(status_code=400, detail="No verification code found")
        
        # Check if code matches and hasn't expired
        if stored_verification["code"] != verification.verification_code:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Handle timezone comparison properly
        expires_at = stored_verification["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if datetime.now(timezone.utc) > expires_at:
            await delete_verification_code(verification.email)
            raise HTTPException(status_code=400, detail="Verification code expired")
        
        # Activate user account
        user_doc = await get_user_by_email(verification.email)
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        await update_user(
            user_doc["id"],
            {
                "email_verified": True,
                "is_active": True,
                "last_login": datetime.now(timezone.utc)
            }
        )
        
        # Clean up verification code
        await delete_verification_code(verification.email)
        
        # Get user and create token
        user_doc = await get_user_by_email(verification.email)
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Send welcome email
        await email_service.send_welcome_email(verification.email, user_doc["full_name"])
        
        # Create JWT token
        token = create_jwt_token(user_doc["id"])
        
        # Remove password hash from response
        del user_doc["password_hash"]
        user = User(**user_doc)
        
        return {
            "message": "Email verified successfully!",
            "token": token,
            "user": user.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Email verification failed")

@api_router.post("/auth/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(request: Request, email_request: EmailVerificationRequest):
    """Resend verification email"""
    try:
        user = await get_user_by_email(email_request.email)
        if not user:
            raise HTTPException(status_code=400, detail="Email not found")
        
        if user.get("email_verified", False):
            raise HTTPException(status_code=400, detail="Email already verified")
        
        # Generate new verification code
        verification_code = generate_verification_code()
        expires_at = datetime.now(timezone.utc) + EMAIL_VERIFICATION_EXPIRY
        
        await store_verification_code(email_request.email, verification_code, expires_at)
        await email_service.send_verification_email(email_request.email, verification_code)
        
        return {"message": "Verification code sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resend verification")

@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login_user(request: Request, login_data: UserLogin):
    """Login user with enhanced security"""
    try:
        # Find user
        user_doc = await get_user_by_email(login_data.email)
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if account is locked
        if is_account_locked(
            user_doc.get("failed_login_attempts", 0),
            user_doc.get("last_failed_login")
        ):
            remaining_time = get_lockout_remaining_time(user_doc.get("last_failed_login"))
            raise HTTPException(
                status_code=423,
                detail=f"Account locked due to too many failed attempts. Try again in {remaining_time} minutes."
            )
        
        # Verify password
        if not verify_password(login_data.password, user_doc["password_hash"]):
            # Increment failed login attempts
            failed_attempts = user_doc.get("failed_login_attempts", 0) + 1
            await update_user(
                user_doc["id"],
                {
                    "failed_login_attempts": failed_attempts,
                    "last_failed_login": datetime.now(timezone.utc)
                }
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if email is verified
        if not user_doc.get("email_verified", False):
            raise HTTPException(
                status_code=401,
                detail="Please verify your email before logging in"
            )
        
        # Check if account is active
        if not user_doc.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account deactivated")
        
        # Reset failed login attempts on successful login
        await update_user(
            user_doc["id"],
            {
                "failed_login_attempts": 0,
                "last_failed_login": None,
                "last_login": datetime.now(timezone.utc)
            }
        )
        
        # Create JWT token
        token = create_jwt_token(user_doc["id"])
        
        # Remove password hash from response
        del user_doc["password_hash"]
        user = User(**user_doc)
        
        return {
            "message": "Login successful",
            "token": token,
            "user": user.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.post("/auth/password-strength")
async def check_password_strength_endpoint(request: Request, password_data: dict):
    """Check password strength"""
    password = password_data.get("password", "")
    strength_info = check_password_strength(password)
    return strength_info

@api_router.post("/auth/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, email_request: EmailVerificationRequest):
    """Send password reset code"""
    try:
        user = await get_user_by_email(email_request.email)
        if not user:
            # Don't reveal if email exists or not
            return {"message": "If the email exists, a reset code has been sent"}
        
        # Generate reset code
        reset_code = generate_verification_code()
        expires_at = datetime.now(timezone.utc) + PASSWORD_RESET_EXPIRY
        
        await store_password_reset_code(email_request.email, reset_code, expires_at)
        await email_service.send_password_reset_email(email_request.email, reset_code)
        
        return {"message": "If the email exists, a reset code has been sent"}
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return {"message": "If the email exists, a reset code has been sent"}

@api_router.post("/auth/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, reset_data: PasswordResetConfirm):
    """Reset password with code"""
    try:
        # Get stored reset code
        stored_reset = await get_password_reset_code(reset_data.email)
        if not stored_reset:
            raise HTTPException(status_code=400, detail="No reset code found")
        
        # Check if code matches and hasn't expired
        if stored_reset["code"] != reset_data.reset_code:
            raise HTTPException(status_code=400, detail="Invalid reset code")
        
        # Handle timezone comparison properly
        expires_at = stored_reset["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if datetime.now(timezone.utc) > expires_at:
            await delete_password_reset_code(reset_data.email)
            raise HTTPException(status_code=400, detail="Reset code expired")
        
        # Update password
        hashed_password = hash_password(reset_data.new_password)
        user = await get_user_by_email(reset_data.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await update_user(
            user["id"], 
            {
                "password_hash": hashed_password,
                "failed_login_attempts": 0,
                "last_failed_login": None
            }
        )
        
        # Clean up reset code
        await delete_password_reset_code(reset_data.email)
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Password reset failed")

# User Routes
@api_router.get("/user/profile", response_model=User)
@limiter.limit("30/minute")
async def get_user_profile(request: Request, user_id: str = Depends(get_current_user)):
    """Get user profile"""
    user_doc = await get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    del user_doc["password_hash"]
    return User(**user_doc)

@api_router.put("/user/profile")
@limiter.limit("10/minute")
async def update_user_profile(request: Request, updated_data: UserUpdate, user_id: str = Depends(get_current_user)):
    """Update user profile with validation"""
    try:
        update_data = {k: v for k, v in updated_data.dict().items() if v is not None}
        
        # Sanitize inputs
        if "full_name" in update_data:
            update_data["full_name"] = sanitize_input(update_data["full_name"])
        if "bio" in update_data:
            update_data["bio"] = sanitize_input(update_data["bio"])
        if "location" in update_data:
            update_data["location"] = sanitize_input(update_data["location"])
        
        if update_data:
            await update_user(user_id, update_data)
        
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Profile update failed")

@api_router.post("/user/profile/photo")
@limiter.limit("5/minute")
async def upload_profile_photo(request: Request, file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """Upload profile photo with validation"""
    try:
        # Validate file
        validate_file_upload(file.filename, file.size)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        filename = f"profile_{user_id}_{uuid.uuid4()}.{file_extension}"
        file_path = UPLOADS_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update user profile
        photo_url = f"/uploads/{filename}"
        await update_user(user_id, {"profile_photo": photo_url})
        
        return {"message": "Profile photo uploaded successfully", "photo_url": photo_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Photo upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Photo upload failed")

# Transaction Routes
@api_router.post("/transactions", response_model=Transaction)
@limiter.limit("20/minute")
async def create_transaction_endpoint(request: Request, transaction_data: TransactionCreate, user_id: str = Depends(get_current_user)):
    """Create transaction with validation"""
    try:
        transaction_dict = transaction_data.dict()
        transaction_dict["user_id"] = user_id
        transaction_dict["description"] = sanitize_input(transaction_dict["description"])
        transaction_dict["category"] = sanitize_input(transaction_dict["category"])
        
        transaction = Transaction(**transaction_dict)
        await create_transaction(transaction.dict())
        
        # Update user's total earnings if it's income
        if transaction.type == "income":
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"total_earnings": transaction.amount}}
            )
        
        return transaction
        
    except Exception as e:
        logger.error(f"Transaction creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Transaction creation failed")

@api_router.get("/transactions", response_model=List[Transaction])
@limiter.limit("30/minute")
async def get_transactions_endpoint(request: Request, user_id: str = Depends(get_current_user), limit: int = 50, skip: int = 0):
    """Get user transactions"""
    transactions = await get_user_transactions(user_id, limit, skip)
    return [Transaction(**t) for t in transactions]

@api_router.get("/transactions/summary")
@limiter.limit("30/minute")
async def get_transaction_summary_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get transaction summary with large number support"""
    # Get current month transactions
    current_month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    results = await get_transaction_summary(user_id, current_month_start)
    
    summary = {"income": 0, "expense": 0, "income_count": 0, "expense_count": 0}
    for result in results:
        if result["_id"] == "income":
            summary["income"] = result["total"]
            summary["income_count"] = result["count"]
        elif result["_id"] == "expense":
            summary["expense"] = result["total"]
            summary["expense_count"] = result["count"]
    
    summary["net_savings"] = summary["income"] - summary["expense"]
    return summary

# Hustle Routes
@api_router.get("/hustles/recommendations")
@limiter.limit("10/minute")
async def get_hustle_recommendations_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get AI-powered hustle recommendations"""
    # Get user profile
    user_doc = await get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get AI recommendations
    ai_recommendations = await get_enhanced_ai_hustle_recommendations(
        user_doc.get("skills", []),
        user_doc.get("availability_hours", 10),
        user_doc.get("total_earnings", 0.0),
        user_doc.get("location")
    )
    
    # Convert to HustleOpportunity objects
    hustles = []
    for rec in ai_recommendations:
        hustle = HustleOpportunity(
            title=rec.get("title", ""),
            description=rec.get("description", ""),
            category=rec.get("category", "micro_tasks"),
            estimated_pay=rec.get("estimated_pay", 200.0),
            time_commitment=rec.get("time_commitment", "Flexible"),
            required_skills=rec.get("required_skills", []),
            difficulty_level=rec.get("difficulty_level", "beginner"),
            platform=rec.get("platform", "Various"),
            ai_recommended=True,
            match_score=rec.get("match_score", 50.0)
        )
        hustles.append(hustle)
    
    return hustles

@api_router.get("/hustles/user-posted")
@limiter.limit("10/minute")
async def get_user_posted_hustles_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get all user-posted hustles"""
    hustles = await get_active_hustles()
    
    # Add creator info
    for hustle in hustles:
        creator = await get_user_by_id(hustle["created_by"])
        if creator:
            hustle["creator_name"] = creator.get("full_name", "Anonymous")
            hustle["creator_photo"] = creator.get("profile_photo")
    
    return [UserHustle(**hustle) for hustle in hustles]

@api_router.get("/hustles/admin-posted")
@limiter.limit("10/minute")
async def get_admin_posted_hustles_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get admin-posted hustles"""
    cursor = db.user_hustles.find({"is_admin_posted": True, "status": "active"}).sort("created_at", -1)
    hustles = await cursor.to_list(100)
    return [UserHustle(**hustle) for hustle in hustles]

@api_router.post("/hustles/create", response_model=UserHustle)
@limiter.limit("5/minute")
async def create_user_hustle_endpoint(request: Request, hustle_data: UserHustleCreate, user_id: str = Depends(get_current_user)):
    """Create a new user-posted side hustle"""
    try:
        hustle_dict = hustle_data.dict()
        hustle_dict["created_by"] = user_id
        hustle_dict["title"] = sanitize_input(hustle_dict["title"])
        hustle_dict["description"] = sanitize_input(hustle_dict["description"])
        hustle_dict["contact_info"] = sanitize_input(hustle_dict["contact_info"])
        
        hustle = UserHustle(**hustle_dict)
        await create_hustle(hustle.dict())
        
        return hustle
        
    except Exception as e:
        logger.error(f"Hustle creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Hustle creation failed")

@api_router.post("/hustles/admin/create", response_model=UserHustle)
@limiter.limit("10/minute")
async def create_admin_hustle(request: Request, hustle_data: AdminHustleCreate, admin_id: str = Depends(get_current_admin)):
    """Create admin-posted hustle"""
    try:
        hustle_dict = hustle_data.dict()
        hustle_dict["created_by"] = admin_id
        hustle_dict["is_admin_posted"] = True
        hustle_dict["pay_rate"] = hustle_data.estimated_pay
        hustle_dict["pay_type"] = "estimated"
        hustle_dict["contact_info"] = hustle_data.application_link or "admin@earnwise.app"
        hustle_dict["is_remote"] = True
        
        hustle = UserHustle(**hustle_dict)
        await create_hustle(hustle.dict())
        
        return hustle
        
    except Exception as e:
        logger.error(f"Admin hustle creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Admin hustle creation failed")

@api_router.post("/hustles/{hustle_id}/apply")
@limiter.limit("10/minute")
async def apply_to_hustle_endpoint(request: Request, hustle_id: str, application_data: HustleApplicationCreate, user_id: str = Depends(get_current_user)):
    """Apply to a user-posted hustle"""
    try:
        # Get hustle
        hustle = await db.user_hustles.find_one({"id": hustle_id})
        if not hustle:
            raise HTTPException(status_code=404, detail="Hustle not found")
        
        # Check if already applied
        if user_id in hustle.get("applicants", []):
            raise HTTPException(status_code=400, detail="Already applied to this hustle")
        
        # Get user info
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create application
        application_dict = application_data.dict()
        application_dict["cover_message"] = sanitize_input(application_dict["cover_message"])
        
        application = HustleApplication(
            hustle_id=hustle_id,
            applicant_id=user_id,
            applicant_name=user["full_name"],
            applicant_email=user["email"],
            **application_dict
        )
        
        await create_hustle_application(application.dict())
        
        # Add to hustle applicants
        await db.user_hustles.update_one(
            {"id": hustle_id},
            {"$push": {"applicants": user_id}}
        )
        
        return {"message": "Application submitted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hustle application error: {str(e)}")
        raise HTTPException(status_code=500, detail="Hustle application failed")

@api_router.get("/hustles/my-applications")
@limiter.limit("20/minute")
async def get_my_applications_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get user's hustle applications"""
    applications = await get_user_applications(user_id)
    
    # Add hustle info
    for app in applications:
        hustle = await db.user_hustles.find_one({"id": app["hustle_id"]})
        if hustle:
            app["hustle_title"] = hustle.get("title")
            app["hustle_category"] = hustle.get("category")
    
    return [HustleApplication(**app) for app in applications]

@api_router.get("/hustles/categories")
async def get_hustle_categories_endpoint():
    """Get hustle categories"""
    categories = [
        {"name": "tutoring", "display": "Tutoring & Teaching", "icon": "📚"},
        {"name": "freelance", "display": "Freelance Work", "icon": "💻"},
        {"name": "content_creation", "display": "Content Creation", "icon": "🎨"},
        {"name": "delivery", "display": "Delivery & Transportation", "icon": "🚗"},
        {"name": "micro_tasks", "display": "Micro Tasks", "icon": "⚡"}
    ]
    return categories

# Budget Routes
@api_router.post("/budgets", response_model=Budget)
@limiter.limit("10/minute")
async def create_budget_endpoint(request: Request, budget_data: BudgetCreate, user_id: str = Depends(get_current_user)):
    """Create budget"""
    budget_dict = budget_data.dict()
    budget_dict["user_id"] = user_id
    budget_dict["category"] = sanitize_input(budget_dict["category"])
    
    budget = Budget(**budget_dict)
    await create_budget(budget.dict())
    
    return budget

@api_router.get("/budgets", response_model=List[Budget])
@limiter.limit("20/minute")
async def get_budgets_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get user budgets"""
    budgets = await get_user_budgets(user_id)
    return [Budget(**b) for b in budgets]

# Analytics Routes
@api_router.get("/analytics/insights")
@limiter.limit("10/minute")
async def get_analytics_insights_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get AI-powered financial insights"""
    insights = await get_financial_insights(user_id)
    return insights

@api_router.get("/analytics/leaderboard")
@limiter.limit("20/minute")
async def get_leaderboard_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get earnings leaderboard (excluding test users)"""
    # Get top earners (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    pipeline = [
        {"$match": {"type": "income", "date": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": "$user_id", "total_earnings": {"$sum": "$amount"}}},
        {"$sort": {"total_earnings": -1}},
        {"$limit": 10}
    ]
    
    leaderboard_data = await db.transactions.aggregate(pipeline).to_list(10)
    
    # Get user names for leaderboard (exclude test users)
    leaderboard = []
    for item in leaderboard_data:
        user = await get_user_by_id(item["_id"])
        if user and not any(test_word in user.get("email", "").lower() for test_word in ['test', 'dummy', 'example', 'demo']):
            leaderboard.append({
                "user_name": user.get("full_name", "Anonymous"),
                "profile_photo": user.get("profile_photo"),
                "total_earnings": item["total_earnings"],
                "rank": len(leaderboard) + 1
            })
    
    return leaderboard

# Admin Routes
@api_router.get("/admin/users")
@limiter.limit("20/minute")
async def get_all_users(request: Request, admin_id: str = Depends(get_current_admin), skip: int = 0, limit: int = 50):
    """Get all users (Admin only)"""
    cursor = db.users.find({}).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(limit)
    
    # Remove password hashes
    for user in users:
        if "password_hash" in user:
            del user["password_hash"]
    
    return users

@api_router.put("/admin/users/{user_id}/status")
@limiter.limit("10/minute")
async def update_user_status(request: Request, user_id: str, is_active: bool, admin_id: str = Depends(get_current_admin)):
    """Update user active status (Admin only)"""
    await update_user(user_id, {"is_active": is_active})
    return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_database()
    logger.info("EarnWise Production Server started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown"""
    client.close()
    logger.info("Database connection closed")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)