import pytest
from app import app, db
from models import User, Book


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


def test_get_books_list(client):
    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()

    response = client.get('/api/books')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['books']) == 1
    assert data['books'][0]['title'] == 'Python'


def test_get_book_detail(client):
    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()

    response = client.get(f'/api/books/{book.id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['book']['title'] == 'Python'
