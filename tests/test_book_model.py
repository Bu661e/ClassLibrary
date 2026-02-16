import pytest
from app import app, db
from models import Book

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_book_create(client):
    book = Book(
        title='Python编程',
        author='张三',
        publisher='人民邮电出版社',
        isbn='9787111234567',
        tags='编程,Python',
        source='class',
        status='available'
    )
    db.session.add(book)
    db.session.commit()
    
    assert book.id is not None
    assert book.title == 'Python编程'
    assert book.status == 'available'
    
def test_book_to_dict(client):
    book = Book(
        title='测试书名',
        author='作者',
        publisher='出版社',
        tags='标签1,标签2'
    )
    db.session.add(book)
    db.session.commit()
    
    data = book.to_dict()
    assert data['title'] == '测试书名'
    assert data['tags'] == ['标签1', '标签2']
