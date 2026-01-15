from functools import wraps
from flask import Blueprint, request, jsonify, session
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '请先登录'}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': '请先登录'}), 401
            user = User.query.get(session['user_id'])
            if not user or user.role not in roles:
                return jsonify({'error': '权限不足'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

# ==================== 认证接口 ====================

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    print(f"[DEBUG] Login attempt for: {username}")
    user = User.query.filter_by(username=username).first()
    
    if user:
        print(f"[DEBUG] User found. Hash: {user.password_hash}")
        is_valid = user.check_password(password)
        print(f"[DEBUG] Password valid? {is_valid}")
    else:
        print(f"[DEBUG] User not found")

    if not user or not user.check_password(password):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    session['user_id'] = user.id
    session['user_role'] = user.role
    
    return jsonify({
        'message': '登录成功',
        'user': user.to_dict()
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': '已退出登录'})

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user_info():
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    return jsonify(user.to_dict())
