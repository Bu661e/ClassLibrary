import pytest
from app import app, db
from models import User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_user_create(client):
    user = User(student_id='2024001', name='张三', is_admin=False)
    user.set_password('123456')
    db.session.add(user)
    db.session.commit()
    
    assert user.id is not None
    assert user.student_id == '2024001'
    assert user.check_password('123456') is True
    assert user.check_password('wrong') is False
