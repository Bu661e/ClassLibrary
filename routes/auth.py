from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import User, db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    student_id = data.get('student_id')
    password = data.get('password')

    user = User.query.filter_by(student_id=student_id).first()

    if user and user.check_password(password):
        login_user(user)
        return jsonify({'success': True, 'user': user.to_dict()})

    return jsonify({'success': False, 'message': '学号或密码错误'}), 401


@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True})


@bp.route('/me', methods=['GET'])
@login_required
def me():
    return jsonify({'success': True, 'user': current_user.to_dict()})
