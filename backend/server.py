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

# Import our enhanced modules
from models import *
from security import *
from database import *
from email_service import email_service
from emergentintegrations.llm.chat import LlmChat, UserMessage
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Ensure uploads directory exists
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(
    title="EarnNest - Student Finance & Side Hustle Platform",
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
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    
    return user_id

async def get_current_admin(user_id: str = Depends(get_current_user)) -> str:
    """Get current authenticated admin user"""
    user = await get_user_by_id(user_id)
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id

async def get_enhanced_ai_hustle_recommendations(user_skills: List[str], availability: int, recent_earnings: float, location: str = None) -> List[Dict]:
    """Generate enhanced AI-powered hustle recommendations based on user skills"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"hustle_rec_{uuid.uuid4()}",
            system_message="""You are an AI advisor for student side hustles in India. Based on user skills, generate personalized side hustle recommendations. 
            
            Skill-based recommendations:
            - Freelancing → "Freelance Services", "Remote Work", "Consultation"
            - Graphic Design → "Logo Design", "Social Media Graphics", "Poster/Flyer Design"  
            - Coding → "Website Development", "App Development", "Automation Scripts"
            - Digital Marketing → "Social Media Campaigns", "SEO Consulting", "Content Strategy"
            - Content Writing → "Blog Writing", "Copywriting", "Technical Writing"
            - Video Editing → "YouTube Shorts", "Promotional Videos", "TikTok Content"
            - AI Tools & Automation → "Chatbot Development", "AI Content Generation", "Process Automation"
            - Social Media Management → "Account Management", "Content Planning", "Community Building"
            
            Return ONLY a JSON array with this exact format:
            [
                {
                    "title": "Exact hustle title based on skills",
                    "description": "Brief description for Indian market",
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
            text=f"User skills: {', '.join(user_skills) if user_skills else 'General skills'}. Available {availability} hours/week{location_context}. {earnings_context}. Generate 6 personalized side hustle opportunities based on these specific skills with Indian market focus and INR rates."
        )
        
        response = await chat.send_message(user_message)
        
        # Try to parse JSON response
        import json
        try:
            recommendations = json.loads(response)
            return recommendations[:6]  # Ensure max 6 recommendations
        except json.JSONDecodeError:
            # Fallback recommendations based on skills
            skill_based_hustles = []
            
            for skill in user_skills:
                if "graphic design" in skill.lower():
                    skill_based_hustles.extend([
                        {
                            "title": "Freelance Logo Design",
                            "description": "Design logos for small Indian businesses and startups",
                            "category": "freelance",
                            "estimated_pay": 500.0,
                            "time_commitment": "8-12 hours/week",
                            "required_skills": ["Graphic Design", "Creative Thinking"],
                            "difficulty_level": "intermediate",
                            "platform": "Upwork, Fiverr, Truelancer",
                            "match_score": 95.0
                        },
                        {
                            "title": "Social Media Graphics Designer",
                            "description": "Create graphics for Indian social media campaigns",
                            "category": "content_creation",
                            "estimated_pay": 400.0,
                            "time_commitment": "10-15 hours/week",
                            "required_skills": ["Graphic Design", "Social Media"],
                            "difficulty_level": "beginner",
                            "platform": "Direct Client Outreach, Instagram",
                            "match_score": 90.0
                        }
                    ])
                
                if "coding" in skill.lower():
                    skill_based_hustles.extend([
                        {
                            "title": "Website Development",
                            "description": "Build websites for Indian small businesses",
                            "category": "freelance",
                            "estimated_pay": 800.0,
                            "time_commitment": "15-20 hours/week",
                            "required_skills": ["Coding", "Web Development"],
                            "difficulty_level": "intermediate",
                            "platform": "Upwork, Freelancer, Local Contacts",
                            "match_score": 95.0
                        },
                        {
                            "title": "App Development",
                            "description": "Create mobile apps for Indian startups",
                            "category": "freelance",
                            "estimated_pay": 1000.0,
                            "time_commitment": "20+ hours/week",
                            "required_skills": ["Coding", "Mobile Development"],
                            "difficulty_level": "advanced",
                            "platform": "Upwork, AngelList, Direct Contacts",
                            "match_score": 90.0
                        }
                    ])
                
                if "digital marketing" in skill.lower():
                    skill_based_hustles.extend([
                        {
                            "title": "Social Media Campaign Management",
                            "description": "Manage social media campaigns for Indian brands",
                            "category": "content_creation",
                            "estimated_pay": 600.0,
                            "time_commitment": "10-15 hours/week",
                            "required_skills": ["Digital Marketing", "Analytics"],
                            "difficulty_level": "intermediate",
                            "platform": "Direct Client Outreach",
                            "match_score": 88.0
                        }
                    ])
                
                if "content writing" in skill.lower():
                    skill_based_hustles.extend([
                        {
                            "title": "Blog Writing for Indian Businesses",
                            "description": "Write blogs and articles for Indian companies",
                            "category": "freelance",
                            "estimated_pay": 300.0,
                            "time_commitment": "8-12 hours/week",
                            "required_skills": ["Content Writing", "Research"],
                            "difficulty_level": "beginner",
                            "platform": "Upwork, ContentKing, Truelancer",
                            "match_score": 85.0
                        }
                    ])
            
            # If no skill-based hustles found, return general recommendations
            if not skill_based_hustles:
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
                        "match_score": 80.0
                    }
                ]
            
            return skill_based_hustles[:6]
            
    except Exception as e:
        logging.error(f"AI recommendation error: {e}")
        return []

async def get_dynamic_financial_insights(user_id: str) -> Dict[str, Any]:
    """Generate dynamic AI-powered financial insights based on user activity"""
    try:
        # Get user's financial data
        user_doc = await get_user_by_id(user_id)
        transactions = await get_user_transactions(user_id, limit=50)
        budgets = await get_user_budgets(user_id)
        goals = await get_user_financial_goals(user_id)
        
        if not transactions:
            return {"insights": ["Start tracking your expenses to get personalized insights!"]}
        
        # Calculate comprehensive stats
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
        net_savings = total_income - total_expenses
        
        # Calculate budget utilization
        budget_stats = {}
        for budget in budgets:
            category = budget["category"]
            utilization = (budget["spent_amount"] / budget["allocated_amount"]) * 100
            budget_stats[category] = {
                "allocated": budget["allocated_amount"],
                "spent": budget["spent_amount"],
                "remaining": budget["allocated_amount"] - budget["spent_amount"],
                "utilization": utilization
            }
        
        # Calculate goal progress
        goal_stats = {}
        for goal in goals:
            progress = (goal["current_amount"] / goal["target_amount"]) * 100
            goal_stats[goal["name"]] = {
                "target": goal["target_amount"],
                "current": goal["current_amount"],
                "progress": progress,
                "remaining": goal["target_amount"] - goal["current_amount"]
            }
        
        # Income streak calculation (days with income since registration)
        income_transactions = [t for t in transactions if t["type"] == "income"]
        income_dates = [t["date"] for t in income_transactions]
        income_streak = calculate_income_streak(income_dates, user_doc.get("created_at"))
        
        # Generate dynamic insights
        insights = []
        
        # Savings insights
        if net_savings > 0:
            savings_rate = (net_savings / total_income) * 100 if total_income > 0 else 0
            if savings_rate > 20:
                insights.append(f"Excellent! You're saving {savings_rate:.1f}% of your income - keep up the great work! 🎉")
            elif savings_rate > 10:
                insights.append(f"Good job! You're saving {savings_rate:.1f}% of your income. Aim for 20% for better financial health! 💪")
            else:
                insights.append(f"You're saving {savings_rate:.1f}% of your income. Try to increase savings to 20% for better financial security! 📈")
        
        # Budget insights
        over_budget_categories = [cat for cat, stats in budget_stats.items() if stats["utilization"] > 90]
        under_budget_categories = [cat for cat, stats in budget_stats.items() if stats["utilization"] < 50]
        
        if over_budget_categories:
            for category in over_budget_categories[:2]:  # Limit to 2 categories
                remaining = budget_stats[category]["remaining"]
                if remaining <= 0:
                    insights.append(f"⚠️ You've exceeded your {category} budget! Consider reducing expenses in this category.")
                else:
                    insights.append(f"⚠️ You're close to your {category} budget limit. Only ₹{remaining:.0f} remaining!")
        
        if under_budget_categories:
            best_category = min(under_budget_categories, key=lambda x: budget_stats[x]["utilization"])
            saved_amount = budget_stats[best_category]["remaining"]
            insights.append(f"Great job! Your {best_category} budget is under control. You've saved ₹{saved_amount:.0f} this month! 🎯")
        
        # Goal insights
        for goal_name, stats in goal_stats.items():
            if stats["progress"] > 75:
                insights.append(f"🎊 You're {stats['progress']:.0f}% towards your {goal_name} goal! Almost there!")
            elif stats["progress"] > 50:
                insights.append(f"💪 You've reached {stats['progress']:.0f}% of your {goal_name} target. Keep going!")
            elif stats["progress"] > 25:
                insights.append(f"📈 You're {stats['progress']:.0f}% towards your {goal_name}. Consider increasing your savings rate!")
        
        # Income streak insights
        if income_streak >= 7:
            insights.append(f"🔥 Amazing! You're on a {income_streak}-day income streak - achievement unlocked soon!")
        elif income_streak >= 3:
            insights.append(f"💼 Good momentum! You're on a {income_streak}-day income streak. Keep it up!")
        
        # Spending pattern insights
        expense_categories = {}
        for transaction in transactions:
            if transaction["type"] == "expense":
                category = transaction["category"]
                expense_categories[category] = expense_categories.get(category, 0) + transaction["amount"]
        
        if expense_categories:
            highest_expense_category = max(expense_categories, key=expense_categories.get)
            highest_amount = expense_categories[highest_expense_category]
            insights.append(f"💡 Your highest expense category is {highest_expense_category} (₹{highest_amount:.0f}). Consider reviewing these expenses!")
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_savings": net_savings,
            "savings_rate": (net_savings / total_income) * 100 if total_income > 0 else 0,
            "income_streak": income_streak,
            "budget_stats": budget_stats,
            "goal_stats": goal_stats,
            "insights": insights[:5]  # Limit to 5 most relevant insights
        }
        
    except Exception as e:
        logging.error(f"Dynamic financial insights error: {e}")
        return {"insights": ["Keep tracking your finances to unlock AI-powered insights!"]}

def calculate_income_streak(income_dates, registration_date=None):
    """Calculate income days since registration"""
    if not income_dates:
        return 0
    
    # If no registration date provided, fall back to old logic
    if not registration_date:
        sorted_dates = sorted(income_dates, reverse=True)
        current_date = datetime.now(timezone.utc).date()
        
        streak = 0
        check_date = current_date
        
        for income_date in sorted_dates:
            income_day = income_date.date() if hasattr(income_date, 'date') else income_date
            days_diff = (check_date - income_day).days
            
            if days_diff <= 1:
                streak += 1
                check_date = income_day - timedelta(days=1)
            else:
                break
        return streak
    
    # New logic: Count days with income since registration
    reg_date = registration_date.date() if hasattr(registration_date, 'date') else registration_date
    
    # Get unique income days since registration
    income_days = set()
    for income_date in income_dates:
        income_day = income_date.date() if hasattr(income_date, 'date') else income_date
        if income_day >= reg_date:
            income_days.add(income_day)
    
    return len(income_days)

async def update_monthly_income_goal_progress(user_id: str):
    """Update Monthly Income Goal progress based on actual income transactions"""
    try:
        # Find the monthly income goal
        monthly_goal = await db.financial_goals.find_one({
            "user_id": user_id,
            "category": "monthly_income",
            "is_active": True
        })
        
        if not monthly_goal:
            return  # No monthly income goal to update
        
        # Calculate current month's income
        current_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = current_month.replace(month=current_month.month + 1) if current_month.month < 12 else current_month.replace(year=current_month.year + 1, month=1)
        
        # Get income transactions for current month
        income_transactions = await db.transactions.find({
            "user_id": user_id,
            "type": "income",
            "date": {"$gte": current_month, "$lt": next_month}
        }).to_list(None)
        
        # Calculate total monthly income
        monthly_income = sum(transaction["amount"] for transaction in income_transactions)
        
        # Update the goal's current amount
        await db.financial_goals.update_one(
            {"_id": monthly_goal["_id"]},
            {
                "$set": {
                    "current_amount": monthly_income,
                    "updated_at": datetime.now(timezone.utc),
                    "is_completed": monthly_income >= monthly_goal["target_amount"]
                }
            }
        )
        
        logger.info(f"Updated monthly income goal for user {user_id}: ₹{monthly_income}/₹{monthly_goal['target_amount']}")
        
    except Exception as e:
        logger.error(f"Error updating monthly income goal: {e}")
        # Don't raise exception as this is a background update

# Enhanced Authentication Routes with Comprehensive OTP Security
@api_router.get("/auth/trending-skills")
async def get_trending_skills():
    """Get trending skills for registration and profile updates"""
    trending_skills = [
        {"name": "Freelancing", "category": "Business", "icon": "💼"},
        {"name": "Graphic Design", "category": "Creative", "icon": "🎨"},
        {"name": "Coding", "category": "Technical", "icon": "💻"},
        {"name": "Digital Marketing", "category": "Marketing", "icon": "📱"},
        {"name": "Content Writing", "category": "Creative", "icon": "✍️"},
        {"name": "Video Editing", "category": "Creative", "icon": "🎬"},
        {"name": "AI Tools & Automation", "category": "Technical", "icon": "🤖"},
        {"name": "Social Media Management", "category": "Marketing", "icon": "📊"}
    ]
    return {"trending_skills": trending_skills}

@api_router.get("/auth/avatars")
async def get_available_avatars():
    """Get available avatar options"""
    avatars = [
        {"value": "boy", "label": "Boy", "category": "youth"},
        {"value": "man", "label": "Man", "category": "adult"},
        {"value": "girl", "label": "Girl", "category": "youth"},
        {"value": "woman", "label": "Woman", "category": "adult"},
        {"value": "grandfather", "label": "Grandfather (GF)", "category": "senior"},
        {"value": "grandmother", "label": "Grandmother (GM)", "category": "senior"}
    ]
    return {"avatars": avatars}

@api_router.post("/auth/register")
@limiter.limit("5/minute")
async def register_user(request: Request, user_data: UserCreate):
    """
    Direct user registration without email verification
    
    Features:
    - Immediate account activation
    - JWT token provided instantly
    - Password strength validation
    - Rate limiting for security
    """
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
        user_doc["email_verified"] = True  # Direct login without email verification
        user_doc["is_active"] = True  # Activate immediately
        
        await create_user(user_doc)
        
        # Create JWT token immediately - no email verification needed
        token = create_jwt_token(user_doc["id"])
        
        # Remove password hash from response
        del user_doc["password_hash"]
        user = User(**user_doc)
        
        return {
            "message": "Registration successful! Welcome to EarnNest - Your journey to financial success starts now!",
            "token": token,
            "user": user.dict(),
            "email": user_data.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

# Removed email verification endpoints - direct registration without verification

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
    """Enhanced password strength checker with detailed feedback"""
    password = password_data.get("password", "")
    strength_info = check_password_strength(password)
    return strength_info

@api_router.get("/auth/otp-config")
async def get_otp_configuration():
    """
    Get current OTP system configuration for debugging and monitoring
    
    Returns current OTP settings including:
    - OTP length configuration
    - Expiry time settings
    - Rate limiting configuration
    - Security feature status
    """
    config = get_otp_config()
    
    return {
        "otp_system": {
            "version": "2.0",
            "features": [
                "Dynamic OTP length (6-8 digits)",
                "5-minute expiry for enhanced security", 
                "Email-specific rate limiting",
                "Comprehensive security logging",
                "Enhanced email validation",
                "Automatic cleanup of expired codes",
                "Client IP tracking",
                "Security event monitoring"
            ]
        },
        "configuration": config,
        "security_status": "Enhanced",
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

# Removed forgot-password endpoint - direct password reset only

@api_router.post("/auth/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, reset_data: dict):
    """Simple password reset with email + new password"""
    try:
        email = reset_data.get("email")
        new_password = reset_data.get("new_password")
        
        if not email or not new_password:
            raise HTTPException(status_code=400, detail="Email and new password are required")
        
        # Get user for password update
        user = await get_user_by_email(email)
        if not user:
            # Don't reveal if user exists for security
            return {"message": "If the email exists, password has been reset successfully"}
        
        # Validate new password strength
        password_strength = check_password_strength(new_password)
        if password_strength["score"] < 40:  # Require at least medium strength
            raise HTTPException(
                status_code=400, 
                detail=f"Password too weak (score: {password_strength['score']}/100). " + 
                       ", ".join(password_strength["feedback"])
            )
        
        # Update password
        hashed_password = hash_password(new_password)
        await update_user(
            user["id"], 
            {
                "password_hash": hashed_password,
                "failed_login_attempts": 0,
                "last_failed_login": None,
                "password_changed_at": datetime.now(timezone.utc)
            }
        )
        
        return {
            "message": "Password reset successfully! Your account is now secure.",
            "password_strength": {
                "score": password_strength["score"],
                "strength": password_strength["strength"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Password reset failed")

# User Routes
@api_router.get("/user/profile", response_model=User)
@limiter.limit("30/minute")
async def get_user_profile(request: Request, user_id: str = Depends(get_current_user)):
    """Get user profile with auto-calculated earnings and achievements"""
    user_doc = await get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate total earnings from transactions
    transactions = await get_user_transactions(user_id, limit=1000)
    total_earnings = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
    net_savings = total_earnings - total_expenses
    
    # Calculate achievements
    achievements = []
    
    # Income-based achievements
    if total_earnings >= 100000:
        achievements.append({
            "id": "lakh_earner",
            "title": "Lakh Earner",
            "description": "Earned ₹1 Lakh or more",
            "icon": "💰",
            "earned": True,
            "category": "earnings"
        })
    elif total_earnings >= 50000:
        achievements.append({
            "id": "fifty_k_earner",
            "title": "Growing Earner",
            "description": "Earned ₹50,000 or more",
            "icon": "💵",
            "earned": True,
            "category": "earnings"
        })
    elif total_earnings >= 10000:
        achievements.append({
            "id": "first_ten_k",
            "title": "First 10K",
            "description": "Earned your first ₹10,000",
            "icon": "💸",
            "earned": True,
            "category": "earnings"
        })
    
    # Streak-based achievements
    income_transactions = [t for t in transactions if t["type"] == "income"]
    income_dates = [t["date"] for t in income_transactions]
    current_streak = calculate_income_streak(income_dates, user_doc.get("created_at"))
    
    if current_streak >= 30:
        achievements.append({
            "id": "month_streaker",
            "title": "Monthly Streaker",
            "description": "30+ days with income",
            "icon": "🔥",
            "earned": True,
            "category": "consistency"
        })
    elif current_streak >= 7:
        achievements.append({
            "id": "week_streaker",
            "title": "Weekly Warrior",
            "description": "7+ days with income",
            "icon": "⚡",
            "earned": True,
            "category": "consistency"
        })
    
    # Savings-based achievements
    if net_savings >= 50000:
        achievements.append({
            "id": "super_saver",
            "title": "Super Saver",
            "description": "Saved ₹50,000 or more",
            "icon": "🏆",
            "earned": True,
            "category": "savings"
        })
    elif net_savings >= 10000:
        achievements.append({
            "id": "good_saver",
            "title": "Good Saver",
            "description": "Saved ₹10,000 or more",
            "icon": "🎯",
            "earned": True,
            "category": "savings"
        })
    
    # Update user document with calculated values
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "total_earnings": total_earnings,
                "net_savings": net_savings,
                "current_streak": current_streak,
                "achievements": achievements
            }
        }
    )
    
    # Update user_doc with calculated values for response
    user_doc["total_earnings"] = total_earnings
    user_doc["net_savings"] = net_savings
    user_doc["current_streak"] = current_streak
    user_doc["achievements"] = achievements
    
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

# Transaction Routes
@api_router.post("/transactions", response_model=Transaction)
@limiter.limit("20/minute")
async def create_transaction_endpoint(request: Request, transaction_data: TransactionCreate, user_id: str = Depends(get_current_user)):
    """Create transaction with budget validation and automatic deduction"""
    try:
        transaction_dict = transaction_data.dict()
        transaction_dict["user_id"] = user_id
        transaction_dict["description"] = sanitize_input(transaction_dict["description"])
        transaction_dict["category"] = sanitize_input(transaction_dict["category"])
        
        # Budget validation logic for EXPENSES only
        if transaction_data.type == "expense":
            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            
            # Find the budget for this category and month
            budget = await db.budgets.find_one({
                "user_id": user_id,
                "category": transaction_dict["category"],
                "month": current_month
            })
            
            if not budget:
                raise HTTPException(
                    status_code=400, 
                    detail=f"No budget allocated for '{transaction_dict['category']}' category. Please allocate budget first."
                )
            
            # Check if expense exceeds remaining budget
            remaining_budget = budget["allocated_amount"] - budget["spent_amount"]
            if transaction_data.amount > remaining_budget:
                raise HTTPException(
                    status_code=400,
                    detail=f"No money, you reached the limit! Remaining budget for '{transaction_dict['category']}': ₹{remaining_budget:.2f}, but you're trying to spend ₹{transaction_data.amount:.2f}"
                )
            
            # Create the transaction first
            transaction = Transaction(**transaction_dict)
            await create_transaction(transaction.dict())
            
            # Update the budget's spent amount
            await db.budgets.update_one(
                {"_id": budget["_id"]},
                {"$inc": {"spent_amount": transaction_data.amount}}
            )
            
        else:
            # For income transactions, no budget validation needed
            transaction = Transaction(**transaction_dict)
            await create_transaction(transaction.dict())
            
            # Update user's total earnings and current streak if it's income
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"total_earnings": transaction.amount}}
            )
            
            # Recalculate and update income streak
            user_doc = await get_user_by_id(user_id)
            user_transactions = await get_user_transactions(user_id, limit=1000)
            income_transactions = [t for t in user_transactions if t["type"] == "income"]
            income_dates = [t["date"] for t in income_transactions]
            current_streak = calculate_income_streak(income_dates, user_doc.get("created_at"))
            
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"current_streak": current_streak}}
            )

            # Update Monthly Income Goal progress automatically
            await update_monthly_income_goal_progress(user_id)
        
        return transaction
        
    except HTTPException:
        raise
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
        # Note: contact_info is a ContactInfo object, not a string, so we don't sanitize it
        
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
    """Get hustle categories with trending indicators"""
    categories = [
        {"name": "tutoring", "display": "Tutoring & Teaching", "icon": "📚", "trending": True},
        {"name": "freelance", "display": "Freelance Work", "icon": "💻", "trending": True},
        {"name": "content_creation", "display": "Content Creation", "icon": "🎨", "trending": True},
        {"name": "delivery", "display": "Delivery & Transportation", "icon": "🚗", "trending": False},
        {"name": "micro_tasks", "display": "Micro Tasks", "icon": "⚡", "trending": True},
        {"name": "digital_marketing", "display": "Digital Marketing", "icon": "📱", "trending": True},
        {"name": "graphic_design", "display": "Graphic Design", "icon": "🎨", "trending": True},
        {"name": "video_editing", "display": "Video Editing", "icon": "🎬", "trending": True},
        {"name": "social_media", "display": "Social Media Management", "icon": "📊", "trending": True},
        {"name": "data_entry", "display": "Data Entry", "icon": "📝", "trending": False},
        {"name": "virtual_assistant", "display": "Virtual Assistant", "icon": "🤝", "trending": True},
        {"name": "other", "display": "Other", "icon": "💼", "trending": False}
    ]
    return categories

# User Hustle Management Routes
@api_router.get("/hustles/my-posted")
@limiter.limit("20/minute")
async def get_my_posted_hustles_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get user's own posted hustles"""
    cursor = db.user_hustles.find({"created_by": user_id}).sort("created_at", -1)
    hustles = await cursor.to_list(100)
    return [UserHustle(**hustle) for hustle in hustles]

@api_router.put("/hustles/{hustle_id}")
@limiter.limit("10/minute")
async def update_user_hustle_endpoint(request: Request, hustle_id: str, hustle_update: UserHustleUpdate, user_id: str = Depends(get_current_user)):
    """Update user's posted hustle"""
    try:
        # Check if hustle exists and belongs to user
        existing_hustle = await db.user_hustles.find_one({"id": hustle_id, "created_by": user_id})
        if not existing_hustle:
            raise HTTPException(status_code=404, detail="Hustle not found or not authorized")
        
        # Prepare update data
        update_data = {k: v for k, v in hustle_update.dict().items() if v is not None}
        
        if "title" in update_data:
            update_data["title"] = sanitize_input(update_data["title"])
        if "description" in update_data:
            update_data["description"] = sanitize_input(update_data["description"])
        
        if update_data:
            await db.user_hustles.update_one(
                {"id": hustle_id, "created_by": user_id},
                {"$set": update_data}
            )
        
        return {"message": "Hustle updated successfully"}
        
    except Exception as e:
        logger.error(f"Hustle update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Hustle update failed")

@api_router.delete("/hustles/{hustle_id}")
@limiter.limit("10/minute")
async def delete_user_hustle_endpoint(request: Request, hustle_id: str, user_id: str = Depends(get_current_user)):
    """Delete user's posted hustle"""
    try:
        # Check if hustle exists and belongs to user
        existing_hustle = await db.user_hustles.find_one({"id": hustle_id, "created_by": user_id})
        if not existing_hustle:
            raise HTTPException(status_code=404, detail="Hustle not found or not authorized")
        
        # Delete the hustle
        result = await db.user_hustles.delete_one({"id": hustle_id, "created_by": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Hustle not found")
        
        return {"message": "Hustle deleted successfully"}
        
    except Exception as e:
        logger.error(f"Hustle deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Hustle deletion failed")

# Budget Routes
@api_router.get("/budgets/category/{category}")
@limiter.limit("30/minute")
async def get_category_budget_endpoint(request: Request, category: str, user_id: str = Depends(get_current_user)):
    """Get budget information for a specific category"""
    try:
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        budget = await db.budgets.find_one({
            "user_id": user_id,
            "category": category,
            "month": current_month
        })
        
        if not budget:
            return {
                "category": category,
                "allocated_amount": 0.0,
                "spent_amount": 0.0,
                "remaining_amount": 0.0,
                "has_budget": False,
                "month": current_month
            }
        
        remaining = budget["allocated_amount"] - budget["spent_amount"]
        return {
            "category": category,
            "allocated_amount": budget["allocated_amount"],
            "spent_amount": budget["spent_amount"],
            "remaining_amount": remaining,
            "has_budget": True,
            "month": current_month,
            "budget_id": budget["id"]
        }
        
    except Exception as e:
        logger.error(f"Budget category lookup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Budget lookup failed")

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

@api_router.delete("/budgets/{budget_id}")
@limiter.limit("10/minute")
async def delete_budget_endpoint(request: Request, budget_id: str, user_id: str = Depends(get_current_user)):
    """Delete budget"""
    try:
        # Verify budget belongs to user
        budget = await db.budgets.find_one({"id": budget_id, "user_id": user_id})
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        await db.budgets.delete_one({"id": budget_id, "user_id": user_id})
        return {"message": "Budget deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Budget deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Budget deletion failed")

@api_router.put("/budgets/{budget_id}", response_model=Budget)
@limiter.limit("10/minute")
async def update_budget_endpoint(request: Request, budget_id: str, budget_update: BudgetUpdate, user_id: str = Depends(get_current_user)):
    """Update budget allocation"""
    try:
        # Verify budget belongs to user
        budget = await db.budgets.find_one({"id": budget_id, "user_id": user_id})
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        # Prepare update data
        update_data = {k: v for k, v in budget_update.dict().items() if v is not None}
        
        if "category" in update_data:
            update_data["category"] = sanitize_input(update_data["category"])
        
        # Update the budget
        await db.budgets.update_one(
            {"id": budget_id, "user_id": user_id}, 
            {"$set": update_data}
        )
        
        # Return updated budget
        updated_budget = await db.budgets.find_one({"id": budget_id, "user_id": user_id})
        return Budget(**updated_budget)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Budget update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Budget update failed")

# Analytics Routes
@api_router.get("/analytics/insights")
@limiter.limit("10/minute")
async def get_analytics_insights_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get dynamic AI-powered financial insights"""
    insights = await get_dynamic_financial_insights(user_id)
    return insights

# Financial Goals Routes
@api_router.post("/financial-goals", response_model=FinancialGoal)
@limiter.limit("10/minute")
async def create_financial_goal_endpoint(request: Request, goal_data: FinancialGoalCreate, user_id: str = Depends(get_current_user)):
    """Create financial goal"""
    try:
        goal_dict = goal_data.dict()
        goal_dict["user_id"] = user_id
        goal_dict["name"] = sanitize_input(goal_dict["name"])
        if goal_dict.get("description"):
            goal_dict["description"] = sanitize_input(goal_dict["description"])
        
        goal = FinancialGoal(**goal_dict)
        await create_financial_goal(goal.dict())
        
        return goal
        
    except Exception as e:
        logger.error(f"Financial goal creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Financial goal creation failed")

@api_router.get("/financial-goals", response_model=List[FinancialGoal])
@limiter.limit("20/minute")
async def get_financial_goals_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get user's financial goals"""
    goals = await get_user_financial_goals(user_id)
    return [FinancialGoal(**g) for g in goals]

@api_router.put("/financial-goals/{goal_id}")
@limiter.limit("10/minute")
async def update_financial_goal_endpoint(request: Request, goal_id: str, goal_update: FinancialGoalUpdate, user_id: str = Depends(get_current_user)):
    """Update financial goal"""
    try:
        update_data = {k: v for k, v in goal_update.dict().items() if v is not None}
        
        if "name" in update_data:
            update_data["name"] = sanitize_input(update_data["name"])
        if "description" in update_data:
            update_data["description"] = sanitize_input(update_data["description"])
        
        if update_data:
            await update_financial_goal(goal_id, user_id, update_data)
        
        return {"message": "Financial goal updated successfully"}
        
    except Exception as e:
        logger.error(f"Financial goal update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Financial goal update failed")

@api_router.delete("/financial-goals/{goal_id}")
@limiter.limit("10/minute")
async def delete_financial_goal_endpoint(request: Request, goal_id: str, user_id: str = Depends(get_current_user)):
    """Delete financial goal"""
    try:
        await delete_financial_goal(goal_id, user_id)
        return {"message": "Financial goal deleted successfully"}
        
    except Exception as e:
        logger.error(f"Financial goal deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Financial goal deletion failed")

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

# Category Suggestions and Emergency Features Routes
@api_router.get("/category-suggestions/{category}")
@limiter.limit("30/minute")
async def get_category_suggestions_endpoint(request: Request, category: str, user_id: str = Depends(get_current_user)):
    """Get app/website suggestions for a transaction category"""
    try:
        suggestions = await get_category_suggestions(category)
        
        # Get popular suggestions based on user clicks (analytics)
        popular_suggestions = await get_popular_suggestions(category)
        popular_names = {item["_id"] for item in popular_suggestions}
        
        # Mark popular suggestions and sort by priority + popularity
        for suggestion in suggestions:
            suggestion["is_popular"] = suggestion["name"] in popular_names
            suggestion["click_count"] = next(
                (item["click_count"] for item in popular_suggestions if item["_id"] == suggestion["name"]), 
                0
            )
        
        # Sort by popularity (click count) first, then priority
        suggestions.sort(key=lambda x: (x["click_count"], x["priority"]), reverse=True)
        
        return {
            "category": category,
            "suggestions": [CategorySuggestion(**s) for s in suggestions],
            "total_count": len(suggestions)
        }
        
    except Exception as e:
        logger.error(f"Category suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get category suggestions")

@api_router.post("/track-suggestion-click")
@limiter.limit("50/minute")
async def track_suggestion_click_endpoint(request: Request, analytics_data: ClickAnalyticsCreate, user_id: str = Depends(get_current_user)):
    """Track user clicks on category suggestions for analytics"""
    try:
        analytics_dict = analytics_data.dict()
        analytics_dict["user_id"] = user_id
        
        await create_click_analytics(analytics_dict)
        return {"message": "Click tracked successfully"}
        
    except Exception as e:
        logger.error(f"Click tracking error: {str(e)}")
        # Don't raise exception for analytics failures
        return {"message": "Click tracking failed but request continues"}

@api_router.get("/emergency/types")
@limiter.limit("20/minute")
async def get_emergency_types_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get all emergency types for Emergency Fund category"""
    try:
        emergency_types = await get_emergency_types()
        return {
            "emergency_types": [EmergencyType(**et) for et in emergency_types]
        }
        
    except Exception as e:
        logger.error(f"Emergency types error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get emergency types")

@api_router.get("/emergency/hospitals")
@limiter.limit("10/minute")
async def get_emergency_hospitals_endpoint(
    request: Request, 
    user_id: str = Depends(get_current_user),
    city: str = None,
    state: str = None,
    latitude: float = None,
    longitude: float = None,
    emergency_type: str = None,
    limit: int = 10
):
    """Get nearby hospitals and top-rated hospitals based on location"""
    try:
        hospitals = []
        
        # If coordinates provided, get nearby hospitals
        if latitude is not None and longitude is not None:
            nearby_hospitals = await get_nearby_hospitals(latitude, longitude, limit=limit//2)
            hospitals.extend(nearby_hospitals)
        
        # Get hospitals by city/state (top-rated hospitals)
        if city:
            city_hospitals = await get_hospitals_by_location(city, state, limit=limit//2)
            hospitals.extend(city_hospitals)
        elif not hospitals:
            # If no location provided, get some default top hospitals
            default_hospitals = await get_hospitals_by_location("Mumbai", "Maharashtra", limit=limit)
            hospitals.extend(default_hospitals)
        
        # Remove duplicates and limit results
        unique_hospitals = {}
        for hospital in hospitals:
            hospital_id = hospital.get("id", hospital.get("name"))
            if hospital_id not in unique_hospitals:
                unique_hospitals[hospital_id] = hospital
        
        final_hospitals = list(unique_hospitals.values())[:limit]
        
        return {
            "hospitals": [Hospital(**h) for h in final_hospitals],
            "total_count": len(final_hospitals),
            "search_criteria": {
                "city": city,
                "state": state,
                "coordinates": f"{latitude}, {longitude}" if latitude and longitude else None,
                "emergency_type": emergency_type
            }
        }
        
    except Exception as e:
        logger.error(f"Emergency hospitals error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get emergency hospitals")

@api_router.get("/price-comparison")
@limiter.limit("10/minute")
async def get_price_comparison_endpoint(
    request: Request, 
    query_data: PriceComparisonQuery = Depends(), 
    user_id: str = Depends(get_current_user)
):
    """Get price comparison suggestions for shopping category"""
    try:
        # For now, return static platform suggestions with search URLs
        # In future, this could integrate with actual price comparison APIs
        
        platforms = [
            {
                "name": "Amazon",
                "url": f"https://amazon.in/s?k={query_data.product_name.replace(' ', '+')}",
                "logo_url": "https://logo.clearbit.com/amazon.in",
                "description": "Wide selection with fast delivery",
                "pros": ["Fast delivery", "Wide selection", "Prime benefits"],
                "estimated_delivery": "1-2 days"
            },
            {
                "name": "Flipkart",
                "url": f"https://flipkart.com/search?q={query_data.product_name.replace(' ', '+')}",
                "logo_url": "https://logo.clearbit.com/flipkart.com",
                "description": "Indian e-commerce leader",
                "pros": ["Local brand", "Good customer service", "Competitive prices"],
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Meesho",
                "url": f"https://meesho.com/search?query={query_data.product_name.replace(' ', '+')}",
                "logo_url": "https://logo.clearbit.com/meesho.com",
                "description": "Best prices from local suppliers",
                "pros": ["Lowest prices", "Local suppliers", "No minimum order"],
                "estimated_delivery": "3-7 days"
            },
            {
                "name": "Myntra",
                "url": f"https://myntra.com/{query_data.product_name.replace(' ', '-')}",
                "logo_url": "https://logo.clearbit.com/myntra.com",
                "description": "Fashion and lifestyle specialist",
                "pros": ["Fashion focus", "Brand authenticity", "Easy returns"],
                "estimated_delivery": "2-4 days"
            },
            {
                "name": "Ajio",
                "url": f"https://ajio.com/search/{query_data.product_name.replace(' ', '-')}",
                "logo_url": "https://logo.clearbit.com/ajio.com",
                "description": "Trendy fashion destination",
                "pros": ["Trendy items", "Reliance brand", "Good quality"],
                "estimated_delivery": "3-5 days"
            }
        ]
        
        return {
            "product_name": query_data.product_name,
            "category": query_data.category,
            "platforms": platforms,
            "comparison_tips": [
                "Check customer reviews and ratings",
                "Compare delivery times and charges",
                "Look for ongoing offers and discounts",
                "Verify seller ratings and return policies",
                "Consider total cost including delivery"
            ],
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Price comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get price comparison")

@api_router.get("/categories/all-suggestions")
@limiter.limit("20/minute")
async def get_all_category_suggestions_endpoint(request: Request, user_id: str = Depends(get_current_user)):
    """Get suggestions for all categories - useful for the dedicated recommendations page"""
    try:
        # Get all unique categories
        categories = ["Movies", "Transportation", "Shopping", "Food", "Groceries", "Entertainment", "Books"]
        
        all_suggestions = {}
        for category in categories:
            suggestions = await get_category_suggestions(category)
            popular = await get_popular_suggestions(category, days=30)
            popular_names = {item["_id"] for item in popular}
            
            # Add popularity info
            for suggestion in suggestions:
                suggestion["is_popular"] = suggestion["name"] in popular_names
                suggestion["click_count"] = next(
                    (item["click_count"] for item in popular if item["_id"] == suggestion["name"]), 
                    0
                )
            
            # Sort by popularity and priority
            suggestions.sort(key=lambda x: (x["click_count"], x["priority"]), reverse=True)
            all_suggestions[category] = suggestions[:5]  # Limit to top 5 per category
        
        return {
            "categories": all_suggestions,
            "total_categories": len(categories)
        }
        
    except Exception as e:
        logger.error(f"All category suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get all category suggestions")

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
    logger.info("EarnNest Production Server started successfully")

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
