from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
import uuid
import re

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str  # "Student", "Professional", "Other" - MANDATORY
    student_level: str  # "undergraduate", "graduate", "high_school"
    skills: List[str] = []

    @validator('skills')
    def validate_skills(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one skill is required')
        
        # Check if all skills are valid (not empty)
        valid_skills = [skill.strip() for skill in v if skill.strip()]
        if len(valid_skills) == 0:
            raise ValueError('At least one valid skill is required')
        
        return valid_skills
    availability_hours: int = 10  # hours per week
    location: str  # MANDATORY - cannot be empty, must be valid location format
    bio: Optional[str] = None
    avatar: str = "boy"  # MANDATORY - avatar selection (boy, man, girl, woman, grandfather, grandmother)
    profile_photo: Optional[str] = None  # Keep for backward compatibility
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_earnings: float = 0.0
    net_savings: float = 0.0
    current_streak: int = 0
    achievements: List[Dict[str, Any]] = []
    email_verified: bool = False
    is_active: bool = True
    is_admin: bool = False
    failed_login_attempts: int = 0
    last_failed_login: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    # VIRAL FEATURES - New fields
    referral_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())  # Unique 8-char code
    referred_by: Optional[str] = None  # Referral code of who referred this user
    earn_coins_balance: int = 0  # Current EarnCoins balance
    total_earn_coins_earned: int = 0  # Total coins ever earned
    total_referrals: int = 0  # Number of successful referrals
    preferred_language: str = "en"  # "en", "hi", "ta"
    daily_login_streak: int = 0  # Current daily login streak
    longest_login_streak: int = 0  # Longest login streak achieved
    last_login_date: Optional[datetime] = None  # Last login date for streak calculation
    total_achievements_earned: int = 0  # Count of achievements earned
    level: int = 1  # User level based on activity
    experience_points: int = 0  # XP for leveling up
    cultural_preferences: List[str] = []  # Festivals/cultures user is interested in
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ["Student", "Professional", "Other"]
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v
    
    @validator('location')
    def validate_location(cls, v):
        if not v or not v.strip():
            raise ValueError('Location is required and cannot be empty')
        
        # Basic location format validation (City, State or City, Country)
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Location must be at least 3 characters long')
        
        # Check for basic city, state/country format
        if ',' not in v and len(v.split()) < 2:
            raise ValueError('Location should include city and state/country (e.g., "Mumbai, Maharashtra" or "New York, USA")')
        
        return v

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # MANDATORY
    student_level: str
    skills: List[str] = []
    availability_hours: int = 10
    location: str  # MANDATORY
    bio: Optional[str] = None
    avatar: str = "boy"  # MANDATORY - avatar selection
    referred_by: Optional[str] = None  # Referral code used during signup
    preferred_language: str = "en"  # Default to English
    cultural_preferences: List[str] = []  # Optional festival/cultural interests

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ["Student", "Professional", "Other"]
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v
    
    @validator('location')
    def validate_location(cls, v):
        if not v or not v.strip():
            raise ValueError('Location is required and cannot be empty')
        
        # Basic location format validation (City, State or City, Country)
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Location must be at least 3 characters long')
        
        # Check for basic city, state/country format
        if ',' not in v and len(v.split()) < 2:
            raise ValueError('Location should include city and state/country (e.g., "Mumbai, Maharashtra" or "New York, USA")')
        
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        
        # Check for common passwords
        common_passwords = [
            'password', '12345678', 'password123', 'admin123', 'welcome123',
            'qwerty123', '123456789', 'letmein123', 'password1', 'admin1234'
        ]
        if v.lower() in common_passwords:
            raise ValueError('Password is too common. Please choose a stronger password')
        
        return v

    @validator('full_name')
    def validate_full_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        if not re.match(r'^[a-zA-Z\s.]+$', v):
            raise ValueError('Full name can only contain letters, spaces, and periods')
        return v.strip()

    @validator('skills')
    def validate_skills(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one skill is required')
        
        # Check if all skills are valid (not empty)
        valid_skills = [skill.strip() for skill in v if skill.strip()]
        if len(valid_skills) == 0:
            raise ValueError('At least one valid skill is required')
        
        return valid_skills

    @validator('bio')
    def validate_bio(cls, v):
        if v and len(v) > 500:
            raise ValueError('Bio cannot exceed 500 characters')
        return v
    
    @validator('preferred_language')
    def validate_preferred_language(cls, v):
        allowed_languages = ["en", "hi", "ta"]
        if v not in allowed_languages:
            raise ValueError(f'Preferred language must be one of: {", ".join(allowed_languages)}')
        return v

    @validator('skills')
    def validate_skills(cls, v):
        if len(v) > 20:
            raise ValueError('Cannot have more than 20 skills')
        cleaned_skills = []
        for skill in v:
            cleaned = skill.strip()
            if cleaned and len(cleaned) <= 50:
                cleaned_skills.append(cleaned)
        return cleaned_skills

    @validator('avatar')
    def validate_avatar(cls, v):
        allowed_avatars = ["boy", "man", "girl", "woman", "grandfather", "grandmother"]
        if v not in allowed_avatars:
            raise ValueError(f'Avatar must be one of: {", ".join(allowed_avatars)}')
        return v
    
    @validator('preferred_language')
    def validate_preferred_language(cls, v):
        allowed_languages = ["en", "hi", "ta"]
        if v not in allowed_languages:
            raise ValueError(f'Preferred language must be one of: {", ".join(allowed_languages)}')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    availability_hours: Optional[int] = None 
    location: Optional[str] = None
    bio: Optional[str] = None
    student_level: Optional[str] = None
    avatar: Optional[str] = None

    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            allowed_roles = ["Student", "Professional", "Other"]
            if v not in allowed_roles:
                raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v
    
    @validator('location') 
    def validate_location(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Location cannot be empty')
            v = v.strip()
            if len(v) < 3:
                raise ValueError('Location must be at least 3 characters long')
            if ',' not in v and len(v.split()) < 2:
                raise ValueError('Location should include city and state/country (e.g., "Mumbai, Maharashtra" or "New York, USA")')
        return v

    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None:
            if len(v.strip()) < 2:
                raise ValueError('Full name must be at least 2 characters long')
            if not re.match(r'^[a-zA-Z\s.]+$', v):
                raise ValueError('Full name can only contain letters, spaces, and periods')
            return v.strip()
        return v

    @validator('avatar')
    def validate_avatar(cls, v):
        if v is not None:
            allowed_avatars = ["boy", "man", "girl", "woman", "grandfather", "grandmother"]
            if v not in allowed_avatars:
                raise ValueError(f'Avatar must be one of: {", ".join(allowed_avatars)}')
        return v

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationConfirm(BaseModel):
    email: EmailStr
    verification_code: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        
        return v

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

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        if v > 10000000:  # 1 crore limit
            raise ValueError('Amount cannot exceed ₹1,00,00,000')
        return round(v, 2)

    @validator('description')
    def validate_description(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Description must be at least 3 characters long')
        if len(v) > 200:
            raise ValueError('Description cannot exceed 200 characters')
        return v.strip()

class TransactionCreate(BaseModel):
    type: str
    amount: float
    category: str
    description: str
    source: Optional[str] = None
    is_hustle_related: bool = False

    @validator('type')
    def validate_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('Type must be either "income" or "expense"')
        return v

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        if v > 10000000:  # 1 crore limit
            raise ValueError('Amount cannot exceed ₹1,00,00,000')
        return round(v, 2)

class ContactInfo(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            phone_pattern = r'^[\+]?[1-9][\d]{3,14}$'
            if not re.match(phone_pattern, v):
                raise ValueError('Invalid phone number format')
        return v
    
    @validator('website')
    def validate_website(cls, v):
        if v:
            url_pattern = r'^https?://[^\s]+$'
            if not re.match(url_pattern, v):
                raise ValueError('Invalid website URL format')
        return v
    
    @validator('linkedin')
    def validate_linkedin(cls, v):
        if v:
            linkedin_pattern = r'^https?://[^\s]*linkedin\.com[^\s]*$'
            if not re.match(linkedin_pattern, v):
                raise ValueError('Invalid LinkedIn URL format')
        return v

class LocationInfo(BaseModel):
    area: str
    city: str
    state: str
    
    @validator('area', 'city', 'state')
    def validate_location_fields(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('All location fields must be at least 2 characters long')
        return v.strip()

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
    location: Optional[LocationInfo] = None
    is_remote: bool = True
    contact_info: ContactInfo
    application_deadline: Optional[datetime] = None
    max_applicants: Optional[int] = None
    status: str = "active"  # "active", "closed", "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    applicants: List[str] = []  # user_ids who applied
    is_admin_posted: bool = False

    @validator('pay_rate')
    def validate_pay_rate(cls, v):
        if v <= 0:
            raise ValueError('Pay rate must be greater than 0')
        if v > 100000:  # 1 lakh per hour/task limit
            raise ValueError('Pay rate cannot exceed ₹1,00,000')
        return round(v, 2)

    @root_validator(skip_on_failure=True)
    def validate_contact_info(cls, values):
        contact_info = values.get('contact_info')
        if isinstance(contact_info, dict):
            contact_info = ContactInfo(**contact_info)
        
        # At least one contact method must be provided
        if not any([contact_info.email, contact_info.phone, contact_info.website, contact_info.linkedin]):
            raise ValueError('At least one contact method must be provided')
        return values

class UserHustleCreate(BaseModel):
    title: str
    description: str
    category: str
    pay_rate: float
    pay_type: str
    time_commitment: str
    required_skills: List[str]
    difficulty_level: str
    location: Optional[Union[str, LocationInfo]] = None
    is_remote: bool = True
    contact_info: Union[str, ContactInfo]
    application_deadline: Optional[datetime] = None
    max_applicants: Optional[int] = None

    @root_validator(pre=True)
    def parse_flexible_inputs(cls, values):
        """Convert string inputs to structured objects"""
        
        # Handle contact_info - accept string or object
        contact_info = values.get('contact_info')
        if isinstance(contact_info, str) and contact_info:
            # Parse string into ContactInfo object
            contact_obj = {}
            contact_str = contact_info.strip()
            
            # Email pattern
            if '@' in contact_str and '.' in contact_str:
                contact_obj['email'] = contact_str
            # Phone pattern (accept various formats)
            elif any(char.isdigit() for char in contact_str):
                # Clean phone number - remove spaces, dashes, parentheses, plus signs
                clean_phone = re.sub(r'[\s\-\(\)\+]', '', contact_str)
                # Convert to expected format (e.g., +91-xxx becomes 91xxx)
                if clean_phone.startswith('91') and len(clean_phone) >= 10:
                    contact_obj['phone'] = clean_phone
                elif len(clean_phone) >= 10:
                    contact_obj['phone'] = clean_phone
            # Website pattern
            elif contact_str.startswith(('http://', 'https://')):
                contact_obj['website'] = contact_str
            else:
                # Default to email if it contains @, otherwise phone
                if '@' in contact_str:
                    contact_obj['email'] = contact_str
                else:
                    contact_obj['phone'] = contact_str
                    
            values['contact_info'] = contact_obj
        
        # Handle location - accept string or object  
        location = values.get('location')
        if isinstance(location, str) and location:
            location_str = location.strip()
            # Simple parsing - split by comma if available
            if ',' in location_str:
                parts = [p.strip() for p in location_str.split(',')]
                if len(parts) >= 2:
                    values['location'] = {
                        'area': parts[0],
                        'city': parts[0], 
                        'state': parts[-1]
                    }
                else:
                    values['location'] = {
                        'area': location_str,
                        'city': location_str,
                        'state': location_str
                    }
            else:
                # Single string - use as all fields
                values['location'] = {
                    'area': location_str,
                    'city': location_str, 
                    'state': location_str
                }
        elif location == '':
            values['location'] = None
            
        return values

    @validator('title')
    def validate_title(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('Title must be at least 5 characters long')
        if len(v) > 100:
            raise ValueError('Title cannot exceed 100 characters')
        return v.strip()

    @validator('description')  
    def validate_description(cls, v):
        if len(v.strip()) < 20:
            raise ValueError('Description must be at least 20 characters long')
        if len(v) > 1000:
            raise ValueError('Description cannot exceed 1000 characters')
        return v.strip()

class UserHustleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    pay_rate: Optional[float] = None
    pay_type: Optional[str] = None
    time_commitment: Optional[str] = None
    required_skills: Optional[List[str]] = None
    difficulty_level: Optional[str] = None
    location: Optional[Union[str, LocationInfo]] = None
    is_remote: Optional[bool] = None
    contact_info: Optional[Union[str, ContactInfo]] = None
    application_deadline: Optional[datetime] = None
    max_applicants: Optional[int] = None
    status: Optional[str] = None

    @root_validator(pre=True)
    def parse_flexible_inputs(cls, values):
        """Convert string inputs to structured objects"""
        
        # Handle contact_info - accept string or object
        contact_info = values.get('contact_info')
        if isinstance(contact_info, str) and contact_info:
            # Parse string into ContactInfo object
            contact_obj = {}
            contact_str = contact_info.strip()
            
            # Email pattern
            if '@' in contact_str and '.' in contact_str:
                contact_obj['email'] = contact_str
            # Phone pattern (accept various formats)
            elif any(char.isdigit() for char in contact_str):
                # Clean phone number - remove spaces, dashes, parentheses, plus signs
                clean_phone = re.sub(r'[\s\-\(\)\+]', '', contact_str)
                # Convert to expected format (e.g., +91-xxx becomes 91xxx)
                if clean_phone.startswith('91') and len(clean_phone) >= 10:
                    contact_obj['phone'] = clean_phone
                elif len(clean_phone) >= 10:
                    contact_obj['phone'] = clean_phone
            # Website pattern
            elif contact_str.startswith(('http://', 'https://')):
                contact_obj['website'] = contact_str
            else:
                # Default to email if it contains @, otherwise phone
                if '@' in contact_str:
                    contact_obj['email'] = contact_str
                else:
                    contact_obj['phone'] = contact_str
                    
            values['contact_info'] = contact_obj
        elif contact_info == '':
            values['contact_info'] = None
        
        # Handle location - accept string or object  
        location = values.get('location')
        if isinstance(location, str) and location:
            location_str = location.strip()
            # Simple parsing - split by comma if available
            if ',' in location_str:
                parts = [p.strip() for p in location_str.split(',')]
                if len(parts) >= 2:
                    values['location'] = {
                        'area': parts[0],
                        'city': parts[0], 
                        'state': parts[-1]
                    }
                else:
                    values['location'] = {
                        'area': location_str,
                        'city': location_str,
                        'state': location_str
                    }
            else:
                # Single string - use as all fields
                values['location'] = {
                    'area': location_str,
                    'city': location_str, 
                    'state': location_str
                }
        elif location == '':
            values['location'] = None
            
        return values

    @validator('title')
    def validate_title(cls, v):
        if v and len(v.strip()) < 5:
            raise ValueError('Title must be at least 5 characters long')
        if v and len(v) > 100:
            raise ValueError('Title cannot exceed 100 characters')
        return v.strip() if v else v

    @validator('description')
    def validate_description(cls, v):
        if v and len(v.strip()) < 20:
            raise ValueError('Description must be at least 20 characters long')
        if v and len(v) > 1000:
            raise ValueError('Description cannot exceed 1000 characters')
        return v.strip() if v else v

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

    @validator('cover_message')
    def validate_cover_message(cls, v):
        if len(v.strip()) < 20:
            raise ValueError('Cover message must be at least 20 characters long')
        if len(v) > 500:
            raise ValueError('Cover message cannot exceed 500 characters')
        return v.strip()

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

    @validator('allocated_amount')
    def validate_allocated_amount(cls, v):
        if v <= 0:
            raise ValueError('Allocated amount must be greater than 0')
        if v > 10000000:  # 1 crore limit
            raise ValueError('Allocated amount cannot exceed ₹1,00,00,000')
        return round(v, 2)

class BudgetCreate(BaseModel):
    category: str
    allocated_amount: float
    month: str

    @validator('category')
    def validate_category(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Category must be at least 2 characters long')
        return v.strip()

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    allocated_amount: Optional[float] = None
    month: Optional[str] = None

    @validator('category')
    def validate_category(cls, v):
        if v is not None:
            if len(v.strip()) < 2:
                raise ValueError('Category must be at least 2 characters long')
            return v.strip()
        return v

    @validator('allocated_amount')
    def validate_amount(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError('Allocated amount must be greater than 0')
            if v > 10000000:  # 1 crore limit
                raise ValueError('Allocated amount cannot exceed ₹1,00,00,000')
            return round(v, 2)
        return v

class AdminHustleCreate(BaseModel):
    title: str
    description: str
    category: str
    estimated_pay: float
    time_commitment: str
    required_skills: List[str]
    difficulty_level: str
    platform: str
    application_link: Optional[str] = None

    @validator('application_link')
    def validate_application_link(cls, v):
        if v:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            phone_pattern = r'^[\+]?[1-9][\d]{3,14}$'
            url_pattern = r'^https?://[^\s]+$'
            
            if not (re.match(email_pattern, v) or re.match(phone_pattern, v) or re.match(url_pattern, v)):
                raise ValueError('Application link must be a valid email, phone number, or website URL')
        return v

# Financial Goals Models
class FinancialGoal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    category: str  # "emergency_fund", "monthly_income", "graduation", "custom"
    target_amount: float = Field(gt=0, le=50000000)  # Up to ₹5 crores
    current_amount: float = Field(default=0.0, ge=0)
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_completed: bool = False
    
    @validator('category')
    def validate_category(cls, v):
        allowed_categories = ["emergency_fund", "monthly_income", "graduation", "custom"]
        if v not in allowed_categories:
            raise ValueError(f'Category must be one of: {", ".join(allowed_categories)}')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Goal name is required')
        if len(v.strip()) > 100:
            raise ValueError('Goal name must be less than 100 characters')
        return v.strip()

class FinancialGoalCreate(BaseModel):
    name: str
    category: str
    target_amount: float = Field(gt=0, le=50000000)
    current_amount: float = Field(default=0.0, ge=0)
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    
    @validator('category')
    def validate_category(cls, v):
        allowed_categories = ["emergency_fund", "monthly_income", "graduation", "custom"]
        if v not in allowed_categories:
            raise ValueError(f'Category must be one of: {", ".join(allowed_categories)}')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Goal name is required')
        if len(v.strip()) > 100:
            raise ValueError('Goal name must be less than 100 characters')
        return v.strip()

class FinancialGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0, le=50000000)
    current_amount: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Goal name cannot be empty')
            if len(v.strip()) > 100:
                raise ValueError('Goal name must be less than 100 characters')
            return v.strip()
        return v

# Category Suggestions Models
class CategorySuggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    name: str
    url: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = None
    offers: Optional[str] = None
    cashback: Optional[str] = None
    type: str  # "app", "website", "both"
    is_active: bool = True
    priority: int = 0  # Higher number = higher priority
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmergencyType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    icon: str
    description: str
    urgency_level: str  # "high", "medium", "low"

class Hospital(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    state: str
    phone: str
    emergency_phone: Optional[str] = None
    latitude: float
    longitude: float
    rating: Optional[float] = None
    specialties: List[str] = []
    is_emergency: bool = True
    is_24x7: bool = True
    type: str  # "government", "private", "clinic"

class ClickAnalytics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    suggestion_name: str
    suggestion_url: str
    clicked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_location: Optional[str] = None
    session_id: Optional[str] = None

class ClickAnalyticsCreate(BaseModel):
    category: str
    suggestion_name: str
    suggestion_url: str
    user_location: Optional[str] = None
    session_id: Optional[str] = None

class PriceComparisonQuery(BaseModel):
    product_name: str
    category: str = "Shopping"
    budget_range: Optional[str] = None  # "under_1000", "1000_5000", "5000_above"

# Advanced Income Tracking System Models

class AutoImportSource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    source_type: str  # "email", "sms"
    provider: str  # "gmail", "outlook", "sms_provider"
    source_name: str  # User-friendly name
    is_active: bool = True
    last_sync: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('source_type')
    def validate_source_type(cls, v):
        allowed_types = ["email", "sms"]
        if v not in allowed_types:
            raise ValueError(f'Source type must be one of: {", ".join(allowed_types)}')
        return v

class AutoImportSourceCreate(BaseModel):
    source_type: str
    provider: str
    source_name: str
    
    @validator('source_type')
    def validate_source_type(cls, v):
        allowed_types = ["email", "sms"]
        if v not in allowed_types:
            raise ValueError(f'Source type must be one of: {", ".join(allowed_types)}')
        return v

class ParsedTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    source_id: Optional[str] = None  # Reference to AutoImportSource
    original_content: str  # Raw SMS/Email content
    parsed_data: Dict[str, Any]  # AI extracted data
    confidence_score: float = Field(ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionSuggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    parsed_transaction_id: str
    suggested_type: str  # "income" or "expense"
    suggested_amount: float
    suggested_category: str
    suggested_description: str
    suggested_source: Optional[str] = None  # For income: "freelance", "salary", "scholarship", "investment", "part_time"
    confidence_score: float = Field(ge=0.0, le=1.0)
    status: str = "pending"  # "pending", "approved", "rejected"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ["pending", "approved", "rejected"]
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v
        
    @validator('suggested_type')
    def validate_suggested_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('Suggested type must be either "income" or "expense"')
        return v

class TransactionSuggestionCreate(BaseModel):
    parsed_transaction_id: str
    suggested_type: str
    suggested_amount: float
    suggested_category: str
    suggested_description: str
    suggested_source: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0)
    
    @validator('suggested_type')
    def validate_suggested_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('Suggested type must be either "income" or "expense"')
        return v

class LearningFeedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    suggestion_id: str
    original_suggestion: Dict[str, Any]  # Original AI suggestion
    user_correction: Dict[str, Any]  # User's correction
    feedback_type: str  # "correction", "approval", "rejection"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('feedback_type')
    def validate_feedback_type(cls, v):
        allowed_types = ["correction", "approval", "rejection"]
        if v not in allowed_types:
            raise ValueError(f'Feedback type must be one of: {", ".join(allowed_types)}')
        return v

class LearningFeedbackCreate(BaseModel):
    suggestion_id: str
    original_suggestion: Dict[str, Any]
    user_correction: Dict[str, Any]
    feedback_type: str
    
    @validator('feedback_type')
    def validate_feedback_type(cls, v):
        allowed_types = ["correction", "approval", "rejection"]
        if v not in allowed_types:
            raise ValueError(f'Feedback type must be one of: {", ".join(allowed_types)}')
        return v

class ContentParseRequest(BaseModel):
    content: str
    content_type: str  # "sms", "email"
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = ["sms", "email"]
        if v not in allowed_types:
            raise ValueError(f'Content type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('content')
    def validate_content(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError('Content must be at least 10 characters long')
        if len(v) > 5000:
            raise ValueError('Content cannot exceed 5000 characters')
        return v.strip()

class SuggestionApprovalRequest(BaseModel):
    suggestion_id: str
    approved: bool
    corrections: Optional[Dict[str, Any]] = None  # If user wants to modify before approving

# ===================================
# VIRAL FEATURES MODELS
# ===================================

# Referral System Models
class Referral(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referrer_id: str  # User who made the referral
    referee_id: Optional[str] = None  # User who was referred (filled when they register)
    referral_code: str  # Unique referral code
    status: str = "pending"  # "pending", "completed", "expired"
    coins_earned: int = 0  # EarnCoins earned from this referral
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    referee_email: Optional[str] = None  # Track who was invited
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ["pending", "completed", "expired"]
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v

class ReferralCreate(BaseModel):
    referee_email: str

# Achievement System Models
class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_hi: str  # Hindi name
    name_ta: str  # Tamil name
    description: str
    description_hi: str  # Hindi description
    description_ta: str  # Tamil description
    badge_icon: str  # Icon name or emoji
    badge_color: str  # Color code
    category: str  # "savings", "earning", "streak", "social", "cultural"
    points_required: int = 0  # Points needed to unlock
    is_active: bool = True
    difficulty: str = "easy"  # "easy", "medium", "hard", "legendary"
    
    @validator('category')
    def validate_category(cls, v):
        allowed_categories = ["savings", "earning", "streak", "social", "cultural", "learning"]
        if v not in allowed_categories:
            raise ValueError(f'Category must be one of: {", ".join(allowed_categories)}')
        return v
    
    @validator('difficulty')
    def validate_difficulty(cls, v):
        allowed_difficulties = ["easy", "medium", "hard", "legendary"]
        if v not in allowed_difficulties:
            raise ValueError(f'Difficulty must be one of: {", ".join(allowed_difficulties)}')
        return v

class UserAchievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    achievement_id: str
    earned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    progress: float = 100.0  # Percentage completed
    is_claimed: bool = False
    claimed_at: Optional[datetime] = None

class UserAchievementCreate(BaseModel):
    achievement_id: str
    progress: float = 100.0

# EarnCoins System Models  
class EarnCoinsTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "earned", "spent", "bonus"
    amount: int  # Number of coins
    source: str  # "referral", "achievement", "daily_checkin", "challenge", "purchase"
    description: str
    description_hi: str
    description_ta: str
    reference_id: Optional[str] = None  # ID of related achievement, referral, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('type')
    def validate_type(cls, v):
        allowed_types = ["earned", "spent", "bonus"]
        if v not in allowed_types:
            raise ValueError(f'Type must be one of: {", ".join(allowed_types)}')
        return v

class EarnCoinsTransactionCreate(BaseModel):
    type: str
    amount: int
    source: str
    description: str
    description_hi: str
    description_ta: str
    reference_id: Optional[str] = None

# Daily Streak System
class UserStreak(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    streak_type: str  # "daily_login", "expense_logging", "saving_goal"
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[datetime] = None
    total_activities: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('streak_type')
    def validate_streak_type(cls, v):
        allowed_types = ["daily_login", "expense_logging", "saving_goal", "hustle_application"]
        if v not in allowed_types:
            raise ValueError(f'Streak type must be one of: {", ".join(allowed_types)}')
        return v

# Language Preference Model
class UserLanguagePreference(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    language_code: str  # "en", "hi", "ta"
    language_name: str  # "English", "Hindi", "Tamil"
    is_primary: bool = True
    set_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('language_code')
    def validate_language_code(cls, v):
        allowed_languages = ["en", "hi", "ta"]
        if v not in allowed_languages:
            raise ValueError(f'Language code must be one of: {", ".join(allowed_languages)}')
        return v

class UserLanguagePreferenceCreate(BaseModel):
    language_code: str
    
    @validator('language_code')
    def validate_language_code(cls, v):
        allowed_languages = ["en", "hi", "ta"]
        if v not in allowed_languages:
            raise ValueError(f'Language code must be one of: {", ".join(allowed_languages)}')
        return v

# Festival & Cultural Models
class Festival(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_hi: str
    name_ta: str
    description: str
    description_hi: str
    description_ta: str
    date: datetime
    festival_type: str  # "national", "regional", "religious", "modern"
    region: Optional[str] = None  # "all", "north", "south", "east", "west"
    typical_expenses: List[str] = []  # Common expense categories for this festival
    budget_suggestions: Dict[str, int] = {}  # Suggested amounts for different categories
    is_active: bool = True
    icon: str = "🎉"
    
    @validator('festival_type')
    def validate_festival_type(cls, v):
        allowed_types = ["national", "regional", "religious", "modern"]
        if v not in allowed_types:
            raise ValueError(f'Festival type must be one of: {", ".join(allowed_types)}')
        return v

class UserFestivalBudget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    festival_id: str
    total_budget: float
    allocated_budgets: Dict[str, float] = {}  # Category-wise allocation
    spent_amounts: Dict[str, float] = {}  # Category-wise spending
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserFestivalBudgetCreate(BaseModel):
    festival_id: str
    total_budget: float
    allocated_budgets: Dict[str, float] = {}

# Challenge System Models
class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_hi: str
    name_ta: str
    description: str
    description_hi: str
    description_ta: str
    challenge_type: str  # "saving", "earning", "streak", "social"
    target_value: float  # Target amount or count
    target_unit: str  # "rupees", "days", "transactions", "referrals"
    duration_days: int
    reward_coins: int
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    difficulty: str = "medium"
    icon: str = "🎯"
    
    @validator('challenge_type')
    def validate_challenge_type(cls, v):
        allowed_types = ["saving", "earning", "streak", "social", "cultural"]
        if v not in allowed_types:
            raise ValueError(f'Challenge type must be one of: {", ".join(allowed_types)}')
        return v

class UserChallenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    challenge_id: str
    current_progress: float = 0.0
    status: str = "active"  # "active", "completed", "failed", "abandoned"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    reward_claimed: bool = False
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ["active", "completed", "failed", "abandoned"]
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v

class UserChallengeCreate(BaseModel):
    challenge_id: str

# ===================================
# INTERCONNECTED ACTIVITY SYSTEM MODELS
# ===================================

class ActivityEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_type: str  # "referral_milestone", "achievement_unlocked", "challenge_completed", "festival_participated"
    event_category: str  # "referral", "achievement", "challenge", "festival"
    title: str
    description: str
    metadata: Dict[str, Any] = {}  # Additional event data
    related_entities: Dict[str, str] = {}  # Related IDs (achievement_id, challenge_id, etc.)
    points_awarded: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_cross_section_event: bool = False  # Events that affect multiple sections
    
    @validator('event_type')
    def validate_event_type(cls, v):
        allowed_types = [
            "referral_milestone", "referral_success", "achievement_unlocked", 
            "challenge_completed", "challenge_joined", "festival_participated", 
            "festival_budget_created", "points_awarded", "streak_milestone"
        ]
        if v not in allowed_types:
            raise ValueError(f'Event type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('event_category')
    def validate_event_category(cls, v):
        allowed_categories = ["referral", "achievement", "challenge", "festival", "general"]
        if v not in allowed_categories:
            raise ValueError(f'Event category must be one of: {", ".join(allowed_categories)}')
        return v

class CrossSectionUpdate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    trigger_section: str  # Section that triggered the update
    affected_sections: List[str] = []  # Sections that should be updated
    update_type: str  # "stats_update", "new_achievement", "progress_update", "milestone_reached"
    update_data: Dict[str, Any] = {}  # Data for the update
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed: bool = False

class NotificationMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "achievement", "referral", "challenge", "festival", "cross_section"
    title: str
    message: str
    icon: str = "🎉"
    color: str = "emerald"  # Notification color theme
    action_url: Optional[str] = None  # Deep link to relevant section
    metadata: Dict[str, Any] = {}
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None

class UnifiedStats(BaseModel):
    user_id: str
    total_achievements: int = 0
    total_referrals: int = 0
    active_challenges: int = 0
    festival_participations: int = 0
    total_points: int = 0
    current_streak: int = 0
    level: int = 1
    next_level_points: int = 1000
    cross_section_completions: int = 0  # Events that span multiple sections
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
