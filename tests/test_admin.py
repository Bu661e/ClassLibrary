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


def test_admin_approve_borrow(client):
    # 创建管理员和普通用户
    admin = User(student_id='admin', name='管理员', is_admin=True)
    admin.set_password('admin')
    db.session.add(admin)

    user = User(student_id='2024001', name='张三')
    user.set_password('123')
    db.session.add(user)

    book = Book(title='Python', author='A', publisher='P', status='pending_borrow')
    db.session.add(book)
    db.session.commit()

    record = BorrowRecord(book_id=book.id, borrower_id=user.id, status='pending')
    db.session.add(record)
    db.session.commit()

    # 管理员登录
    client.post('/api/auth/login', json={'student_id': 'admin', 'password': 'admin'})

    # 通过借阅
    response = client.put(f'/api/admin/borrows/{record.id}/approve')
    assert response.status_code == 200

    # 检查状态
    record = BorrowRecord.query.get(record.id)
    assert record.status == 'approved'
    assert record.book.status == 'borrowed'
