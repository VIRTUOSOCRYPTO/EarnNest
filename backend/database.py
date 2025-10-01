from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import logging

logger = logging.getLogger(__name__)

def clean_mongo_doc(doc):
    """Remove MongoDB ObjectId fields from document"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [clean_mongo_doc(item) for item in doc]
    if isinstance(doc, dict):
        cleaned = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB ObjectId field
            cleaned[key] = clean_mongo_doc(value)
        return cleaned
    return doc

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
        
        # Category suggestions collection indexes
        await db.category_suggestions.create_index("category")
        await db.category_suggestions.create_index("is_active")
        await db.category_suggestions.create_index([("category", 1), ("priority", -1)])
        
        # Emergency types collection indexes
        await db.emergency_types.create_index("name", unique=True)
        await db.emergency_types.create_index("urgency_level")
        
        # Hospitals collection indexes
        await db.hospitals.create_index("city")
        await db.hospitals.create_index("state")
        await db.hospitals.create_index([("latitude", 1), ("longitude", 1)])
        await db.hospitals.create_index("rating")
        await db.hospitals.create_index("is_emergency")
        
        # Click analytics collection indexes
        await db.click_analytics.create_index("user_id")
        await db.click_analytics.create_index("category")
        await db.click_analytics.create_index("clicked_at")
        await db.click_analytics.create_index([("category", 1), ("clicked_at", -1)])
        
        # Auto import sources collection indexes
        await db.auto_import_sources.create_index("user_id")
        await db.auto_import_sources.create_index("source_type")
        await db.auto_import_sources.create_index("provider")
        await db.auto_import_sources.create_index("is_active")
        await db.auto_import_sources.create_index("created_at")
        
        # Parsed transactions collection indexes
        await db.parsed_transactions.create_index("user_id")
        await db.parsed_transactions.create_index("source_id")
        await db.parsed_transactions.create_index("created_at")
        await db.parsed_transactions.create_index("confidence_score")
        
        # Transaction suggestions collection indexes
        await db.transaction_suggestions.create_index("user_id")
        await db.transaction_suggestions.create_index("parsed_transaction_id")
        await db.transaction_suggestions.create_index("status")
        await db.transaction_suggestions.create_index("created_at")
        await db.transaction_suggestions.create_index("confidence_score")
        
        # Learning feedback collection indexes
        await db.learning_feedback.create_index("user_id")
        await db.learning_feedback.create_index("suggestion_id")
        await db.learning_feedback.create_index("feedback_type")
        await db.learning_feedback.create_index("created_at")
        
        # VIRAL FEATURES - New indexes
        
        # Users collection - add viral feature indexes
        await db.users.create_index("referral_code", unique=True)
        await db.users.create_index("referred_by")
        await db.users.create_index("preferred_language")
        await db.users.create_index("daily_login_streak")
        await db.users.create_index("total_referrals")
        
        # Referrals collection indexes
        await db.referrals.create_index("referrer_id")
        await db.referrals.create_index("referee_id")
        await db.referrals.create_index("referral_code", unique=True)
        await db.referrals.create_index("status")
        await db.referrals.create_index("created_at")
        
        # Achievements collection indexes
        await db.achievements.create_index("category")
        await db.achievements.create_index("difficulty")
        await db.achievements.create_index("is_active")
        await db.achievements.create_index("points_required")
        
        # User achievements collection indexes
        await db.user_achievements.create_index("user_id")
        await db.user_achievements.create_index("achievement_id")
        await db.user_achievements.create_index([("user_id", 1), ("achievement_id", 1)], unique=True)
        await db.user_achievements.create_index("earned_at")
        await db.user_achievements.create_index("is_claimed")
        
        # EarnCoins transactions collection indexes
        await db.earncoins_transactions.create_index("user_id")
        await db.earncoins_transactions.create_index("type")
        await db.earncoins_transactions.create_index("source")
        await db.earncoins_transactions.create_index("created_at")
        await db.earncoins_transactions.create_index("reference_id")
        
        # User streaks collection indexes
        await db.user_streaks.create_index("user_id")
        await db.user_streaks.create_index("streak_type")
        await db.user_streaks.create_index([("user_id", 1), ("streak_type", 1)], unique=True)
        await db.user_streaks.create_index("last_activity_date")
        
        # Festivals collection indexes
        await db.festivals.create_index("date")
        await db.festivals.create_index("festival_type")
        await db.festivals.create_index("region")
        await db.festivals.create_index("is_active")
        
        # User festival budgets collection indexes
        await db.user_festival_budgets.create_index("user_id")
        await db.user_festival_budgets.create_index("festival_id")
        await db.user_festival_budgets.create_index([("user_id", 1), ("festival_id", 1)])
        await db.user_festival_budgets.create_index("is_active")
        
        # Challenges collection indexes
        await db.challenges.create_index("challenge_type")
        await db.challenges.create_index("start_date")
        await db.challenges.create_index("end_date")
        await db.challenges.create_index("is_active")
        await db.challenges.create_index("difficulty")
        
        # User challenges collection indexes
        await db.user_challenges.create_index("user_id")
        await db.user_challenges.create_index("challenge_id")
        await db.user_challenges.create_index([("user_id", 1), ("challenge_id", 1)], unique=True)
        await db.user_challenges.create_index("status")
        await db.user_challenges.create_index("started_at")
        await db.transaction_suggestions.create_index("parsed_transaction_id")
        await db.transaction_suggestions.create_index("status")
        await db.transaction_suggestions.create_index("created_at")
        await db.transaction_suggestions.create_index([("user_id", 1), ("status", 1)])
        await db.transaction_suggestions.create_index("confidence_score")
        
        # Learning feedback collection indexes
        await db.learning_feedback.create_index("user_id")
        await db.learning_feedback.create_index("suggestion_id")
        await db.learning_feedback.create_index("feedback_type")
        await db.learning_feedback.create_index("created_at")
        await db.learning_feedback.create_index([("user_id", 1), ("feedback_type", 1)])
        
        logger.info("Database indexes created successfully")
        
        # Initialize seed data
        await init_seed_data()
        
        # Initialize interconnected system
        await init_interconnected_system()
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")

async def init_seed_data():
    """Initialize seed data for category suggestions and emergency data"""
    try:
        # Initialize Category Suggestions
        existing_suggestions = await db.category_suggestions.count_documents({})
        if existing_suggestions == 0:
            category_suggestions = [
                # Movies Category
                {"category": "Movies", "name": "BookMyShow", "url": "https://bookmyshow.com", "type": "both", "priority": 10, "description": "Book movie tickets online", "is_active": True},
                {"category": "Movies", "name": "PVR Cinemas", "url": "https://pvrcinemas.com", "type": "both", "priority": 9, "description": "Premium movie experience", "is_active": True},
                {"category": "Movies", "name": "INOX Movies", "url": "https://inoxmovies.com", "type": "both", "priority": 8, "description": "Luxury cinema experience", "is_active": True},
                
                # Transportation Category
                {"category": "Transportation", "name": "Uber", "url": "https://uber.com", "type": "app", "priority": 10, "description": "Ride sharing service", "is_active": True},
                {"category": "Transportation", "name": "Ola Cabs", "url": "https://olacabs.com", "type": "app", "priority": 9, "description": "Local taxi service", "is_active": True},
                {"category": "Transportation", "name": "Rapido", "url": "https://rapido.bike", "type": "app", "priority": 8, "description": "Bike taxi service", "is_active": True},
                {"category": "Transportation", "name": "RedBus", "url": "https://redbus.in", "type": "both", "priority": 9, "description": "Bus booking service", "is_active": True},
                {"category": "Transportation", "name": "Namma Yatri", "url": "https://nammayatri.in", "type": "app", "priority": 7, "description": "Open mobility platform", "is_active": True},
                
                # Shopping Category  
                {"category": "Shopping", "name": "Amazon", "url": "https://amazon.in", "type": "both", "priority": 10, "description": "Online marketplace", "is_active": True},
                {"category": "Shopping", "name": "Flipkart", "url": "https://flipkart.com", "type": "both", "priority": 9, "description": "E-commerce platform", "is_active": True},
                {"category": "Shopping", "name": "Meesho", "url": "https://meesho.com", "type": "both", "priority": 8, "description": "Social commerce platform", "is_active": True},
                {"category": "Shopping", "name": "Myntra", "url": "https://myntra.com", "type": "both", "priority": 8, "description": "Fashion and lifestyle", "is_active": True},
                {"category": "Shopping", "name": "Ajio", "url": "https://ajio.com", "type": "both", "priority": 7, "description": "Fashion retailer", "is_active": True},
                
                # Food Category
                {"category": "Food", "name": "Zomato", "url": "https://zomato.com", "type": "both", "priority": 10, "description": "Food delivery service", "is_active": True},
                {"category": "Food", "name": "Swiggy", "url": "https://swiggy.com", "type": "both", "priority": 10, "description": "Food delivery platform", "is_active": True},
                {"category": "Food", "name": "Domino's Pizza", "url": "https://dominos.co.in", "type": "both", "priority": 8, "description": "Pizza delivery", "is_active": True},
                {"category": "Food", "name": "McDonald's", "url": "https://mcdelivery.co.in", "type": "both", "priority": 7, "description": "Fast food delivery", "is_active": True},
                
                # Groceries Category
                {"category": "Groceries", "name": "Swiggy Instamart", "url": "https://swiggy.com/instamart", "type": "app", "priority": 10, "description": "Quick grocery delivery", "is_active": True},
                {"category": "Groceries", "name": "Blinkit", "url": "https://blinkit.com", "type": "both", "priority": 10, "description": "10-minute grocery delivery", "is_active": True},
                {"category": "Groceries", "name": "BigBasket", "url": "https://bigbasket.com", "type": "both", "priority": 9, "description": "Online grocery store", "is_active": True},
                {"category": "Groceries", "name": "Zepto", "url": "https://zepto.co.in", "type": "app", "priority": 9, "description": "Ultra-fast grocery delivery", "is_active": True},
                {"category": "Groceries", "name": "JioMart", "url": "https://jiomart.com", "type": "both", "priority": 8, "description": "Digital commerce platform", "is_active": True},
                
                # Entertainment Category
                {"category": "Entertainment", "name": "Netflix", "url": "https://netflix.com", "type": "both", "priority": 10, "description": "Streaming service", "offers": "Various subscription plans", "is_active": True},
                {"category": "Entertainment", "name": "Amazon Prime Video", "url": "https://primevideo.com", "type": "both", "priority": 9, "description": "Prime video streaming", "is_active": True},
                {"category": "Entertainment", "name": "Disney+ Hotstar", "url": "https://hotstar.com", "type": "both", "priority": 9, "description": "Disney and sports content", "is_active": True},
                {"category": "Entertainment", "name": "YouTube Premium", "url": "https://youtube.com/premium", "type": "both", "priority": 8, "description": "Ad-free YouTube experience", "is_active": True},
                {"category": "Entertainment", "name": "SonyLIV", "url": "https://sonyliv.com", "type": "both", "priority": 7, "description": "Sony content streaming", "is_active": True},
                
                # Books Category
                {"category": "Books", "name": "Amazon Kindle", "url": "https://amazon.in/kindle", "type": "both", "priority": 10, "description": "Digital books platform", "is_active": True},
                {"category": "Books", "name": "Audible", "url": "https://audible.in", "type": "both", "priority": 9, "description": "Audiobooks service", "is_active": True},
                {"category": "Books", "name": "Flipkart Books", "url": "https://flipkart.com/books", "type": "website", "priority": 8, "description": "Online bookstore", "is_active": True},
                {"category": "Books", "name": "Crossword", "url": "https://crossword.in", "type": "both", "priority": 7, "description": "Book retailer", "is_active": True},
                {"category": "Books", "name": "Storytel", "url": "https://storytel.com", "type": "app", "priority": 6, "description": "Audiobook streaming", "is_active": True},
            ]
            
            await db.category_suggestions.insert_many(category_suggestions)
            logger.info(f"Inserted {len(category_suggestions)} category suggestions")
        
        # Initialize Emergency Types
        existing_emergency_types = await db.emergency_types.count_documents({})
        if existing_emergency_types == 0:
            emergency_types = [
                {"name": "Medical Emergency", "icon": "🚑", "description": "Heart attack, stroke, severe injury, breathing problems", "urgency_level": "high"},
                {"name": "Accident", "icon": "🚗", "description": "Vehicle accidents, workplace accidents, home accidents", "urgency_level": "high"},
                {"name": "Fire Emergency", "icon": "🔥", "description": "House fire, building fire, forest fire", "urgency_level": "high"},
                {"name": "Natural Disaster", "icon": "🌪️", "description": "Earthquake, flood, cyclone, landslide", "urgency_level": "high"},
                {"name": "Crime/Security", "icon": "👮", "description": "Theft, assault, suspicious activity, security threat", "urgency_level": "medium"},
                {"name": "Mental Health Crisis", "icon": "🧠", "description": "Suicide risk, severe anxiety, panic attack", "urgency_level": "high"},
            ]
            
            await db.emergency_types.insert_many(emergency_types)
            logger.info(f"Inserted {len(emergency_types)} emergency types")
        
        # Initialize Sample Hospital Data (Major cities)
        existing_hospitals = await db.hospitals.count_documents({})
        if existing_hospitals == 0:
            sample_hospitals = [
                # Mumbai
                {"name": "Kokilaben Dhirubhai Ambani Hospital", "city": "Mumbai", "state": "Maharashtra", "phone": "022-42696969", "emergency_phone": "022-42696911", "latitude": 19.1334, "longitude": 72.8267, "rating": 4.5, "type": "private", "is_emergency": True, "is_24x7": True, "specialties": ["Cardiology", "Neurology", "Oncology"], "address": "Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West"},
                {"name": "Lilavati Hospital", "city": "Mumbai", "state": "Maharashtra", "phone": "022-26567777", "emergency_phone": "022-26567911", "latitude": 19.0545, "longitude": 72.8302, "rating": 4.3, "type": "private", "is_emergency": True, "is_24x7": True, "specialties": ["Emergency Medicine", "Trauma Care"], "address": "A-791, Bandra Reclamation, Bandra West"},
                
                # Delhi
                {"name": "All India Institute of Medical Sciences (AIIMS)", "city": "New Delhi", "state": "Delhi", "phone": "011-26588500", "emergency_phone": "011-26588663", "latitude": 28.5672, "longitude": 77.2100, "rating": 4.8, "type": "government", "is_emergency": True, "is_24x7": True, "specialties": ["All Specialties"], "address": "Sri Aurobindo Marg, Ansari Nagar"},
                {"name": "Fortis Hospital Shalimar Bagh", "city": "New Delhi", "state": "Delhi", "phone": "011-47135000", "emergency_phone": "011-47135911", "latitude": 28.7196, "longitude": 77.1569, "rating": 4.2, "type": "private", "is_emergency": True, "is_24x7": True, "specialties": ["Cardiology", "Orthopedics"], "address": "AA-299, Shahpur Jat, Shalimar Bagh"},
                
                # Bangalore
                {"name": "Manipal Hospital Whitefield", "city": "Bangalore", "state": "Karnataka", "phone": "080-66712000", "emergency_phone": "080-66712911", "latitude": 12.9699, "longitude": 77.7499, "rating": 4.4, "type": "private", "is_emergency": True, "is_24x7": True, "specialties": ["Emergency Care", "Critical Care"], "address": "#143, 212-2015, HRBR Layout, Kalyan Nagar, Whitefield"},
                {"name": "Apollo Hospital Bannerghatta", "city": "Bangalore", "state": "Karnataka", "phone": "080-26304050", "emergency_phone": "080-26304911", "latitude": 12.8008, "longitude": 77.6495, "rating": 4.3, "type": "private", "is_emergency": True, "is_24x7": True, "specialties": ["Multi-specialty"], "address": "154/11, Opposite IIM-B, Bannerghatta Road"},
                
                # Chennai
                {"name": "Apollo Hospital Greams Road", "city": "Chennai", "state": "Tamil Nadu", "phone": "044-28293333", "emergency_phone": "044-28293911", "latitude": 13.0661, "longitude": 80.2589, "rating": 4.5, "type": "private", "is_emergency": True, "is_24x7": True, "specialties": ["Cardiology", "Transplant"], "address": "21, Greams Lane, Off Greams Road"},
                {"name": "Fortis Malar Hospital", "city": "Chennai", "state": "Tamil Nadu", "phone": "044-42892222", "emergency_phone": "044-42892911", "latitude": 13.0339, "longitude": 80.2403, "rating": 4.2, "type": "private", "is_emergency": True, "is_24x7": True, "specialties": ["Emergency Medicine"], "address": "52, 1st Main Road, Gandhi Nagar, Adyar"},
            ]
            
            await db.hospitals.insert_many(sample_hospitals)
            logger.info(f"Inserted {len(sample_hospitals)} sample hospitals")
        
        logger.info("Seed data initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize seed data: {str(e)}")

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

# Category Suggestions Database Functions
async def get_category_suggestions(category: str):
    """Get suggestions for a category"""
    cursor = db.category_suggestions.find(
        {"category": category, "is_active": True}
    ).sort("priority", -1)
    return await cursor.to_list(None)

async def create_category_suggestion(suggestion_data: dict):
    """Create category suggestion"""
    suggestion_data["created_at"] = datetime.now(timezone.utc)
    return await db.category_suggestions.insert_one(suggestion_data)

async def get_emergency_types():
    """Get all emergency types"""
    cursor = db.emergency_types.find({}).sort("urgency_level", -1)
    return await cursor.to_list(None)

async def get_hospitals_by_location(city: str, state: str = None, limit: int = 10):
    """Get hospitals by location"""
    match_filter = {"city": {"$regex": city, "$options": "i"}}
    if state:
        match_filter["state"] = {"$regex": state, "$options": "i"}
    
    cursor = db.hospitals.find(match_filter).sort("rating", -1).limit(limit)
    return await cursor.to_list(limit)

async def get_nearby_hospitals(latitude: float, longitude: float, radius_km: float = 10, limit: int = 10):
    """Get hospitals near coordinates using $geoNear"""
    # Note: This requires a 2dsphere index on location field
    # For now, we'll use a simple distance calculation
    cursor = db.hospitals.find({
        "latitude": {"$gte": latitude - 0.1, "$lte": latitude + 0.1},
        "longitude": {"$gte": longitude - 0.1, "$lte": longitude + 0.1}
    }).sort("rating", -1).limit(limit)
    return await cursor.to_list(limit)

async def create_click_analytics(analytics_data: dict):
    """Record click analytics"""
    analytics_data["clicked_at"] = datetime.now(timezone.utc)
    return await db.click_analytics.insert_one(analytics_data)

async def get_popular_suggestions(category: str, days: int = 30):
    """Get popular suggestions based on click analytics"""
    from datetime import timedelta
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "category": category,
                "clicked_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": "$suggestion_name",
                "click_count": {"$sum": 1},
                "suggestion_url": {"$first": "$suggestion_url"}
            }
        },
        {
            "$sort": {"click_count": -1}
        },
        {
            "$limit": 10
        }
    ]
    
    return await db.click_analytics.aggregate(pipeline).to_list(10)

# Advanced Income Tracking System Database Functions

async def create_auto_import_source(source_data: dict):
    """Create new auto-import source"""
    source_data["created_at"] = datetime.now(timezone.utc)
    return await db.auto_import_sources.insert_one(source_data)

async def get_user_auto_import_sources(user_id: str):
    """Get user's auto-import sources"""
    cursor = db.auto_import_sources.find({"user_id": user_id}).sort("created_at", -1)
    sources = await cursor.to_list(100)
    return clean_mongo_doc(sources)

async def update_auto_import_source(source_id: str, update_data: dict):
    """Update auto-import source"""
    return await db.auto_import_sources.update_one({"id": source_id}, {"$set": update_data})

async def create_parsed_transaction(parsed_data: dict):
    """Create new parsed transaction"""
    parsed_data["created_at"] = datetime.now(timezone.utc)
    return await db.parsed_transactions.insert_one(parsed_data)

async def get_parsed_transaction(parsed_id: str):
    """Get parsed transaction by ID"""
    doc = await db.parsed_transactions.find_one({"id": parsed_id})
    return clean_mongo_doc(doc)

async def create_transaction_suggestion(suggestion_data: dict):
    """Create new transaction suggestion"""
    suggestion_data["created_at"] = datetime.now(timezone.utc)
    return await db.transaction_suggestions.insert_one(suggestion_data)

async def get_user_pending_suggestions(user_id: str, limit: int = 20):
    """Get user's pending transaction suggestions"""
    cursor = db.transaction_suggestions.find({
        "user_id": user_id, 
        "status": "pending"
    }).sort("created_at", -1).limit(limit)
    suggestions = await cursor.to_list(limit)
    return clean_mongo_doc(suggestions)

async def update_suggestion_status(suggestion_id: str, status: str, approved_at: datetime = None):
    """Update suggestion status"""
    update_data = {"status": status}
    if approved_at:
        update_data["approved_at"] = approved_at
    return await db.transaction_suggestions.update_one({"id": suggestion_id}, {"$set": update_data})

async def get_suggestion_by_id(suggestion_id: str):
    """Get suggestion by ID"""
    doc = await db.transaction_suggestions.find_one({"id": suggestion_id})
    return clean_mongo_doc(doc)

async def create_learning_feedback(feedback_data: dict):
    """Create learning feedback entry"""
    feedback_data["created_at"] = datetime.now(timezone.utc)
    return await db.learning_feedback.insert_one(feedback_data)

async def get_user_learning_feedback(user_id: str, limit: int = 100):
    """Get user's learning feedback for improving AI suggestions"""
    cursor = db.learning_feedback.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    feedback = await cursor.to_list(limit)
    return clean_mongo_doc(feedback)

async def check_duplicate_transaction(user_id: str, amount: float, date_range_hours: int = 24):
    """Check for potential duplicate transactions within specified time range"""
    # Check for transactions with same amount within the time range
    start_time = datetime.now(timezone.utc) - timedelta(hours=date_range_hours)
    
    existing_transactions = await db.transactions.find({
        "user_id": user_id,
        "amount": amount,
        "date": {"$gte": start_time}
    }).to_list(10)
    
    return existing_transactions

async def get_user_transaction_patterns(user_id: str, days: int = 30):
    """Get user's transaction patterns for better categorization"""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": start_date}}},
        {"$group": {
            "_id": {
                "category": "$category",
                "type": "$type",
                "source": "$source"
            },
            "count": {"$sum": 1},
            "avg_amount": {"$avg": "$amount"},
            "total_amount": {"$sum": "$amount"}
        }},
        {"$sort": {"count": -1}}
    ]
    
    return await db.transactions.aggregate(pipeline).to_list(50)

# ===================================
# VIRAL FEATURES DATABASE FUNCTIONS
# ===================================

# Referral System Functions
async def create_referral(referrer_id: str, referee_email: str = None):
    """Create a new referral"""
    from models import Referral
    import uuid
    
    referral = Referral(
        referrer_id=referrer_id,
        referee_email=referee_email,
        referral_code=str(uuid.uuid4())[:8].upper()
    )
    
    result = await db.referrals.insert_one(referral.dict())
    return await db.referrals.find_one({"_id": result.inserted_id})

async def get_user_referrals(user_id: str):
    """Get all referrals made by a user"""
    referrals = await db.referrals.find({"referrer_id": user_id}).to_list(100)
    return clean_mongo_doc(referrals)

async def complete_referral(referral_code: str, new_user_id: str):
    """Complete a referral when someone signs up using referral code"""
    referral = await db.referrals.find_one({"referral_code": referral_code, "status": "pending"})
    if not referral:
        return None
    
    # Update referral status
    await db.referrals.update_one(
        {"referral_code": referral_code},
        {
            "$set": {
                "referee_id": new_user_id,
                "status": "completed",
                "completed_at": datetime.now(timezone.utc),
                "coins_earned": 50  # 50 EarnCoins for referral
            }
        }
    )
    
    # Award coins to referrer
    await award_earn_coins(referral["referrer_id"], 50, "referral", "Referral bonus for inviting a friend!", 
                          "दोस्त को आमंत्रित करने के लिए रेफरल बोनस!", "நண்பரை அழைத்ததற்கான பரிந்துரை போனஸ்!", referral_code)
    
    # Award welcome coins to referee
    await award_earn_coins(new_user_id, 25, "bonus", "Welcome bonus for joining EarnNest!", 
                          "EarnNest में शामिल होने के लिए स्वागत बोनस!", "EarnNest இல் சேர்ந்ததற்கான வரவேற்பு போனஸ்!", referral_code)
    
    return clean_mongo_doc(await db.referrals.find_one({"referral_code": referral_code}))

async def get_referral_stats(user_id: str):
    """Get referral statistics for a user"""
    stats = await db.referrals.aggregate([
        {"$match": {"referrer_id": user_id}},
        {"$group": {
            "_id": None,
            "total_referrals": {"$sum": 1},
            "completed_referrals": {
                "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
            },
            "pending_referrals": {
                "$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}
            },
            "total_coins_earned": {"$sum": "$coins_earned"}
        }}
    ]).to_list(1)
    
    return stats[0] if stats else {
        "total_referrals": 0, "completed_referrals": 0, 
        "pending_referrals": 0, "total_coins_earned": 0
    }

# EarnCoins System Functions
async def award_earn_coins(user_id: str, amount: int, source: str, description: str, 
                          description_hi: str, description_ta: str, reference_id: str = None):
    """Award EarnCoins to a user"""
    from models import EarnCoinsTransaction
    
    transaction = EarnCoinsTransaction(
        user_id=user_id,
        type="earned",
        amount=amount,
        source=source,
        description=description,
        description_hi=description_hi,
        description_ta=description_ta,
        reference_id=reference_id
    )
    
    # Insert transaction
    await db.earncoins_transactions.insert_one(transaction.dict())
    
    # Update user's coin balance
    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {
                "earn_coins_balance": amount,
                "total_earn_coins_earned": amount
            }
        }
    )
    
    return True

async def spend_earn_coins(user_id: str, amount: int, source: str, description: str, 
                          description_hi: str, description_ta: str, reference_id: str = None):
    """Spend user's EarnCoins"""
    from models import EarnCoinsTransaction
    
    # Check if user has enough coins
    user = await get_user_by_id(user_id)
    if not user or user.get("earn_coins_balance", 0) < amount:
        return False
    
    transaction = EarnCoinsTransaction(
        user_id=user_id,
        type="spent",
        amount=amount,
        source=source,
        description=description,
        description_hi=description_hi,
        description_ta=description_ta,
        reference_id=reference_id
    )
    
    # Insert transaction
    await db.earncoins_transactions.insert_one(transaction.dict())
    
    # Update user's coin balance
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"earn_coins_balance": -amount}}
    )
    
    return True

async def get_user_coin_transactions(user_id: str, limit: int = 50):
    """Get user's EarnCoins transaction history"""
    transactions = await db.earncoins_transactions.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return clean_mongo_doc(transactions)

# Achievement System Functions
async def create_achievement(achievement_data: dict):
    """Create a new achievement"""
    from models import Achievement
    
    achievement = Achievement(**achievement_data)
    result = await db.achievements.insert_one(achievement.dict())
    return clean_mongo_doc(await db.achievements.find_one({"_id": result.inserted_id}))

async def get_all_achievements():
    """Get all available achievements"""
    achievements = await db.achievements.find({"is_active": True}).to_list(100)
    return clean_mongo_doc(achievements)

async def award_achievement(user_id: str, achievement_id: str, progress: float = 100.0):
    """Award an achievement to a user"""
    from models import UserAchievement
    
    # Check if user already has this achievement
    existing = await db.user_achievements.find_one({
        "user_id": user_id,
        "achievement_id": achievement_id
    })
    
    if existing:
        return clean_mongo_doc(existing)
    
    user_achievement = UserAchievement(
        user_id=user_id,
        achievement_id=achievement_id,
        progress=progress
    )
    
    # Insert achievement
    result = await db.user_achievements.insert_one(user_achievement.dict())
    
    # Update user's achievement count
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"total_achievements_earned": 1, "experience_points": 25}}
    )
    
    # Award coins for achievement (basic: 10 coins, medium: 25, hard: 50, legendary: 100)
    achievement = await db.achievements.find_one({"id": achievement_id})
    if achievement:
        coin_rewards = {"easy": 10, "medium": 25, "hard": 50, "legendary": 100}
        coins = coin_rewards.get(achievement.get("difficulty", "easy"), 10)
        
        await award_earn_coins(
            user_id, coins, "achievement", f"Achievement unlocked: {achievement['name']}",
            f"उपलब्धि अनलॉक: {achievement.get('name_hi', achievement['name'])}",
            f"சாதனை திறக்கப்பட்டது: {achievement.get('name_ta', achievement['name'])}",
            achievement_id
        )
    
    return clean_mongo_doc(await db.user_achievements.find_one({"_id": result.inserted_id}))

async def get_user_achievements(user_id: str):
    """Get all achievements earned by a user"""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$lookup": {
            "from": "achievements",
            "localField": "achievement_id",
            "foreignField": "id",
            "as": "achievement"
        }},
        {"$unwind": "$achievement"},
        {"$sort": {"earned_at": -1}}
    ]
    
    achievements = await db.user_achievements.aggregate(pipeline).to_list(100)
    return clean_mongo_doc(achievements)

# Daily Streak Functions
async def update_user_streak(user_id: str, streak_type: str):
    """Update user's daily streak"""
    from models import UserStreak
    from datetime import date, timedelta
    
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Get existing streak
    streak = await db.user_streaks.find_one({"user_id": user_id, "streak_type": streak_type})
    
    if not streak:
        # Create new streak
        new_streak = UserStreak(
            user_id=user_id,
            streak_type=streak_type,
            current_streak=1,
            longest_streak=1,
            last_activity_date=datetime.now(timezone.utc),
            total_activities=1
        )
        await db.user_streaks.insert_one(new_streak.dict())
        current_streak = 1
    else:
        last_activity = streak["last_activity_date"].date() if streak["last_activity_date"] else None
        
        if last_activity == today:
            # Already updated today
            current_streak = streak["current_streak"]
        elif last_activity == yesterday:
            # Continue streak
            current_streak = streak["current_streak"] + 1
            await db.user_streaks.update_one(
                {"user_id": user_id, "streak_type": streak_type},
                {
                    "$set": {
                        "current_streak": current_streak,
                        "longest_streak": max(current_streak, streak["longest_streak"]),
                        "last_activity_date": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$inc": {"total_activities": 1}
                }
            )
        else:
            # Streak broken, start over
            current_streak = 1
            await db.user_streaks.update_one(
                {"user_id": user_id, "streak_type": streak_type},
                {
                    "$set": {
                        "current_streak": 1,
                        "last_activity_date": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$inc": {"total_activities": 1}
                }
            )
    
    # Award coins for milestones
    if current_streak in [7, 30, 100, 365]:  # Weekly, monthly, 100 days, yearly milestones
        milestone_coins = {"7": 25, "30": 100, "100": 500, "365": 2000}
        coins = milestone_coins[str(current_streak)]
        
        await award_earn_coins(
            user_id, coins, "streak", f"{current_streak} day {streak_type.replace('_', ' ')} streak!",
            f"{current_streak} दिन {streak_type.replace('_', ' ')} स्ट्रीक!",
            f"{current_streak} நாள் {streak_type.replace('_', ' ')} தொடர்!",
            f"streak_{current_streak}"
        )
    
    return current_streak

async def get_user_streaks(user_id: str):
    """Get all user's streaks"""
    streaks = await db.user_streaks.find({"user_id": user_id}).to_list(100)
    return clean_mongo_doc(streaks)

# Festival Functions
async def create_festival(festival_data: dict):
    """Create a new festival"""
    from models import Festival
    
    festival = Festival(**festival_data)
    result = await db.festivals.insert_one(festival.dict())
    return clean_mongo_doc(await db.festivals.find_one({"_id": result.inserted_id}))

async def get_upcoming_festivals(days_ahead: int = 60):
    """Get upcoming festivals in the next N days"""
    start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=days_ahead)
    
    festivals = await db.festivals.find({
        "date": {"$gte": start_date, "$lte": end_date},
        "is_active": True
    }).sort("date", 1).to_list(20)
    
    return clean_mongo_doc(festivals)

async def get_all_festivals():
    """Get all festivals"""
    festivals = await db.festivals.find({"is_active": True}).sort("date", 1).to_list(100)
    return clean_mongo_doc(festivals)

async def create_user_festival_budget(user_id: str, festival_id: str, budget_data: dict):
    """Create a festival budget for user"""
    from models import UserFestivalBudget
    
    # Check if budget already exists
    existing = await db.user_festival_budgets.find_one({
        "user_id": user_id,
        "festival_id": festival_id,
        "is_active": True
    })
    
    if existing:
        # Update existing budget
        await db.user_festival_budgets.update_one(
            {"user_id": user_id, "festival_id": festival_id, "is_active": True},
            {
                "$set": {
                    **budget_data,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        return clean_mongo_doc(await db.user_festival_budgets.find_one({
            "user_id": user_id, "festival_id": festival_id, "is_active": True
        }))
    else:
        # Create new budget
        festival_budget = UserFestivalBudget(
            user_id=user_id,
            festival_id=festival_id,
            **budget_data
        )
        result = await db.user_festival_budgets.insert_one(festival_budget.dict())
        return clean_mongo_doc(await db.user_festival_budgets.find_one({"_id": result.inserted_id}))

async def get_user_festival_budgets(user_id: str):
    """Get user's festival budgets with festival details"""
    pipeline = [
        {"$match": {"user_id": user_id, "is_active": True}},
        {"$lookup": {
            "from": "festivals",
            "localField": "festival_id",
            "foreignField": "id",
            "as": "festival"
        }},
        {"$unwind": "$festival"},
        {"$sort": {"festival.date": 1}}
    ]
    
    budgets = await db.user_festival_budgets.aggregate(pipeline).to_list(50)
    return clean_mongo_doc(budgets)

# Challenge System Functions
async def create_challenge(challenge_data: dict):
    """Create a new challenge"""
    from models import Challenge
    
    challenge = Challenge(**challenge_data)
    result = await db.challenges.insert_one(challenge.dict())
    return clean_mongo_doc(await db.challenges.find_one({"_id": result.inserted_id}))

async def get_active_challenges():
    """Get all active challenges"""
    now = datetime.now(timezone.utc)
    challenges = await db.challenges.find({
        "is_active": True,
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }).sort("start_date", 1).to_list(50)
    
    return clean_mongo_doc(challenges)

async def join_challenge(user_id: str, challenge_id: str):
    """User joins a challenge"""
    from models import UserChallenge
    
    # Check if user already joined this challenge
    existing = await db.user_challenges.find_one({
        "user_id": user_id,
        "challenge_id": challenge_id
    })
    
    if existing:
        return clean_mongo_doc(existing)
    
    user_challenge = UserChallenge(
        user_id=user_id,
        challenge_id=challenge_id
    )
    
    result = await db.user_challenges.insert_one(user_challenge.dict())
    return clean_mongo_doc(await db.user_challenges.find_one({"_id": result.inserted_id}))

async def update_challenge_progress(user_id: str, challenge_id: str, progress_value: float):
    """Update user's progress in a challenge"""
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        return None
    
    # Calculate progress percentage
    progress_percentage = min((progress_value / challenge["target_value"]) * 100, 100)
    
    result = await db.user_challenges.update_one(
        {"user_id": user_id, "challenge_id": challenge_id},
        {
            "$set": {
                "current_progress": progress_percentage,
                "status": "completed" if progress_percentage >= 100 else "active"
            }
        }
    )
    
    # Award coins if challenge completed
    if progress_percentage >= 100:
        user_challenge = await db.user_challenges.find_one({
            "user_id": user_id,
            "challenge_id": challenge_id
        })
        
        if user_challenge and not user_challenge.get("reward_claimed", False):
            await award_earn_coins(
                user_id, challenge["reward_coins"], "challenge", 
                f"Challenge completed: {challenge['name']}",
                f"चुनौती पूरी: {challenge.get('name_hi', challenge['name'])}",
                f"சவால் முடிந்தது: {challenge.get('name_ta', challenge['name'])}",
                challenge_id
            )
            
            await db.user_challenges.update_one(
                {"user_id": user_id, "challenge_id": challenge_id},
                {
                    "$set": {
                        "reward_claimed": True,
                        "completed_at": datetime.now(timezone.utc)
                    }
                }
            )
    
    return clean_mongo_doc(await db.user_challenges.find_one({
        "user_id": user_id, "challenge_id": challenge_id
    }))

async def get_user_challenges(user_id: str):
    """Get user's challenges with challenge details"""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$lookup": {
            "from": "challenges",
            "localField": "challenge_id",
            "foreignField": "id",
            "as": "challenge"
        }},
        {"$unwind": "$challenge"},
        {"$sort": {"started_at": -1}}
    ]
    
    challenges = await db.user_challenges.aggregate(pipeline).to_list(50)
    return clean_mongo_doc(challenges)

# ===================================
# INTERCONNECTED ACTIVITY SYSTEM FUNCTIONS
# ===================================

async def create_activity_event(user_id: str, event_type: str, event_category: str, title: str, 
                               description: str, metadata: dict = None, related_entities: dict = None, 
                               points_awarded: int = 0, is_cross_section: bool = False):
    """Create a new activity event"""
    from models import ActivityEvent
    
    event = ActivityEvent(
        user_id=user_id,
        event_type=event_type,
        event_category=event_category,
        title=title,
        description=description,
        metadata=metadata or {},
        related_entities=related_entities or {},
        points_awarded=points_awarded,
        is_cross_section_event=is_cross_section
    )
    
    result = await db.activity_events.insert_one(event.dict())
    
    # Trigger cross-section updates if needed
    if is_cross_section:
        await create_cross_section_update(user_id, event_category, event_type, event.dict())
    
    # Update unified stats
    await update_unified_stats(user_id)
    
    return clean_mongo_doc(await db.activity_events.find_one({"_id": result.inserted_id}))

async def get_user_activity_feed(user_id: str, limit: int = 50):
    """Get user's activity feed"""
    activities = await db.activity_events.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return clean_mongo_doc(activities)

async def get_community_activity_feed(limit: int = 100):
    """Get community activity feed (anonymized)"""
    pipeline = [
        {"$match": {"is_cross_section_event": True}},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "id",
            "as": "user"
        }},
        {"$unwind": "$user"},
        {"$project": {
            "event_type": 1,
            "event_category": 1,
            "title": 1,
            "description": 1,
            "points_awarded": 1,
            "created_at": 1,
            "user_name": "$user.full_name",
            "user_avatar": "$user.avatar"
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": limit}
    ]
    
    activities = await db.activity_events.aggregate(pipeline).to_list(limit)
    return clean_mongo_doc(activities)

async def create_cross_section_update(user_id: str, trigger_section: str, update_type: str, 
                                    update_data: dict, affected_sections: list = None):
    """Create a cross-section update"""
    from models import CrossSectionUpdate
    
    if affected_sections is None:
        # Default affected sections based on trigger
        section_mappings = {
            "referral": ["dashboard", "achievements", "profile"],
            "achievement": ["dashboard", "referrals", "challenges", "festivals", "profile"],
            "challenge": ["dashboard", "achievements", "profile", "festivals"],
            "festival": ["dashboard", "achievements", "challenges", "profile"]
        }
        affected_sections = section_mappings.get(trigger_section, ["dashboard", "profile"])
    
    update = CrossSectionUpdate(
        user_id=user_id,
        trigger_section=trigger_section,
        affected_sections=affected_sections,
        update_type=update_type,
        update_data=update_data
    )
    
    result = await db.cross_section_updates.insert_one(update.dict())
    return clean_mongo_doc(await db.cross_section_updates.find_one({"_id": result.inserted_id}))

async def get_pending_updates(user_id: str, section: str = None):
    """Get pending cross-section updates for user"""
    match_filter = {"user_id": user_id, "processed": False}
    if section:
        match_filter["affected_sections"] = {"$in": [section]}
    
    updates = await db.cross_section_updates.find(match_filter).sort("created_at", -1).to_list(50)
    return clean_mongo_doc(updates)

async def mark_updates_processed(update_ids: list):
    """Mark updates as processed"""
    await db.cross_section_updates.update_many(
        {"id": {"$in": update_ids}},
        {"$set": {"processed": True}}
    )

async def create_notification(user_id: str, notification_type: str, title: str, message: str, 
                             icon: str = "🎉", color: str = "emerald", action_url: str = None, 
                             metadata: dict = None):
    """Create a notification for user"""
    from models import NotificationMessage
    
    notification = NotificationMessage(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        icon=icon,
        color=color,
        action_url=action_url,
        metadata=metadata or {}
    )
    
    result = await db.notifications.insert_one(notification.dict())
    return clean_mongo_doc(await db.notifications.find_one({"_id": result.inserted_id}))

async def get_user_notifications(user_id: str, limit: int = 20, unread_only: bool = False):
    """Get user notifications"""
    match_filter = {"user_id": user_id}
    if unread_only:
        match_filter["is_read"] = False
    
    notifications = await db.notifications.find(match_filter).sort("created_at", -1).limit(limit).to_list(limit)
    return clean_mongo_doc(notifications)

async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True}}
    )

async def update_unified_stats(user_id: str):
    """Update unified stats for user"""
    from models import UnifiedStats
    
    # Get current stats
    achievements_count = await db.user_achievements.count_documents({"user_id": user_id})
    referrals_count = await db.referrals.count_documents({"referrer_id": user_id, "status": "completed"})
    active_challenges = await db.user_challenges.count_documents({"user_id": user_id, "status": "active"})
    festival_participations = await db.user_festival_budgets.count_documents({"user_id": user_id, "is_active": True})
    
    # Calculate total points from various sources
    coin_transactions = await db.earncoins_transactions.find({"user_id": user_id, "type": "earned"}).to_list(1000)
    total_points = sum(tx.get("amount", 0) for tx in coin_transactions)
    
    # Get current streak (from login streak)
    login_streak = await db.user_streaks.find_one({"user_id": user_id, "streak_type": "daily_login"})
    current_streak = login_streak.get("current_streak", 0) if login_streak else 0
    
    # Calculate level (every 1000 points = 1 level)
    level = max(1, total_points // 1000)
    next_level_points = 1000 - (total_points % 1000)
    
    # Count cross-section events
    cross_section_events = await db.activity_events.count_documents({"user_id": user_id, "is_cross_section_event": True})
    
    stats = UnifiedStats(
        user_id=user_id,
        total_achievements=achievements_count,
        total_referrals=referrals_count,
        active_challenges=active_challenges,
        festival_participations=festival_participations,
        total_points=total_points,
        current_streak=current_streak,
        level=level,
        next_level_points=next_level_points,
        cross_section_completions=cross_section_events
    )
    
    # Upsert unified stats
    await db.unified_stats.update_one(
        {"user_id": user_id},
        {"$set": stats.dict()},
        upsert=True
    )
    
    return clean_mongo_doc(await db.unified_stats.find_one({"user_id": user_id}))

async def get_unified_stats(user_id: str):
    """Get unified stats for user"""
    stats = await db.unified_stats.find_one({"user_id": user_id})
    if not stats:
        # Create initial stats if not found
        return await update_unified_stats(user_id)
    return clean_mongo_doc(stats)

# Enhanced trigger functions for interconnected events

async def trigger_referral_milestone(user_id: str, milestone_count: int):
    """Trigger referral milestone achievement"""
    # Create activity event
    await create_activity_event(
        user_id=user_id,
        event_type="referral_milestone",
        event_category="referral",
        title=f"{milestone_count} Successful Referrals!",
        description=f"Reached {milestone_count} successful referrals milestone",
        metadata={"milestone_count": milestone_count},
        points_awarded=milestone_count * 10,
        is_cross_section=True
    )
    
    # Check for milestone achievements
    if milestone_count == 1:
        await award_achievement(user_id, "first_referral_achievement")
    elif milestone_count == 5:
        await award_achievement(user_id, "social_connector_achievement")
    elif milestone_count == 10:
        await award_achievement(user_id, "referral_master_achievement")
    
    # Create notification
    await create_notification(
        user_id=user_id,
        notification_type="referral",
        title="🎉 Referral Milestone!",
        message=f"Congratulations! You've successfully referred {milestone_count} friends to EarnNest!",
        icon="👥",
        color="purple",
        action_url="/referrals"
    )

async def trigger_achievement_unlock(user_id: str, achievement_id: str):
    """Trigger achievement unlock event"""
    achievement = await db.achievements.find_one({"id": achievement_id})
    if not achievement:
        return
    
    # Create activity event
    await create_activity_event(
        user_id=user_id,
        event_type="achievement_unlocked",
        event_category="achievement",
        title=f"Achievement Unlocked: {achievement['name']}",
        description=achievement['description'],
        metadata={"achievement_category": achievement['category'], "difficulty": achievement['difficulty']},
        related_entities={"achievement_id": achievement_id},
        points_awarded=achievement.get('points_required', 25),
        is_cross_section=True
    )
    
    # Create notification
    await create_notification(
        user_id=user_id,
        notification_type="achievement",
        title=f"🏆 {achievement['name']}",
        message=f"You've unlocked a new achievement! {achievement['description']}",
        icon=achievement.get('badge_icon', '🏆'),
        color="emerald",
        action_url="/achievements"
    )

async def trigger_challenge_completion(user_id: str, challenge_id: str):
    """Trigger challenge completion event"""
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        return
    
    # Create activity event
    await create_activity_event(
        user_id=user_id,
        event_type="challenge_completed",
        event_category="challenge",
        title=f"Challenge Completed: {challenge['name']}",
        description=f"Successfully completed the {challenge['challenge_type']} challenge",
        metadata={"challenge_type": challenge['challenge_type'], "reward_coins": challenge['reward_coins']},
        related_entities={"challenge_id": challenge_id},
        points_awarded=challenge['reward_coins'],
        is_cross_section=True
    )
    
    # Check for challenge-related achievements
    user_completed_challenges = await db.user_challenges.count_documents({
        "user_id": user_id,
        "status": "completed"
    })
    
    if user_completed_challenges == 1:
        await award_achievement(user_id, "first_challenge_achievement")
    elif user_completed_challenges == 5:
        await award_achievement(user_id, "challenge_warrior_achievement")
    
    # Create notification
    await create_notification(
        user_id=user_id,
        notification_type="challenge",
        title=f"🎯 Challenge Complete!",
        message=f"Amazing! You've completed the {challenge['name']} challenge and earned {challenge['reward_coins']} coins!",
        icon="🎯",
        color="blue",
        action_url="/challenges"
    )

async def trigger_festival_participation(user_id: str, festival_id: str, budget_amount: float):
    """Trigger festival participation event"""
    festival = await db.festivals.find_one({"id": festival_id})
    if not festival:
        return
    
    # Create activity event
    await create_activity_event(
        user_id=user_id,
        event_type="festival_participated",
        event_category="festival",
        title=f"Festival Budget Created: {festival['name']}",
        description=f"Created budget for {festival['name']} celebration",
        metadata={"festival_type": festival['festival_type'], "budget_amount": budget_amount},
        related_entities={"festival_id": festival_id},
        points_awarded=20,
        is_cross_section=True
    )
    
    # Check for festival-related achievements
    user_festival_count = await db.user_festival_budgets.count_documents({
        "user_id": user_id,
        "is_active": True
    })
    
    if user_festival_count == 1:
        await award_achievement(user_id, "festival_planner_achievement")
    elif user_festival_count == 5:
        await award_achievement(user_id, "cultural_enthusiast_achievement")
    
    # Create notification
    await create_notification(
        user_id=user_id,
        notification_type="festival",
        title=f"🎊 Festival Planning Started!",
        message=f"Your budget for {festival['name']} has been created. Start planning your celebration!",
        icon=festival.get('icon', '🎉'),
        color="yellow",
        action_url="/festivals"
    )

# Database initialization for new collections
async def init_interconnected_system():
    """Initialize interconnected system collections and indexes"""
    try:
        # Activity events collection indexes
        await db.activity_events.create_index("user_id")
        await db.activity_events.create_index("event_type")
        await db.activity_events.create_index("event_category")
        await db.activity_events.create_index("created_at")
        await db.activity_events.create_index("is_cross_section_event")
        await db.activity_events.create_index([("user_id", 1), ("created_at", -1)])
        
        # Cross section updates collection indexes
        await db.cross_section_updates.create_index("user_id")
        await db.cross_section_updates.create_index("trigger_section")
        await db.cross_section_updates.create_index("processed")
        await db.cross_section_updates.create_index("created_at")
        await db.cross_section_updates.create_index([("user_id", 1), ("processed", 1)])
        
        # Notifications collection indexes
        await db.notifications.create_index("user_id")
        await db.notifications.create_index("type")
        await db.notifications.create_index("is_read")
        await db.notifications.create_index("created_at")
        await db.notifications.create_index("expires_at", expireAfterSeconds=0)
        await db.notifications.create_index([("user_id", 1), ("is_read", 1)])
        
        # Unified stats collection indexes
        await db.unified_stats.create_index("user_id", unique=True)
        await db.unified_stats.create_index("level")
        await db.unified_stats.create_index("total_points")
        await db.unified_stats.create_index("updated_at")
        
        logger.info("Interconnected system database indexes created successfully")
        
        # Initialize sample achievements for interconnection
        await init_interconnected_achievements()
        
    except Exception as e:
        logger.error(f"Failed to initialize interconnected system: {str(e)}")

async def init_interconnected_achievements():
    """Initialize sample achievements for interconnected system"""
    try:
        existing_achievements = await db.achievements.count_documents({})
        if existing_achievements == 0:
            achievements = [
                # Referral achievements
                {
                    "id": "first_referral_achievement",
                    "name": "First Friend",
                    "name_hi": "पहला दोस्त",
                    "name_ta": "முதல் நண்பர்",
                    "description": "Successfully referred your first friend to EarnNest",
                    "description_hi": "EarnNest में अपने पहले दोस्त को सफलतापूर्वक रेफर किया",
                    "description_ta": "EarnNest க்கு உங்கள் முதல் நண்பரை வெற்றிகரமாக பரிந்துரைத்தீர்கள்",
                    "badge_icon": "👥",
                    "badge_color": "#10B981",
                    "category": "social",
                    "difficulty": "easy",
                    "points_required": 50,
                    "is_active": True
                },
                {
                    "id": "social_connector_achievement",
                    "name": "Social Connector",
                    "name_hi": "सामाजिक कनेक्टर",
                    "name_ta": "சமூக இணைப்பாளர்",
                    "description": "Referred 5 friends to EarnNest",
                    "description_hi": "EarnNest में 5 दोस्तों को रेफर किया",
                    "description_ta": "EarnNest க்கு 5 நண்பர்களை பரிந்துரைத்தீர்கள்",
                    "badge_icon": "🌐",
                    "badge_color": "#8B5CF6",
                    "category": "social",
                    "difficulty": "medium",
                    "points_required": 250,
                    "is_active": True
                },
                {
                    "id": "referral_master_achievement",
                    "name": "Referral Master",
                    "name_hi": "रेफरल मास्टर",
                    "name_ta": "பரிந்துரை மாஸ்டர்",
                    "description": "Referred 10 friends to EarnNest",
                    "description_hi": "EarnNest में 10 दोस्तों को रेफर किया",
                    "description_ta": "EarnNest க்கு 10 நண்பர்களை பரிந்துரைத்தீர்கள்",
                    "badge_icon": "👑",
                    "badge_color": "#F59E0B",
                    "category": "social",
                    "difficulty": "hard",
                    "points_required": 500,
                    "is_active": True
                },
                
                # Challenge achievements
                {
                    "id": "first_challenge_achievement",
                    "name": "Challenge Starter",
                    "name_hi": "चुनौती शुरूकर्ता",
                    "name_ta": "சவால் துவக்குநர்",
                    "description": "Completed your first challenge",
                    "description_hi": "अपनी पहली चुनौती पूरी की",
                    "description_ta": "உங்கள் முதல் சவாலை முடித்தீர்கள்",
                    "badge_icon": "🎯",
                    "badge_color": "#3B82F6",
                    "category": "streak",
                    "difficulty": "easy",
                    "points_required": 25,
                    "is_active": True
                },
                {
                    "id": "challenge_warrior_achievement",
                    "name": "Challenge Warrior",
                    "name_hi": "चुनौती योद्धा",
                    "name_ta": "சவால் வீரர்",
                    "description": "Completed 5 challenges successfully",
                    "description_hi": "5 चुनौतियों को सफलतापूर्वक पूरा किया",
                    "description_ta": "5 சவால்களை வெற்றிகரமாக முடித்தீர்கள்",
                    "badge_icon": "⚔️",
                    "badge_color": "#DC2626",
                    "category": "streak",
                    "difficulty": "medium",
                    "points_required": 125,
                    "is_active": True
                },
                
                # Festival achievements
                {
                    "id": "festival_planner_achievement",
                    "name": "Festival Planner",
                    "name_hi": "त्योहार योजनाकार",
                    "name_ta": "திருவிழா திட்டமிடுபவர்",
                    "description": "Created your first festival budget",
                    "description_hi": "अपना पहला त्योहार बजट बनाया",
                    "description_ta": "உங்கள் முதல் திருவிழா பட்ஜெட்டை உருவாக்கினீர்கள்",
                    "badge_icon": "🎊",
                    "badge_color": "#F59E0B",
                    "category": "cultural",
                    "difficulty": "easy",
                    "points_required": 20,
                    "is_active": True
                },
                {
                    "id": "cultural_enthusiast_achievement",
                    "name": "Cultural Enthusiast",
                    "name_hi": "सांस्कृतिक उत्साही",
                    "name_ta": "கலாச்சார ஆர்வலர்",
                    "description": "Participated in 5 different festivals",
                    "description_hi": "5 विभिन्न त्योहारों में भाग लिया",
                    "description_ta": "5 வெவ்வேறு திருவிழாக்களில் பங்கேற்றீர்கள்",
                    "badge_icon": "🌺",
                    "badge_color": "#EC4899",
                    "category": "cultural",
                    "difficulty": "medium",
                    "points_required": 100,
                    "is_active": True
                }
            ]
            
            await db.achievements.insert_many(achievements)
            logger.info(f"Inserted {len(achievements)} interconnected achievements")
        
        logger.info("Interconnected achievements initialization completed")
        
    except Exception as e:
        logger.error(f"Failed to initialize interconnected achievements: {str(e)}")

# Call interconnected system initialization in main init_database function
