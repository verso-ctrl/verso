from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime

Base = declarative_base()

# Association table for user's books with reading status
user_books = Table('user_books', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('book_id', Integer, ForeignKey('books.id')),
    Column('status', String(50)),  # 'read', 'currently_reading', 'want_to_read', 'owned'
    Column('rating', Float, nullable=True),
    Column('review', Text, nullable=True),
    Column('current_page', Integer, nullable=True),  # For tracking reading progress
    Column('started_at', DateTime, nullable=True),
    Column('finished_at', DateTime, nullable=True),
    Column('is_owned', Boolean, default=False),
    Column('added_at', DateTime, default=datetime.utcnow)
)

# Following relationship
followers = Table('followers', Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('following_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow)
)

# Review likes
review_likes = Table('review_likes', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('book_id', Integer, ForeignKey('books.id')),  # The book being reviewed
    Column('reviewer_id', Integer, ForeignKey('users.id')),  # The person who wrote the review
    Column('created_at', DateTime, default=datetime.utcnow)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(255))
    points = Column(Integer, default=0)  # Gamification points
    reading_goal = Column(Integer, nullable=True)  # Annual reading goal
    reading_goal_year = Column(Integer, nullable=True)  # Year for the goal
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    following = relationship(
        'User',
        secondary=followers,
        primaryjoin=id == followers.c.follower_id,
        secondaryjoin=id == followers.c.following_id,
        backref='followers'
    )

class Book(Base):
    __tablename__ = 'books'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    isbn = Column(String(13), unique=True, index=True)
    description = Column(Text)
    cover_url = Column(String(255))
    published_year = Column(Integer)
    genre = Column(String(100))
    page_count = Column(Integer)
    publisher = Column(String(100))
    average_rating = Column(Float, default=0.0)
    ratings_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Collection(Base):
    __tablename__ = 'collections'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User')

# Collection books
collection_books = Table('collection_books', Base.metadata,
    Column('collection_id', Integer, ForeignKey('collections.id'), primary_key=True),
    Column('book_id', Integer, ForeignKey('books.id'), primary_key=True),
    Column('added_at', DateTime, default=datetime.utcnow)
)

class Activity(Base):
    __tablename__ = 'activities'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    activity_type = Column(String(50), nullable=False)  # 'finished_book', 'started_book', 'reviewed', 'rated'
    book_id = Column(Integer, ForeignKey('books.id'), nullable=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship('User')
    book = relationship('Book')


# ==================== READING CIRCLES ====================

class ReadingCircle(Base):
    """A reading group for competitive/social reading"""
    __tablename__ = 'reading_circles'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    cover_url = Column(String(255))
    invite_code = Column(String(20), unique=True, index=True)  # For joining via link
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship('User', foreign_keys=[created_by])
    members = relationship('CircleMember', back_populates='circle', cascade='all, delete-orphan')
    challenges = relationship('CircleChallenge', back_populates='circle', cascade='all, delete-orphan')


class CircleMember(Base):
    """Members of a reading circle"""
    __tablename__ = 'circle_members'
    
    id = Column(Integer, primary_key=True)
    circle_id = Column(Integer, ForeignKey('reading_circles.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    role = Column(String(20), default='member')  # 'admin', 'member'
    circle_points = Column(Integer, default=0)  # Points earned in this circle
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    circle = relationship('ReadingCircle', back_populates='members')
    user = relationship('User')


class CircleChallenge(Base):
    """Challenges/goals within a circle"""
    __tablename__ = 'circle_challenges'
    
    id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('reading_circles.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    challenge_type = Column(String(30), nullable=False)  # 'book_race', 'books_count', 'pages_count', 'genre_challenge'
    target_book_id = Column(Integer, ForeignKey('books.id'), nullable=True)  # For book_race
    target_count = Column(Integer, nullable=True)  # For count-based challenges
    target_genre = Column(String(100), nullable=True)  # For genre challenges
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    circle = relationship('ReadingCircle', back_populates='challenges')
    target_book = relationship('Book')
    creator = relationship('User', foreign_keys=[created_by])
    progress = relationship('ChallengeProgress', back_populates='challenge', cascade='all, delete-orphan')


class ChallengeProgress(Base):
    """Individual member progress on a challenge"""
    __tablename__ = 'challenge_progress'
    
    id = Column(Integer, primary_key=True)
    challenge_id = Column(Integer, ForeignKey('circle_challenges.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    current_value = Column(Integer, default=0)  # Pages read, books completed, etc.
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    challenge = relationship('CircleChallenge', back_populates='progress')
    user = relationship('User')


class CircleActivity(Base):
    """Activity feed for a circle"""
    __tablename__ = 'circle_activities'
    
    id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey('reading_circles.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    activity_type = Column(String(50), nullable=False)  # 'joined', 'finished_book', 'progress_update', 'challenge_complete', 'milestone'
    challenge_id = Column(Integer, ForeignKey('circle_challenges.id'), nullable=True)
    book_id = Column(Integer, ForeignKey('books.id'), nullable=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    circle = relationship('ReadingCircle')
    user = relationship('User')
    book = relationship('Book')

# Database setup - supports both SQLite (local) and PostgreSQL (production)
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./verso.db")

# Railway uses postgres:// but SQLAlchemy needs postgresql+psycopg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# SQLite needs special connect args
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
