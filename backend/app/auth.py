from functools import wraps

from flask import Blueprint, jsonify, request, session

from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__)


def _get_session_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not _get_session_user():
            session.clear()
            return jsonify({'error': '请先登录'}), 401
        return f(*args, **kwargs)

    return decorated_function


def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = _get_session_user()
            if not user:
                session.clear()
                return jsonify({'error': '请先登录'}), 401
            if user.role not in roles:
                return jsonify({'error': '权限不足'}), 403
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def get_current_user():
    return _get_session_user()


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': '用户名或密码错误'}), 401

    session['user_id'] = user.id
    session['user_role'] = user.role

    return jsonify({
        'message': '登录成功',
        'user': user.to_dict(),
    })


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': '已退出登录'})


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user_info():
    user = _get_session_user()
    if not user:
        session.clear()
        return jsonify({'error': '用户不存在'}), 404
    return jsonify(user.to_dict())
