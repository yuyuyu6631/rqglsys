import requests
import json

BASE_URL = "http://127.0.0.1:5010"

def test_api():
    print(f"Testing API at {BASE_URL}...")
    
    # Create a session to persist cookies
    session = requests.Session()
    
    # 1. Test Login
    login_url = f"{BASE_URL}/api/auth/login"
    payload = {
        "username": "admin",
        "password": "123456"
    }
    
    print(f"\n[1] Attempting Login to {login_url} (Admin)...")
    try:
        response = session.post(login_url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print("Admin Login Failed!")
            return
            
        print("Admin Login Successful! Session cookie established.")
        
    except Exception as e:
        print(f"Login Exception: {e}")
        return

    # 1.5 Test Non-Admin Login (station01)
    # We must use a new session or logout first, otherwise we are still admin.
    # Let's try a fresh session for non-admin
    session_station = requests.Session()
    payload_station = {
        "username": "station01",
        "password": "123456" # Updated to new standard password
    }
    print(f"\n[1.5] Attempting Login to {login_url} (Station)...")
    try:
        response = session_station.post(login_url, json=payload_station)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
             print("Station Login Successful!")
        else:
             print(f"Station Login Failed! Response: {response.text}")
    except Exception as e:
        print(f"Station Login Exception: {e}")


    # 2. Test Get Data (e.g., Users or Orders)
    # Using endpoints that require login
    target_endpoints = ["/api/api/users", "/api/api/orders"] 
    # Note: verify correct prefix. app/__init__.py regs auth at /api/auth and api at /api
    # so users would be /api/users not /api/api/users.
    # Let's check __init__.py again.
    # app.register_blueprint(api_bp, url_prefix='/api')
    # So if api_bp has /users, then it is /api/users.
    # Let's try /api/users first.
    
    target_endpoints = ["/api/users", "/api/orders"]
    
    for endpoint in target_endpoints:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n[2] Fetching {url}...")
        try:
            # Session automatically handles cookies
            res = session.get(url) 
            print(f"Status Code: {res.status_code}")
            if res.status_code == 200:
                json_data = res.json()
                if isinstance(json_data, list):
                    print(f"Success! Got {len(json_data)} items.")
                    # Show first item as sample
                    if json_data:
                        print(f"Sample: {json_data[0]}")
                elif isinstance(json_data, dict):
                     items = json_data.get('items', json_data.get('data', []))
                     print(f"Success! Got {len(items)} items (from paginated/wrapped response).")
                else:
                    print(f"Success! Response: {json_data}")
            else:
                print(f"Failed: {res.text}")
        except Exception as e:
            print(f"Request Exception: {e}")

if __name__ == "__main__":
    test_api()
