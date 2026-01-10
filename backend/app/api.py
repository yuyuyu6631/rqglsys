import os
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, session, current_app
from sqlalchemy import func, text
from app import db
from app.models import (
    User, Cylinder, Order, SafetyRecord, Announcement, Rating,
    UserRole, CylinderStatus, OrderStatus, HazardLevel
)
from app.auth import login_required, role_required, get_current_user
from app.validators import (
    validate_required_fields, validate_cylinder_specs, validate_phone,
    validate_date_format, validate_date_range, validate_user_role,
    validate_cylinder_status, validate_order_status, validate_hazard_level,
    validate_rating_score, validate_positive_integer
)

api_bp = Blueprint('api', __name__)

# ==================== 健康检查 ====================

@api_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查端点,用于 Docker 容器健康检查"""
    try:
        # 简单检查,不依赖数据库表是否存在
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'tables_count': len(tables),
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        # 即使数据库未初始化,也返回 200,因为服务本身是健康的
        return jsonify({
            'status': 'healthy',
            'database': 'not_initialized',
            'message': 'Service is running, database needs initialization',
            'timestamp': datetime.now().isoformat()
        }), 200

# ==================== 用户管理 ====================


@api_bp.route('/users', methods=['GET'])
@login_required
@role_required(['admin', 'station'])
def get_users():
    role = request.args.get('role')
    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])

@api_bp.route('/users', methods=['POST'])
@login_required
@role_required(['admin'])
@validate_required_fields(['username', 'password'])
def create_user():
    data = request.get_json()
    
    # 验证用户名是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    # 验证角色
    role = data.get('role', 'user')
    if not validate_user_role(role):
        return jsonify({'error': '无效的用户角色'}), 400
    
    # 验证手机号格式
    if data.get('phone') and not validate_phone(data['phone']):
        return jsonify({'error': '手机号格式不正确'}), 400
    
    user = User(
        username=data['username'],
        role=role,
        phone=data.get('phone'),
        real_name=data.get('real_name'),
        station_id=data.get('station_id')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@api_bp.route('/users/<int:id>', methods=['PUT'])
@login_required
@role_required(['admin'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    user.role = data.get('role', user.role)
    user.phone = data.get('phone', user.phone)
    user.real_name = data.get('real_name', user.real_name)
    user.station_id = data.get('station_id', user.station_id)
    if data.get('password'):
        user.set_password(data['password'])
    db.session.commit()
    return jsonify(user.to_dict())

@api_bp.route('/users/<int:id>', methods=['DELETE'])
@login_required
@role_required(['admin'])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': '删除成功'})

# ==================== 钢瓶管理 ====================

@api_bp.route('/cylinders', methods=['GET'])
@login_required
def get_cylinders():
    status = request.args.get('status')
    specs = request.args.get('specs')
    query = Cylinder.query
    if status:
        query = query.filter_by(status=status)
    if specs:
        query = query.filter_by(specs=specs)
    cylinders = query.order_by(Cylinder.created_at.desc()).all()
    return jsonify([c.to_dict() for c in cylinders])

@api_bp.route('/cylinders', methods=['POST'])
@login_required
@role_required(['admin', 'station'])
@validate_required_fields(['specs'])
def create_cylinder():
    data = request.get_json()
    
    # 验证规格
    if not validate_cylinder_specs(data['specs']):
        return jsonify({'error': '钢瓶规格必须是 5kg, 15kg 或 50kg'}), 400
    
    # 验证日期格式
    if data.get('manufacture_date') and not validate_date_format(data['manufacture_date']):
        return jsonify({'error': '生产日期格式不正确，应为 YYYY-MM-DD'}), 400
    
    if data.get('expiry_date') and not validate_date_format(data['expiry_date']):
        return jsonify({'error': '有效期格式不正确，应为 YYYY-MM-DD'}), 400
    
    # 验证日期范围
    if data.get('manufacture_date') and data.get('expiry_date'):
        if not validate_date_range(data['manufacture_date'], data['expiry_date']):
            return jsonify({'error': '有效期必须晚于生产日期'}), 400
    
    try:
        cylinder = Cylinder(
            serial_code=data.get('serial_code') or f'CYL{datetime.now().strftime("%Y%m%d%H%M%S")}',
            specs=data['specs'],
            status=data.get('status', 'in_stock'),
            manufacturer=data.get('manufacturer'),
            manufacture_date=datetime.strptime(data['manufacture_date'], '%Y-%m-%d').date() if data.get('manufacture_date') else None,
            expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data.get('expiry_date') else None,
            station_id=data.get('station_id')
        )
        db.session.add(cylinder)
        db.session.commit()
        return jsonify(cylinder.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'创建钢瓶失败: {str(e)}'}), 500

@api_bp.route('/cylinders/<int:id>', methods=['PUT'])
@login_required
@role_required(['admin', 'station'])
def update_cylinder(id):
    cylinder = Cylinder.query.get_or_404(id)
    data = request.get_json()
    cylinder.specs = data.get('specs', cylinder.specs)
    cylinder.status = data.get('status', cylinder.status)
    cylinder.manufacturer = data.get('manufacturer', cylinder.manufacturer)
    if data.get('manufacture_date'):
        cylinder.manufacture_date = datetime.strptime(data['manufacture_date'], '%Y-%m-%d').date()
    if data.get('expiry_date'):
        cylinder.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify(cylinder.to_dict())

@api_bp.route('/cylinders/<int:id>/status', methods=['PUT'])
@login_required
def update_cylinder_status(id):
    cylinder = Cylinder.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')
    
    # 简化的状态流转验证
    valid_transitions = {
        'in_stock': ['delivering'],
        'delivering': ['in_use', 'in_stock'],
        'in_use': ['empty'],
        'empty': ['in_stock']
    }
    
    if new_status not in valid_transitions.get(cylinder.status, []):
        return jsonify({'error': f'不允许从 {cylinder.status} 转换到 {new_status}'}), 400
    
    cylinder.status = new_status
    db.session.commit()
    return jsonify(cylinder.to_dict())

@api_bp.route('/cylinders/<int:id>', methods=['DELETE'])
@login_required
@role_required(['admin', 'station'])
def delete_cylinder(id):
    cylinder = Cylinder.query.get_or_404(id)
    
    # 检查钢瓶是否可以删除（不在使用中）
    if cylinder.status in ['delivering', 'in_use']:
        return jsonify({'error': '钢瓶正在使用中，无法删除'}), 400
    
    db.session.delete(cylinder)
    db.session.commit()
    return jsonify({'message': '删除成功'})

@api_bp.route('/cylinders/stats', methods=['GET'])
@login_required
def get_cylinder_stats():
    stats = db.session.query(
        Cylinder.status,
        func.count(Cylinder.id)
    ).group_by(Cylinder.status).all()
    
    result = {s.value: 0 for s in CylinderStatus}
    for status, count in stats:
        result[status] = count
    
    # 即将过期的钢瓶
    expiring_soon = Cylinder.query.filter(
        Cylinder.expiry_date <= datetime.now().date() + timedelta(days=30),
        Cylinder.expiry_date >= datetime.now().date()
    ).count()
    
    result['expiring_soon'] = expiring_soon
    result['total'] = sum(result.get(s.value, 0) for s in CylinderStatus)
    
    return jsonify(result)

# ==================== 订单管理 ====================

@api_bp.route('/orders', methods=['GET'])
@login_required
def get_orders():
    user = get_current_user()
    status = request.args.get('status')
    
    query = Order.query
    
    # 按角色过滤
    if user.role == 'user':
        query = query.filter_by(user_id=user.id)
    elif user.role == 'delivery':
        query = query.filter_by(delivery_id=user.id)
    
    if status:
        query = query.filter_by(status=status)
    
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@api_bp.route('/orders/<int:id>', methods=['GET'])
@login_required
def get_order(id):
    order = Order.query.get_or_404(id)
    user = get_current_user()
    
    # 权限检查
    if user.role == 'user' and order.user_id != user.id:
        return jsonify({'error': '无权访问'}), 403
    elif user.role == 'delivery' and order.delivery_id != user.id:
        return jsonify({'error': '无权访问'}), 403
    
    return jsonify(order.to_dict())

@api_bp.route('/orders', methods=['POST'])
@login_required
@validate_required_fields(['specs', 'address'])
def create_order():
    user = get_current_user()
    data = request.get_json()
    
    # 验证规格
    specs = data['specs']
    if not validate_cylinder_specs(specs):
        return jsonify({'error': '钢瓶规格必须是 5kg, 15kg 或 50kg'}), 400
    
    # 验证数量
    quantity = data.get('quantity', 1)
    if not validate_positive_integer(quantity):
        return jsonify({'error': '订购数量必须是正整数'}), 400
    
    # 检查库存
    available = Cylinder.query.filter_by(specs=specs, status='in_stock').count()
    if available < quantity:
        return jsonify({'error': f'{specs} 规格库存不足，当前可用: {available}'}), 400
    
    # 验证联系电话
    contact_phone = data.get('contact_phone') or user.phone
    if contact_phone and not validate_phone(contact_phone):
        return jsonify({'error': '联系电话格式不正确'}), 400
    
    # 价格配置
    prices = {'5kg': 50, '15kg': 120, '50kg': 350}
    unit_price = prices.get(specs, 120)
    
    try:
        order = Order(
            order_no=f'ORD{datetime.now().strftime("%Y%m%d%H%M%S")}{str(uuid.uuid4())[:4].upper()}',
            user_id=user.id,
            specs=specs,
            quantity=quantity,
            unit_price=unit_price,
            total_amount=unit_price * quantity,
            address=data['address'],
            contact_name=data.get('contact_name') or user.real_name,
            contact_phone=contact_phone,
            remark=data.get('remark')
        )
        
        db.session.add(order)
        db.session.commit()
        return jsonify(order.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'创建订单失败: {str(e)}'}), 500

@api_bp.route('/orders/<int:id>/assign', methods=['PUT'])
@login_required
@role_required(['admin', 'station'])
def assign_order(id):
    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    if order.status != 'pending':
        return jsonify({'error': '只能分配待处理的订单'}), 400
    
    delivery_id = data.get('delivery_id')
    delivery = User.query.filter_by(id=delivery_id, role='delivery').first()
    if not delivery:
        return jsonify({'error': '配送员不存在'}), 400
    
    order.delivery_id = delivery_id
    order.status = 'assigned'
    order.assigned_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(order.to_dict())

@api_bp.route('/orders/<int:id>/status', methods=['PUT'])
@login_required
def update_order_status(id):
    order = Order.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')
    
    # 状态流转验证
    valid_transitions = {
        'pending': ['assigned', 'cancelled'],
        'assigned': ['delivering', 'cancelled'],
        'delivering': ['completed'],
        'completed': [],
        'cancelled': []
    }
    
    if new_status not in valid_transitions.get(order.status, []):
        return jsonify({'error': f'不允许从 {order.status} 转换到 {new_status}'}), 400
    
    order.status = new_status
    if new_status == 'completed':
        order.completed_at = datetime.utcnow()
        # 更新钢瓶状态
        cylinders = Cylinder.query.filter_by(
            specs=order.specs, 
            status='in_stock'
        ).limit(order.quantity).all()
        for c in cylinders:
            c.status = 'in_use'
    
    db.session.commit()
    return jsonify(order.to_dict())

# ==================== 安全管理 ====================

@api_bp.route('/safety/records', methods=['GET'])
@login_required
def get_safety_records():
    user = get_current_user()
    query = SafetyRecord.query
    
    if user.role == 'delivery':
        query = query.filter_by(inspector_id=user.id)
    
    hazard_level = request.args.get('hazard_level')
    if hazard_level:
        query = query.filter_by(hazard_level=hazard_level)
    
    records = query.order_by(SafetyRecord.created_at.desc()).all()
    return jsonify([r.to_dict() for r in records])

@api_bp.route('/safety/records', methods=['POST'])
@login_required
def create_safety_record():
    user = get_current_user()
    data = request.get_json()
    
    record = SafetyRecord(
        order_id=data.get('order_id'),
        inspector_id=user.id,
        check_items=data.get('check_items'),
        hazard_level=data.get('hazard_level', 'none'),
        hazard_description=data.get('hazard_description'),
        photos=','.join(data.get('photos', [])) if data.get('photos') else None,
        rectify_status='pending' if data.get('hazard_level') not in ['none', None] else None
    )
    
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201

@api_bp.route('/safety/upload', methods=['POST'])
@login_required
def upload_safety_photo():
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    # 生成文件名
    ext = file.filename.rsplit('.', 1)[-1] if '.' in file.filename else 'jpg'
    filename = f'{datetime.now().strftime("%Y%m%d%H%M%S")}_{uuid.uuid4().hex[:8]}.{ext}'
    
    # 保存文件
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    
    return jsonify({
        'filename': filename,
        'url': f'/uploads/{filename}'
    })

@api_bp.route('/safety/records/<int:id>', methods=['PUT'])
@login_required
def update_safety_record(id):
    record = SafetyRecord.query.get_or_404(id)
    data = request.get_json()
    
    if data.get('rectify_status'):
        record.rectify_status = data['rectify_status']
    
    if data.get('rectify_photos'):
        record.rectify_photos = ','.join(data['rectify_photos'])
    
    db.session.commit()
    return jsonify(record.to_dict())

# ==================== 统计分析 ====================

@api_bp.route('/stats/dashboard', methods=['GET'])
@login_required
def get_dashboard_stats():
    # 订单统计
    total_orders = Order.query.count()
    pending_orders = Order.query.filter_by(status='pending').count()
    completed_orders = Order.query.filter_by(status='completed').count()
    
    # 钢瓶统计
    total_cylinders = Cylinder.query.count()
    in_stock = Cylinder.query.filter_by(status='in_stock').count()
    
    # 用户统计
    total_users = User.query.filter_by(role='user').count()
    total_delivery = User.query.filter_by(role='delivery').count()
    
    # 今日订单
    today = datetime.now().date()
    today_orders = Order.query.filter(
        func.date(Order.created_at) == today
    ).count()
    
    # 今日收入
    today_revenue = db.session.query(func.sum(Order.total_amount)).filter(
        func.date(Order.completed_at) == today,
        Order.status == 'completed'
    ).scalar() or 0
    
    return jsonify({
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'total_cylinders': total_cylinders,
        'in_stock': in_stock,
        'total_users': total_users,
        'total_delivery': total_delivery,
        'today_orders': today_orders,
        'today_revenue': float(today_revenue)
    })

@api_bp.route('/stats/orders/trend', methods=['GET'])
@login_required
def get_order_trend():
    days = int(request.args.get('days', 7))
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days-1)
    
    # 查询每日订单数
    results = db.session.query(
        func.date(Order.created_at).label('date'),
        func.count(Order.id).label('count')
    ).filter(
        func.date(Order.created_at) >= start_date,
        func.date(Order.created_at) <= end_date
    ).group_by(func.date(Order.created_at)).all()
    
    # 填充缺失的日期
    date_counts = {str(r.date): r.count for r in results}
    trend = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        trend.append({
            'date': str(date),
            'count': date_counts.get(str(date), 0)
        })
    
    return jsonify(trend)

@api_bp.route('/stats/delivery/ranking', methods=['GET'])
@login_required
def get_delivery_ranking():
    results = db.session.query(
        User.id,
        User.username,
        User.real_name,
        func.count(Order.id).label('order_count')
    ).join(
        Order, Order.delivery_id == User.id
    ).filter(
        Order.status == 'completed'
    ).group_by(User.id).order_by(func.count(Order.id).desc()).limit(10).all()
    
    return jsonify([{
        'id': r.id,
        'username': r.username,
        'real_name': r.real_name,
        'order_count': r.order_count
    } for r in results])

# ==================== 公告管理 ====================

@api_bp.route('/announcements', methods=['GET'])
@login_required
def get_announcements():
    announcements = Announcement.query.order_by(
        Announcement.is_top.desc(),
        Announcement.created_at.desc()
    ).all()
    return jsonify([a.to_dict() for a in announcements])

@api_bp.route('/announcements', methods=['POST'])
@login_required
@role_required(['admin'])
def create_announcement():
    user = get_current_user()
    data = request.get_json()
    
    announcement = Announcement(
        title=data.get('title'),
        content=data.get('content'),
        author_id=user.id,
        is_top=data.get('is_top', False)
    )
    
    db.session.add(announcement)
    db.session.commit()
    return jsonify(announcement.to_dict()), 201

@api_bp.route('/announcements/<int:id>', methods=['DELETE'])
@login_required
@role_required(['admin'])
def delete_announcement(id):
    announcement = Announcement.query.get_or_404(id)
    db.session.delete(announcement)
    db.session.commit()
    return jsonify({'message': '删除成功'})

@api_bp.route('/announcements/<int:id>', methods=['PUT'])
@login_required
@role_required(['admin'])
def update_announcement(id):
    announcement = Announcement.query.get_or_404(id)
    data = request.get_json()
    
    announcement.title = data.get('title', announcement.title)
    announcement.content = data.get('content', announcement.content)
    announcement.is_top = data.get('is_top', announcement.is_top)
    
    db.session.commit()
    return jsonify(announcement.to_dict())

# ==================== 评价管理 ====================

@api_bp.route('/ratings', methods=['POST'])
@login_required
def create_rating():
    user = get_current_user()
    data = request.get_json()
    
    order_id = data.get('order_id')
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != user.id:
        return jsonify({'error': '只能评价自己的订单'}), 403
    
    if order.status != 'completed':
        return jsonify({'error': '只能评价已完成的订单'}), 400
    
    existing = Rating.query.filter_by(order_id=order_id).first()
    if existing:
        return jsonify({'error': '该订单已评价'}), 400
    
    rating = Rating(
        order_id=order_id,
        user_id=user.id,
        score=data.get('score', 5),
        comment=data.get('comment')
    )
    
    db.session.add(rating)
    db.session.commit()
    return jsonify(rating.to_dict()), 201

@api_bp.route('/ratings', methods=['GET'])
@login_required
def get_ratings():
    order_id = request.args.get('order_id')
    query = Rating.query
    
    if order_id:
        query = query.filter_by(order_id=order_id)
    
    ratings = query.order_by(Rating.created_at.desc()).all()
    return jsonify([r.to_dict() for r in ratings])

@api_bp.route('/orders/<int:id>/rating', methods=['GET'])
@login_required
def get_order_rating(id):
    rating = Rating.query.filter_by(order_id=id).first()
    if not rating:
        return jsonify({'message': '暂无评价'}), 404
    return jsonify(rating.to_dict())
