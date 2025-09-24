from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from typing import List, Optional, Dict, Any
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
    location: Optional[LocationInfo] = None
    is_remote: bool = True
    contact_info: ContactInfo
    application_deadline: Optional[datetime] = None
    max_applicants: Optional[int] = None

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
    location: Optional[LocationInfo] = None
    is_remote: Optional[bool] = None
    contact_info: Optional[ContactInfo] = None
    application_deadline: Optional[datetime] = None
    max_applicants: Optional[int] = None
    status: Optional[str] = None

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
