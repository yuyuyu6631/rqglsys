from datetime import datetime, timedelta
import random
from app import db, create_app
from app.models import User, Cylinder, Order, SafetyRecord, Announcement

def seed_data():
    app = create_app()
    with app.app_context():
        # 清空现有数据
        db.drop_all()
        db.create_all()
        
        # ==================== 创建用户 ====================
        users = [
            {'username': 'admin', 'password': '123456', 'role': 'admin', 'real_name': '系统管理员', 'phone': '13800000001'},
            {'username': 'station1', 'password': '123456', 'role': 'station', 'real_name': '张站长', 'phone': '13800000002', 'station_id': 1},
            {'username': 'delivery1', 'password': '123456', 'role': 'delivery', 'real_name': '李配送', 'phone': '13800000003', 'station_id': 1},
            {'username': 'user1', 'password': '123456', 'role': 'user', 'real_name': '陈先生', 'phone': '13800000005'},
        ]
        
        for u in users:
            user = User(
                username=u['username'],
                role=u['role'],
                real_name=u['real_name'],
                phone=u['phone'],
                station_id=u.get('station_id')
            )
            user.set_password(u['password'])
            db.session.add(user)
        
        db.session.commit()
        
        # ==================== 创建钢瓶 ====================
        specs_list = ['5kg', '15kg', '50kg']
        for i in range(20):
            cylinder = Cylinder(
                serial_code=f'CYL2024{str(i+1).zfill(6)}',
                specs=random.choice(specs_list),
                status='in_stock',
                manufacturer='中燃集团',
                manufacture_date=datetime.now().date() - timedelta(days=500),
                expiry_date=datetime.now().date() + timedelta(days=365),
                station_id=1
            )
            db.session.add(cylinder)
        
        db.session.commit()
        
        # ==================== 创建公告 ====================
        announcement = Announcement(
            title='关于加强冬季燃气安全使用的通知',
            content='冬季是燃气使用高峰期，请务必注意室内通风，定期检查软管老化情况。',
            author_id=1,
            is_top=True
        )
        db.session.add(announcement)
        db.session.commit()
        
        print("✓ 数据初始化完成")

if __name__ == '__main__':
    seed_data()
