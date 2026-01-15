from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    username = 'admin'
    new_password = '123456'
    
    user = User.query.filter_by(username=username).first()
    if user:
        user.set_password(new_password)
        db.session.commit()
        print(f"Succees! User '{username}' password has been reset to '{new_password}'")
    else:
        print(f"Error: User '{username}' not found.")
