import requests
import sys
import json
from datetime import datetime
import time

class MoneyMojoAPITester:
    def __init__(self, base_url="https://moneymojo.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{int(time.time())}@example.com"
        self.test_password = "TestPass123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
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
        """Test user registration"""
        user_data = {
            "email": self.test_user_email,
            "password": self.test_password,
            "full_name": "Test User",
            "student_level": "undergraduate",
            "skills": ["Python", "Writing", "Math"],
            "availability_hours": 15
        }
        
        success, response = self.run_test(
            "User Registration",
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
        """Test updating user profile"""
        update_data = {
            "full_name": "Updated Test User",
            "skills": ["Python", "JavaScript", "Data Analysis"],
            "availability_hours": 20
        }
        
        success, response = self.run_test(
            "Update User Profile",
            "PUT",
            "user/profile",
            200,
            data=update_data
        )
        return success

    def test_create_income_transaction(self):
        """Test creating an income transaction"""
        transaction_data = {
            "type": "income",
            "amount": 150.00,
            "category": "Freelance",
            "description": "Web development project",
            "source": "freelance",
            "is_hustle_related": True
        }
        
        success, response = self.run_test(
            "Create Income Transaction",
            "POST",
            "transactions",
            200,
            data=transaction_data
        )
        return success, response.get('id') if success else None

    def test_create_expense_transaction(self):
        """Test creating an expense transaction"""
        transaction_data = {
            "type": "expense",
            "amount": 25.50,
            "category": "Food",
            "description": "Lunch at campus cafeteria",
            "is_hustle_related": False
        }
        
        success, response = self.run_test(
            "Create Expense Transaction",
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
        """Test creating a budget"""
        budget_data = {
            "category": "Food",
            "allocated_amount": 300.00,
            "month": "2024-12"
        }
        
        success, response = self.run_test(
            "Create Budget",
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
        """Test getting AI hustle recommendations"""
        print("   Note: This may take a few seconds for AI processing...")
        success, response = self.run_test(
            "Get Hustle Recommendations",
            "GET",
            "hustles/recommendations",
            200
        )
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
        """Test getting financial insights"""
        print("   Note: This may take a few seconds for AI processing...")
        success, response = self.run_test(
            "Get Analytics Insights",
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
    print("🚀 Starting MoneyMojo API Testing...")
    print("=" * 50)
    
    tester = MoneyMojoAPITester()
    
    # Test Authentication Flow
    print("\n📝 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_user_registration():
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Test profile operations
    print("\n👤 USER PROFILE TESTS")
    print("-" * 30)
    
    tester.test_get_user_profile()
    tester.test_update_user_profile()
    
    # Test transaction operations
    print("\n💰 TRANSACTION TESTS")
    print("-" * 30)
    
    income_success, income_id = tester.test_create_income_transaction()
    expense_success, expense_id = tester.test_create_expense_transaction()
    tester.test_get_transactions()
    tester.test_get_transaction_summary()
    
    # Test budget operations
    print("\n📊 BUDGET TESTS")
    print("-" * 30)
    
    tester.test_create_budget()
    tester.test_get_budgets()
    
    # Test hustle features
    print("\n🚀 HUSTLE TESTS")
    print("-" * 30)
    
    tester.test_get_hustle_categories()
    tester.test_get_hustle_recommendations()
    
    # Test analytics features
    print("\n📈 ANALYTICS TESTS")
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
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())