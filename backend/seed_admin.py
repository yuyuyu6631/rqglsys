print("Starting seed script...")
from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', role='admin', real_name='系统管理员')
        admin.set_password('123456')
        db.session.add(admin)
        db.session.commit()
        print("Admin user 'admin' created with password '123456'")
    else:
        print("Admin user already exists")
