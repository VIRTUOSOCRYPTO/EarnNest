from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'earnwise_production')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def init_database():
    """Initialize database with indexes and constraints"""
    try:
        # Create indexes for better performance
        
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.users.create_index("created_at")
        await db.users.create_index("email_verified")
        await db.users.create_index("is_active")
        await db.users.create_index("last_login")
        
        # Transactions collection indexes
        await db.transactions.create_index("user_id")
        await db.transactions.create_index("date")
        await db.transactions.create_index([("user_id", 1), ("date", -1)])
        await db.transactions.create_index("type")
        await db.transactions.create_index("is_hustle_related")
        
        # User hustles collection indexes
        await db.user_hustles.create_index("created_by")
        await db.user_hustles.create_index("status")
        await db.user_hustles.create_index("category")
        await db.user_hustles.create_index("created_at")
        await db.user_hustles.create_index("is_admin_posted")
        await db.user_hustles.create_index("application_deadline")
        
        # Hustle applications collection indexes
        await db.hustle_applications.create_index("hustle_id")
        await db.hustle_applications.create_index("applicant_id")
        await db.hustle_applications.create_index([("hustle_id", 1), ("applicant_id", 1)], unique=True)
        await db.hustle_applications.create_index("applied_at")
        await db.hustle_applications.create_index("status")
        
        # Budgets collection indexes
        await db.budgets.create_index("user_id")
        await db.budgets.create_index("month")
        await db.budgets.create_index([("user_id", 1), ("month", 1), ("category", 1)], unique=True)
        
        # Email verification collection indexes
        await db.email_verifications.create_index("email")
        await db.email_verifications.create_index("expires_at", expireAfterSeconds=0)
        
        # Password reset collection indexes
        await db.password_resets.create_index("email")
        await db.password_resets.create_index("expires_at", expireAfterSeconds=0)
        
        # Financial goals collection indexes
        await db.financial_goals.create_index("user_id")
        await db.financial_goals.create_index("category")
        await db.financial_goals.create_index("is_active")
        await db.financial_goals.create_index([("user_id", 1), ("category", 1)])
        
        logger.info("Database indexes created successfully")
        
        # Clean up test/dummy data
        await cleanup_test_data()
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")

async def cleanup_test_data():
    """Remove test/dummy data from production database"""
    try:
        # Remove test users (emails with 'test', 'dummy', 'example' etc.)
        test_patterns = [
            {"email": {"$regex": "test", "$options": "i"}},
            {"email": {"$regex": "dummy", "$options": "i"}},
            {"email": {"$regex": "example", "$options": "i"}},
            {"email": {"$regex": "demo", "$options": "i"}},
            {"full_name": {"$regex": "test", "$options": "i"}},
            {"full_name": {"$regex": "dummy", "$options": "i"}},
            {"full_name": {"$regex": "demo", "$options": "i"}}
        ]
        
        # Get test user IDs before deletion
        test_users = await db.users.find({"$or": test_patterns}).to_list(None)
        test_user_ids = [user["id"] for user in test_users]
        
        if test_user_ids:
            # Delete test users
            result = await db.users.delete_many({"$or": test_patterns})
            logger.info(f"Removed {result.deleted_count} test users")
            
            # Delete related data for test users
            await db.transactions.delete_many({"user_id": {"$in": test_user_ids}})
            await db.user_hustles.delete_many({"created_by": {"$in": test_user_ids}})
            await db.hustle_applications.delete_many({"applicant_id": {"$in": test_user_ids}})
            await db.budgets.delete_many({"user_id": {"$in": test_user_ids}})
            
            logger.info("Cleaned up related test data")
        
        # Remove transactions with unrealistic amounts (likely test data)
        await db.transactions.delete_many({"amount": {"$gt": 10000000}})  # > 1 crore
        await db.transactions.delete_many({"amount": {"$lt": 1}})  # < 1 rupee
        
        # Remove hustles with unrealistic pay rates
        await db.user_hustles.delete_many({"pay_rate": {"$gt": 100000}})  # > 1 lakh per hour
        await db.user_hustles.delete_many({"pay_rate": {"$lt": 10}})  # < 10 rupees per hour
        
        logger.info("Database cleanup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to cleanup test data: {str(e)}")

async def get_user_by_email(email: str):
    """Get user by email"""
    return await db.users.find_one({"email": email})

async def get_user_by_id(user_id: str):
    """Get user by ID"""
    return await db.users.find_one({"id": user_id})

async def create_user(user_data: dict):
    """Create new user"""
    user_data["created_at"] = datetime.now(timezone.utc)
    return await db.users.insert_one(user_data)

async def update_user(user_id: str, update_data: dict):
    """Update user data"""
    return await db.users.update_one({"id": user_id}, {"$set": update_data})

async def create_transaction(transaction_data: dict):
    """Create new transaction"""
    transaction_data["date"] = datetime.now(timezone.utc)
    return await db.transactions.insert_one(transaction_data)

async def get_user_transactions(user_id: str, limit: int = 50, skip: int = 0):
    """Get user transactions"""
    cursor = db.transactions.find({"user_id": user_id}).sort("date", -1).skip(skip).limit(limit)
    return await cursor.to_list(limit)

async def get_transaction_summary(user_id: str, start_date: datetime = None):
    """Get transaction summary for user"""
    match_filter = {"user_id": user_id}
    if start_date:
        match_filter["date"] = {"$gte": start_date}
    
    pipeline = [
        {"$match": match_filter},
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    return await db.transactions.aggregate(pipeline).to_list(None)

async def create_hustle(hustle_data: dict):
    """Create new hustle"""
    hustle_data["created_at"] = datetime.now(timezone.utc)
    return await db.user_hustles.insert_one(hustle_data)

async def get_active_hustles(limit: int = 100):
    """Get active hustles"""
    cursor = db.user_hustles.find({"status": "active"}).sort("created_at", -1).limit(limit)
    return await cursor.to_list(limit)

async def create_hustle_application(application_data: dict):
    """Create hustle application"""
    application_data["applied_at"] = datetime.now(timezone.utc)
    return await db.hustle_applications.insert_one(application_data)

async def get_user_applications(user_id: str):
    """Get user's hustle applications"""
    cursor = db.hustle_applications.find({"applicant_id": user_id}).sort("applied_at", -1)
    return await cursor.to_list(None)

async def create_budget(budget_data: dict):
    """Create budget"""
    budget_data["created_at"] = datetime.now(timezone.utc)
    return await db.budgets.insert_one(budget_data)

async def get_user_budgets(user_id: str):
    """Get user budgets"""
    cursor = db.budgets.find({"user_id": user_id})
    return await cursor.to_list(None)

async def store_verification_code(email: str, code: str, expires_at: datetime):
    """Store email verification code"""
    await db.email_verifications.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "code": code,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )

async def get_verification_code(email: str):
    """Get verification code for email"""
    return await db.email_verifications.find_one({"email": email})

async def delete_verification_code(email: str):
    """Delete verification code"""
    await db.email_verifications.delete_one({"email": email})

async def store_password_reset_code(email: str, code: str, expires_at: datetime):
    """Store password reset code"""
    await db.password_resets.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "code": code,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )

async def get_password_reset_code(email: str):
    """Get password reset code for email"""
    return await db.password_resets.find_one({"email": email})

async def delete_password_reset_code(email: str):
    """Delete password reset code"""
    await db.password_resets.delete_one({"email": email})

# Financial Goals Database Functions
async def create_financial_goal(goal_data: dict):
    """Create financial goal"""
    goal_data["created_at"] = datetime.now(timezone.utc)
    goal_data["is_active"] = True  # Ensure goals are marked as active
    return await db.financial_goals.insert_one(goal_data)

async def get_user_financial_goals(user_id: str):
    """Get user's financial goals"""
    cursor = db.financial_goals.find({"user_id": user_id, "is_active": True}).sort("created_at", -1)
    return await cursor.to_list(None)

async def update_financial_goal(goal_id: str, user_id: str, update_data: dict):
    """Update financial goal"""
    return await db.financial_goals.update_one(
        {"id": goal_id, "user_id": user_id},
        {"$set": update_data}
    )

async def delete_financial_goal(goal_id: str, user_id: str):
    """Delete financial goal"""
    return await db.financial_goals.update_one(
        {"id": goal_id, "user_id": user_id},
        {"$set": {"is_active": False}}
    )
