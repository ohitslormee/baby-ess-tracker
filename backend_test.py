#!/usr/bin/env python3
"""
Backend API Testing for Baby ERP System
Tests all API endpoints with comprehensive coverage
"""

import requests
import sys
import json
from datetime import datetime
import time

class BabyERPAPITester:
    def __init__(self, base_url="https://littlelife-plan.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = []  # Track created items for cleanup

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return self.log_test(name, True, f"Status: {response.status_code}"), response_data
                except:
                    return self.log_test(name, True, f"Status: {response.status_code}"), {}
            else:
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}"), {}

        except requests.exceptions.RequestException as e:
            return self.log_test(name, False, f"Request error: {str(e)}"), {}
        except Exception as e:
            return self.log_test(name, False, f"Unexpected error: {str(e)}"), {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_product_lookup(self):
        """Test product lookup endpoint"""
        test_barcode = "123456789"
        return self.run_test("Product Lookup", "POST", f"products/lookup/{test_barcode}", 200)

    def test_get_inventory_empty(self):
        """Test getting inventory when empty"""
        return self.run_test("Get Inventory (Empty)", "GET", "inventory", 200)

    def test_get_low_stock_empty(self):
        """Test getting low stock items when empty"""
        return self.run_test("Get Low Stock (Empty)", "GET", "inventory/low-stock", 200)

    def test_create_inventory_item(self):
        """Test creating a new inventory item"""
        test_item = {
            "barcode": "1234567890123",
            "name": "Test Baby Diapers",
            "category": "Diapers",
            "current_stock": 10,
            "min_stock_alert": 3,
            "unit_type": "pieces",
            "brand": "Test Brand",
            "size": "Medium"
        }
        
        success, response_data = self.run_test("Create Inventory Item", "POST", "inventory", 200, test_item)
        if success and 'id' in response_data:
            self.created_items.append(response_data['id'])
            print(f"   Created item ID: {response_data['id']}")
        return success, response_data

    def test_create_duplicate_item(self):
        """Test creating duplicate item (should fail)"""
        test_item = {
            "barcode": "1234567890123",  # Same barcode as previous test
            "name": "Duplicate Test Item",
            "category": "Other"
        }
        
        return self.run_test("Create Duplicate Item", "POST", "inventory", 400, test_item)

    def test_get_inventory_with_items(self):
        """Test getting inventory after creating items"""
        return self.run_test("Get Inventory (With Items)", "GET", "inventory", 200)

    def test_get_inventory_by_id(self):
        """Test getting specific inventory item by ID"""
        if not self.created_items:
            return self.log_test("Get Inventory by ID", False, "No items created to test with"), {}
        
        item_id = self.created_items[0]
        return self.run_test("Get Inventory by ID", "GET", f"inventory/{item_id}", 200)

    def test_get_inventory_by_barcode(self):
        """Test getting inventory item by barcode"""
        test_barcode = "1234567890123"
        return self.run_test("Get Inventory by Barcode", "GET", f"inventory/barcode/{test_barcode}", 200)

    def test_add_stock(self):
        """Test adding stock to an item"""
        if not self.created_items:
            return self.log_test("Add Stock", False, "No items created to test with"), {}
        
        item_id = self.created_items[0]
        return self.run_test("Add Stock", "POST", f"inventory/{item_id}/add-stock", 200, params={"quantity": 5})

    def test_use_item(self):
        """Test using/consuming an item"""
        if not self.created_items:
            return self.log_test("Use Item", False, "No items created to test with"), {}
        
        item_id = self.created_items[0]
        usage_data = {
            "item_id": item_id,
            "barcode": "1234567890123",
            "quantity_used": 2,
            "notes": "Test usage"
        }
        
        return self.run_test("Use Item", "POST", f"inventory/{item_id}/use", 200, usage_data)

    def test_update_inventory_item(self):
        """Test updating an inventory item"""
        if not self.created_items:
            return self.log_test("Update Inventory Item", False, "No items created to test with"), {}
        
        item_id = self.created_items[0]
        update_data = {
            "name": "Updated Test Baby Diapers",
            "brand": "Updated Brand",
            "min_stock_alert": 5
        }
        
        return self.run_test("Update Inventory Item", "PUT", f"inventory/{item_id}", 200, update_data)

    def test_get_usage_logs(self):
        """Test getting usage logs"""
        return self.run_test("Get Usage Logs", "GET", "usage-logs", 200, params={"limit": 10})

    def test_get_low_stock_with_items(self):
        """Test getting low stock items after creating and using items"""
        return self.run_test("Get Low Stock (With Items)", "GET", "inventory/low-stock", 200)

    def test_dashboard_stats_with_data(self):
        """Test dashboard stats after creating items"""
        return self.run_test("Dashboard Stats (With Data)", "GET", "dashboard/stats", 200)

    def test_get_children_empty(self):
        """Test getting children when empty"""
        return self.run_test("Get Children (Empty)", "GET", "children", 200)

    def test_create_child(self):
        """Test creating a new child record"""
        test_child = {
            "name": "Emma Johnson",
            "date_of_birth": "2023-03-15",
            "gender": "Girl",
            "height": 75.5,
            "weight": 9.2,
            "notes": "First child, loves music"
        }
        
        success, response_data = self.run_test("Create Child", "POST", "children", 200, test_child)
        if success and 'id' in response_data:
            self.created_children = getattr(self, 'created_children', [])
            self.created_children.append(response_data['id'])
            print(f"   Created child ID: {response_data['id']}")
        return success, response_data

    def test_create_minimal_child(self):
        """Test creating child with minimal required fields"""
        test_child = {
            "name": "Alex Smith",
            "date_of_birth": "2022-08-20"
        }
        
        success, response_data = self.run_test("Create Minimal Child", "POST", "children", 200, test_child)
        if success and 'id' in response_data:
            self.created_children = getattr(self, 'created_children', [])
            self.created_children.append(response_data['id'])
            print(f"   Created child ID: {response_data['id']}")
        return success, response_data

    def test_get_children_with_data(self):
        """Test getting children after creating some"""
        return self.run_test("Get Children (With Data)", "GET", "children", 200)

    def test_get_child_by_id(self):
        """Test getting specific child by ID"""
        if not hasattr(self, 'created_children') or not self.created_children:
            return self.log_test("Get Child by ID", False, "No children created to test with"), {}
        
        child_id = self.created_children[0]
        return self.run_test("Get Child by ID", "GET", f"children/{child_id}", 200)

    def test_update_child(self):
        """Test updating a child record"""
        if not hasattr(self, 'created_children') or not self.created_children:
            return self.log_test("Update Child", False, "No children created to test with"), {}
        
        child_id = self.created_children[0]
        update_data = {
            "name": "Emma Johnson Updated",
            "height": 80.0,
            "weight": 10.5,
            "notes": "Updated notes - growing well!"
        }
        
        return self.run_test("Update Child", "PUT", f"children/{child_id}", 200, update_data)

    def test_delete_child(self):
        """Test deleting a child record"""
        if not hasattr(self, 'created_children') or not self.created_children:
            return self.log_test("Delete Child", False, "No children created to test with"), {}
        
        # Delete the last created child
        child_id = self.created_children.pop()
        return self.run_test("Delete Child", "DELETE", f"children/{child_id}", 200)

    def test_error_cases(self):
        """Test various error cases"""
        print("\n🔍 Testing Error Cases...")
        
        # Inventory error cases
        self.run_test("Get Non-existent Item", "GET", "inventory/non-existent-id", 404)
        self.run_test("Get Non-existent Barcode", "GET", "inventory/barcode/999999999", 404)
        self.run_test("Add Stock to Non-existent Item", "POST", "inventory/non-existent-id/add-stock", 404, params={"quantity": 1})
        
        usage_data = {
            "item_id": "non-existent-id",
            "barcode": "999999999",
            "quantity_used": 1
        }
        self.run_test("Use Non-existent Item", "POST", "inventory/non-existent-id/use", 404, usage_data)
        
        # Children error cases
        self.run_test("Get Non-existent Child", "GET", "children/non-existent-id", 404)
        self.run_test("Update Non-existent Child", "PUT", "children/non-existent-id", 404, {"name": "Test"})
        self.run_test("Delete Non-existent Child", "DELETE", "children/non-existent-id", 404)

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting Baby ERP API Comprehensive Testing")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n📡 CONNECTIVITY TESTS")
        self.test_root_endpoint()
        
        # Initial state tests
        print("\n📊 INITIAL STATE TESTS")
        self.test_dashboard_stats()
        self.test_get_inventory_empty()
        self.test_get_low_stock_empty()
        
        # Product lookup tests
        print("\n🔍 PRODUCT LOOKUP TESTS")
        self.test_product_lookup()
        
        # CRUD operations
        print("\n📝 CRUD OPERATION TESTS")
        success, item_data = self.test_create_inventory_item()
        if success:
            self.test_create_duplicate_item()
            self.test_get_inventory_with_items()
            self.test_get_inventory_by_id()
            self.test_get_inventory_by_barcode()
            
            # Stock management tests
            print("\n📦 STOCK MANAGEMENT TESTS")
            self.test_add_stock()
            self.test_use_item()
            self.test_update_inventory_item()
            
            # Analytics tests
            print("\n📈 ANALYTICS TESTS")
            self.test_get_usage_logs()
            self.test_get_low_stock_with_items()
            self.test_dashboard_stats_with_data()
        
        # Error handling tests
        print("\n❌ ERROR HANDLING TESTS")
        self.test_error_cases()
        
        # Final results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.created_items:
            print(f"\n📝 Created Items: {len(self.created_items)}")
            for item_id in self.created_items:
                print(f"   - {item_id}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    print("Baby ERP API Testing Suite")
    print("Testing against: https://littlelife-plan.preview.emergentagent.com")
    print("Starting tests in 2 seconds...")
    time.sleep(2)
    
    tester = BabyERPAPITester()
    
    try:
        success = tester.run_comprehensive_test()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())