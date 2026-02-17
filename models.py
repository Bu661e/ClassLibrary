from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    donor = db.relationship('User', foreign_keys=[donor_id])
    borrow_records = db.relationship('BorrowRecord', backref='book_record', lazy='dynamic')
    
    def to_dict(self):
        # 获取借阅历史
        borrow_history = []
        if hasattr(self, 'borrow_records'):
            borrow_history = [record.to_dict() for record in self.borrow_records]

        # 获取当前借阅记录
        current_borrow = None
        if self.status in ['borrowed', 'pending_borrow', 'pending_return']:
            from sqlalchemy import or_
            current_record = BorrowRecord.query.filter(
                BorrowRecord.book_id == self.id,
                BorrowRecord.status.in_(['approved', 'pending', 'donor_pending', 'return_pending'])
            ).first()
            if current_record:
                current_borrow = current_record.to_dict()

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
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'borrow_history': borrow_history,
            'current_borrow': current_borrow
        }


class BorrowRecord(db.Model):
    __tablename__ = 'borrow_records'
    
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, donor_pending, approved, return_pending, completed, rejected
    request_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
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
            'return_at': self.return_at.isoformat() if self.return_at else None,
            'created_at': self.request_at.isoformat() if self.request_at else None,
            'updated_at': self.return_at.isoformat() if self.return_at else (self.approve_at.isoformat() if self.approve_at else self.request_at.isoformat())
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
    
    def to_dict(self):
        return {
            'id': self.id,
            'borrow_record_id': self.borrow_record_id,
            'donor_id': self.donor_id,
            'status': self.status,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
        }



class Setting(db.Model):
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': self.value
        }

