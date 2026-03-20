"""Shared request validation helpers for backend APIs."""

import re
from datetime import datetime
from functools import wraps

from flask import jsonify, request


def validate_required_fields(required_fields):
    """Validate required JSON fields."""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json(silent=True)
            if not isinstance(data, dict):
                return jsonify({'error': '请求体不能为空'}), 400

            missing_fields = []
            for field in required_fields:
                value = data.get(field)
                if value is None:
                    missing_fields.append(field)
                elif isinstance(value, str) and not value.strip():
                    missing_fields.append(field)

            if missing_fields:
                return jsonify({'error': f'缺少必填字段: {", ".join(missing_fields)}'}), 400

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def validate_cylinder_specs(specs):
    return specs in ['5kg', '15kg', '50kg']


def validate_phone(phone):
    if not phone:
        return True
    return re.fullmatch(r'1[3-9]\d{9}', str(phone)) is not None


def validate_date_format(date_str):
    if not date_str:
        return True
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False


def validate_date_range(start_date_str, end_date_str):
    if not start_date_str or not end_date_str:
        return True
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        return end_date > start_date
    except ValueError:
        return False


def validate_user_role(role):
    return role in ['admin', 'station', 'delivery', 'user']


def validate_cylinder_status(status):
    return status in ['in_stock', 'delivering', 'in_use', 'empty']


def validate_order_status(status):
    return status in ['pending', 'assigned', 'delivering', 'completed', 'cancelled']


def validate_hazard_level(level):
    return level in ['none', 'low', 'medium', 'high']


def validate_rating_score(score):
    try:
        score_int = int(score)
    except (TypeError, ValueError):
        return False
    return 1 <= score_int <= 5


def validate_positive_integer(value):
    try:
        int_value = int(value)
    except (TypeError, ValueError):
        return False
    return int_value > 0
