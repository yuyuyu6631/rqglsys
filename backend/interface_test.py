import requests
import time

BASE_URL = "http://localhost:5010/api"

def test_gas_system_flow():
    session = requests.Session()
    
    print("--- 1. Admin Login ---")
    resp = session.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "123456"})
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    print("Admin login success")

    # Unique suffix for this run
    ts = int(time.time())
    cust_username = f"cust_{ts}"
    deliv_username = f"deliv_{ts}"
    cyl_serial = f"CYL_{ts}"

    print(f"--- 2. Create Customer: {cust_username} ---")
    resp = session.post(f"{BASE_URL}/users", json={
        "username": cust_username,
        "password": "password123",
        "role": "user",
        "real_name": "测试客户",
        "phone": "13800000001"
    })
    assert resp.status_code == 201, f"Create customer failed: {resp.text}"
    cust_id = resp.json()['id']
    print(f"Customer created, ID: {cust_id}")

    print(f"--- 3. Create Delivery Person: {deliv_username} ---")
    resp = session.post(f"{BASE_URL}/users", json={
        "username": deliv_username,
        "password": "password123",
        "role": "delivery",
        "real_name": "测试配送员",
        "phone": "13900000002"
    })
    assert resp.status_code == 201, f"Create delivery failed: {resp.text}"
    deliv_id = resp.json()['id']
    print(f"Delivery person created, ID: {deliv_id}")

    print(f"--- 4. Create Cylinder: {cyl_serial} ---")
    resp = session.post(f"{BASE_URL}/cylinders", json={
        "serial_code": cyl_serial,
        "specs": "15kg",
        "status": "in_stock",
        "manufacture_date": "2023-01-01",
        "expiry_date": "2030-01-01"
    })
    assert resp.status_code == 201, f"Create cylinder failed: {resp.text}"
    cyl_id = resp.json()['id']
    print(f"Cylinder created, ID: {cyl_id}")

    print("--- 5. Customer Login ---")
    cust_session = requests.Session()
    resp = cust_session.post(f"{BASE_URL}/auth/login", json={"username": cust_username, "password": "password123"})
    assert resp.status_code == 200, "Customer login failed"
    print("Customer login success")

    print("--- 6. Customer Places Order ---")
    resp = cust_session.post(f"{BASE_URL}/orders", json={
        "specs": "15kg",
        "quantity": 1,
        "address": "测试省测试市测试区某街123号",
        "contact_name": "测试人",
        "contact_phone": "13800000001"
    })
    assert resp.status_code == 201, f"Place order failed: {resp.text}"
    order = resp.json()
    order_id = order['id']
    print(f"Order placed, ID: {order_id}, No: {order['order_no']}")

    print("--- 7. Admin Assigns Order ---")
    resp = session.put(f"{BASE_URL}/orders/{order_id}/assign", json={"delivery_id": deliv_id})
    assert resp.status_code == 200, f"Assign order failed: {resp.text}"
    print("Order assigned to delivery person")

    print("--- 8. Delivery Person Login ---")
    deliv_session = requests.Session()
    resp = deliv_session.post(f"{BASE_URL}/auth/login", json={"username": deliv_username, "password": "password123"})
    assert resp.status_code == 200, "Delivery person login failed"
    print("Delivery person login success")

    print("--- 9. Delivery Starts ---")
    resp = deliv_session.put(f"{BASE_URL}/orders/{order_id}/status", json={"status": "delivering"})
    assert resp.status_code == 200, f"Update status to delivering failed: {resp.text}"
    print("Order status updated to 'delivering'")

    print("--- 10. Delivery Completes ---")
    resp = deliv_session.put(f"{BASE_URL}/orders/{order_id}/status", json={"status": "completed"})
    assert resp.status_code == 200, f"Update status to completed failed: {resp.text}"
    print("Order status updated to 'completed'")

    print("--- 11. Delivery Submits Safety Record ---")
    resp = deliv_session.post(f"{BASE_URL}/safety/records", json={
        "order_id": order_id,
        "hazard_level": "none",
        "check_items": "Valve: OK, Hose: OK",
        "hazard_description": "Everything looks good"
    })
    assert resp.status_code == 201, f"Submit safety record failed: {resp.text}"
    print("Safety record submitted")

    print("--- 12. Final Check (Admin Stats) ---")
    resp = session.get(f"{BASE_URL}/stats/dashboard")
    assert resp.status_code == 200
    stats = resp.json()
    print(f"Dashboard Stats: Pending Orders: {stats['pending_orders']}, Completed: {stats['completed_orders']}")
    
    print("\n[SUCCESS] Integration flow test completed successfully.")

if __name__ == "__main__":
    try:
        test_gas_system_flow()
    except Exception as e:
        print(f"\n[FAILED] Test aborted: {e}")
