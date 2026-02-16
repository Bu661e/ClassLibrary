# 班级图书共享管理系统 - 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 实现班级图书共享管理系统 MVP，包含用户认证、图书管理、借阅流程、捐赠者确认、数据看板。

**Architecture:** Flask + SQLite 后端，Vue 3 + Element Plus CDN 前端，前后端同仓库部署。遵循 TDD，小步提交。

**Tech Stack:** Python 3.10+, Flask, Flask-SQLAlchemy, Flask-Login, Vue 3, Element Plus, SQLite

---

## 项目初始化

### Task 1: 创建项目结构和基础配置

**Files:**
- Create: `requirements.txt`
- Create: `config.py`
- Create: `app.py` (基础框架)
- Create: `.gitignore`

**Step 1: 创建 requirements.txt**

```txt
flask==3.0.0
flask-sqlalchemy==3.1.1
flask-login==0.6.3
flask-cors==4.0.0
werkzeug==3.0.1
```

**Step 2: 创建 config.py**

```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///library.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_BORROW_DAYS = 30
    MAX_BOOKS_PER_USER = 5
```

**Step 3: 创建基础 app.py**

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'auth.login'

from routes import auth, books, borrow, admin

app.register_blueprint(auth.bp)
app.register_blueprint(books.bp)
app.register_blueprint(borrow.bp)
app.register_blueprint(admin.bp)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
```

**Step 4: 创建 .gitignore**

```gitignore
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.db
*.sqlite
*.sqlite3
instance/
.pytest_cache/
.coverage
htmlcov/
.venv/
venv/
```

**Step 5: 创建目录结构**

```bash
mkdir -p routes services static/js/components static/js/pages templates tests
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: initialize project structure"
```

---

## 数据模型层

### Task 2: 实现用户模型和认证基础

**Files:**
- Create: `models.py` (User 模型)
- Modify: `app.py` (添加 user_loader)
- Create: `tests/test_models.py`

**Step 1: 编写 User 模型测试**

```python
import pytest
from app import app, db
from models import User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_user_create(client):
    user = User(student_id='2024001', name='张三', is_admin=False)
    user.set_password('123456')
    db.session.add(user)
    db.session.commit()

    assert user.id is not None
    assert user.student_id == '2024001'
    assert user.check_password('123456') is True
    assert user.check_password('wrong') is False
```

**Step 2: 运行测试确认失败**

```bash
python -m pytest tests/test_models.py::test_user_create -v
```
Expected: FAIL - User model not defined

**Step 3: 实现 User 模型**

```python
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'is_admin': self.is_admin
        }
```

**Step 4: 修改 app.py 导入 db**

```python
from flask import Flask
from flask_login import LoginManager
from config import Config
from models import db, User

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ... 注册蓝图
```

**Step 5: 运行测试确认通过**

```bash
python -m pytest tests/test_models.py::test_user_create -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add tests/test_models.py models.py app.py
git commit -m "feat: add User model with password hashing"
```

---

### Task 3: 实现图书模型

**Files:**
- Modify: `models.py` (添加 Book 模型)
- Create: `tests/test_book_model.py`

**Step 1: 编写 Book 模型测试**

```python
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
```

**Step 2: 运行测试确认失败**

**Step 3: 实现 Book 模型**

```python
class Book(db.Model):
    __tablename__ = 'books'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    author = db.Column(db.String(50), nullable=False)
    publisher = db.Column(db.String(100), nullable=False)
    isbn = db.Column(db.String(20))
    tags = db.Column(db.String(200))
    source = db.Column(db.String(20), default='class')  # class, donated
    donor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='available')  # available, pending_borrow, borrowed, pending_return, unavailable
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    donor = db.relationship('User', foreign_keys=[donor_id])

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'publisher': self.publisher,
            'isbn': self.isbn,
            'tags': self.tags.split(',') if self.tags else [],
            'source': self.source,
            'donor_id': self.donor_id,
            'donor_name': self.donor.name if self.donor else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
```

**Step 4: 运行测试确认通过**

**Step 5: Commit**

```bash
git add tests/test_book_model.py models.py
git commit -m "feat: add Book model"
```

---

### Task 4: 实现借阅记录和捐赠者确认模型

**Files:**
- Modify: `models.py` (添加 BorrowRecord, DonorConfirm, Setting)
- Create: `tests/test_borrow_model.py`

**Step 1: 编写测试**

```python
def test_borrow_record_create(client):
    from models import BorrowRecord

    # 创建用户和图书
    user = User(student_id='2024001', name='张三')
    user.set_password('123')
    db.session.add(user)

    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()

    # 创建借阅记录
    record = BorrowRecord(
        book_id=book.id,
        borrower_id=user.id,
        status='pending'
    )
    db.session.add(record)
    db.session.commit()

    assert record.id is not None
    assert record.status == 'pending'
```

**Step 2: 实现模型**

```python
class BorrowRecord(db.Model):
    __tablename__ = 'borrow_records'

    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, donor_pending, approved, return_pending, completed, rejected
    request_at = db.Column(db.DateTime, default=datetime.utcnow)
    approve_at = db.Column(db.DateTime, nullable=True)
    return_at = db.Column(db.DateTime, nullable=True)

    book = db.relationship('Book')
    borrower = db.relationship('User', foreign_keys=[borrower_id])

    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'book_title': self.book.title if self.book else None,
            'borrower_id': self.borrower_id,
            'borrower_name': self.borrower.name if self.borrower else None,
            'status': self.status,
            'request_at': self.request_at.isoformat() if self.request_at else None,
            'approve_at': self.approve_at.isoformat() if self.approve_at else None,
            'return_at': self.return_at.isoformat() if self.return_at else None
        }

class DonorConfirm(db.Model):
    __tablename__ = 'donor_confirms'

    id = db.Column(db.Integer, primary_key=True)
    borrow_record_id = db.Column(db.Integer, db.ForeignKey('borrow_records.id'), nullable=False)
    donor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    confirmed_at = db.Column(db.DateTime, nullable=True)

    borrow_record = db.relationship('BorrowRecord')
    donor = db.relationship('User')

class Setting(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(255))
```

**Step 3: 运行测试确认通过**

**Step 4: Commit**

```bash
git add tests/test_borrow_model.py models.py
git commit -m "feat: add BorrowRecord, DonorConfirm, Setting models"
```

---

## 认证路由

### Task 5: 实现认证 API

**Files:**
- Create: `routes/__init__.py`
- Create: `routes/auth.py`
- Create: `tests/test_auth.py`

**Step 1: 编写测试**

```python
def test_login_success(client):
    from models import User
    user = User(student_id='2024001', name='张三')
    user.set_password('123456')
    db.session.add(user)
    db.session.commit()

    response = client.post('/api/auth/login', json={
        'student_id': '2024001',
        'password': '123456'
    })

    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['user']['name'] == '张三'

def test_login_fail(client):
    response = client.post('/api/auth/login', json={
        'student_id': 'wrong',
        'password': 'wrong'
    })

    assert response.status_code == 401
```

**Step 2: 实现 auth.py**

```python
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
```

**Step 3: 运行测试确认通过**

**Step 4: Commit**

```bash
git add routes/__init__.py routes/auth.py tests/test_auth.py
git commit -m "feat: implement authentication API"
```

---

## 图书路由

### Task 6: 实现图书列表和详情 API

**Files:**
- Create: `routes/books.py`
- Create: `tests/test_books.py`

**Step 1: 编写测试**

```python
def test_get_books_list(client):
    from models import Book
    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()

    response = client.get('/api/books')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['books']) == 1
    assert data['books'][0]['title'] == 'Python'

def test_get_book_detail(client):
    from models import Book
    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()

    response = client.get(f'/api/books/{book.id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['book']['title'] == 'Python'
```

**Step 2: 实现 books.py**

```python
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
```

**Step 3: 运行测试确认通过**

**Step 4: Commit**

```bash
git add routes/books.py tests/test_books.py
git commit -m "feat: implement book CRUD API"
```

---

## 借阅路由

### Task 7: 实现借阅申请 API

**Files:**
- Create: `routes/borrow.py`
- Create: `tests/test_borrow.py`
- Create: `services/borrow_service.py`

**Step 1: 编写借阅服务测试**

```python
def test_request_borrow(client):
    from models import User, Book, BorrowRecord

    user = User(student_id='2024001', name='张三')
    user.set_password('123')
    db.session.add(user)

    book = Book(title='Python', author='A', publisher='P', status='available')
    db.session.add(book)
    db.session.commit()

    # 登录
    client.post('/api/auth/login', json={'student_id': '2024001', 'password': '123'})

    # 申请借阅
    response = client.post('/api/borrows', json={'book_id': book.id})
    assert response.status_code == 201

    # 检查状态
    book = Book.query.get(book.id)
    assert book.status == 'pending_borrow'
```

**Step 2: 实现 borrow_service.py**

```python
from models import Book, BorrowRecord, DonorConfirm, User, db
from flask_login import current_user

def get_max_books_per_user():
    from models import Setting
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
```

**Step 3: 实现 borrow.py 路由**

```python
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import BorrowRecord, DonorConfirm, db
from services.borrow_service import request_borrow, get_current_borrow_count

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
```

**Step 4: 运行测试确认通过**

**Step 5: Commit**

```bash
git add routes/borrow.py services/borrow_service.py tests/test_borrow.py
git commit -m "feat: implement borrow request and donor confirm API"
```

---

### Task 8: 实现管理员审核 API

**Files:**
- Create: `routes/admin.py`
- Create: `tests/test_admin.py`

**Step 1: 编写测试**

```python
def test_admin_approve_borrow(client):
    from models import User, Book, BorrowRecord

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
```

**Step 2: 实现 admin.py**

```python
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import User, Book, BorrowRecord, Setting, db
from datetime import datetime

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403

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
    record.approve_at = datetime.utcnow()
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
    record.return_at = datetime.utcnow()
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

    overdue_records = BorrowRecord.query.filter(
        BorrowRecord.status == 'approved',
        BorrowRecord.approve_at < datetime.utcnow() - db.text(f'INTERVAL \'{max_days} days\'')
    ).all()

    return jsonify({
        'success': True,
        'stats': {
            'total_books': total_books,
            'available_books': available_books,
            'borrowed_books': borrowed_books,
            'total_users': total_users
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
```

**Step 3: 运行测试确认通过**

**Step 4: Commit**

```bash
git add routes/admin.py tests/test_admin.py
git commit -m "feat: implement admin approval and dashboard API"
```

---

## 前端基础

### Task 9: 创建前端基础结构和登录页

**Files:**
- Create: `templates/index.html`
- Create: `static/js/app.js`
- Create: `static/js/pages/LoginPage.js`
- Create: `static/js/api.js`

**Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>班级图书共享管理系统</title>
    <link rel="stylesheet" href="https://unpkg.com/element-plus@2.5.0/dist/index.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #app { min-height: 100vh; }
    </style>
</head>
<body>
    <div id="app"></div>

    <script src="https://unpkg.com/vue@3.4.0/dist/vue.global.js"></script>
    <script src="https://unpkg.com/vue-router@4.2.0/dist/vue-router.global.js"></script>
    <script src="https://unpkg.com/element-plus@2.5.0/dist/index.full.js"></script>
    <script src="https://unpkg.com/element-plus@2.5.0/dist/locale/zh-cn.js"></script>

    <script type="module" src="/static/js/app.js"></script>
</body>
</html>
```

**Step 2: 创建 api.js**

```javascript
const API_BASE = '/api';

async function request(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'same-origin'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || '请求失败');
    }

    return data;
}

export const authApi = {
    login: (student_id, password) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ student_id, password })
    }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me')
};

export const bookApi = {
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/books?${query}`);
    },
    get: (id) => request(`/books/${id}`),
    create: (data) => request('/books', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id, status) => request(`/books/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    })
};

export const borrowApi = {
    list: () => request('/borrows'),
    create: (book_id) => request('/borrows', { method: 'POST', body: JSON.stringify({ book_id }) }),
    return: (id) => request(`/borrows/${id}/return`, { method: 'PUT' })
};

export const adminApi = {
    getBorrows: (status) => request(`/admin/borrows?${status ? `status=${status}` : ''}`),
    approveBorrow: (id) => request(`/admin/borrows/${id}/approve`, { method: 'PUT' }),
    rejectBorrow: (id) => request(`/admin/borrows/${id}/reject`, { method: 'PUT' }),
    confirmReturn: (id) => request(`/admin/borrows/${id}/confirm-return`, { method: 'PUT' }),
    getUsers: () => request('/admin/users'),
    createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    getDashboard: () => request('/admin/dashboard'),
    getSettings: () => request('/admin/settings'),
    updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
};

export const donorApi = {
    getConfirms: () => request('/donor/confirms'),
    approve: (id) => request(`/donor/confirms/${id}/approve`, { method: 'PUT' }),
    reject: (id) => request(`/donor/confirms/${id}/reject`, { method: 'PUT' })
};
```

**Step 3: 创建 LoginPage.js**

```javascript
const { ref } = Vue;
const { ElMessage } = ElementPlus;
import { authApi } from '../api.js';

export default {
    name: 'LoginPage',
    setup() {
        const form = ref({
            student_id: '',
            password: ''
        });
        const loading = ref(false);

        const handleLogin = async () => {
            if (!form.value.student_id || !form.value.password) {
                ElMessage.warning('请填写学号和密码');
                return;
            }

            loading.value = true;
            try {
                const res = await authApi.login(form.value.student_id, form.value.password);
                localStorage.setItem('user', JSON.stringify(res.user));
                ElMessage.success('登录成功');
                window.location.href = '/';
            } catch (error) {
                ElMessage.error(error.message || '登录失败');
            } finally {
                loading.value = false;
            }
        };

        return { form, loading, handleLogin };
    },
    template: `
        <div class="login-container">
            <el-card class="login-card">
                <template #header>
                    <h2>班级图书共享管理系统</h2>
                </template>
                <el-form :model="form" label-position="top">
                    <el-form-item label="学号">
                        <el-input v-model="form.student_id" placeholder="请输入学号" />
                    </el-form-item>
                    <el-form-item label="密码">
                        <el-input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
                            登录
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </div>
    `
};
```

**Step 4: 创建 app.js**

```javascript
const { createApp, ref, computed } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import LoginPage from './pages/LoginPage.js';

const App = {
    setup() {
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const isLoggedIn = computed(() => !!user.value);
        const isAdmin = computed(() => user.value?.is_admin || false);

        const logout = async () => {
            try {
                await authApi.logout();
            } finally {
                localStorage.removeItem('user');
                window.location.href = '/#/login';
            }
        };

        return { user, isLoggedIn, isAdmin, logout };
    },
    template: `
        <router-view />
    `
};

const routes = [
    { path: '/login', component: LoginPage },
    { path: '/', component: { template: '<div>首页</div>' } }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const user = localStorage.getItem('user');
    if (to.path !== '/login' && !user) {
        next('/login');
    } else {
        next();
    }
});

createApp(App).use(router).use(ElementPlus).mount('#app');
```

**Step 5: 添加 Flask 路由渲染模板**

修改 `app.py`，在蓝图注册后添加：

```python
from flask import render_template

@app.route('/')
def index():
    return render_template('index.html')
```

**Step 6: 测试登录页**

```bash
python app.py
```

访问 http://localhost:5000，应看到登录页面。

**Step 7: Commit**

```bash
git add templates/index.html static/js/app.js static/js/pages/LoginPage.js static/js/api.js app.py
git commit -m "feat: implement frontend login page"
```

---

### Task 10: 实现图书列表和详情页

**Files:**
- Create: `static/js/pages/HomePage.js`
- Create: `static/js/pages/BookDetailPage.js`
- Modify: `static/js/app.js` (添加路由)

**Step 1: 创建 HomePage.js**

```javascript
const { ref, onMounted } = Vue;
const { ElMessage } = ElementPlus;
import { bookApi, borrowApi } from '../api.js';

export default {
    name: 'HomePage',
    setup() {
        const books = ref([]);
        const loading = ref(false);
        const searchKeyword = ref('');
        const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

        const loadBooks = async () => {
            loading.value = true;
            try {
                const res = await bookApi.list({ keyword: searchKeyword.value });
                books.value = res.books;
            } catch (error) {
                ElMessage.error('加载图书失败');
            } finally {
                loading.value = false;
            }
        };

        const handleSearch = () => {
            loadBooks();
        };

        const handleBorrow = async (book) => {
            try {
                await borrowApi.create(book.id);
                ElMessage.success('借阅申请已提交');
                loadBooks();
            } catch (error) {
                ElMessage.error(error.message);
            }
        };

        const getStatusText = (status) => {
            const map = {
                'available': '在库',
                'pending_borrow': '借阅审核中',
                'borrowed': '已借出',
                'pending_return': '归还审核中',
                'unavailable': '不可用'
            };
            return map[status] || status;
        };

        const getStatusType = (status) => {
            const map = {
                'available': 'success',
                'pending_borrow': 'warning',
                'borrowed': 'info',
                'pending_return': 'warning',
                'unavailable': 'danger'
            };
            return map[status] || 'info';
        };

        onMounted(loadBooks);

        return {
            books,
            loading,
            searchKeyword,
            user,
            handleSearch,
            handleBorrow,
            getStatusText,
            getStatusType
        };
    },
    template: `
        <div>
            <el-header style="background: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between;">
                <h1>班级图书共享管理系统</h1>
                <div>
                    <span style="margin-right: 20px;">{{ user?.name }}</span>
                    <el-button type="danger" size="small" @click="$router.push('/my-borrows')">我的借阅</el-button>
                    <el-button v-if="user?.is_admin" type="warning" size="small" @click="$router.push('/admin')">管理后台</el-button>
                    <el-button type="info" size="small" @click="logout">退出</el-button>
                </div>
            </el-header>

            <el-main>
                <el-row :gutter="20" style="margin-bottom: 20px;">
                    <el-col :span="16">
                        <el-input v-model="searchKeyword" placeholder="搜索书名、作者、标签" @keyup.enter="handleSearch">
                            <template #append>
                                <el-button @click="handleSearch">搜索</el-button>
                            </template>
                        </el-input>
                    </el-col>
                </el-row>

                <el-row :gutter="20" v-loading="loading">
                    <el-col :span="6" v-for="book in books" :key="book.id" style="margin-bottom: 20px;">
                        <el-card :body-style="{ padding: '15px' }">
                            <h3 @click="$router.push('/books/' + book.id)" style="cursor: pointer; color: #409EFF;">
                                {{ book.title }}
                            </h3>
                            <p>作者: {{ book.author }}</p>
                            <p>出版社: {{ book.publisher }}</p>
                            <p>
                                状态:
                                <el-tag :type="getStatusType(book.status)" size="small">
                                    {{ getStatusText(book.status) }}
                                </el-tag>
                            </p>
                            <el-button
                                v-if="book.status === 'available'"
                                type="primary"
                                size="small"
                                @click="handleBorrow(book)"
                                style="width: 100%; margin-top: 10px;"
                            >
                                申请借阅
                            </el-button>
                        </el-card>
                    </el-col>
                </el-row>
            </el-main>
        </div>
    `
};
```

**Step 2: 更新 app.js 添加路由**

```javascript
import HomePage from './pages/HomePage.js';

const routes = [
    { path: '/login', component: LoginPage },
    { path: '/', component: HomePage },
    { path: '/books/:id', component: { template: '<div>图书详情</div>' } }
];
```

**Step 3: Commit**

```bash
git add static/js/pages/HomePage.js static/js/app.js
git commit -m "feat: implement book list page"
```

---

由于篇幅限制，后续任务（图书详情页、我的借阅、捐赠者确认、管理后台各页面）遵循相同模式：创建页面组件 → 调用 API → 处理交互 → 提交。完整实现将包含所有页面组件。

## 测试策略

### 单元测试
- 模型层：每个模型的 CRUD 操作
- API 层：每个端点的成功/失败场景
- 服务层：业务逻辑验证

### 集成测试
- 完整借还流程
- 捐赠者确认流程
- 管理员审核流程

### 手动测试清单
1. 用户登录/登出
2. 图书搜索
3. 借阅申请（普通图书和捐赠图书）
4. 捐赠者确认
5. 管理员审核借阅
6. 归还申请
7. 管理员确认归还
8. 数据看板显示

## 部署说明

```bash
# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# 运行
python app.py
```

访问 http://localhost:5000

---

**计划完成！** 保存于 `docs/plans/2026-02-16-library-system-implementation.md`
