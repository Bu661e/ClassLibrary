import pytest
from app import app, db
from models import User, Book, BorrowRecord, DonorConfirm
from werkzeug.security import generate_password_hash


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


def test_borrow_record_create(client):
    # 使用 pbkdf2 方法避免 scrypt 兼容性问题
    user = User(
        student_id='2024001', 
        name='张三',
        password_hash=generate_password_hash('123', method='pbkdf2:sha256')
    )
    db.session.add(user)
    
    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()
    
    record = BorrowRecord(
        book_id=book.id,
        borrower_id=user.id,
        status='pending'
    )
    db.session.add(record)
    db.session.commit()
    
    assert record.id is not None
    assert record.status == 'pending'


def test_donor_confirm_create(client):
    user = User(
        student_id='2024001', 
        name='张三',
        password_hash=generate_password_hash('123', method='pbkdf2:sha256')
    )
    db.session.add(user)
    
    book = Book(title='Python', author='A', publisher='P')
    db.session.add(book)
    db.session.commit()
    
    record = BorrowRecord(book_id=book.id, borrower_id=user.id)
    db.session.add(record)
    db.session.commit()
    
    confirm = DonorConfirm(
        borrow_record_id=record.id,
        donor_id=user.id,
        status='pending'
    )
    db.session.add(confirm)
    db.session.commit()
    
    assert confirm.id is not None
