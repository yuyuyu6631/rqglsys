"""
后端API单元测试
测试所有CRUD接口的功能和参数验证
"""
import unittest
import json
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User, Cylinder, Order, SafetyRecord, Announcement, Rating


class APITestCase(unittest.TestCase):
    """API测试基类"""
    
    def setUp(self):
        """测试前准备"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        # 创建测试管理员用户
        self.admin = User(username='admin', role='admin', phone='13800138000')
        self.admin.set_password('123456')
        db.session.add(self.admin)
        
        # 创建测试普通用户
        self.user = User(username='testuser', role='user', phone='13900139000')
        self.user.set_password('123456')
        db.session.add(self.user)
        
        # 创建测试配送员
        self.delivery = User(username='delivery1', role='delivery', phone='13700137000')
        self.delivery.set_password('123456')
        db.session.add(self.delivery)
        
        db.session.commit()
        
        # 登录管理员
        self.login('admin', '123456')
    
    def tearDown(self):
        """测试后清理"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def login(self, username, password):
        """登录辅助方法"""
        response = self.client.post('/api/auth/login', 
            data=json.dumps({'username': username, 'password': password}),
            content_type='application/json')
        return response
    
    def logout(self):
        """登出辅助方法"""
        return self.client.post('/api/auth/logout')


class CylinderAPITest(APITestCase):
    """钢瓶管理API测试"""
    
    def test_create_cylinder_success(self):
        """测试成功创建钢瓶"""
        data = {
            'specs': '15kg',
            'manufacturer': '测试厂家',
            'manufacture_date': '2024-01-01',
            'expiry_date': '2025-01-01'
        }
        response = self.client.post('/api/cylinders',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        json_data = json.loads(response.data)
        self.assertEqual(json_data['specs'], '15kg')
        self.assertEqual(json_data['manufacturer'], '测试厂家')
    
    def test_create_cylinder_invalid_specs(self):
        """测试创建钢瓶时规格无效"""
        data = {
            'specs': '20kg',  # 无效规格
            'manufacturer': '测试厂家'
        }
        response = self.client.post('/api/cylinders',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        json_data = json.loads(response.data)
        self.assertIn('规格', json_data['error'])
    
    def test_create_cylinder_missing_required_field(self):
        """测试创建钢瓶时缺少必填字段"""
        data = {
            'manufacturer': '测试厂家'
            # 缺少 specs 字段
        }
        response = self.client.post('/api/cylinders',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        json_data = json.loads(response.data)
        self.assertIn('必填字段', json_data['error'])
    
    def test_create_cylinder_invalid_date_range(self):
        """测试创建钢瓶时日期范围无效"""
        data = {
            'specs': '15kg',
            'manufacture_date': '2025-01-01',
            'expiry_date': '2024-01-01'  # 有效期早于生产日期
        }
        response = self.client.post('/api/cylinders',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        json_data = json.loads(response.data)
        self.assertIn('有效期', json_data['error'])
    
    def test_get_cylinders(self):
        """测试获取钢瓶列表"""
        # 先创建一个钢瓶
        cylinder = Cylinder(
            serial_code='TEST001',
            specs='15kg',
            status='in_stock',
            manufacturer='测试厂家'
        )
        db.session.add(cylinder)
        db.session.commit()
        
        response = self.client.get('/api/cylinders')
        self.assertEqual(response.status_code, 200)
        json_data = json.loads(response.data)
        self.assertIsInstance(json_data, list)
        self.assertGreater(len(json_data), 0)
    
    def test_delete_cylinder_success(self):
        """测试成功删除钢瓶"""
        # 创建一个在库钢瓶
        cylinder = Cylinder(
            serial_code='TEST002',
            specs='15kg',
            status='in_stock'
        )
        db.session.add(cylinder)
        db.session.commit()
        cylinder_id = cylinder.id
        
        response = self.client.delete(f'/api/cylinders/{cylinder_id}')
        self.assertEqual(response.status_code, 200)
        
        # 验证已删除
        self.assertIsNone(Cylinder.query.get(cylinder_id))
    
    def test_delete_cylinder_in_use(self):
        """测试删除使用中的钢瓶应失败"""
        # 创建一个使用中的钢瓶
        cylinder = Cylinder(
            serial_code='TEST003',
            specs='15kg',
            status='in_use'
        )
        db.session.add(cylinder)
        db.session.commit()
        
        response = self.client.delete(f'/api/cylinders/{cylinder.id}')
        self.assertEqual(response.status_code, 400)
        json_data = json.loads(response.data)
        self.assertIn('使用中', json_data['error'])


class OrderAPITest(APITestCase):
    """订单管理API测试"""
    
    def test_create_order_success(self):
        """测试成功创建订单"""
        # 先创建一些库存
        for i in range(3):
            cylinder = Cylinder(
                serial_code=f'CYL{i}',
                specs='15kg',
                status='in_stock'
            )
            db.session.add(cylinder)
        db.session.commit()
        
        # 登录普通用户
        self.logout()
        self.login('testuser', '123456')
        
        data = {
            'specs': '15kg',
            'quantity': 2,
            'address': '测试地址123号'
        }
        response = self.client.post('/api/orders',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        json_data = json.loads(response.data)
        self.assertEqual(json_data['specs'], '15kg')
        self.assertEqual(json_data['quantity'], 2)
    
    def test_create_order_insufficient_stock(self):
        """测试库存不足时创建订单应失败"""
        # 只创建1个库存
        cylinder = Cylinder(
            serial_code='CYL001',
            specs='15kg',
            status='in_stock'
        )
        db.session.add(cylinder)
        db.session.commit()
        
        # 登录普通用户
        self.logout()
        self.login('testuser', '123456')
        
        data = {
            'specs': '15kg',
            'quantity': 5,  # 请求5个但只有1个库存
            'address': '测试地址'
        }
        response = self.client.post('/api/orders',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        json_data = json.loads(response.data)
        self.assertIn('库存不足', json_data['error'])
    
    def test_get_order_detail(self):
        """测试获取订单详情"""
        # 创建一个订单
        order = Order(
            order_no='TEST001',
            user_id=self.user.id,
            specs='15kg',
            quantity=1,
            unit_price=120,
            total_amount=120,
            address='测试地址',
            contact_name='测试用户',
            contact_phone='13900139000'
        )
        db.session.add(order)
        db.session.commit()
        
        response = self.client.get(f'/api/orders/{order.id}')
        self.assertEqual(response.status_code, 200)
        json_data = json.loads(response.data)
        self.assertEqual(json_data['order_no'], 'TEST001')


class UserAPITest(APITestCase):
    """用户管理API测试"""
    
    def test_create_user_success(self):
        """测试成功创建用户"""
        data = {
            'username': 'newuser',
            'password': '123456',
            'role': 'user',
            'phone': '13600136000'
        }
        response = self.client.post('/api/users',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        json_data = json.loads(response.data)
        self.assertEqual(json_data['username'], 'newuser')
    
    def test_create_user_duplicate_username(self):
        """测试创建重复用户名应失败"""
        data = {
            'username': 'admin',  # 已存在的用户名
            'password': '123456'
        }
        response = self.client.post('/api/users',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        json_data = json.loads(response.data)
        self.assertIn('已存在', json_data['error'])
    
    def test_create_user_invalid_phone(self):
        """测试创建用户时手机号格式无效"""
        data = {
            'username': 'newuser2',
            'password': '123456',
            'phone': '12345'  # 无效手机号
        }
        response = self.client.post('/api/users',
            data=json.dumps(data),
            content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        json_data = json.loads(response.data)
        self.assertIn('手机号', json_data['error'])


if __name__ == '__main__':
    unittest.main()
