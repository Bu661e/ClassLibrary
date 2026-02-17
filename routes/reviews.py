from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import BookReview, WishList, DonationRequest, Book, DonorConfirm, BorrowRecord, db

bp = Blueprint('reviews', __name__, url_prefix='/api')


# ==================== 书评相关 ====================

@bp.route('/books/<int:book_id>/reviews', methods=['GET'])
def get_book_reviews(book_id):
    """获取图书的所有评价"""
    reviews = BookReview.query.filter_by(book_id=book_id).order_by(BookReview.created_at.desc()).all()
    return jsonify({'success': True, 'reviews': [r.to_dict() for r in reviews]})


@bp.route('/books/<int:book_id>/reviews', methods=['POST'])
@login_required
def create_book_review(book_id):
    """创建图书评价"""
    book = Book.query.get_or_404(book_id)
    data = request.get_json()

    rating = data.get('rating', 5)
    if rating < 1 or rating > 5:
        return jsonify({'success': False, 'message': '评分范围为1-5'}), 400

    # 检查用户是否已评价过该图书
    existing = BookReview.query.filter_by(book_id=book_id, user_id=current_user.id).first()
    if existing:
        return jsonify({'success': False, 'message': '您已评价过该图书'}), 400

    review = BookReview(
        book_id=book_id,
        user_id=current_user.id,
        rating=rating,
        content=data.get('content', ''),
        review_type=data.get('review_type', 'neutral')
    )

    db.session.add(review)
    db.session.commit()

    return jsonify({'success': True, 'review': review.to_dict()}), 201


# ==================== 心愿单相关 ====================

@bp.route('/wishlists', methods=['GET'])
@login_required
def get_my_wishlists():
    """获取我的心愿单"""
    wishlists = WishList.query.filter_by(user_id=current_user.id).order_by(WishList.created_at.desc()).all()
    return jsonify({'success': True, 'wishlists': [w.to_dict() for w in wishlists]})


@bp.route('/wishlists', methods=['POST'])
@login_required
def create_wishlist():
    """添加心愿单"""
    data = request.get_json()

    wishlist = WishList(
        user_id=current_user.id,
        book_title=data['book_title'],
        author=data.get('author', ''),
        publisher=data.get('publisher', ''),
        isbn=data.get('isbn', ''),
        reason=data.get('reason', '')
    )

    db.session.add(wishlist)
    db.session.commit()

    return jsonify({'success': True, 'wishlist': wishlist.to_dict()}), 201


@bp.route('/wishlists/<int:wish_id>', methods=['DELETE'])
@login_required
def delete_wishlist(wish_id):
    """删除心愿单"""
    wishlist = WishList.query.get_or_404(wish_id)

    if wishlist.user_id != current_user.id:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    db.session.delete(wishlist)
    db.session.commit()

    return jsonify({'success': True})


@bp.route('/admin/wishlists', methods=['GET'])
@login_required
def get_all_wishlists():
    """获取所有心愿单（管理员）"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    status = request.args.get('status')
    query = WishList.query

    if status:
        query = query.filter_by(status=status)

    wishlists = query.order_by(WishList.created_at.desc()).all()
    return jsonify({'success': True, 'wishlists': [w.to_dict() for w in wishlists]})


@bp.route('/admin/wishlists/<int:wish_id>/fulfill', methods=['PUT'])
@login_required
def fulfill_wishlist(wish_id):
    """标记心愿单为已满足（管理员）"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    wishlist = WishList.query.get_or_404(wish_id)
    wishlist.status = 'fulfilled'
    db.session.commit()

    return jsonify({'success': True})


@bp.route('/admin/wishlists/<int:wish_id>/reject', methods=['PUT'])
@login_required
def reject_wishlist(wish_id):
    """拒绝心愿单（管理员）"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    wishlist = WishList.query.get_or_404(wish_id)
    wishlist.status = 'rejected'
    db.session.commit()

    return jsonify({'success': True})


# ==================== 捐赠申请相关 ====================

@bp.route('/donations', methods=['GET'])
@login_required
def get_my_donations():
    """获取我的捐赠申请和已捐赠的图书"""
    # 获取用户的捐赠申请（待审核、已通过、已拒绝）
    donations = DonationRequest.query.filter_by(user_id=current_user.id).order_by(DonationRequest.created_at.desc()).all()

    # 获取用户已捐赠的图书（捐赠申请通过后创建的图书）
    donated_books = Book.query.filter_by(donor_id=current_user.id).order_by(Book.created_at.desc()).all()

    # 为每本已捐赠的图书检查是否有待确认的借阅申请
    books_with_confirms = []
    for book in donated_books:
        # 检查是否有待捐赠者确认的借阅申请
        pending_confirm = DonorConfirm.query.filter_by(
            donor_id=current_user.id,
            status='pending'
        ).join(BorrowRecord).filter(BorrowRecord.book_id == book.id).first()

        book_dict = book.to_dict()
        book_dict['has_pending_confirm'] = pending_confirm is not None
        if pending_confirm:
            book_dict['pending_confirm'] = {
                'id': pending_confirm.id,
                'borrow_record': pending_confirm.borrow_record.to_dict() if pending_confirm.borrow_record else None
            }
        books_with_confirms.append(book_dict)

    return jsonify({
        'success': True,
        'donations': [d.to_dict() for d in donations],
        'donated_books': books_with_confirms
    })


@bp.route('/donations', methods=['POST'])
@login_required
def create_donation():
    """提交捐赠申请"""
    data = request.get_json()

    donation = DonationRequest(
        user_id=current_user.id,
        title=data['title'],
        author=data.get('author', ''),
        publisher=data.get('publisher', ''),
        isbn=data.get('isbn', ''),
        tags=data.get('tags', ''),
        reason=data.get('reason', '')
    )

    db.session.add(donation)
    db.session.commit()

    return jsonify({'success': True, 'donation': donation.to_dict()}), 201


@bp.route('/admin/donations', methods=['GET'])
@login_required
def get_all_donations():
    """获取所有捐赠申请（管理员）"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    status = request.args.get('status')
    query = DonationRequest.query

    if status:
        query = query.filter_by(status=status)

    donations = query.order_by(DonationRequest.created_at.desc()).all()
    return jsonify({'success': True, 'donations': [d.to_dict() for d in donations]})


@bp.route('/admin/donations/<int:donation_id>/approve', methods=['PUT'])
@login_required
def approve_donation(donation_id):
    """批准捐赠申请，创建图书入库"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    donation = DonationRequest.query.get_or_404(donation_id)

    if donation.status != 'pending':
        return jsonify({'success': False, 'message': '当前状态不可批准'}), 400

    # 创建图书
    book = Book(
        title=donation.title,
        author=donation.author,
        publisher=donation.publisher,
        isbn=donation.isbn,
        tags=donation.tags,
        source='donated',
        donor_id=donation.user_id,
        status='available'
    )

    donation.status = 'approved'
    db.session.add(book)
    db.session.commit()

    return jsonify({'success': True, 'book': book.to_dict()})


@bp.route('/admin/donations/<int:donation_id>/reject', methods=['PUT'])
@login_required
def reject_donation(donation_id):
    """拒绝捐赠申请"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '权限不足'}), 403

    donation = DonationRequest.query.get_or_404(donation_id)

    if donation.status != 'pending':
        return jsonify({'success': False, 'message': '当前状态不可拒绝'}), 400

    donation.status = 'rejected'
    db.session.commit()

    return jsonify({'success': True})
