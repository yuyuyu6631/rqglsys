import os
import random
import uuid
from datetime import datetime, date, timedelta
from app import create_app, db
from app.models import User, Cylinder, Order, SafetyRecord, Announcement, UserRole, CylinderStatus, OrderStatus, HazardLevel

app = create_app()

def seed_data():
    with app.app_context():
        print("Starting realistic data seeding...")
        
        # 1. Clear existing data (Optional, but good for a fresh start)
        db.drop_all()
        db.create_all()
        
        # 2. Users
        users_to_create = [
            {"username": "admin", "role": "admin", "real_name": "系统管理员", "password": "admin666", "phone": "13800138000"},
            {"username": "station01", "role": "station", "real_name": "城南供应站", "password": "password123", "phone": "010-66778899"},
            {"username": "zhao_q", "role": "delivery", "real_name": "赵强", "password": "password123", "phone": "13912345678"},
            {"username": "wang_w", "role": "delivery", "real_name": "王伟", "password": "password123", "phone": "13788776655"},
            {"username": "li_ming", "role": "user", "real_name": "李明", "password": "password123", "phone": "13500001111"},
            {"username": "zhang_j", "role": "user", "real_name": "张静", "password": "password123", "phone": "13699998888"},
            {"username": "customer_demo", "role": "user", "real_name": "陈先生", "password": "password123", "phone": "18822334455"}
        ]
        
        user_objs = {}
        for u_data in users_to_create:
            user = User(
                username=u_data["username"],
                role=u_data["role"],
                real_name=u_data["real_name"],
                phone=u_data["phone"]
            )
            user.set_password(u_data["password"])
            db.session.add(user)
            user_objs[u_data["username"]] = user
            
        db.session.flush() # Get IDs
        
        # 3. Cylinders
        specs_list = ["15kg", "5kg", "50kg"]
        manufacturers = ["新兴燃气设备厂", "金源压力容器有限公司", "蓝天特种装备"]
        
        cylinders = []
        for i in range(50):
            specs = random.choice(specs_list)
            status = random.choice(list(CylinderStatus)).value
            m_date = date.today() - timedelta(days=random.randint(100, 1000))
            e_date = m_date + timedelta(days=365*8) # 8 years life
            
            cyl = Cylinder(
                serial_code=f"GP-{m_date.year}-{'%04d' % i}",
                specs=specs,
                status=status,
                manufacturer=random.choice(manufacturers),
                manufacture_date=m_date,
                expiry_date=e_date,
                last_check_date=date.today() - timedelta(days=random.randint(10, 180))
            )
            db.session.add(cyl)
            cylinders.append(cyl)
            
        # 4. Announcements
        announcements = [
            {
                "title": "关于开展冬季燃气安全大检查的通知",
                "content": "近期气温骤降，为保障冬季用气安全，公司决定对全市供应站及终端用户开展安全隐患排查。请各部门高度重视，严格落实安全主体责任。",
                "is_top": True
            },
            {
                "title": "液化气钢瓶二维码溯源管理系统升级公告",
                "content": "本系统将于本周五凌晨2:00-4:00进行版本升级，届时配送APP可能出现短暂无法充值或派单的情况，请提前做好业务安排。",
                "is_top": False
            },
            {
                "title": "【安全提醒】开窗通风，谨慎用气",
                "content": "冬季室内通风较差，使用燃气热水器或灶具时，请务必保持窗户开启。如闻到异味，请立即关闭阀门并到室外拨打报修电话。",
                "is_top": True
            }
        ]
        for a_data in announcements:
            ann = Announcement(
                title=a_data["title"],
                content=a_data["content"],
                is_top=a_data["is_top"],
                author_id=user_objs["admin"].id
            )
            db.session.add(ann)
            
        # 5. Orders & Safety Records
        addresses = [
            "阳光花园小区12栋201室",
            "滨江路幸福里3号楼502",
            "德馨园A区8栋1单元101",
            "新华大街25号临街商铺",
            "青草巷4号院"
        ]
        
        order_statuses = list(OrderStatus)
        customers = [user_objs["li_ming"], user_objs["zhang_j"], user_objs["customer_demo"]]
        delivery_guys = [user_objs["zhao_q"], user_objs["wang_w"]]
        
        for i in range(100):
            cust = random.choice(customers)
            specs = random.choice(specs_list)
            quantity = random.randint(1, 2)
            unit_price = {"5kg": 50, "15kg": 120, "50kg": 350}[specs]
            
            created_at = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
            status = random.choice(order_statuses).value
            
            order = Order(
                order_no=f"ORD{created_at.strftime('%Y%m%d%H%M')}{str(uuid.uuid4())[:4].upper()}",
                user_id=cust.id,
                specs=specs,
                quantity=quantity,
                unit_price=unit_price,
                total_amount=unit_price * quantity,
                address=random.choice(addresses),
                contact_name=cust.real_name,
                contact_phone=cust.phone,
                status=status,
                created_at=created_at
            )
            
            if status != 'pending':
                deliv = random.choice(delivery_guys)
                order.delivery_id = deliv.id
                order.assigned_at = created_at + timedelta(minutes=random.randint(5, 30))
            
            if status == 'completed':
                order.completed_at = order.assigned_at + timedelta(minutes=random.randint(20, 120))
                # Add a safety record for completed orders
                record = SafetyRecord(
                    order_id=order.id,
                    inspector_id=order.delivery_id,
                    check_items="阀门检查：通过, 胶管老化：正常, 炉具状态：良好",
                    hazard_level=random.choice(list(HazardLevel)).value,
                    hazard_description="定期安全巡检，未发现重大安全隐患。" if random.random() > 0.8 else "正常使用中。",
                    created_at=order.completed_at
                )
                db.session.add(record)
                
            db.session.add(order)
            
        db.session.commit()
        print("Success: Realistic data seeded.")

if __name__ == "__main__":
    seed_data()
