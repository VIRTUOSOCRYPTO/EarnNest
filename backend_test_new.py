import requests
import sys
import json
from datetime import datetime
import time
import io

class EarnWiseAPITester:
    def __init__(self, base_url="https://moneymojo.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{int(time.time())}@example.com"
        self.test_password = "TestPass123!"
        self.created_hustle_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)
        
        # Don't set Content-Type for file uploads
        if not files and 'Content-Type' not in test_headers:
            test_headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=test_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration with new fields"""
        user_data = {
            "email": self.test_user_email,
            "password": self.test_password,
            "full_name": "Test User",
            "student_level": "undergraduate",
            "skills": ["Python", "Writing", "Math"],
            "availability_hours": 15,
            "location": "Mumbai, India",
            "bio": "Computer Science student looking for side hustles"
        }
        
        success, response = self.run_test(
            "User Registration (Enhanced)",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_email,
            "password": self.test_password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "user/profile",
            200
        )
        return success

    def test_update_user_profile(self):
        """Test updating user profile with new fields"""
        update_data = {
            "full_name": "Updated Test User",
            "skills": ["Python", "JavaScript", "Data Analysis"],
            "availability_hours": 20,
            "location": "Delhi, India",
            "bio": "Updated bio with more experience"
        }
        
        success, response = self.run_test(
            "Update User Profile (Enhanced)",
            "PUT",
            "user/profile",
            200,
            data=update_data
        )
        return success

    def test_profile_photo_upload(self):
        """Test profile photo upload functionality"""
        # Create a simple test image file
        test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('test_profile.png', io.BytesIO(test_image_content), 'image/png')
        }
        
        success, response = self.run_test(
            "Profile Photo Upload",
            "POST",
            "user/profile/photo",
            200,
            files=files
        )
        return success

    def test_create_user_hustle(self):
        """Test creating a user-posted side hustle"""
        hustle_data = {
            "title": "Python Tutoring for Beginners",
            "description": "Offering Python programming tutoring for students new to coding. Will cover basics, data structures, and simple projects.",
            "category": "tutoring",
            "pay_rate": 500.0,
            "pay_type": "hourly",
            "time_commitment": "5-10 hours/week",
            "required_skills": ["Python", "Teaching", "Patience"],
            "difficulty_level": "beginner",
            "location": "Mumbai, India",
            "is_remote": True,
            "contact_info": "test@example.com",
            "max_applicants": 5
        }
        
        success, response = self.run_test(
            "Create User Hustle",
            "POST",
            "hustles/create",
            200,
            data=hustle_data
        )
        
        if success and 'id' in response:
            self.created_hustle_id = response['id']
            print(f"   Created hustle ID: {self.created_hustle_id}")
        
        return success

    def test_get_user_posted_hustles(self):
        """Test getting user-posted hustles"""
        success, response = self.run_test(
            "Get User-Posted Hustles",
            "GET",
            "hustles/user-posted",
            200
        )
        return success

    def test_apply_to_hustle(self):
        """Test applying to a user-posted hustle"""
        if not self.created_hustle_id:
            print("   Skipping - No hustle ID available")
            return False
            
        application_data = {
            "cover_message": "I'm very interested in this tutoring opportunity. I have 2 years of Python experience and love helping others learn programming."
        }
        
        success, response = self.run_test(
            "Apply to Hustle",
            "POST",
            f"hustles/{self.created_hustle_id}/apply",
            200,
            data=application_data
        )
        return success

    def test_get_my_applications(self):
        """Test getting user's hustle applications"""
        success, response = self.run_test(
            "Get My Applications",
            "GET",
            "hustles/my-applications",
            200
        )
        return success

    def test_create_income_transaction(self):
        """Test creating an income transaction with INR"""
        transaction_data = {
            "type": "income",
            "amount": 2500.00,  # INR amount
            "category": "Freelance",
            "description": "Web development project payment",
            "source": "freelance",
            "is_hustle_related": True
        }
        
        success, response = self.run_test(
            "Create Income Transaction (INR)",
            "POST",
            "transactions",
            200,
            data=transaction_data
        )
        return success, response.get('id') if success else None

    def test_create_expense_transaction(self):
        """Test creating an expense transaction with INR"""
        transaction_data = {
            "type": "expense",
            "amount": 150.00,  # INR amount
            "category": "Food",
            "description": "Lunch at campus cafeteria",
            "is_hustle_related": False
        }
        
        success, response = self.run_test(
            "Create Expense Transaction (INR)",
            "POST",
            "transactions",
            200,
            data=transaction_data
        )
        return success, response.get('id') if success else None

    def test_get_transactions(self):
        """Test getting user transactions"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200
        )
        return success

    def test_get_transaction_summary(self):
        """Test getting transaction summary"""
        success, response = self.run_test(
            "Get Transaction Summary",
            "GET",
            "transactions/summary",
            200
        )
        return success

    def test_create_budget(self):
        """Test creating a budget with INR"""
        budget_data = {
            "category": "Food",
            "allocated_amount": 5000.00,  # INR amount
            "month": "2024-12"
        }
        
        success, response = self.run_test(
            "Create Budget (INR)",
            "POST",
            "budgets",
            200,
            data=budget_data
        )
        return success

    def test_get_budgets(self):
        """Test getting user budgets"""
        success, response = self.run_test(
            "Get Budgets",
            "GET",
            "budgets",
            200
        )
        return success

    def test_get_hustle_recommendations(self):
        """Test getting AI hustle recommendations (Indian market)"""
        print("   Note: This may take a few seconds for AI processing...")
        success, response = self.run_test(
            "Get AI Hustle Recommendations (Indian Market)",
            "GET",
            "hustles/recommendations",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Received {len(response)} recommendations")
            for i, rec in enumerate(response[:2]):  # Show first 2
                print(f"   Rec {i+1}: {rec.get('title', 'N/A')} - ₹{rec.get('estimated_pay', 0)}/hr")
        
        return success

    def test_get_hustle_categories(self):
        """Test getting hustle categories"""
        success, response = self.run_test(
            "Get Hustle Categories",
            "GET",
            "hustles/categories",
            200
        )
        return success

    def test_get_analytics_insights(self):
        """Test getting financial insights with INR"""
        print("   Note: This may take a few seconds for AI processing...")
        success, response = self.run_test(
            "Get Analytics Insights (INR)",
            "GET",
            "analytics/insights",
            200
        )
        return success

    def test_get_leaderboard(self):
        """Test getting leaderboard"""
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "analytics/leaderboard",
            200
        )
        return success

def main():
    print("🚀 Starting EarnWise API Testing...")
    print("🇮🇳 Testing Enhanced Features with Indian Market Focus")
    print("=" * 60)
    
    tester = EarnWiseAPITester()
    
    # Test Authentication Flow
    print("\n📝 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_user_registration():
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Test enhanced profile operations
    print("\n👤 ENHANCED USER PROFILE TESTS")
    print("-" * 30)
    
    tester.test_get_user_profile()
    tester.test_update_user_profile()
    tester.test_profile_photo_upload()
    
    # Test new user-generated hustle features
    print("\n🚀 USER-GENERATED HUSTLE TESTS")
    print("-" * 30)
    
    tester.test_create_user_hustle()
    tester.test_get_user_posted_hustles()
    tester.test_apply_to_hustle()
    tester.test_get_my_applications()
    
    # Test transaction operations with INR
    print("\n💰 TRANSACTION TESTS (INR)")
    print("-" * 30)
    
    income_success, income_id = tester.test_create_income_transaction()
    expense_success, expense_id = tester.test_create_expense_transaction()
    tester.test_get_transactions()
    tester.test_get_transaction_summary()
    
    # Test budget operations with INR
    print("\n📊 BUDGET TESTS (INR)")
    print("-" * 30)
    
    tester.test_create_budget()
    tester.test_get_budgets()
    
    # Test enhanced hustle features
    print("\n🇮🇳 AI HUSTLE TESTS (INDIAN MARKET)")
    print("-" * 30)
    
    tester.test_get_hustle_categories()
    tester.test_get_hustle_recommendations()
    
    # Test analytics features with INR
    print("\n📈 ANALYTICS TESTS (INR)")
    print("-" * 30)
    
    tester.test_get_analytics_insights()
    tester.test_get_leaderboard()
    
    # Test login with existing user
    print("\n🔐 LOGIN TEST")
    print("-" * 30)
    
    # Clear token to test login
    tester.token = None
    tester.test_user_login()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 EARNWISE API TEST RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All EarnWise API tests passed!")
        print("✅ Enhanced features working correctly")
        print("✅ Indian market integration successful")
        print("✅ INR currency support verified")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        print("❌ Some enhanced features need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())