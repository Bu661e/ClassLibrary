import pytest
from app import app, db
from models import User, Book, BorrowRecord


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


def test_request_borrow(client):
    user = User(student_id='2024001', name='张三')
    user.set_password('123')
    db.session.add(user)

    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()

    # 登录
    client.post('/api/auth/login', json={'student_id': '2024001', 'password': '123'})

    # 申请借阅
    response = client.post('/api/borrows', json={'book_id': book.id})
    assert response.status_code == 201

    # 检查状态
    book = Book.query.get(book.id)
    assert book.status == 'pending_borrow'
