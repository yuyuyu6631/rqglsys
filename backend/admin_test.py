import requests
import time

BASE_URL = "http://localhost:5010/api"

def test_admin_features():
    session = requests.Session()
    session.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "123456"})
    
    print("--- Admin: Create Announcement ---")
    ts = int(time.time())
    title = f"安全通知 {ts}"
    resp = session.post(f"{BASE_URL}/announcements", json={
        "title": title,
        "content": "冬季用气请注意开启门窗通风，保持室内空气流通。",
        "is_top": True
    })
    assert resp.status_code == 201, "Create announcement failed"
    ann_id = resp.json()['id']
    print(f"Announcement created, ID: {ann_id}")

    print("--- Admin: Get Announcements ---")
    resp = session.get(f"{BASE_URL}/announcements")
    assert resp.status_code == 200
    anns = resp.json()
    assert any(a['title'] == title for a in anns), "New announcement not found in list"
    print("Announcement found in list")

    print("\n[SUCCESS] Admin feature tests completed.")

if __name__ == "__main__":
    test_admin_features()
