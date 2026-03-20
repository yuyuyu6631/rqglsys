import os
import uuid
from datetime import UTC, datetime, timedelta

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import func

from app import db
from app.auth import get_current_user, login_required, role_required
from app.models import (
    Announcement,
    Cylinder,
    CylinderStatus,
    Order,
    OrderStatus,
    Rating,
    SafetyRecord,
    User,
)
from app.validators import (
    validate_cylinder_specs,
    validate_cylinder_status,
    validate_date_format,
    validate_date_range,
    validate_hazard_level,
    validate_order_status,
    validate_phone,
    validate_positive_integer,
    validate_rating_score,
    validate_required_fields,
    validate_user_role,
)

api_bp = Blueprint('api', __name__)

ALLOWED_UPLOAD_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
PRICE_MAP = {'5kg': 50, '15kg': 120, '50kg': 350}


def now_utc():
    return datetime.now(UTC).replace(tzinfo=None)


def json_error(message, status_code=400):
    return jsonify({'error': message}), status_code


def normalize_optional_str(value):
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def serialize_string_list(value):
    if not value:
        return None
    if isinstance(value, list):
        items = [str(item).strip() for item in value if str(item).strip()]
        return ','.join(items) if items else None
    return normalize_optional_str(str(value))


def parse_cylinder_dates(data):
    manufacture_date_raw = normalize_optional_str(data.get('manufacture_date'))
    expiry_date_raw = normalize_optional_str(data.get('expiry_date'))

    if manufacture_date_raw and not validate_date_format(manufacture_date_raw):
        return None, None, json_error('生产日期格式不正确，应为 YYYY-MM-DD')
    if expiry_date_raw and not validate_date_format(expiry_date_raw):
        return None, None, json_error('有效期格式不正确，应为 YYYY-MM-DD')
    if manufacture_date_raw and expiry_date_raw and not validate_date_range(manufacture_date_raw, expiry_date_raw):
        return None, None, json_error('有效期必须晚于生产日期')

    manufacture_date = (
        datetime.strptime(manufacture_date_raw, '%Y-%m-%d').date() if manufacture_date_raw else None
    )
    expiry_date = datetime.strptime(expiry_date_raw, '%Y-%m-%d').date() if expiry_date_raw else None
    return manufacture_date, expiry_date, None


def can_access_order(user, order):
    if user.role in ['admin', 'station']:
        return True
    if user.role == 'user':
        return order.user_id == user.id
    if user.role == 'delivery':
        return order.delivery_id == user.id
    return False


def can_manage_safety_record(user, record):
    return user.role in ['admin', 'station'] or record.inspector_id == user.id


def get_allocated_cylinders(order):
    cylinder_ids = order.get_allocated_cylinder_ids()
    if not cylinder_ids:
        return []
    cylinders = db.session.query(Cylinder).filter(Cylinder.id.in_(cylinder_ids)).all()
    cylinder_map = {cylinder.id: cylinder for cylinder in cylinders}
    return [cylinder_map[cylinder_id] for cylinder_id in cylinder_ids if cylinder_id in cylinder_map]


def attach_order_cylinder_details(order):
    data = order.to_dict()
    data['allocated_cylinders'] = [cylinder.serial_code for cylinder in get_allocated_cylinders(order)]
    return data


def reserve_cylinders_for_order(order):
    cylinders = get_allocated_cylinders(order)
    if cylinders:
        for cylinder in cylinders:
            if cylinder.status == CylinderStatus.IN_STOCK.value:
                cylinder.status = CylinderStatus.DELIVERING.value
        return cylinders, None

    cylinders = (
        Cylinder.query.filter_by(specs=order.specs, status=CylinderStatus.IN_STOCK.value)
        .order_by(Cylinder.created_at.asc(), Cylinder.id.asc())
        .limit(order.quantity)
        .all()
    )
    if len(cylinders) < order.quantity:
        return None, json_error('库存不足，无法为该订单分配钢瓶')

    for cylinder in cylinders:
        cylinder.status = CylinderStatus.DELIVERING.value
    order.set_allocated_cylinder_ids([cylinder.id for cylinder in cylinders])
    return cylinders, None


def release_order_cylinders(order, target_status=CylinderStatus.IN_STOCK.value, clear_allocation=True):
    cylinders = get_allocated_cylinders(order)
    for cylinder in cylinders:
        cylinder.status = target_status
    if clear_allocation:
        order.set_allocated_cylinder_ids([])
    return cylinders


def ensure_order_rating_access(order, user):
    if user.role in ['admin', 'station']:
        return True
    if user.role == 'user':
        return order.user_id == user.id
    if user.role == 'delivery':
        return order.delivery_id == user.id
    return False


@api_bp.route('/health', methods=['GET'])
def health_check():
    try:
        from sqlalchemy import inspect

        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'tables_count': len(tables),
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception:
        return jsonify({
            'status': 'healthy',
            'database': 'not_initialized',
            'message': '服务已启动，但数据库尚未初始化',
            'timestamp': datetime.now().isoformat(),
        }), 200


@api_bp.route('/users', methods=['GET'])
@login_required
@role_required(['admin', 'station'])
def get_users():
    role = request.args.get('role')
    if role and not validate_user_role(role):
        return json_error('无效的用户角色')

    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.order_by(User.created_at.desc()).all()
    return jsonify([user.to_dict() for user in users])


@api_bp.route('/users/<int:id>', methods=['GET'])
@login_required
@role_required(['admin', 'station'])
def get_user(id):
    user = User.query.get_or_404(id)
    return jsonify(user.to_dict())


@api_bp.route('/users', methods=['POST'])
@login_required
@role_required(['admin'])
@validate_required_fields(['username', 'password'])
def create_user():
    data = request.get_json(silent=True) or {}
    username = normalize_optional_str(data.get('username'))
    password = data.get('password')
    role = data.get('role', 'user')
    phone = normalize_optional_str(data.get('phone'))

    if User.query.filter_by(username=username).first():
        return json_error('用户名已存在')
    if not validate_user_role(role):
        return json_error('无效的用户角色')
    if phone and not validate_phone(phone):
        return json_error('手机号格式不正确')

    user = User(
        username=username,
        role=role,
        phone=phone,
        real_name=normalize_optional_str(data.get('real_name')),
        station_id=data.get('station_id'),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@api_bp.route('/users/<int:id>', methods=['PUT'])
@login_required
@role_required(['admin'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    if 'username' in data:
        username = normalize_optional_str(data.get('username'))
        if not username:
            return json_error('用户名不能为空')
        existing = User.query.filter(User.username == username, User.id != user.id).first()
        if existing:
            return json_error('用户名已存在')
        user.username = username

    if 'role' in data:
        if not validate_user_role(data.get('role')):
            return json_error('无效的用户角色')
        user.role = data['role']

    if 'phone' in data:
        phone = normalize_optional_str(data.get('phone'))
        if phone and not validate_phone(phone):
            return json_error('手机号格式不正确')
        user.phone = phone

    if 'real_name' in data:
        user.real_name = normalize_optional_str(data.get('real_name'))

    if 'station_id' in data:
        user.station_id = data.get('station_id')

    if data.get('password'):
        user.set_password(data['password'])

    db.session.commit()
    return jsonify(user.to_dict())


@api_bp.route('/users/<int:id>', methods=['DELETE'])
@login_required
@role_required(['admin'])
def delete_user(id):
    user = User.query.get_or_404(id)
    current_user = get_current_user()

    if current_user and current_user.id == user.id:
        return json_error('不能删除当前登录用户')
    if Order.query.filter((Order.user_id == user.id) | (Order.delivery_id == user.id)).first():
        return json_error('该用户已有关联订单，无法删除')
    if SafetyRecord.query.filter_by(inspector_id=user.id).first():
        return json_error('该用户已有关联安检记录，无法删除')
    if Announcement.query.filter_by(author_id=user.id).first():
        return json_error('该用户已发布公告，无法删除')
    if Rating.query.filter_by(user_id=user.id).first():
        return json_error('该用户已存在评价记录，无法删除')

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': '删除成功'})


@api_bp.route('/cylinders', methods=['GET'])
@login_required
def get_cylinders():
    status = request.args.get('status')
    specs = request.args.get('specs')

    if status and not validate_cylinder_status(status):
        return json_error('无效的钢瓶状态')
    if specs and not validate_cylinder_specs(specs):
        return json_error('无效的钢瓶规格')

    query = Cylinder.query
    if status:
        query = query.filter_by(status=status)
    if specs:
        query = query.filter_by(specs=specs)
    cylinders = query.order_by(Cylinder.created_at.desc()).all()
    return jsonify([cylinder.to_dict() for cylinder in cylinders])


@api_bp.route('/cylinders/<int:id>', methods=['GET'])
@login_required
def get_cylinder(id):
    cylinder = Cylinder.query.get_or_404(id)
    return jsonify(cylinder.to_dict())


@api_bp.route('/cylinders', methods=['POST'])
@login_required
@role_required(['admin', 'station'])
@validate_required_fields(['specs'])
def create_cylinder():
    data = request.get_json(silent=True) or {}
    specs = data.get('specs')
    serial_code = normalize_optional_str(data.get('serial_code'))
    status = data.get('status', CylinderStatus.IN_STOCK.value)

    if not validate_cylinder_specs(specs):
        return json_error('钢瓶规格必须是 5kg、15kg 或 50kg')
    if not validate_cylinder_status(status):
        return json_error('无效的钢瓶状态')
    if serial_code and Cylinder.query.filter_by(serial_code=serial_code).first():
        return json_error('钢瓶编号已存在')

    manufacture_date, expiry_date, error_response = parse_cylinder_dates(data)
    if error_response:
        return error_response

    cylinder = Cylinder(
        serial_code=serial_code or f'CYL{datetime.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:4].upper()}',
        specs=specs,
        status=status,
        manufacturer=normalize_optional_str(data.get('manufacturer')),
        manufacture_date=manufacture_date,
        expiry_date=expiry_date,
        station_id=data.get('station_id'),
    )
    db.session.add(cylinder)
    db.session.commit()
    return jsonify(cylinder.to_dict()), 201


@api_bp.route('/cylinders/<int:id>', methods=['PUT'])
@login_required
@role_required(['admin', 'station'])
def update_cylinder(id):
    cylinder = Cylinder.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    if 'serial_code' in data:
        serial_code = normalize_optional_str(data.get('serial_code'))
        if not serial_code:
            return json_error('钢瓶编号不能为空')
        existing = Cylinder.query.filter(Cylinder.serial_code == serial_code, Cylinder.id != cylinder.id).first()
        if existing:
            return json_error('钢瓶编号已存在')
        cylinder.serial_code = serial_code

    if 'specs' in data:
        if not validate_cylinder_specs(data.get('specs')):
            return json_error('钢瓶规格必须是 5kg、15kg 或 50kg')
        cylinder.specs = data['specs']

    if 'status' in data:
        if not validate_cylinder_status(data.get('status')):
            return json_error('无效的钢瓶状态')
        cylinder.status = data['status']

    if 'manufacturer' in data:
        cylinder.manufacturer = normalize_optional_str(data.get('manufacturer'))

    if 'station_id' in data:
        cylinder.station_id = data.get('station_id')

    if 'manufacture_date' in data or 'expiry_date' in data:
        merged_data = {
            'manufacture_date': data.get(
                'manufacture_date',
                cylinder.manufacture_date.isoformat() if cylinder.manufacture_date else None,
            ),
            'expiry_date': data.get(
                'expiry_date',
                cylinder.expiry_date.isoformat() if cylinder.expiry_date else None,
            ),
        }
        manufacture_date, expiry_date, error_response = parse_cylinder_dates(merged_data)
        if error_response:
            return error_response
        cylinder.manufacture_date = manufacture_date
        cylinder.expiry_date = expiry_date

    db.session.commit()
    return jsonify(cylinder.to_dict())


@api_bp.route('/cylinders/<int:id>/status', methods=['PUT'])
@login_required
@role_required(['admin', 'station', 'delivery'])
def update_cylinder_status(id):
    cylinder = Cylinder.query.get_or_404(id)
    data = request.get_json(silent=True) or {}
    new_status = data.get('status')

    if not validate_cylinder_status(new_status):
        return json_error('无效的钢瓶状态')

    valid_transitions = {
        CylinderStatus.IN_STOCK.value: [CylinderStatus.DELIVERING.value],
        CylinderStatus.DELIVERING.value: [CylinderStatus.IN_USE.value, CylinderStatus.IN_STOCK.value],
        CylinderStatus.IN_USE.value: [CylinderStatus.EMPTY.value],
        CylinderStatus.EMPTY.value: [CylinderStatus.IN_STOCK.value],
    }
    if new_status not in valid_transitions.get(cylinder.status, []):
        return json_error(f'不允许从 {cylinder.status} 变更为 {new_status}')

    cylinder.status = new_status
    db.session.commit()
    return jsonify(cylinder.to_dict())


@api_bp.route('/cylinders/<int:id>', methods=['DELETE'])
@login_required
@role_required(['admin', 'station'])
def delete_cylinder(id):
    cylinder = Cylinder.query.get_or_404(id)
    if cylinder.status in [CylinderStatus.DELIVERING.value, CylinderStatus.IN_USE.value]:
        return json_error('钢瓶正在使用流程中，无法删除')

    db.session.delete(cylinder)
    db.session.commit()
    return jsonify({'message': '删除成功'})


@api_bp.route('/cylinders/stats', methods=['GET'])
@login_required
def get_cylinder_stats():
    stats = db.session.query(Cylinder.status, func.count(Cylinder.id)).group_by(Cylinder.status).all()
    result = {status.value: 0 for status in CylinderStatus}
    for status, count in stats:
        result[status] = count

    today = datetime.now().date()
    result['expiring_soon'] = Cylinder.query.filter(
        Cylinder.expiry_date.isnot(None),
        Cylinder.expiry_date >= today,
        Cylinder.expiry_date <= today + timedelta(days=30),
    ).count()
    result['total'] = sum(result[status.value] for status in CylinderStatus)
    return jsonify(result)


@api_bp.route('/orders', methods=['GET'])
@login_required
def get_orders():
    user = get_current_user()
    status = request.args.get('status')

    if status and not validate_order_status(status):
        return json_error('无效的订单状态')

    query = Order.query
    if user.role == 'user':
        query = query.filter_by(user_id=user.id)
    elif user.role == 'delivery':
        query = query.filter_by(delivery_id=user.id)

    if status:
        query = query.filter_by(status=status)

    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([attach_order_cylinder_details(order) for order in orders])


@api_bp.route('/orders/<int:id>', methods=['GET'])
@login_required
def get_order(id):
    order = Order.query.get_or_404(id)
    user = get_current_user()

    if not can_access_order(user, order):
        return json_error('无权访问该订单', 403)
    return jsonify(attach_order_cylinder_details(order))


@api_bp.route('/orders', methods=['POST'])
@login_required
@validate_required_fields(['specs', 'address'])
def create_order():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    specs = data.get('specs')
    quantity = data.get('quantity', 1)
    address = normalize_optional_str(data.get('address'))
    contact_name = normalize_optional_str(data.get('contact_name')) or user.real_name or user.username
    contact_phone = normalize_optional_str(data.get('contact_phone')) or user.phone

    if not validate_cylinder_specs(specs):
        return json_error('钢瓶规格必须是 5kg、15kg 或 50kg')
    if not validate_positive_integer(quantity):
        return json_error('订购数量必须为正整数')
    quantity = int(quantity)

    available = Cylinder.query.filter_by(specs=specs, status=CylinderStatus.IN_STOCK.value).count()
    if available < quantity:
        return json_error(f'{specs} 规格库存不足，当前可用 {available}')
    if contact_phone and not validate_phone(contact_phone):
        return json_error('联系电话格式不正确')

    unit_price = PRICE_MAP.get(specs, 120)

    order = Order(
        order_no=f'ORD{datetime.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:4].upper()}',
        user_id=user.id,
        specs=specs,
        quantity=quantity,
        unit_price=unit_price,
        total_amount=unit_price * quantity,
        address=address,
        contact_name=contact_name,
        contact_phone=contact_phone,
        remark=normalize_optional_str(data.get('remark')),
    )
    db.session.add(order)
    db.session.commit()
    return jsonify(attach_order_cylinder_details(order)), 201


@api_bp.route('/orders/<int:id>/assign', methods=['PUT'])
@login_required
@role_required(['admin', 'station'])
def assign_order(id):
    order = Order.query.get_or_404(id)
    data = request.get_json(silent=True) or {}
    delivery_id = data.get('delivery_id')

    if order.status != OrderStatus.PENDING.value:
        return json_error('只能分配待处理订单')
    if not delivery_id:
        return json_error('请选择配送员')

    delivery = User.query.filter_by(id=delivery_id, role='delivery').first()
    if not delivery:
        return json_error('配送员不存在')

    cylinders, error_response = reserve_cylinders_for_order(order)
    if error_response:
        return error_response

    order.delivery_id = delivery_id
    order.status = OrderStatus.ASSIGNED.value
    order.assigned_at = now_utc()
    if not cylinders:
        return json_error('未能完成钢瓶分配')
    db.session.commit()
    return jsonify(attach_order_cylinder_details(order))


@api_bp.route('/orders/<int:id>/status', methods=['PUT'])
@login_required
def update_order_status(id):
    order = Order.query.get_or_404(id)
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    new_status = data.get('status')

    if not validate_order_status(new_status):
        return json_error('无效的订单状态')
    if not can_access_order(user, order) and user.role not in ['admin', 'station']:
        return json_error('无权修改该订单', 403)

    if user.role == 'user':
        if order.user_id != user.id:
            return json_error('无权修改该订单', 403)
        if new_status != OrderStatus.CANCELLED.value or order.status != OrderStatus.PENDING.value:
            return json_error('用户只能取消待处理订单', 403)
    elif user.role == 'delivery':
        if order.delivery_id != user.id:
            return json_error('无权修改该订单', 403)
        if new_status not in [OrderStatus.DELIVERING.value, OrderStatus.COMPLETED.value]:
            return json_error('配送员只能更新为配送中或已完成', 403)

    valid_transitions = {
        OrderStatus.PENDING.value: [OrderStatus.ASSIGNED.value, OrderStatus.CANCELLED.value],
        OrderStatus.ASSIGNED.value: [OrderStatus.DELIVERING.value, OrderStatus.CANCELLED.value],
        OrderStatus.DELIVERING.value: [OrderStatus.COMPLETED.value],
        OrderStatus.COMPLETED.value: [],
        OrderStatus.CANCELLED.value: [],
    }
    if new_status not in valid_transitions.get(order.status, []):
        return json_error(f'不允许从 {order.status} 变更为 {new_status}')

    if new_status == OrderStatus.ASSIGNED.value:
        if user.role not in ['admin', 'station']:
            return json_error('只有管理员或站点人员可以分配订单', 403)
        if not order.delivery_id:
            return json_error('请先通过分配接口指定配送员')
        _, error_response = reserve_cylinders_for_order(order)
        if error_response:
            return error_response

    if new_status == OrderStatus.DELIVERING.value:
        if not order.delivery_id:
            return json_error('订单尚未分配配送员')
        _, error_response = reserve_cylinders_for_order(order)
        if error_response:
            return error_response

    if new_status == OrderStatus.CANCELLED.value:
        release_order_cylinders(order, target_status=CylinderStatus.IN_STOCK.value, clear_allocation=True)
        if user.role in ['admin', 'station']:
            order.delivery_id = None

    if new_status == OrderStatus.COMPLETED.value:
        cylinders, error_response = reserve_cylinders_for_order(order)
        if error_response:
            return error_response
        for cylinder in cylinders:
            cylinder.status = CylinderStatus.IN_USE.value
        order.completed_at = now_utc()

    order.status = new_status
    db.session.commit()
    return jsonify(attach_order_cylinder_details(order))


@api_bp.route('/safety/records', methods=['GET'])
@login_required
def get_safety_records():
    user = get_current_user()
    hazard_level = request.args.get('hazard_level')

    if hazard_level and not validate_hazard_level(hazard_level):
        return json_error('无效的隐患等级')

    query = SafetyRecord.query
    if user.role == 'delivery':
        query = query.filter_by(inspector_id=user.id)
    if hazard_level:
        query = query.filter_by(hazard_level=hazard_level)

    records = query.order_by(SafetyRecord.created_at.desc()).all()
    return jsonify([record.to_dict() for record in records])


@api_bp.route('/safety/records/<int:id>', methods=['GET'])
@login_required
def get_safety_record(id):
    record = SafetyRecord.query.get_or_404(id)
    user = get_current_user()
    if not can_manage_safety_record(user, record):
        return json_error('无权访问该安检记录', 403)
    return jsonify(record.to_dict())


@api_bp.route('/safety/records', methods=['POST'])
@login_required
def create_safety_record():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    hazard_level = data.get('hazard_level', 'none')

    if not validate_hazard_level(hazard_level):
        return json_error('无效的隐患等级')

    order_id = data.get('order_id')
    if order_id:
        order = Order.query.get_or_404(order_id)
        if not can_access_order(user, order) and user.role not in ['admin', 'station']:
            return json_error('无权为该订单创建安检记录', 403)

    record = SafetyRecord(
        order_id=order_id,
        inspector_id=user.id,
        check_items=normalize_optional_str(data.get('check_items')),
        hazard_level=hazard_level,
        hazard_description=normalize_optional_str(data.get('hazard_description')),
        photos=serialize_string_list(data.get('photos')),
        rectify_status='pending' if hazard_level != 'none' else None,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@api_bp.route('/safety/upload', methods=['POST'])
@login_required
def upload_safety_photo():
    if 'file' not in request.files:
        return json_error('没有上传文件')

    file = request.files['file']
    if file.filename == '':
        return json_error('没有选择文件')

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        return json_error('仅支持 jpg、jpeg、png、gif、webp 格式文件')

    filename = f'{datetime.now().strftime("%Y%m%d%H%M%S")}_{uuid.uuid4().hex[:8]}.{ext}'
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, filename))

    return jsonify({
        'filename': filename,
        'url': f'/uploads/{filename}',
    })


@api_bp.route('/safety/records/<int:id>', methods=['PUT'])
@login_required
def update_safety_record(id):
    record = SafetyRecord.query.get_or_404(id)
    user = get_current_user()
    data = request.get_json(silent=True) or {}

    if not can_manage_safety_record(user, record):
        return json_error('无权修改该安检记录', 403)

    if 'hazard_level' in data:
        if not validate_hazard_level(data.get('hazard_level')):
            return json_error('无效的隐患等级')
        record.hazard_level = data['hazard_level']
        if record.hazard_level == 'none':
            record.rectify_status = None
        elif not record.rectify_status:
            record.rectify_status = 'pending'

    if 'check_items' in data:
        record.check_items = normalize_optional_str(data.get('check_items'))
    if 'hazard_description' in data:
        record.hazard_description = normalize_optional_str(data.get('hazard_description'))
    if 'photos' in data:
        record.photos = serialize_string_list(data.get('photos'))
    if 'rectify_status' in data:
        if data.get('rectify_status') not in [None, 'pending', 'completed']:
            return json_error('整改状态无效')
        record.rectify_status = data.get('rectify_status')
    if 'rectify_photos' in data:
        record.rectify_photos = serialize_string_list(data.get('rectify_photos'))

    db.session.commit()
    return jsonify(record.to_dict())


@api_bp.route('/safety/records/<int:id>', methods=['DELETE'])
@login_required
def delete_safety_record(id):
    record = SafetyRecord.query.get_or_404(id)
    user = get_current_user()
    if not can_manage_safety_record(user, record):
        return json_error('无权删除该安检记录', 403)

    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': '删除成功'})


@api_bp.route('/stats/dashboard', methods=['GET'])
@login_required
def get_dashboard_stats():
    total_orders = Order.query.count()
    pending_orders = Order.query.filter_by(status=OrderStatus.PENDING.value).count()
    assigned_orders = Order.query.filter_by(status=OrderStatus.ASSIGNED.value).count()
    delivering_orders = Order.query.filter_by(status=OrderStatus.DELIVERING.value).count()
    completed_orders = Order.query.filter_by(status=OrderStatus.COMPLETED.value).count()
    cancelled_orders = Order.query.filter_by(status=OrderStatus.CANCELLED.value).count()
    total_cylinders = Cylinder.query.count()
    in_stock = Cylinder.query.filter_by(status=CylinderStatus.IN_STOCK.value).count()
    total_users = User.query.filter_by(role='user').count()
    total_delivery = User.query.filter_by(role='delivery').count()

    today = datetime.now().date()
    today_orders = Order.query.filter(func.date(Order.created_at) == today).count()
    today_revenue = db.session.query(func.sum(Order.total_amount)).filter(
        func.date(Order.completed_at) == today,
        Order.status == OrderStatus.COMPLETED.value,
    ).scalar() or 0
    hazard_pending = SafetyRecord.query.filter_by(rectify_status='pending').count()
    expiring_soon = Cylinder.query.filter(
        Cylinder.expiry_date.isnot(None),
        Cylinder.expiry_date >= today,
        Cylinder.expiry_date <= today + timedelta(days=30),
    ).count()

    return jsonify({
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'assigned_orders': assigned_orders,
        'delivering_orders': delivering_orders,
        'completed_orders': completed_orders,
        'cancelled_orders': cancelled_orders,
        'total_cylinders': total_cylinders,
        'in_stock': in_stock,
        'total_users': total_users,
        'total_delivery': total_delivery,
        'today_orders': today_orders,
        'today_revenue': float(today_revenue),
        'hazard_pending': hazard_pending,
        'expiring_soon': expiring_soon,
    })


@api_bp.route('/stats/orders/trend', methods=['GET'])
@login_required
def get_order_trend():
    days = request.args.get('days', 7, type=int)
    if not days or days <= 0:
        return json_error('days 必须为正整数')

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days - 1)
    results = db.session.query(
        func.date(Order.created_at).label('date'),
        func.count(Order.id).label('count'),
    ).filter(
        func.date(Order.created_at) >= start_date,
        func.date(Order.created_at) <= end_date,
    ).group_by(func.date(Order.created_at)).all()

    date_counts = {str(item.date): item.count for item in results}
    trend = []
    for index in range(days):
        current = start_date + timedelta(days=index)
        trend.append({
            'date': str(current),
            'count': date_counts.get(str(current), 0),
        })
    return jsonify(trend)


@api_bp.route('/stats/delivery/ranking', methods=['GET'])
@login_required
def get_delivery_ranking():
    results = db.session.query(
        User.id,
        User.username,
        User.real_name,
        func.count(Order.id).label('order_count'),
    ).join(
        Order, Order.delivery_id == User.id
    ).filter(
        Order.status == OrderStatus.COMPLETED.value
    ).group_by(User.id).order_by(func.count(Order.id).desc()).limit(10).all()

    return jsonify([{
        'id': item.id,
        'username': item.username,
        'real_name': item.real_name,
        'order_count': item.order_count,
    } for item in results])


@api_bp.route('/stats/cylinders/specs', methods=['GET'])
@login_required
def get_cylinder_specs_stats():
    rows = db.session.query(Cylinder.specs, func.count(Cylinder.id)).group_by(Cylinder.specs).all()
    result = {'5kg': 0, '15kg': 0, '50kg': 0}
    for specs, count in rows:
        result[specs] = count
    return jsonify([{'specs': specs, 'count': count} for specs, count in result.items()])


@api_bp.route('/announcements', methods=['GET'])
@login_required
def get_announcements():
    announcements = Announcement.query.order_by(
        Announcement.is_top.desc(),
        Announcement.created_at.desc(),
    ).all()
    return jsonify([announcement.to_dict() for announcement in announcements])


@api_bp.route('/announcements/<int:id>', methods=['GET'])
@login_required
def get_announcement(id):
    announcement = Announcement.query.get_or_404(id)
    return jsonify(announcement.to_dict())


@api_bp.route('/announcements', methods=['POST'])
@login_required
@role_required(['admin'])
@validate_required_fields(['title', 'content'])
def create_announcement():
    user = get_current_user()
    data = request.get_json(silent=True) or {}

    announcement = Announcement(
        title=normalize_optional_str(data.get('title')),
        content=normalize_optional_str(data.get('content')),
        author_id=user.id,
        is_top=bool(data.get('is_top', False)),
    )
    db.session.add(announcement)
    db.session.commit()
    return jsonify(announcement.to_dict()), 201


@api_bp.route('/announcements/<int:id>', methods=['PUT'])
@login_required
@role_required(['admin'])
def update_announcement(id):
    announcement = Announcement.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    if 'title' in data:
        title = normalize_optional_str(data.get('title'))
        if not title:
            return json_error('公告标题不能为空')
        announcement.title = title
    if 'content' in data:
        content = normalize_optional_str(data.get('content'))
        if not content:
            return json_error('公告内容不能为空')
        announcement.content = content
    if 'is_top' in data:
        announcement.is_top = bool(data.get('is_top'))

    db.session.commit()
    return jsonify(announcement.to_dict())


@api_bp.route('/announcements/<int:id>', methods=['DELETE'])
@login_required
@role_required(['admin'])
def delete_announcement(id):
    announcement = Announcement.query.get_or_404(id)
    db.session.delete(announcement)
    db.session.commit()
    return jsonify({'message': '删除成功'})


@api_bp.route('/ratings', methods=['POST'])
@login_required
@validate_required_fields(['order_id'])
def create_rating():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    order = Order.query.get_or_404(data.get('order_id'))
    score = data.get('score', 5)

    if order.user_id != user.id:
        return json_error('只能评价自己的订单', 403)
    if order.status != OrderStatus.COMPLETED.value:
        return json_error('只能评价已完成的订单')
    if Rating.query.filter_by(order_id=order.id).first():
        return json_error('该订单已评价')
    if not validate_rating_score(score):
        return json_error('评分必须是 1 到 5 的整数')

    rating = Rating(
        order_id=order.id,
        user_id=user.id,
        score=int(score),
        comment=normalize_optional_str(data.get('comment')),
    )
    db.session.add(rating)
    db.session.commit()
    return jsonify(rating.to_dict()), 201


@api_bp.route('/ratings', methods=['GET'])
@login_required
def get_ratings():
    user = get_current_user()
    order_id = request.args.get('order_id', type=int)
    query = Rating.query
    if order_id:
        order = Order.query.get_or_404(order_id)
        if not ensure_order_rating_access(order, user):
            return json_error('无权查看该订单评价', 403)
        query = query.filter_by(order_id=order_id)
    elif user.role == 'user':
        query = query.filter_by(user_id=user.id)
    ratings = query.order_by(Rating.created_at.desc()).all()
    return jsonify([rating.to_dict() for rating in ratings])


@api_bp.route('/ratings/<int:id>', methods=['GET'])
@login_required
def get_rating(id):
    rating = Rating.query.get_or_404(id)
    user = get_current_user()
    order = Order.query.get(rating.order_id)
    if order is None:
        return jsonify(rating.to_dict())
    if not ensure_order_rating_access(order, user):
        return json_error('无权查看该评价', 403)
    return jsonify(rating.to_dict())


@api_bp.route('/orders/<int:id>/rating', methods=['GET'])
@login_required
def get_order_rating(id):
    order = Order.query.get_or_404(id)
    user = get_current_user()
    if not ensure_order_rating_access(order, user):
        return json_error('无权查看该订单评价', 403)
    rating = Rating.query.filter_by(order_id=id).first()
    if not rating:
        return jsonify({'message': '暂无评价'}), 404
    return jsonify(rating.to_dict())
