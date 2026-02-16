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


def test_login_success(client):
    user = User(student_id='2024001', name='张三')
    user.set_password('123456')
    db.session.add(user)
    db.session.commit()

    response = client.post('/api/auth/login', json={
        'student_id': '2024001',
        'password': '123456'
    })

    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['user']['name'] == '张三'


def test_login_fail(client):
    response = client.post('/api/auth/login', json={
        'student_id': 'wrong',
        'password': 'wrong'
    })

    assert response.status_code == 401
    data = response.get_json()
    assert data['success'] is False
