from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Book, db

bp = Blueprint('books', __name__, url_prefix='/api/books')


@bp.route('', methods=['GET'])
def get_books():
    query = Book.query

    # 搜索过滤
    keyword = request.args.get('keyword')
    if keyword:
        query = query.filter(
            db.or_(
                Book.title.contains(keyword),
                Book.author.contains(keyword),
                Book.tags.contains(keyword)
            )
        )

    # 状态过滤
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    books = query.order_by(Book.created_at.desc()).all()
    return jsonify({'success': True, 'books': [b.to_dict() for b in books]})


@bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify({'success': True, 'book': book.to_dict()})


@bp.route('', methods=['POST'])
@login_required
def create_book():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    data = request.get_json()

    book = Book(
        title=data['title'],
        author=data['author'],
        publisher=data['publisher'],
        isbn=data.get('isbn', ''),
        tags=data.get('tags', ''),
        source=data.get('source', 'class'),
        donor_id=data.get('donor_id'),
        status='available'
    )

    db.session.add(book)
    db.session.commit()

    return jsonify({'success': True, 'book': book.to_dict()}), 201


@bp.route('/<int:book_id>', methods=['PUT'])
@login_required
def update_book(book_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    book = Book.query.get_or_404(book_id)
    data = request.get_json()

    book.title = data.get('title', book.title)
    book.author = data.get('author', book.author)
    book.publisher = data.get('publisher', book.publisher)
    book.isbn = data.get('isbn', book.isbn)
    book.tags = data.get('tags', book.tags)

    db.session.commit()
    return jsonify({'success': True, 'book': book.to_dict()})


@bp.route('/<int:book_id>/status', methods=['PUT'])
@login_required
def update_book_status(book_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    book = Book.query.get_or_404(book_id)
    data = request.get_json()

    book.status = data.get('status', book.status)
    db.session.commit()

    return jsonify({'success': True, 'book': book.to_dict()})
