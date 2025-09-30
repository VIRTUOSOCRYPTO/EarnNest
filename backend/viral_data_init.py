"""
Viral Features Data Initialization
Initialize default achievements, festivals, and challenges data
"""

from datetime import datetime, timezone, timedelta
from database import db, clean_mongo_doc
import asyncio

async def initialize_achievements():
    """Initialize default achievements"""
    
    # Check if achievements already exist
    existing_count = await db.achievements.count_documents({})
    if existing_count > 0:
        print(f"Achievements already exist ({existing_count} found), skipping initialization")
        return
    
    achievements = [
        # Savings Achievements
        {
            "id": "first_transaction",
            "name": "Getting Started",
            "name_hi": "शुरुआत",
            "name_ta": "தொடக்கம்",
            "description": "Record your first transaction",
            "description_hi": "अपना पहला लेन-देन दर्ज करें",
            "description_ta": "உங்கள் முதல் பரிவர்த்தனையை பதிவு செய்யுங்கள்",
            "badge_icon": "🎯",
            "badge_color": "#10B981",
            "category": "savings",
            "points_required": 0,
            "difficulty": "easy",
            "is_active": True
        },
        {
            "id": "chai_money_saver",
            "name": "Chai Money Saver",
            "name_hi": "चाय के पैसे बचाने वाला",
            "name_ta": "தேனீர் பணம் சேமிப்பாளர்",
            "description": "Save ₹500 in a month",
            "description_hi": "एक महीने में ₹500 बचाएं",
            "description_ta": "ஒரு மாதத்தில் ₹500 சேமிக்கவும்",
            "badge_icon": "☕",
            "badge_color": "#F59E0B",
            "category": "savings",
            "points_required": 500,
            "difficulty": "easy",
            "is_active": True
        },
        {
            "id": "budget_master",
            "name": "Budget Master",
            "name_hi": "बजट मास्टर",
            "name_ta": "பட்ஜெட் மாஸ்டர்",
            "description": "Stay within budget for 7 consecutive days",
            "description_hi": "लगातार 7 दिनों तक बजट के भीतर रहें",
            "description_ta": "7 தொடர்ந்த நாட்களுக்கு பட்ஜெட்டுக்குள் இருங்கள்",
            "badge_icon": "💰",
            "badge_color": "#8B5CF6",
            "category": "savings",
            "points_required": 0,
            "difficulty": "medium",
            "is_active": True
        },
        {
            "id": "rickshaw_rider",
            "name": "Rickshaw Rider",
            "name_hi": "रिक्शा सवार",
            "name_ta": "ரிக்ஷா ரைடர்",
            "description": "Use public transport 10 times to save money",
            "description_hi": "पैसे बचाने के लिए 10 बार सार्वजनिक परिवहन का उपयोग करें",
            "description_ta": "பணத்தை மிச்சப்படுத்த 10 முறை பொது போக்குவரத்தைப் பயன்படுत्तুங்கள்",
            "badge_icon": "🚌",
            "badge_color": "#059669",
            "category": "savings",
            "points_required": 0,
            "difficulty": "easy",
            "is_active": True
        },
        
        # Earning Achievements
        {
            "id": "side_hustle_hero",
            "name": "Side Hustle Hero",
            "name_hi": "साइड हसल हीरो",
            "name_ta": "பக்க வேலை ஹீரோ",
            "description": "Complete your first side hustle",
            "description_hi": "अपना पहला साइड हसल पूरा करें",
            "description_ta": "உங்கள் முதல் பக்க வேலையை முடிக்கவும்",
            "badge_icon": "💼",
            "badge_color": "#DC2626",
            "category": "earning",
            "points_required": 0,
            "difficulty": "medium",
            "is_active": True
        },
        {
            "id": "rupee_collector",
            "name": "Rupee Collector",
            "name_hi": "रुपया संग्राहक",
            "name_ta": "ரூபாய் சேகரிப்பாளர்",
            "description": "Earn ₹1000 from side hustles",
            "description_hi": "साइड हसल से ₹1000 कमाएं",
            "description_ta": "பக்க வேலைகளில் இருந்து ₹1000 சம்பாதிக்கவும்",
            "badge_icon": "💸",
            "badge_color": "#7C3AED",
            "category": "earning",
            "points_required": 1000,
            "difficulty": "medium",
            "is_active": True
        },
        
        # Streak Achievements
        {
            "id": "week_warrior",
            "name": "Week Warrior",
            "name_hi": "सप्ताह योद्धा",
            "name_ta": "வார வீரர்",
            "description": "Login daily for 7 consecutive days",
            "description_hi": "लगातार 7 दिनों तक दैनिक लॉगिन",
            "description_ta": "7 தொடர்ந்த நாட்களுக்கு தினமும் உள் நுழைவு",
            "badge_icon": "🔥",
            "badge_color": "#EF4444",
            "category": "streak",
            "points_required": 0,
            "difficulty": "easy",
            "is_active": True
        },
        {
            "id": "month_master",
            "name": "Month Master",
            "name_hi": "महीने का मास्टर",
            "name_ta": "மாத மாஸ்டர்",
            "description": "Maintain 30-day login streak",
            "description_hi": "30 दिनों की लॉगिन स्ट्रीक बनाए रखें",
            "description_ta": "30 நாள் உள்நுழைவு வரிசையைப் பராமரிக்கவும்",
            "badge_icon": "🏆",
            "badge_color": "#F59E0B",
            "category": "streak",
            "points_required": 0,
            "difficulty": "hard",
            "is_active": True
        },
        
        # Social Achievements
        {
            "id": "friend_inviter",
            "name": "Friend Inviter",
            "name_hi": "दोस्त आमंत्रक",
            "name_ta": "நண்பர் அழைப்பாளர்",
            "description": "Invite your first friend to EarnNest",
            "description_hi": "EarnNest में अपने पहले दोस्त को आमंत्रित करें",
            "description_ta": "EarnNest க்கு உங்கள் முதல் நண்பரை அழைக்கவும்",
            "badge_icon": "👥",
            "badge_color": "#3B82F6",
            "category": "social",
            "points_required": 0,
            "difficulty": "easy",
            "is_active": True
        },
        {
            "id": "network_builder",
            "name": "Network Builder",
            "name_hi": "नेटवर्क बिल्डर",
            "name_ta": "நெட்வொர்க் பில்டர்",
            "description": "Successfully refer 5 friends",
            "description_hi": "सफलतापूर्वक 5 दोस्तों को रेफर करें",
            "description_ta": "வெற்றிகரமாக 5 நண்பர்களைப் பரிந்துரைக்கவும்",
            "badge_icon": "🌐",
            "badge_color": "#059669",
            "category": "social",
            "points_required": 0,
            "difficulty": "medium",
            "is_active": True
        },
        
        # Cultural Achievements
        {
            "id": "diwali_saver",
            "name": "Diwali Saver",
            "name_hi": "दिवाली सेवर",
            "name_ta": "தீபாவளி சேமிப்பாளர்",
            "description": "Create and achieve Diwali festival budget",
            "description_hi": "दिवाली त्योहार का बजट बनाएं और पूरा करें",
            "description_ta": "தீபாவளி திருவிழா பட்ஜெட்டை உருவாக்கி அடையுங்கள்",
            "badge_icon": "🪔",
            "badge_color": "#F59E0B",
            "category": "cultural",
            "points_required": 0,
            "difficulty": "medium",
            "is_active": True
        },
        {
            "id": "festival_planner",
            "name": "Festival Planner",
            "name_hi": "त्योहार योजनाकार",
            "name_ta": "திருவிழா திட்டமிடுபவர்",
            "description": "Plan budgets for 3 different festivals",
            "description_hi": "3 अलग-अलग त्योहारों के लिए बजट की योजना बनाएं",
            "description_ta": "3 வெவ்வேறு திருவிழाக்களுக்கான பட்ஜெட்டுகளைத் திட்டமிडुங்கள்",
            "badge_icon": "🎊",
            "badge_color": "#EC4899",
            "category": "cultural",
            "points_required": 0,
            "difficulty": "hard",
            "is_active": True
        }
    ]
    
    # Insert achievements
    result = await db.achievements.insert_many(achievements)
    print(f"Inserted {len(result.inserted_ids)} achievements")

async def initialize_festivals():
    """Initialize default festivals"""
    
    # Check if festivals already exist
    existing_count = await db.festivals.count_documents({})
    if existing_count > 0:
        print(f"Festivals already exist ({existing_count} found), skipping initialization")
        return
    
    current_year = datetime.now().year
    
    festivals = [
        # Pan-India Festivals
        {
            "id": "diwali_2025",
            "name": "Diwali",
            "name_hi": "दिवाली",
            "name_ta": "தீபாவளி",
            "description": "Festival of Lights - The biggest festival in India",
            "description_hi": "रोशनी का त्योहार - भारत का सबसे बड़ा त्योहार",
            "description_ta": "விளக்குகளின் திருவிழா - இந்தியாவின் மிகப்பெரிய திருவிழா",
            "date": datetime(current_year, 11, 1, tzinfo=timezone.utc),
            "festival_type": "national",
            "region": "all",
            "typical_expenses": ["Shopping", "Food", "Entertainment", "Gifts", "Decorations"],
            "budget_suggestions": {
                "Shopping": 5000,
                "Food": 3000,
                "Entertainment": 2000,
                "Gifts": 4000,
                "Decorations": 1500
            },
            "is_active": True,
            "icon": "🪔"
        },
        {
            "id": "holi_2025",
            "name": "Holi",
            "name_hi": "होली",
            "name_ta": "ஹோலி",
            "description": "Festival of Colors - Celebration of spring and love",
            "description_hi": "रंगों का त्योहार - वसंत और प्रेम का उत्सव",
            "description_ta": "வண்ணங்களின் திருவிழா - வசंत மற்றும் அன்பின் கொண்டாட்டம்",
            "date": datetime(current_year, 3, 14, tzinfo=timezone.utc),
            "festival_type": "national",
            "region": "all",
            "typical_expenses": ["Colors", "Food", "Entertainment", "Gifts"],
            "budget_suggestions": {
                "Colors": 500,
                "Food": 1500,
                "Entertainment": 1000,
                "Gifts": 1000
            },
            "is_active": True,
            "icon": "🎨"
        },
        {
            "id": "eid_2025",
            "name": "Eid ul-Fitr",
            "name_hi": "ईद उल-फ़ित्र",
            "name_ta": "ஈத் உல்-ஃபித்ர்",
            "description": "Festival marking the end of Ramadan",
            "description_hi": "रमज़ान के अंत का त्योहार",
            "description_ta": "ரமலானின் முடிவைக் குறிக்கும் திருவிழா",
            "date": datetime(current_year, 4, 10, tzinfo=timezone.utc),
            "festival_type": "religious",
            "region": "all",
            "typical_expenses": ["Shopping", "Food", "Gifts", "Charity"],
            "budget_suggestions": {
                "Shopping": 3000,
                "Food": 2500,
                "Gifts": 2000,
                "Charity": 1000
            },
            "is_active": True,
            "icon": "🌙"
        },
        
        # Regional Festivals
        {
            "id": "durga_puja_2025",
            "name": "Durga Puja",
            "name_hi": "दुर्गा पूजा",
            "name_ta": "துர்கா பூஜை",
            "description": "Bengali festival honoring Goddess Durga",
            "description_hi": "देवी दुर्गा का सम्मान करने वाला बंगाली त्योहार",
            "description_ta": "துர்கா தேவியை கொண்டாடும் வங்காள திருவிழா",
            "date": datetime(current_year, 10, 10, tzinfo=timezone.utc),
            "festival_type": "regional",
            "region": "east",
            "typical_expenses": ["Shopping", "Food", "Entertainment", "Pandal_Hopping"],
            "budget_suggestions": {
                "Shopping": 4000,
                "Food": 3000,
                "Entertainment": 2000,
                "Pandal_Hopping": 1500
            },
            "is_active": True,
            "icon": "🙏"
        },
        {
            "id": "onam_2025",
            "name": "Onam",
            "name_hi": "ओणम",
            "name_ta": "ஓணம்",
            "description": "Kerala harvest festival",
            "description_hi": "केरल का फसल त्योहार",
            "description_ta": "கேரளாவின் அறுவடை திருவிழா",
            "date": datetime(current_year, 8, 15, tzinfo=timezone.utc),
            "festival_type": "regional",
            "region": "south",
            "typical_expenses": ["Sadhya", "Shopping", "Flowers", "Entertainment"],
            "budget_suggestions": {
                "Sadhya": 2000,
                "Shopping": 3000,
                "Flowers": 500,
                "Entertainment": 1500
            },
            "is_active": True,
            "icon": "🌾"
        },
        
        # Modern Celebrations
        {
            "id": "valentine_2025",
            "name": "Valentine's Day",
            "name_hi": "वैलेंटाइन डे",
            "name_ta": "காதலர் தினம்",
            "description": "Day of love and romance",
            "description_hi": "प्रेम और रोमांस का दिन",
            "description_ta": "அன்பு மற்றும் காதலின் நாள்",
            "date": datetime(current_year, 2, 14, tzinfo=timezone.utc),
            "festival_type": "modern",
            "region": "all",
            "typical_expenses": ["Gifts", "Dining", "Movies", "Flowers"],
            "budget_suggestions": {
                "Gifts": 2000,
                "Dining": 1500,
                "Movies": 800,
                "Flowers": 500
            },
            "is_active": True,
            "icon": "❤️"
        },
        {
            "id": "new_year_2025",
            "name": "New Year",
            "name_hi": "नव वर्ष",
            "name_ta": "புத்தாண்டு",
            "description": "Celebration of the new calendar year",
            "description_hi": "नए कैलेंडर वर्ष का उत्सव",
            "description_ta": "புதிய நாட்காட்டி ஆண்டின் கொண்டாட்டம்",
            "date": datetime(current_year, 12, 31, tzinfo=timezone.utc),
            "festival_type": "modern",
            "region": "all",
            "typical_expenses": ["Party", "Food", "Entertainment", "Gifts"],
            "budget_suggestions": {
                "Party": 3000,
                "Food": 2000,
                "Entertainment": 2500,
                "Gifts": 1500
            },
            "is_active": True,
            "icon": "🎉"
        },
        
        # Additional Regional Festivals
        {
            "id": "karva_chauth_2025",
            "name": "Karva Chauth",
            "name_hi": "करवा चौथ",
            "name_ta": "கர்வா சௌத்",
            "description": "Festival for married women's prayers for husband's long life",
            "description_hi": "विवाहित महिलाओं द्वारा पति की लंबी आयु के लिए प्रार्थना का त्योहार",
            "description_ta": "திருமணமான பெண்கள் கணவரின் நீண்ட ஆயுளுக்காக பிரார்த்தனை செய்யும் திருவிழா",
            "date": datetime(current_year, 10, 20, tzinfo=timezone.utc),
            "festival_type": "regional",
            "region": "north",
            "typical_expenses": ["Shopping", "Gifts", "Food", "Jewelry"],
            "budget_suggestions": {
                "Shopping": 3000,
                "Gifts": 2000,
                "Food": 1500,
                "Jewelry": 5000
            },
            "is_active": True,
            "icon": "💝"
        }
    ]
    
    # Insert festivals
    result = await db.festivals.insert_many(festivals)
    print(f"Inserted {len(result.inserted_ids)} festivals")

async def initialize_challenges():
    """Initialize default challenges"""
    
    # Check if challenges already exist
    existing_count = await db.challenges.count_documents({})
    if existing_count > 0:
        print(f"Challenges already exist ({existing_count} found), skipping initialization")
        return
    
    now = datetime.now(timezone.utc)
    
    challenges = [
        {
            "id": "save_1000_30_days",
            "name": "Save ₹1000 in 30 Days",
            "name_hi": "30 दिनों में ₹1000 बचाएं",
            "name_ta": "30 நாட்களில் ₹1000 சேமிக்கவும்",
            "description": "Challenge yourself to save ₹1000 in the next 30 days",
            "description_hi": "अगले 30 दिनों में ₹1000 बचाने की चुनौती लें",
            "description_ta": "அடுத்த 30 நாட்களில் ₹1000 சேமிக்க உங்களை சவால் செய்யுங்கள்",
            "challenge_type": "saving",
            "target_value": 1000.0,
            "target_unit": "rupees",
            "duration_days": 30,
            "reward_coins": 100,
            "start_date": now,
            "end_date": now + timedelta(days=30),
            "is_active": True,
            "difficulty": "medium",
            "icon": "💰"
        },
        {
            "id": "no_swiggy_september",
            "name": "No Swiggy September",
            "name_hi": "नो स्विगी सितंबर",
            "name_ta": "நோ ஸ்விகி செப்டம்பர்",
            "description": "Avoid food delivery for the entire month of September",
            "description_hi": "सितंबर के पूरे महीने फूड डिलीवरी से बचें",
            "description_ta": "செப்டம்பர் மாதம் முழுவதும் உணவு விநியோகத்தை தவிர்க்கவும்",
            "challenge_type": "saving",
            "target_value": 30.0,
            "target_unit": "days",
            "duration_days": 30,
            "reward_coins": 150,
            "start_date": now,
            "end_date": now + timedelta(days=30),
            "is_active": True,
            "difficulty": "hard",
            "icon": "🚫"
        },
        {
            "id": "earn_5000_hustle",
            "name": "Earn ₹5000 from Side Hustles",
            "name_hi": "साइड हसल से ₹5000 कमाएं",
            "name_ta": "பக்க வேலைகளில் இருந்து ₹5000 சம்பாதிக்கவும்",
            "description": "Complete side hustles to earn ₹5000 in 60 days",
            "description_hi": "60 दिनों में ₹5000 कमाने के लिए साइड हसल पूरा करें",
            "description_ta": "60 நாட்களில் ₹5000 சம்பாதிக்க பக்க வேலைகளை முடிக்கவும்",
            "challenge_type": "earning",
            "target_value": 5000.0,
            "target_unit": "rupees",
            "duration_days": 60,
            "reward_coins": 300,
            "start_date": now,
            "end_date": now + timedelta(days=60),
            "is_active": True,
            "difficulty": "hard",
            "icon": "💼"
        },
        {
            "id": "daily_login_streak_21",
            "name": "21-Day Login Streak",
            "name_hi": "21-दिन लॉगिन स्ट्रीक",
            "name_ta": "21-நாள் உள்நுழைவு வரிசை",
            "description": "Login daily for 21 consecutive days",
            "description_hi": "लगातार 21 दिनों तक दैनिक लॉगिन करें",
            "description_ta": "21 தொடர்ந்த நாட்களுக்கு தினமும் உள்நुழைவு செய்யுங்கள்",
            "challenge_type": "streak",
            "target_value": 21.0,
            "target_unit": "days",
            "duration_days": 21,
            "reward_coins": 75,
            "start_date": now,
            "end_date": now + timedelta(days=21),
            "is_active": True,
            "difficulty": "medium",
            "icon": "🔥"
        },
        {
            "id": "refer_3_friends",
            "name": "Refer 3 Friends",
            "name_hi": "3 दोस्तों को रेफर करें",
            "name_ta": "3 நண்பர்களை பரிந்துரைக்கவும்",
            "description": "Successfully refer 3 friends to EarnNest",
            "description_hi": "EarnNest में सफलतापूर्वक 3 दोस्तों को रेफर करें",
            "description_ta": "EarnNest க்கு வெற்றிகرமாக 3 நண்பர்களை பரிந்துரைக्कवும்",
            "challenge_type": "social",
            "target_value": 3.0,
            "target_unit": "referrals",
            "duration_days": 30,
            "reward_coins": 200,
            "start_date": now,
            "end_date": now + timedelta(days=30),
            "is_active": True,
            "difficulty": "medium",
            "icon": "👥"
        }
    ]
    
    # Insert challenges
    result = await db.challenges.insert_many(challenges)
    print(f"Inserted {len(result.inserted_ids)} challenges")

async def main():
    """Main function to initialize all viral features data"""
    print("🚀 Initializing Viral Features Data...")
    
    try:
        await initialize_achievements()
        await initialize_festivals()
        await initialize_challenges()
        print("✅ All viral features data initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing data: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
