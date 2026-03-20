from datetime import UTC, datetime
from enum import Enum

from werkzeug.security import check_password_hash, generate_password_hash

from app import db


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


class UserRole(str, Enum):
    ADMIN = 'admin'
    STATION = 'station'
    DELIVERY = 'delivery'
    USER = 'user'


class CylinderStatus(str, Enum):
    IN_STOCK = 'in_stock'
    DELIVERING = 'delivering'
    IN_USE = 'in_use'
    EMPTY = 'empty'


class OrderStatus(str, Enum):
    PENDING = 'pending'
    ASSIGNED = 'assigned'
    DELIVERING = 'delivering'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'


class HazardLevel(str, Enum):
    NONE = 'none'
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default=UserRole.USER.value)
    phone = db.Column(db.String(20))
    real_name = db.Column(db.String(50))
    station_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'phone': self.phone,
            'real_name': self.real_name,
            'station_id': self.station_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Cylinder(db.Model):
    __tablename__ = 'cylinders'

    id = db.Column(db.Integer, primary_key=True)
    serial_code = db.Column(db.String(50), unique=True, nullable=False)
    specs = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default=CylinderStatus.IN_STOCK.value)
    manufacturer = db.Column(db.String(100))
    manufacture_date = db.Column(db.Date)
    expiry_date = db.Column(db.Date)
    last_check_date = db.Column(db.Date)
    station_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'serial_code': self.serial_code,
            'specs': self.specs,
            'status': self.status,
            'manufacturer': self.manufacturer,
            'manufacture_date': self.manufacture_date.isoformat() if self.manufacture_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'last_check_date': self.last_check_date.isoformat() if self.last_check_date else None,
            'station_id': self.station_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_no = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    delivery_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    specs = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float, default=0)
    total_amount = db.Column(db.Float, default=0)
    address = db.Column(db.String(200))
    contact_name = db.Column(db.String(50))
    contact_phone = db.Column(db.String(20))
    remark = db.Column(db.Text)
    allocated_cylinder_ids = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=utcnow)
    assigned_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    user = db.relationship('User', foreign_keys=[user_id], backref='orders')
    delivery = db.relationship('User', foreign_keys=[delivery_id])

    def get_allocated_cylinder_ids(self):
        if not self.allocated_cylinder_ids:
            return []
        return [int(item) for item in self.allocated_cylinder_ids.split(',') if item]

    def set_allocated_cylinder_ids(self, cylinder_ids):
        self.allocated_cylinder_ids = ','.join(str(item) for item in cylinder_ids) if cylinder_ids else None

    def to_dict(self):
        cylinder_ids = self.get_allocated_cylinder_ids()
        return {
            'id': self.id,
            'order_no': self.order_no,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'delivery_id': self.delivery_id,
            'delivery_name': self.delivery.username if self.delivery else None,
            'status': self.status,
            'specs': self.specs,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_amount': self.total_amount,
            'address': self.address,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'remark': self.remark,
            'allocated_cylinder_ids': cylinder_ids,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class SafetyRecord(db.Model):
    __tablename__ = 'safety_records'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'))
    inspector_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    check_items = db.Column(db.Text)
    hazard_level = db.Column(db.String(20), default=HazardLevel.NONE.value)
    hazard_description = db.Column(db.Text)
    photos = db.Column(db.Text)
    rectify_status = db.Column(db.String(20))
    rectify_photos = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=utcnow)

    order = db.relationship('Order', backref='safety_records')
    inspector = db.relationship('User', backref='inspections')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_no': self.order.order_no if self.order else None,
            'inspector_id': self.inspector_id,
            'inspector_name': self.inspector.username if self.inspector else None,
            'check_items': self.check_items,
            'hazard_level': self.hazard_level,
            'hazard_description': self.hazard_description,
            'photos': self.photos.split(',') if self.photos else [],
            'rectify_status': self.rectify_status,
            'rectify_photos': self.rectify_photos.split(',') if self.rectify_photos else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Announcement(db.Model):
    __tablename__ = 'announcements'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_top = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    author = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'author_id': self.author_id,
            'author_name': self.author.username if self.author else None,
            'is_top': self.is_top,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Rating(db.Model):
    __tablename__ = 'ratings'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Integer, default=5)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=utcnow)

    order = db.relationship('Order', backref='rating')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'user_id': self.user_id,
            'score': self.score,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
