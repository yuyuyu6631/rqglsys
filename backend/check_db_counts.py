from app import create_app, db
from app.models import User, Cylinder, Order, Announcement, SafetyRecord

app = create_app()

def check_counts():
    with app.app_context():
        print("--- Database Record Counts ---")
        print(f"Users: {User.query.count()}")
        print(f"Cylinders: {Cylinder.query.count()}")
        print(f"Orders: {Order.query.count()}")
        print(f"Announcements: {Announcement.query.count()}")
        print(f"SafetyRecords: {SafetyRecord.query.count()}")
        print("------------------------------")
        
        # Print a few examples to be sure
        print("\n--- Example Data ---")
        admin = User.query.filter_by(username='admin').first()
        if admin:
            print(f"Admin User: {admin.username} (Role: {admin.role})")
            
        order = Order.query.first()
        if order:
            print(f"Sample Order: {order.order_no} (Status: {order.status})")

if __name__ == "__main__":
    check_counts()
