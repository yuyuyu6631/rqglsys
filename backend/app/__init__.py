import os

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text

db = SQLAlchemy()


def ensure_schema(app: Flask) -> None:
    """Apply lightweight schema updates for local SQLite deployments."""
    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())

    if 'orders' in tables:
        order_columns = {column['name'] for column in inspector.get_columns('orders')}
        if 'allocated_cylinder_ids' not in order_columns:
            with db.engine.begin() as connection:
                connection.execute(text('ALTER TABLE orders ADD COLUMN allocated_cylinder_ids TEXT'))


def create_app(test_config: dict | None = None):
    app = Flask(__name__)

    app.config.update(
        SECRET_KEY='gas-system-secret-key-2024',
        SQLALCHEMY_DATABASE_URI='sqlite:///gas_system.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads'),
        MAX_CONTENT_LENGTH=8 * 1024 * 1024,
    )

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    CORS(app, supports_credentials=True)

    from app.api import api_bp
    from app.auth import auth_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/uploads/<path:filename>', methods=['GET'])
    def uploaded_file(filename: str):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    with app.app_context():
        db.create_all()
        ensure_schema(app)

    return app
