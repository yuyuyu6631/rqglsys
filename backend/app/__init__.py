import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # 配置
    app.config['SECRET_KEY'] = 'gas-system-secret-key-2024'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gas_system.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    
    # 初始化扩展
    db.init_app(app)
    CORS(app, supports_credentials=True)
    
    # 注册蓝图
    from app.auth import auth_bp
    from app.api import api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app
