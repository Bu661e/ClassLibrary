from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import BorrowRecord, DonorConfirm, db
from services.borrow_service import request_borrow

bp = Blueprint('borrow', __name__, url_prefix='/api')


@bp.route('/borrows', methods=['GET'])
@login_required
def get_my_borrows():
    records = BorrowRecord.query.filter_by(borrower_id=current_user.id)\
        .order_by(BorrowRecord.request_at.desc()).all()
    return jsonify({'success': True, 'records': [r.to_dict() for r in records]})


@bp.route('/borrows', methods=['POST'])
@login_required
def create_borrow():
    data = request.get_json()
    book_id = data.get('book_id')

    result, status_code = request_borrow(book_id, current_user.id)
    return jsonify(result), status_code


@bp.route('/borrows/<int:record_id>/return', methods=['PUT'])
@login_required
def request_return(record_id):
    record = BorrowRecord.query.get_or_404(record_id)

    if record.borrower_id != current_user.id:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    if record.status != 'approved':
        return jsonify({'success': False, 'message': '当前状态不可归还'}), 400

    record.status = 'return_pending'
    record.book.status = 'pending_return'
    db.session.commit()

    return jsonify({'success': True, 'record': record.to_dict()})


@bp.route('/donor/confirms', methods=['GET'])
@login_required
def get_donor_confirms():
    """获取待捐赠者确认的借阅申请"""
    confirms = DonorConfirm.query.filter(
        DonorConfirm.donor_id == current_user.id,
        DonorConfirm.status == 'pending'
    ).all()

    result = []
    for c in confirms:
        result.append({
            'id': c.id,
            'borrow_record': c.borrow_record.to_dict(),
            'status': c.status
        })

    return jsonify({'success': True, 'confirms': result})


@bp.route('/donor/confirms/<int:confirm_id>/approve', methods=['PUT'])
@login_required
def approve_donor_confirm(confirm_id):
    confirm = DonorConfirm.query.get_or_404(confirm_id)

    if confirm.donor_id != current_user.id:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    confirm.status = 'approved'
    confirm.confirmed_at = db.func.now()

    # 捐赠者同意后，借阅记录变为待管理员审核
    confirm.borrow_record.status = 'pending'

    db.session.commit()
    return jsonify({'success': True})


@bp.route('/donor/confirms/<int:confirm_id>/reject', methods=['PUT'])
@login_required
def reject_donor_confirm(confirm_id):
    confirm = DonorConfirm.query.get_or_404(confirm_id)

    if confirm.donor_id != current_user.id:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    confirm.status = 'rejected'
    confirm.confirmed_at = db.func.now()

    # 捐赠者拒绝后，借阅记录被拒绝，图书恢复可借
    record = confirm.borrow_record
    record.status = 'rejected'
    record.book.status = 'available'

    db.session.commit()
    return jsonify({'success': True})
