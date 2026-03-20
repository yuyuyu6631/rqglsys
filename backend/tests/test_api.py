import io
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import Announcement, Cylinder, Order, Rating, User


class APITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        })
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        self.admin = User(username='admin', role='admin', phone='13800138000', real_name='管理员')
        self.admin.set_password('123456')
        self.station = User(username='station1', role='station', phone='13800138001', real_name='站长')
        self.station.set_password('123456')
        self.user = User(username='user1', role='user', phone='13900139000', real_name='普通用户')
        self.user.set_password('123456')
        self.delivery = User(username='delivery1', role='delivery', phone='13700137000', real_name='配送员')
        self.delivery.set_password('123456')

        db.session.add_all([self.admin, self.station, self.user, self.delivery])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def login(self, username, password='123456'):
        return self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': username, 'password': password}),
            content_type='application/json',
        )

    def logout(self):
        return self.client.post('/api/auth/logout')


class UserApiTest(APITestCase):
    def setUp(self):
        super().setUp()
        self.login('admin')

    def test_create_user_success(self):
        response = self.client.post(
            '/api/users',
            data=json.dumps({
                'username': 'newuser',
                'password': '123456',
                'role': 'user',
                'phone': '13600136000',
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()['username'], 'newuser')

    def test_update_user_duplicate_username(self):
        response = self.client.put(
            f'/api/users/{self.user.id}',
            data=json.dumps({'username': 'station1'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('已存在', response.get_json()['error'])

    def test_delete_current_user_blocked(self):
        response = self.client.delete(f'/api/users/{self.admin.id}')

        self.assertEqual(response.status_code, 400)
        self.assertIn('当前登录用户', response.get_json()['error'])


class CylinderApiTest(APITestCase):
    def setUp(self):
        super().setUp()
        self.login('admin')

    def test_create_and_get_cylinder(self):
        response = self.client.post(
            '/api/cylinders',
            data=json.dumps({
                'serial_code': 'CYL001',
                'specs': '15kg',
                'manufacturer': '测试厂家',
                'manufacture_date': '2024-01-01',
                'expiry_date': '2025-01-01',
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        cylinder_id = response.get_json()['id']
        get_response = self.client.get(f'/api/cylinders/{cylinder_id}')
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.get_json()['serial_code'], 'CYL001')

    def test_update_cylinder_reject_invalid_status(self):
        cylinder = Cylinder(serial_code='CYL002', specs='15kg', status='in_stock')
        db.session.add(cylinder)
        db.session.commit()

        response = self.client.put(
            f'/api/cylinders/{cylinder.id}',
            data=json.dumps({'status': 'broken'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('钢瓶状态', response.get_json()['error'])

    def test_delete_cylinder_in_use_blocked(self):
        cylinder = Cylinder(serial_code='CYL003', specs='15kg', status='in_use')
        db.session.add(cylinder)
        db.session.commit()

        response = self.client.delete(f'/api/cylinders/{cylinder.id}')

        self.assertEqual(response.status_code, 400)
        self.assertIn('无法删除', response.get_json()['error'])


class OrderApiTest(APITestCase):
    def setUp(self):
        super().setUp()
        for index in range(4):
            db.session.add(Cylinder(
                serial_code=f'OCK{index}',
                specs='15kg',
                status='in_stock',
            ))
        db.session.commit()

    def create_order_for_user(self, quantity=1):
        self.login('user1')
        response = self.client.post(
            '/api/orders',
            data=json.dumps({
                'specs': '15kg',
                'quantity': quantity,
                'address': '测试地址 1 号',
            }),
            content_type='application/json',
        )
        self.logout()
        return response

    def test_create_order_success(self):
        response = self.create_order_for_user(quantity=2)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()['quantity'], 2)

    def test_user_can_cancel_pending_order_only(self):
        order_response = self.create_order_for_user()
        order_id = order_response.get_json()['id']

        self.login('user1')
        response = self.client.put(
            f'/api/orders/{order_id}/status',
            data=json.dumps({'status': 'cancelled'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['status'], 'cancelled')

    def test_delivery_cannot_update_other_delivery_order(self):
        order = Order(
            order_no='ORDTEST001',
            user_id=self.user.id,
            delivery_id=self.delivery.id,
            status='assigned',
            specs='15kg',
            quantity=1,
            unit_price=120,
            total_amount=120,
            address='测试地址',
            contact_name='普通用户',
            contact_phone='13900139000',
        )
        other_delivery = User(username='delivery2', role='delivery', phone='13700137001')
        other_delivery.set_password('123456')
        db.session.add(other_delivery)
        db.session.add(order)
        db.session.commit()

        self.login('delivery2')
        response = self.client.put(
            f'/api/orders/{order.id}/status',
            data=json.dumps({'status': 'delivering'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)

    def test_assign_and_complete_order(self):
        order_response = self.create_order_for_user()
        order_id = order_response.get_json()['id']

        self.login('admin')
        assign_response = self.client.put(
            f'/api/orders/{order_id}/assign',
            data=json.dumps({'delivery_id': self.delivery.id}),
            content_type='application/json',
        )
        self.assertEqual(assign_response.status_code, 200)
        self.assertEqual(len(assign_response.get_json()['allocated_cylinder_ids']), 1)
        self.assertEqual(Cylinder.query.filter_by(status='delivering').count(), 1)

        self.logout()
        self.login('delivery1')
        delivering_response = self.client.put(
            f'/api/orders/{order_id}/status',
            data=json.dumps({'status': 'delivering'}),
            content_type='application/json',
        )
        completed_response = self.client.put(
            f'/api/orders/{order_id}/status',
            data=json.dumps({'status': 'completed'}),
            content_type='application/json',
        )

        self.assertEqual(delivering_response.status_code, 200)
        self.assertEqual(completed_response.status_code, 200)
        self.assertEqual(completed_response.get_json()['status'], 'completed')
        self.assertEqual(Cylinder.query.filter_by(status='in_use').count(), 1)

    def test_cancel_assigned_order_releases_allocated_cylinders(self):
        order_response = self.create_order_for_user(quantity=2)
        order_id = order_response.get_json()['id']

        self.login('admin')
        assign_response = self.client.put(
            f'/api/orders/{order_id}/assign',
            data=json.dumps({'delivery_id': self.delivery.id}),
            content_type='application/json',
        )
        self.assertEqual(assign_response.status_code, 200)
        self.assertEqual(Cylinder.query.filter_by(status='delivering').count(), 2)

        cancel_response = self.client.put(
            f'/api/orders/{order_id}/status',
            data=json.dumps({'status': 'cancelled'}),
            content_type='application/json',
        )
        self.assertEqual(cancel_response.status_code, 200)
        self.assertEqual(cancel_response.get_json()['allocated_cylinder_ids'], [])
        self.assertEqual(Cylinder.query.filter_by(status='in_stock').count(), 4)


class SafetyAnnouncementRatingApiTest(APITestCase):
    def setUp(self):
        super().setUp()
        self.order = Order(
            order_no='ORDSAFE001',
            user_id=self.user.id,
            delivery_id=self.delivery.id,
            status='completed',
            specs='15kg',
            quantity=1,
            unit_price=120,
            total_amount=120,
            address='测试地址',
            contact_name='普通用户',
            contact_phone='13900139000',
        )
        db.session.add(self.order)
        db.session.commit()

    def test_create_and_update_safety_record(self):
        self.login('delivery1')
        create_response = self.client.post(
            '/api/safety/records',
            data=json.dumps({
                'order_id': self.order.id,
                'hazard_level': 'medium',
                'hazard_description': '软管老化',
                'photos': ['a.jpg'],
            }),
            content_type='application/json',
        )
        self.assertEqual(create_response.status_code, 201)
        record_id = create_response.get_json()['id']

        update_response = self.client.put(
            f'/api/safety/records/{record_id}',
            data=json.dumps({
                'rectify_status': 'completed',
                'rectify_photos': ['fixed.jpg'],
            }),
            content_type='application/json',
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.get_json()['rectify_status'], 'completed')

    def test_upload_safety_photo_returns_accessible_path(self):
        self.login('delivery1')
        response = self.client.post(
            '/api/safety/upload',
            data={'file': (io.BytesIO(b'fake-image-bytes'), 'scene.jpg')},
            content_type='multipart/form-data',
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['url'].startswith('/uploads/'))
        uploaded = self.client.get(data['url'])
        self.assertEqual(uploaded.status_code, 200)

    def test_create_and_update_announcement(self):
        self.login('admin')
        create_response = self.client.post(
            '/api/announcements',
            data=json.dumps({
                'title': '系统通知',
                'content': '今晚维护',
                'is_top': True,
            }),
            content_type='application/json',
        )
        self.assertEqual(create_response.status_code, 201)
        announcement_id = create_response.get_json()['id']

        update_response = self.client.put(
            f'/api/announcements/{announcement_id}',
            data=json.dumps({'title': '系统通知更新'}),
            content_type='application/json',
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.get_json()['title'], '系统通知更新')
        self.assertEqual(Announcement.query.count(), 1)

    def test_create_rating_completed_order(self):
        self.login('user1')
        response = self.client.post(
            '/api/ratings',
            data=json.dumps({
                'order_id': self.order.id,
                'score': 5,
                'comment': '服务很好',
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()['score'], 5)
        self.assertEqual(Rating.query.count(), 1)


class StatsApiTest(APITestCase):
    def setUp(self):
        super().setUp()
        db.session.add_all([
            Cylinder(serial_code='SPEC001', specs='5kg', status='in_stock'),
            Cylinder(serial_code='SPEC002', specs='15kg', status='in_stock'),
            Cylinder(serial_code='SPEC003', specs='15kg', status='empty'),
        ])
        db.session.commit()

    def test_get_cylinder_spec_stats(self):
        self.login('admin')
        response = self.client.get('/api/stats/cylinders/specs')

        self.assertEqual(response.status_code, 200)
        data = {item['specs']: item['count'] for item in response.get_json()}
        self.assertEqual(data['5kg'], 1)
        self.assertEqual(data['15kg'], 2)
        self.assertEqual(data['50kg'], 0)


if __name__ == '__main__':
    unittest.main()
