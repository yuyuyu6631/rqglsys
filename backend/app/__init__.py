import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()


def create_app(test_config: dict | None = None):
    app = Flask(__name__)

    # 默认配置
    app.config.update(
        SECRET_KEY='gas-system-secret-key-2024',
        SQLALCHEMY_DATABASE_URI='sqlite:///gas_system.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads'),
    )

    # 测试环境或自定义配置覆盖
    if test_config:
        app.config.update(test_config)

    # 初始化扩展（使用最终配置）
    db.init_app(app)
    CORS(app, supports_credentials=True)

    # 注册蓝图
    from app.auth import auth_bp
    from app.api import api_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    # 创建数据库表（根据当前配置）
    with app.app_context():
        db.create_all()

    return app
