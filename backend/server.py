from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import shutil
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Ensure uploads directory exists
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = "earnwise-secret-key-2024"
JWT_ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI(title="EarnWise - Student Finance & Side Hustle Platform")

# Serve static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# LLM Chat instance
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    student_level: str  # "undergraduate", "graduate", "high_school"
    skills: List[str] = []
    availability_hours: int = 10  # hours per week
    location: Optional[str] = None
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_earnings: float = 0.0
    current_streak: int = 0
    achievements: List[str] = []

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    student_level: str
    skills: List[str] = []
    availability_hours: int = 10
    location: Optional[str] = None
    bio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    skills: Optional[List[str]] = None
    availability_hours: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    student_level: Optional[str] = None

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "income" or "expense"
    amount: float
    category: str
    description: str
    source: Optional[str] = None  # for income: "hustle", "part_time", "scholarship", etc.
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_hustle_related: bool = False

class TransactionCreate(BaseModel):
    type: str
    amount: float
    category: str
    description: str
    source: Optional[str] = None
    is_hustle_related: bool = False

class UserHustle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str  # user_id
    title: str
    description: str
    category: str  # "tutoring", "freelance", "content_creation", "delivery", "micro_tasks"
    pay_rate: float
    pay_type: str  # "hourly", "fixed", "per_task"
    time_commitment: str
    required_skills: List[str]
    difficulty_level: str  # "beginner", "intermediate", "advanced"
    location: Optional[str] = None
    is_remote: bool = True
    contact_info: str
    application_deadline: Optional[datetime] = None
    max_applicants: Optional[int] = None
    status: str = "active"  # "active", "closed", "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    applicants: List[str] = []  # user_ids who applied

class UserHustleCreate(BaseModel):
    title: str
    description: str
    category: str
    pay_rate: float
    pay_type: str
    time_commitment: str
    required_skills: List[str]
    difficulty_level: str
    location: Optional[str] = None
    is_remote: bool = True
    contact_info: str
    application_deadline: Optional[datetime] = None
    max_applicants: Optional[int] = None

class HustleApplication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hustle_id: str
    applicant_id: str
    applicant_name: str
    applicant_email: str
    cover_message: str
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"  # "pending", "accepted", "rejected"

class HustleApplicationCreate(BaseModel):
    cover_message: str

class HustleOpportunity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str  # "tutoring", "freelance", "content_creation", "delivery", "micro_tasks"
    estimated_pay: float
    time_commitment: str
    required_skills: List[str]
    difficulty_level: str  # "beginner", "intermediate", "advanced"
    platform: str
    application_link: Optional[str] = None
    ai_recommended: bool = False
    match_score: float = 0.0

class Budget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    allocated_amount: float
    spent_amount: float = 0.0
    month: str  # "2024-01"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BudgetCreate(BaseModel):
    category: str
    allocated_amount: float
    month: str

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    user_id = verify_jwt_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
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
        transactions = await db.transactions.find({"user_id": user_id}).sort("date", -1).limit(50).to_list(50)
        
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
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    
    user = User(**user_dict)
    user_doc = user.dict()
    user_doc["password_hash"] = hashed_password
    
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user.id)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": user.dict()
    }

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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

# User Routes
@api_router.get("/user/profile", response_model=User)
async def get_user_profile(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    del user_doc["password_hash"]
    return User(**user_doc)

@api_router.put("/user/profile")
async def update_user_profile(updated_data: UserUpdate, user_id: str = Depends(get_current_user)):
    update_data = {k: v for k, v in updated_data.dict().items() if v is not None}
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}

@api_router.post("/user/profile/photo")
async def upload_profile_photo(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"profile_{user_id}_{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / filename
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update user profile
        photo_url = f"/uploads/{filename}"
        await db.users.update_one(
            {"id": user_id}, 
            {"$set": {"profile_photo": photo_url}}
        )
        
        return {"message": "Profile photo uploaded successfully", "photo_url": photo_url}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

# Transaction Routes
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, user_id: str = Depends(get_current_user)):
    transaction_dict = transaction_data.dict()
    transaction_dict["user_id"] = user_id
    
    transaction = Transaction(**transaction_dict)
    await db.transactions.insert_one(transaction.dict())
    
    # Update user's total earnings if it's income
    if transaction.type == "income":
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"total_earnings": transaction.amount}}
        )
    
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(user_id: str = Depends(get_current_user), limit: int = 50):
    transactions = await db.transactions.find({"user_id": user_id}).sort("date", -1).limit(limit).to_list(limit)
    return [Transaction(**t) for t in transactions]

@api_router.get("/transactions/summary")
async def get_transaction_summary(user_id: str = Depends(get_current_user)):
    # Get current month transactions
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": datetime.strptime(current_month, "%Y-%m")}}},
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.transactions.aggregate(pipeline).to_list(None)
    
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
async def get_hustle_recommendations(user_id: str = Depends(get_current_user)):
    # Get user profile
    user_doc = await db.users.find_one({"id": user_id})
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
async def get_user_posted_hustles(user_id: str = Depends(get_current_user)):
    """Get all user-posted hustles"""
    hustles = await db.user_hustles.find({"status": "active"}).sort("created_at", -1).to_list(100)
    
    # Add creator info
    for hustle in hustles:
        creator = await db.users.find_one({"id": hustle["created_by"]})
        if creator:
            hustle["creator_name"] = creator.get("full_name", "Anonymous")
            hustle["creator_photo"] = creator.get("profile_photo")
    
    return [UserHustle(**hustle) for hustle in hustles]

@api_router.post("/hustles/create", response_model=UserHustle)
async def create_user_hustle(hustle_data: UserHustleCreate, user_id: str = Depends(get_current_user)):
    """Create a new user-posted side hustle"""
    hustle_dict = hustle_data.dict()
    hustle_dict["created_by"] = user_id
    
    hustle = UserHustle(**hustle_dict)
    await db.user_hustles.insert_one(hustle.dict())
    
    return hustle

@api_router.post("/hustles/{hustle_id}/apply")
async def apply_to_hustle(hustle_id: str, application_data: HustleApplicationCreate, user_id: str = Depends(get_current_user)):
    """Apply to a user-posted hustle"""
    # Get hustle
    hustle = await db.user_hustles.find_one({"id": hustle_id})
    if not hustle:
        raise HTTPException(status_code=404, detail="Hustle not found")
    
    # Check if already applied
    if user_id in hustle.get("applicants", []):
        raise HTTPException(status_code=400, detail="Already applied to this hustle")
    
    # Get user info
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create application
    application = HustleApplication(
        hustle_id=hustle_id,
        applicant_id=user_id,
        applicant_name=user["full_name"],
        applicant_email=user["email"],
        cover_message=application_data.cover_message
    )
    
    await db.hustle_applications.insert_one(application.dict())
    
    # Add to hustle applicants
    await db.user_hustles.update_one(
        {"id": hustle_id},
        {"$push": {"applicants": user_id}}
    )
    
    return {"message": "Application submitted successfully"}

@api_router.get("/hustles/my-applications")
async def get_my_applications(user_id: str = Depends(get_current_user)):
    """Get user's hustle applications"""
    applications = await db.hustle_applications.find({"applicant_id": user_id}).sort("applied_at", -1).to_list(100)
    
    # Add hustle info
    for app in applications:
        hustle = await db.user_hustles.find_one({"id": app["hustle_id"]})
        if hustle:
            app["hustle_title"] = hustle.get("title")
            app["hustle_category"] = hustle.get("category")
    
    return [HustleApplication(**app) for app in applications]

@api_router.get("/hustles/categories")
async def get_hustle_categories():
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
async def create_budget(budget_data: BudgetCreate, user_id: str = Depends(get_current_user)):
    budget_dict = budget_data.dict()
    budget_dict["user_id"] = user_id
    
    budget = Budget(**budget_dict)
    await db.budgets.insert_one(budget.dict())
    
    return budget

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(user_id: str = Depends(get_current_user)):
    budgets = await db.budgets.find({"user_id": user_id}).to_list(100)
    return [Budget(**b) for b in budgets]

# Analytics Routes
@api_router.get("/analytics/insights")
async def get_analytics_insights(user_id: str = Depends(get_current_user)):
    insights = await get_financial_insights(user_id)
    return insights

@api_router.get("/analytics/leaderboard")
async def get_leaderboard():
    # Get top earners (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    pipeline = [
        {"$match": {"type": "income", "date": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": "$user_id", "total_earnings": {"$sum": "$amount"}}},
        {"$sort": {"total_earnings": -1}},
        {"$limit": 10}
    ]
    
    leaderboard_data = await db.transactions.aggregate(pipeline).to_list(10)
    
    # Get user names for leaderboard
    leaderboard = []
    for item in leaderboard_data:
        user = await db.users.find_one({"id": item["_id"]})
        if user:
            leaderboard.append({
                "user_name": user.get("full_name", "Anonymous"),
                "profile_photo": user.get("profile_photo"),
                "total_earnings": item["total_earnings"],
                "rank": len(leaderboard) + 1
            })
    
    return leaderboard

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()