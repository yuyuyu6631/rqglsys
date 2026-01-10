"""
参数验证工具模块
提供常用的参数验证装饰器和验证函数
"""
from functools import wraps
from flask import request, jsonify
import re
from datetime import datetime


def validate_required_fields(required_fields):
    """验证必填字段装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({'error': '请求体不能为空'}), 400
            
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return jsonify({
                    'error': f'缺少必填字段: {", ".join(missing_fields)}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_cylinder_specs(specs):
    """验证钢瓶规格"""
    valid_specs = ['5kg', '15kg', '50kg']
    return specs in valid_specs


def validate_phone(phone):
    """验证手机号"""
    if not phone:
        return True  # 允许为空
    pattern = r'^1[3-9]\d{9}$'
    return re.match(pattern, phone) is not None


def validate_date_format(date_str):
    """验证日期格式 YYYY-MM-DD"""
    if not date_str:
        return True
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False


def validate_date_range(start_date_str, end_date_str):
    """验证日期范围（结束日期必须晚于开始日期）"""
    if not start_date_str or not end_date_str:
        return True
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        return end_date > start_date
    except ValueError:
        return False


def validate_user_role(role):
    """验证用户角色"""
    valid_roles = ['admin', 'station', 'delivery', 'user']
    return role in valid_roles


def validate_cylinder_status(status):
    """验证钢瓶状态"""
    valid_statuses = ['in_stock', 'delivering', 'in_use', 'empty']
    return status in valid_statuses


def validate_order_status(status):
    """验证订单状态"""
    valid_statuses = ['pending', 'assigned', 'delivering', 'completed', 'cancelled']
    return status in valid_statuses


def validate_hazard_level(level):
    """验证隐患等级"""
    valid_levels = ['none', 'low', 'medium', 'high']
    return level in valid_levels


def validate_rating_score(score):
    """验证评分（1-5星）"""
    try:
        score_int = int(score)
        return 1 <= score_int <= 5
    except (ValueError, TypeError):
        return False


def validate_positive_integer(value):
    """验证正整数"""
    try:
        int_value = int(value)
        return int_value > 0
    except (ValueError, TypeError):
        return False
