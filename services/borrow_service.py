from models import Book, BorrowRecord, DonorConfirm, Setting, db


def get_max_books_per_user():
    setting = Setting.query.filter_by(key='max_books_per_user').first()
    return int(setting.value) if setting else 5


def get_current_borrow_count(user_id):
    return BorrowRecord.query.filter(
        BorrowRecord.borrower_id == user_id,
        BorrowRecord.status.in_(['approved', 'pending', 'donor_pending', 'return_pending'])
    ).count()


def request_borrow(book_id, user_id):
    book = Book.query.get(book_id)
    if not book:
        return {'success': False, 'message': '图书不存在'}, 404

    if book.status != 'available':
        return {'success': False, 'message': '图书不可借阅'}, 400

    # 检查最大借阅数量
    max_books = get_max_books_per_user()
    current_count = get_current_borrow_count(user_id)
    if current_count >= max_books:
        return {'success': False, 'message': f'每人最多借阅{max_books}本书'}, 400

    # 创建借阅记录
    record = BorrowRecord(
        book_id=book_id,
        borrower_id=user_id,
        status='pending'
    )

    # 如果是捐赠图书，需要捐赠者确认
    if book.source == 'donated' and book.donor_id:
        record.status = 'donor_pending'
        db.session.add(record)
        db.session.flush()

        confirm = DonorConfirm(
            borrow_record_id=record.id,
            donor_id=book.donor_id,
            status='pending'
        )
        db.session.add(confirm)
    else:
        db.session.add(record)

    # 锁定图书
    book.status = 'pending_borrow'
    db.session.commit()

    return {'success': True, 'record': record.to_dict()}, 201
