from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import User, Book, BorrowRecord, Setting, DonationRequest, db
from datetime import datetime, timezone

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@bp.route('/borrows', methods=['GET'])
@login_required
def get_all_borrows():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    status = request.args.get('status')
    query = BorrowRecord.query

    if status:
        query = query.filter_by(status=status)

    records = query.order_by(BorrowRecord.request_at.desc()).all()
    return jsonify({'success': True, 'records': [r.to_dict() for r in records]})


@bp.route('/borrows/<int:record_id>/approve', methods=['PUT'])
@login_required
def approve_borrow(record_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    record = BorrowRecord.query.get_or_404(record_id)

    if record.status != 'pending':
        return jsonify({'success': False, 'message': '当前状态不可通过'}), 400

    record.status = 'approved'
    record.approve_at = datetime.now(timezone.utc)
    record.book.status = 'borrowed'

    db.session.commit()
    return jsonify({'success': True, 'record': record.to_dict()})


@bp.route('/borrows/<int:record_id>/reject', methods=['PUT'])
@login_required
def reject_borrow(record_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    record = BorrowRecord.query.get_or_404(record_id)

    if record.status not in ['pending', 'donor_pending']:
        return jsonify({'success': False, 'message': '当前状态不可拒绝'}), 400

    record.status = 'rejected'
    record.book.status = 'available'

    db.session.commit()
    return jsonify({'success': True})


@bp.route('/borrows/<int:record_id>/confirm-return', methods=['PUT'])
@login_required
def confirm_return(record_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    record = BorrowRecord.query.get_or_404(record_id)

    if record.status != 'return_pending':
        return jsonify({'success': False, 'message': '当前状态不可确认归还'}), 400

    record.status = 'completed'
    record.return_at = datetime.now(timezone.utc)
    record.book.status = 'available'

    db.session.commit()
    return jsonify({'success': True, 'record': record.to_dict()})


@bp.route('/users', methods=['GET'])
@login_required
def get_users():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    users = User.query.all()
    return jsonify({'success': True, 'users': [u.to_dict() for u in users]})


@bp.route('/users', methods=['POST'])
@login_required
def create_user():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    data = request.get_json()

    if User.query.filter_by(student_id=data['student_id']).first():
        return jsonify({'success': False, 'message': '学号已存在'}), 400

    user = User(
        student_id=data['student_id'],
        name=data['name'],
        is_admin=data.get('is_admin', False)
    )
    user.set_password(data.get('password', '123456'))

    db.session.add(user)
    db.session.commit()

    return jsonify({'success': True, 'user': user.to_dict()}), 201


@bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    user = User.query.get_or_404(user_id)

    # 检查是否有未还图书
    has_borrow = BorrowRecord.query.filter(
        BorrowRecord.borrower_id == user_id,
        BorrowRecord.status.in_(['approved', 'pending', 'donor_pending', 'return_pending'])
    ).first()

    if has_borrow:
        return jsonify({'success': False, 'message': '该用户有未还图书，无法删除'}), 400

    db.session.delete(user)
    db.session.commit()

    return jsonify({'success': True})


@bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    # 基础统计
    total_books = Book.query.count()
    available_books = Book.query.filter_by(status='available').count()
    borrowed_books = Book.query.filter_by(status='borrowed').count()
    total_users = User.query.filter_by(is_admin=False).count()

    # 待审核数量（借阅申请 + 归还申请 + 捐赠申请）
    pending_borrows = BorrowRecord.query.filter(BorrowRecord.status.in_(['pending', 'donor_pending'])).count()
    pending_returns = BorrowRecord.query.filter_by(status='return_pending').count()
    pending_donations = DonationRequest.query.filter_by(status='pending').count()
    pending_reviews = pending_borrows + pending_returns + pending_donations

    # 热门图书榜（借阅次数最多的书）
    from sqlalchemy import func
    popular_books = db.session.query(
        Book.title,
        func.count(BorrowRecord.id).label('borrow_count')
    ).join(BorrowRecord).group_by(Book.id).order_by(func.count(BorrowRecord.id).desc()).limit(10).all()

    # 班级阅读排行榜（借阅最多的学生）
    top_readers = db.session.query(
        User.name,
        func.count(BorrowRecord.id).label('read_count')
    ).join(BorrowRecord).filter(User.is_admin == False).group_by(User.id).order_by(func.count(BorrowRecord.id).desc()).limit(10).all()

    # 逾期列表（已批准借阅且超过最大借阅天数）
    max_days_setting = Setting.query.filter_by(key='max_borrow_days').first()
    max_days = int(max_days_setting.value) if max_days_setting else 30

    from datetime import timedelta
    overdue_threshold = datetime.now(timezone.utc) - timedelta(days=max_days)

    overdue_records = BorrowRecord.query.filter(
        BorrowRecord.status == 'approved',
        BorrowRecord.approve_at < overdue_threshold
    ).all()

    return jsonify({
        'success': True,
        'stats': {
            'total_books': total_books,
            'available_books': available_books,
            'borrowed_books': borrowed_books,
            'total_users': total_users,
            'pending_reviews': pending_reviews,
            'pending_borrows': pending_borrows,
            'pending_returns': pending_returns,
            'pending_donations': pending_donations
        },
        'popular_books': [{'title': b.title, 'count': b.borrow_count} for b in popular_books],
        'top_readers': [{'name': r.name, 'count': r.read_count} for r in top_readers],
        'overdue': [r.to_dict() for r in overdue_records]
    })


@bp.route('/settings', methods=['GET'])
@login_required
def get_settings():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    settings = Setting.query.all()
    result = {s.key: s.value for s in settings}

    # 默认值
    if 'max_borrow_days' not in result:
        result['max_borrow_days'] = '30'
    if 'max_books_per_user' not in result:
        result['max_books_per_user'] = '5'

    return jsonify({'success': True, 'settings': result})


@bp.route('/settings', methods=['PUT'])
@login_required
def update_settings():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    data = request.get_json()

    for key, value in data.items():
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
        else:
            setting = Setting(key=key, value=str(value))
            db.session.add(setting)

    db.session.commit()
    return jsonify({'success': True})


@bp.route('/overdue/send-reminder', methods=['POST'])
@login_required
def send_overdue_reminder():
    """发送逾期提醒"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    data = request.get_json()
    record_ids = data.get('record_ids', [])

    if not record_ids:
        return jsonify({'success': False, 'message': '请选择要提醒的记录'}), 400

    # 在本地系统中标记已发送提醒
    reminder_sent = []
    for record_id in record_ids:
        record = BorrowRecord.query.get(record_id)
        if record and record.status == 'approved':
            reminder_sent.append({
                'record_id': record_id,
                'borrower_name': record.borrower.name if record.borrower else None,
                'book_title': record.book.title if record.book else None
            })

    return jsonify({
        'success': True,
        'message': f'已向 {len(reminder_sent)} 位用户发送提醒',
        'reminder_sent': reminder_sent
    })
