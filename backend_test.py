#!/usr/bin/env python3
"""
Nirvana E-commerce Backend API Testing Script
Tests all backend endpoints systematically
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://nirvana-shop.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class APITester:
    def __init__(self):
        self.results = {
            "public_endpoints": {},
            "auth_endpoints": {},
            "admin_endpoints": {},
            "summary": {"passed": 0, "failed": 0, "skipped": 0}
        }
        
    def log_result(self, test_name: str, success: bool, message: str, category: str = "public_endpoints"):
        """Log test result"""
        self.results[category][test_name] = {
            "success": success,
            "message": message
        }
        
        if success:
            self.results["summary"]["passed"] += 1
            print(f"✅ {test_name}: {message}")
        else:
            self.results["summary"]["failed"] += 1
            print(f"❌ {test_name}: {message}")
    
    def skip_test(self, test_name: str, reason: str, category: str = "public_endpoints"):
        """Skip a test"""
        self.results[category][test_name] = {
            "success": None,
            "message": f"SKIPPED: {reason}"
        }
        self.results["summary"]["skipped"] += 1
        print(f"⏭️  {test_name}: SKIPPED - {reason}")
    
    def test_get_products(self):
        """Test GET /api/products - Should work without auth"""
        try:
            response = requests.get(f"{BASE_URL}/products", headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "products" in data:
                    product_count = len(data["products"])
                    self.log_result("GET /api/products", True, f"Retrieved {product_count} products successfully")
                    return data["products"]
                else:
                    self.log_result("GET /api/products", False, f"Invalid response format: {data}")
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                if "relation \"products\" does not exist" in response.text:
                    self.log_result("GET /api/products", False, "Database tables not created - run /app/lib/db-setup.sql in Supabase")
                else:
                    self.log_result("GET /api/products", False, error_msg)
                    
        except requests.exceptions.RequestException as e:
            self.log_result("GET /api/products", False, f"Request failed: {str(e)}")
        
        return []
    
    def test_get_single_product(self, products):
        """Test GET /api/products/:id - Should work without auth"""
        if not products:
            self.skip_test("GET /api/products/:id", "No products available to test")
            return
            
        try:
            # Use first product for testing
            product_id = products[0].get("id")
            if not product_id:
                self.log_result("GET /api/products/:id", False, "No product ID found in products")
                return
                
            response = requests.get(f"{BASE_URL}/products/{product_id}", headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "product" in data:
                    product_name = data["product"].get("name", "Unknown")
                    self.log_result("GET /api/products/:id", True, f"Retrieved product '{product_name}' successfully")
                else:
                    self.log_result("GET /api/products/:id", False, f"Invalid response format: {data}")
            else:
                self.log_result("GET /api/products/:id", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_result("GET /api/products/:id", False, f"Request failed: {str(e)}")
    
    def test_cart_endpoints_without_auth(self):
        """Test cart endpoints without authentication - Should fail with 401"""
        
        # Test GET /api/cart
        try:
            response = requests.get(f"{BASE_URL}/cart", headers=HEADERS, timeout=10)
            if response.status_code == 401:
                self.log_result("GET /api/cart (no auth)", True, "Correctly rejected unauthorized request", "auth_endpoints")
            else:
                self.log_result("GET /api/cart (no auth)", False, f"Expected 401, got {response.status_code}", "auth_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("GET /api/cart (no auth)", False, f"Request failed: {str(e)}", "auth_endpoints")
        
        # Test POST /api/cart
        try:
            test_data = {"productId": "test-id", "quantity": 1}
            response = requests.post(f"{BASE_URL}/cart", headers=HEADERS, json=test_data, timeout=10)
            if response.status_code == 401:
                self.log_result("POST /api/cart (no auth)", True, "Correctly rejected unauthorized request", "auth_endpoints")
            else:
                self.log_result("POST /api/cart (no auth)", False, f"Expected 401, got {response.status_code}", "auth_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("POST /api/cart (no auth)", False, f"Request failed: {str(e)}", "auth_endpoints")
    
    def test_orders_endpoints_without_auth(self):
        """Test orders endpoints without authentication - Should fail with 401"""
        
        # Test GET /api/orders
        try:
            response = requests.get(f"{BASE_URL}/orders", headers=HEADERS, timeout=10)
            if response.status_code == 401:
                self.log_result("GET /api/orders (no auth)", True, "Correctly rejected unauthorized request", "auth_endpoints")
            else:
                self.log_result("GET /api/orders (no auth)", False, f"Expected 401, got {response.status_code}", "auth_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("GET /api/orders (no auth)", False, f"Request failed: {str(e)}", "auth_endpoints")
        
        # Test POST /api/orders
        try:
            test_data = {
                "items": [],
                "shippingAddress": "Test Address",
                "phone": "1234567890",
                "userName": "Test User",
                "userEmail": "test@example.com"
            }
            response = requests.post(f"{BASE_URL}/orders", headers=HEADERS, json=test_data, timeout=10)
            if response.status_code == 401:
                self.log_result("POST /api/orders (no auth)", True, "Correctly rejected unauthorized request", "auth_endpoints")
            else:
                self.log_result("POST /api/orders (no auth)", False, f"Expected 401, got {response.status_code}", "auth_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("POST /api/orders (no auth)", False, f"Request failed: {str(e)}", "auth_endpoints")
    
    def test_admin_endpoints_without_auth(self):
        """Test admin endpoints without authentication - Should fail with 401"""
        
        # Test POST /api/products (admin only)
        try:
            test_data = {
                "name": "Test Product",
                "description": "Test Description",
                "price": 99.99,
                "image_url": "https://example.com/image.jpg",
                "category": "Test",
                "stock": 10
            }
            response = requests.post(f"{BASE_URL}/products", headers=HEADERS, json=test_data, timeout=10)
            if response.status_code == 401:
                self.log_result("POST /api/products (no auth)", True, "Correctly rejected unauthorized request", "admin_endpoints")
            else:
                self.log_result("POST /api/products (no auth)", False, f"Expected 401, got {response.status_code}", "admin_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("POST /api/products (no auth)", False, f"Request failed: {str(e)}", "admin_endpoints")
        
        # Test GET /api/admin/orders
        try:
            response = requests.get(f"{BASE_URL}/admin/orders", headers=HEADERS, timeout=10)
            if response.status_code == 401:
                self.log_result("GET /api/admin/orders (no auth)", True, "Correctly rejected unauthorized request", "admin_endpoints")
            else:
                self.log_result("GET /api/admin/orders (no auth)", False, f"Expected 401, got {response.status_code}", "admin_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("GET /api/admin/orders (no auth)", False, f"Request failed: {str(e)}", "admin_endpoints")
        
        # Test GET /api/admin/customers
        try:
            response = requests.get(f"{BASE_URL}/admin/customers", headers=HEADERS, timeout=10)
            if response.status_code == 401:
                self.log_result("GET /api/admin/customers (no auth)", True, "Correctly rejected unauthorized request", "admin_endpoints")
            else:
                self.log_result("GET /api/admin/customers (no auth)", False, f"Expected 401, got {response.status_code}", "admin_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("GET /api/admin/customers (no auth)", False, f"Request failed: {str(e)}", "admin_endpoints")
    
    def test_cart_crud_operations(self, products):
        """Test cart CRUD operations - These will fail without auth but test the endpoints"""
        if not products:
            self.skip_test("Cart CRUD operations", "No products available", "auth_endpoints")
            return
            
        product_id = products[0].get("id")
        
        # Test PATCH /api/cart/:id (update quantity)
        try:
            test_data = {"quantity": 2}
            response = requests.patch(f"{BASE_URL}/cart/test-cart-id", headers=HEADERS, json=test_data, timeout=10)
            if response.status_code == 401:
                self.log_result("PATCH /api/cart/:id (no auth)", True, "Correctly rejected unauthorized request", "auth_endpoints")
            else:
                self.log_result("PATCH /api/cart/:id (no auth)", False, f"Expected 401, got {response.status_code}", "auth_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("PATCH /api/cart/:id (no auth)", False, f"Request failed: {str(e)}", "auth_endpoints")
        
        # Test DELETE /api/cart/:id (remove from cart)
        try:
            response = requests.delete(f"{BASE_URL}/cart/test-cart-id", headers=HEADERS, timeout=10)
            if response.status_code == 401:
                self.log_result("DELETE /api/cart/:id (no auth)", True, "Correctly rejected unauthorized request", "auth_endpoints")
            else:
                self.log_result("DELETE /api/cart/:id (no auth)", False, f"Expected 401, got {response.status_code}", "auth_endpoints")
        except requests.exceptions.RequestException as e:
            self.log_result("DELETE /api/cart/:id (no auth)", False, f"Request failed: {str(e)}", "auth_endpoints")
    
    def test_invalid_routes(self):
        """Test invalid routes - Should return 404"""
        try:
            response = requests.get(f"{BASE_URL}/invalid-route", headers=HEADERS, timeout=10)
            if response.status_code == 404:
                self.log_result("Invalid route handling", True, "Correctly returned 404 for invalid route")
            else:
                self.log_result("Invalid route handling", False, f"Expected 404, got {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_result("Invalid route handling", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Nirvana E-commerce Backend API Tests")
        print(f"📍 Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Test public endpoints first
        print("\n📂 Testing Public Endpoints (No Auth Required)")
        print("-" * 40)
        products = self.test_get_products()
        self.test_get_single_product(products)
        self.test_invalid_routes()
        
        # Test authentication requirements
        print("\n🔐 Testing Authentication Requirements")
        print("-" * 40)
        self.test_cart_endpoints_without_auth()
        self.test_orders_endpoints_without_auth()
        self.test_cart_crud_operations(products)
        
        # Test admin authentication requirements
        print("\n👑 Testing Admin Authentication Requirements")
        print("-" * 40)
        self.test_admin_endpoints_without_auth()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['summary']['passed']}")
        print(f"❌ Failed: {self.results['summary']['failed']}")
        print(f"⏭️  Skipped: {self.results['summary']['skipped']}")
        
        # Print detailed results
        print("\n📋 DETAILED RESULTS")
        print("-" * 60)
        
        for category, tests in self.results.items():
            if category == "summary":
                continue
                
            print(f"\n{category.replace('_', ' ').title()}:")
            for test_name, result in tests.items():
                status = "✅" if result["success"] else "❌" if result["success"] is False else "⏭️"
                print(f"  {status} {test_name}: {result['message']}")
        
        # Return overall success
        return self.results["summary"]["failed"] == 0

def main():
    """Main function"""
    tester = APITester()
    success = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL TESTS PASSED! Backend APIs are working correctly.")
    else:
        print("⚠️  SOME TESTS FAILED. Check the details above.")
        
    print("\n📝 IMPORTANT NOTES:")
    print("- If you see 'Database tables not created' errors, run the SQL from /app/lib/db-setup.sql in Supabase")
    print("- Authentication tests verify that endpoints correctly reject unauthorized requests")
    print("- To test authenticated endpoints, you need valid Clerk session tokens")
    print("- Admin endpoints require 'admin' role in Clerk user metadata")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())