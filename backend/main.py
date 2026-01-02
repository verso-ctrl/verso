from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import List, Optional
from datetime import datetime
import secrets
import string
import os

from database import (
    get_db, init_db, User, Book, user_books, Collection, Activity, 
    collection_books, followers, review_likes,
    ReadingCircle, CircleMember, CircleChallenge, ChallengeProgress, CircleActivity
)
from schemas import *
from auth import (
    get_password_hash, 
    authenticate_user, 
    create_access_token, 
    get_current_user
)
from ai_recommendations import ai_service
from book_search import BookSearchService

app = FastAPI(title="Verso API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", ""),  # Production frontend URL
        "*"  # Allow all origins for easier setup (tighten for production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Initialize book search service
book_service = BookSearchService()

# Health check
@app.get("/")
def read_root():
    return {"message": "Verso API is running", "version": "2.0.0"}

# ==================== AUTH ROUTES ====================

@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.put("/auth/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    
    db.commit()
    db.refresh(current_user)
    return current_user

# ==================== READING GOALS & PROGRESS ====================

@app.post("/reading-goal")
def set_reading_goal(
    goal: int,
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set reading goal for a year"""
    current_user.reading_goal = goal
    current_user.reading_goal_year = year
    db.commit()
    return {"goal": goal, "year": year}

@app.get("/reading-goal")
def get_reading_goal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current reading goal and progress"""
    if not current_user.reading_goal or not current_user.reading_goal_year:
        return {"goal": None, "year": None, "progress": 0}
    
    # Count books read this year
    from datetime import datetime as dt
    year_start = dt(current_user.reading_goal_year, 1, 1)
    year_end = dt(current_user.reading_goal_year, 12, 31, 23, 59, 59)
    
    books_read = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.status == 'read',
            user_books.c.finished_at >= year_start,
            user_books.c.finished_at <= year_end
        )
    ).fetchall()
    
    return {
        "goal": current_user.reading_goal,
        "year": current_user.reading_goal_year,
        "progress": len(books_read)
    }

@app.put("/my-books/{book_id}/progress")
def update_reading_progress(
    book_id: int,
    current_page: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current page for a book"""
    db.execute(
        user_books.update().where(
            user_books.c.user_id == current_user.id,
            user_books.c.book_id == book_id
        ).values(current_page=current_page)
    )
    db.commit()
    
    # Get book to calculate percentage
    book = db.query(Book).filter(Book.id == book_id).first()
    percentage = 0
    if book and book.page_count:
        percentage = int((current_page / book.page_count) * 100)
    
    return {"current_page": current_page, "percentage": percentage}

@app.get("/points")
def get_user_points(
    current_user: User = Depends(get_current_user)
):
    """Get current user's points"""
    return {"points": current_user.points, "username": current_user.username}

# ==================== BOOK ROUTES ====================

@app.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_data: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new book entry"""
    db_book = Book(**book_data.dict())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@app.get("/books/search-external")
def search_external_books(
    query: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Search Open Library for books"""
    return book_service.search_books(query, max_results=limit)

@app.post("/books/import-from-search")
def import_book_from_search(
    book_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import a book from external search into our database"""
    # Check if book already exists by ISBN
    if book_data.get('isbn'):
        existing = db.query(Book).filter(Book.isbn == book_data['isbn']).first()
        if existing:
            return existing
    
    # Create new book
    db_book = Book(
        title=book_data.get('title'),
        author=book_data.get('author'),
        isbn=book_data.get('isbn'),
        description=book_data.get('description'),
        cover_url=book_data.get('cover_url'),
        published_year=book_data.get('published_year'),
        genre=book_data.get('genre'),
        page_count=book_data.get('page_count'),
        publisher=book_data.get('publisher')
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@app.get("/books", response_model=List[BookResponse])
def get_books(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    genre: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get books with optional search and filtering"""
    query = db.query(Book)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Book.title.ilike(search_term),
                Book.author.ilike(search_term)
            )
        )
    
    if genre:
        query = query.filter(Book.genre == genre)
    
    return query.offset(skip).limit(limit).all()

@app.get("/books/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@app.get("/books/{book_id}/reviews")
def get_book_reviews(
    book_id: int,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific book"""
    reviews_data = db.execute(
        user_books.select().where(
            user_books.c.book_id == book_id,
            user_books.c.review.isnot(None)
        ).order_by(user_books.c.added_at.desc()).limit(limit)
    ).fetchall()
    
    reviews = []
    for review_entry in reviews_data:
        user = db.query(User).filter(User.id == review_entry.user_id).first()
        if user:
            # Get like count
            like_count = len(db.execute(
                review_likes.select().where(
                    review_likes.c.book_id == book_id,
                    review_likes.c.reviewer_id == user.id
                )
            ).fetchall())
            
            # Check if current user has liked
            user_liked = db.execute(
                review_likes.select().where(
                    review_likes.c.user_id == current_user.id,
                    review_likes.c.book_id == book_id,
                    review_likes.c.reviewer_id == user.id
                )
            ).first() is not None
            
            reviews.append({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'avatar_url': user.avatar_url
                },
                'rating': review_entry.rating,
                'review': review_entry.review,
                'status': review_entry.status,
                'created_at': review_entry.added_at.isoformat() if review_entry.added_at else None,
                'like_count': like_count,
                'user_liked': user_liked
            })
    
    return {'reviews': reviews, 'total': len(reviews)}

@app.get("/books/popular/top")
def get_popular_books(limit: int = 10, db: Session = Depends(get_db)):
    """Get most popular books by rating count"""
    books = db.query(Book).filter(
        Book.ratings_count > 0
    ).order_by(
        desc(Book.ratings_count),
        desc(Book.average_rating)
    ).limit(limit).all()
    return books

@app.get("/reviews/recent")
def get_recent_reviews(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent reviews from all users"""
    reviews_data = db.execute(
        user_books.select().where(
            user_books.c.review.isnot(None)
        ).order_by(user_books.c.added_at.desc()).limit(limit)
    ).fetchall()
    
    reviews = []
    for review_entry in reviews_data:
        user = db.query(User).filter(User.id == review_entry.user_id).first()
        book = db.query(Book).filter(Book.id == review_entry.book_id).first()
        if user and book:
            reviews.append({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'avatar_url': user.avatar_url
                },
                'book': {
                    'id': book.id,
                    'title': book.title,
                    'author': book.author,
                    'cover_url': book.cover_url
                },
                'rating': review_entry.rating,
                'review': review_entry.review,
                'status': review_entry.status,
                'created_at': review_entry.added_at.isoformat() if review_entry.added_at else None
            })
    
    return reviews

@app.post("/reviews/{book_id}/{reviewer_id}/like")
def like_review(
    book_id: int,
    reviewer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like a review"""
    # Check if already liked
    existing = db.execute(
        review_likes.select().where(
            review_likes.c.user_id == current_user.id,
            review_likes.c.book_id == book_id,
            review_likes.c.reviewer_id == reviewer_id
        )
    ).first()
    
    if existing:
        return {"message": "Already liked", "liked": True}
    
    # Add like
    db.execute(
        review_likes.insert().values(
            user_id=current_user.id,
            book_id=book_id,
            reviewer_id=reviewer_id
        )
    )
    
    # Award 1 point to reviewer
    reviewer = db.query(User).filter(User.id == reviewer_id).first()
    if reviewer:
        reviewer.points += 1
    
    db.commit()
    return {"message": "Review liked", "liked": True}

@app.delete("/reviews/{book_id}/{reviewer_id}/like")
def unlike_review(
    book_id: int,
    reviewer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlike a review"""
    result = db.execute(
        review_likes.delete().where(
            review_likes.c.user_id == current_user.id,
            review_likes.c.book_id == book_id,
            review_likes.c.reviewer_id == reviewer_id
        )
    )
    
    if result.rowcount > 0:
        # Remove 1 point from reviewer
        reviewer = db.query(User).filter(User.id == reviewer_id).first()
        if reviewer and reviewer.points > 0:
            reviewer.points -= 1
        db.commit()
        return {"message": "Review unliked", "liked": False}
    
    return {"message": "Not liked", "liked": False}

@app.get("/reviews/{book_id}/{reviewer_id}/likes")
def get_review_likes(
    book_id: int,
    reviewer_id: int,
    db: Session = Depends(get_db)
):
    """Get like count for a review"""
    likes = db.execute(
        review_likes.select().where(
            review_likes.c.book_id == book_id,
            review_likes.c.reviewer_id == reviewer_id
        )
    ).fetchall()
    
    return {"count": len(likes)}



# ==================== USER BOOKS ROUTES ====================

@app.post("/my-books", status_code=status.HTTP_201_CREATED)
def add_book_to_library(
    user_book: UserBookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a book to user's library"""
    # Check if book exists
    book = db.query(Book).filter(Book.id == user_book.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if already in library
    existing = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.book_id == user_book.book_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Book already in library")
    
    # Auto-set dates based on status
    started_at = user_book.started_at
    finished_at = user_book.finished_at
    
    if user_book.status == 'currently_reading' and not started_at:
        started_at = datetime.utcnow()
    elif user_book.status == 'read':
        if not started_at:
            started_at = datetime.utcnow()
        if not finished_at:
            finished_at = datetime.utcnow()
    
    # Add to library
    db.execute(
        user_books.insert().values(
            user_id=current_user.id,
            book_id=user_book.book_id,
            status=user_book.status,
            rating=user_book.rating,
            review=user_book.review,
            is_owned=user_book.is_owned,
            started_at=started_at,
            finished_at=finished_at
        )
    )
    
    # Update book's average rating
    if user_book.rating:
        update_book_rating(db, user_book.book_id)
    
    # Create activity
    activity_type = {
        'read': 'finished_book',
        'currently_reading': 'started_book',
        'want_to_read': 'added_to_list'
    }.get(user_book.status, 'added_to_list')
    
    db_activity = Activity(
        user_id=current_user.id,
        activity_type=activity_type,
        book_id=user_book.book_id,
        content=user_book.review if user_book.review else None
    )
    db.add(db_activity)
    
    # Award points
    points_earned = 0
    current_user.points += 5  # 5 points for adding a book
    points_earned += 5
    
    if user_book.rating:
        current_user.points += 10  # 10 points for rating
        points_earned += 10
    
    if user_book.review:
        current_user.points += 20  # 20 points for writing a review
        points_earned += 20
    
    db.commit()
    return {"message": "Book added to library", "points_earned": points_earned}

@app.get("/my-books", response_model=List[UserBookResponse])
def get_my_books(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's books with optional status filter"""
    query = user_books.select().where(user_books.c.user_id == current_user.id)
    
    if status:
        query = query.where(user_books.c.status == status)
    
    user_book_entries = db.execute(query).fetchall()
    
    result = []
    for ub in user_book_entries:
        book = db.query(Book).filter(Book.id == ub.book_id).first()
        if book:
            result.append(UserBookResponse(
                book=book,
                status=ub.status,
                rating=ub.rating,
                review=ub.review,
                current_page=ub.current_page,
                is_owned=ub.is_owned,
                started_at=ub.started_at,
                finished_at=ub.finished_at,
                added_at=ub.added_at
            ))
    
    return result

@app.put("/my-books/{book_id}")
def update_my_book(
    book_id: int,
    update_data: UserBookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a book in user's library"""
    # Check if book is in user's library
    existing = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.book_id == book_id
        )
    ).first()
    
    if not existing:
        raise HTTPException(status_code=404, detail="Book not in library")
    
    # Build update dict
    update_dict = {}
    if update_data.status is not None:
        update_dict['status'] = update_data.status
        # Auto-set dates based on status change
        if update_data.status == 'currently_reading' and not existing.started_at:
            update_dict['started_at'] = datetime.utcnow()
        elif update_data.status == 'read':
            if not existing.started_at:
                update_dict['started_at'] = datetime.utcnow()
            if not existing.finished_at:
                update_dict['finished_at'] = datetime.utcnow()
    if update_data.rating is not None:
        update_dict['rating'] = update_data.rating
    if update_data.review is not None:
        update_dict['review'] = update_data.review
    if update_data.is_owned is not None:
        update_dict['is_owned'] = update_data.is_owned
    if update_data.started_at is not None:
        update_dict['started_at'] = update_data.started_at
    if update_data.finished_at is not None:
        update_dict['finished_at'] = update_data.finished_at
    
    # Update
    db.execute(
        user_books.update().where(
            user_books.c.user_id == current_user.id,
            user_books.c.book_id == book_id
        ).values(**update_dict)
    )
    
    # Update book's average rating if rating changed
    if update_data.rating is not None:
        update_book_rating(db, book_id)
    
    # Award points for new ratings/reviews
    points_earned = 0
    if update_data.rating is not None and existing.rating is None:
        current_user.points += 10  # First time rating
        points_earned += 10
    
    if update_data.review is not None and existing.review is None:
        current_user.points += 20  # First time reviewing
        points_earned += 20
    
    db.commit()
    return {"message": "Book updated", "points_earned": points_earned}

@app.delete("/my-books/{book_id}")
def remove_from_library(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a book from user's library"""
    result = db.execute(
        user_books.delete().where(
            user_books.c.user_id == current_user.id,
            user_books.c.book_id == book_id
        )
    )
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Book not in library")
    
    # Update book's average rating
    update_book_rating(db, book_id)
    
    db.commit()
    return {"message": "Book removed from library"}

# ==================== COLLECTIONS ROUTES ====================

@app.post("/collections", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new collection"""
    db_collection = Collection(
        user_id=current_user.id,
        **collection_data.dict()
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    
    response = CollectionResponse.from_orm(db_collection)
    response.book_count = 0
    return response

@app.get("/collections", response_model=List[CollectionResponse])
def get_collections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's collections"""
    collections = db.query(Collection).filter(Collection.user_id == current_user.id).all()
    
    result = []
    for coll in collections:
        book_count = db.execute(
            collection_books.select().where(collection_books.c.collection_id == coll.id)
        ).fetchall()
        
        coll_response = CollectionResponse.from_orm(coll)
        coll_response.book_count = len(book_count)
        result.append(coll_response)
    
    return result

@app.post("/collections/{collection_id}/books/{book_id}")
def add_book_to_collection(
    collection_id: int,
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a book to a collection"""
    # Verify collection belongs to user
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Verify book exists
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Add to collection
    db.execute(
        collection_books.insert().values(
            collection_id=collection_id,
            book_id=book_id
        )
    )
    db.commit()
    return {"message": "Book added to collection"}

# ==================== AI RECOMMENDATIONS ====================

@app.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations(
    count: int = 10,
    based_on_book_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered book recommendations"""
    books, reasoning = ai_service.get_recommendations(
        db=db,
        user_id=current_user.id,
        count=count,
        based_on_book_id=based_on_book_id
    )
    
    # Convert to BookResponse objects if they're dicts
    book_responses = []
    for book in books:
        if isinstance(book, dict):
            # These are AI-generated recommendations, not from DB
            # We'll return them as-is for now
            # In production, you might want to search DB for these books
            continue
        else:
            book_responses.append(book)
    
    return RecommendationResponse(
        books=book_responses,
        reasoning=reasoning
    )

# ==================== SOCIAL FEATURES ====================

@app.get("/users/browse/all")
def browse_all_users(
    limit: int = 50,
    skip: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Browse all users on the platform"""
    users = db.query(User).filter(
        User.id != current_user.id  # Exclude current user
    ).offset(skip).limit(limit).all()
    
    result = []
    for u in users:
        # Get user's stats
        books_read = len(db.execute(
            user_books.select().where(
                user_books.c.user_id == u.id,
                user_books.c.status == 'read'
            )
        ).fetchall())
        
        result.append({
            'id': u.id,
            'username': u.username,
            'full_name': u.full_name,
            'avatar_url': u.avatar_url,
            'bio': u.bio,
            'books_read': books_read,
            'created_at': u.created_at.isoformat() if u.created_at else None
        })
    
    return result

@app.get("/users/search")
def search_users(
    query: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for users by username"""
    search_term = f"%{query}%"
    users = db.query(User).filter(
        User.username.ilike(search_term),
        User.id != current_user.id  # Don't include current user
    ).limit(limit).all()
    
    return [{
        'id': u.id,
        'username': u.username,
        'full_name': u.full_name,
        'avatar_url': u.avatar_url,
        'bio': u.bio
    } for u in users]

@app.get("/users/{user_id}/profile")
def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get public profile of a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's stats
    read_count = db.execute(
        user_books.select().where(
            user_books.c.user_id == user_id,
            user_books.c.status == 'read'
        )
    ).fetchall()
    
    currently_reading_count = db.execute(
        user_books.select().where(
            user_books.c.user_id == user_id,
            user_books.c.status == 'currently_reading'
        )
    ).fetchall()
    
    # Check if current user follows this user
    is_following = db.execute(
        followers.select().where(
            followers.c.follower_id == current_user.id,
            followers.c.following_id == user_id
        )
    ).first() is not None
    
    # Get follower counts
    follower_count = len(db.execute(
        followers.select().where(followers.c.following_id == user_id)
    ).fetchall())
    
    following_count = len(db.execute(
        followers.select().where(followers.c.follower_id == user_id)
    ).fetchall())
    
    return {
        'id': user.id,
        'username': user.username,
        'full_name': user.full_name,
        'bio': user.bio,
        'avatar_url': user.avatar_url,
        'created_at': user.created_at,
        'stats': {
            'books_read': len(read_count),
            'currently_reading': len(currently_reading_count),
            'followers': follower_count,
            'following': following_count
        },
        'is_following': is_following
    }

@app.get("/users/{user_id}/books")
def get_user_books(
    user_id: int,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a user's public book library"""
    query = user_books.select().where(user_books.c.user_id == user_id)
    
    if status:
        query = query.where(user_books.c.status == status)
    
    user_book_entries = db.execute(query).fetchall()
    
    result = []
    for ub in user_book_entries:
        book = db.query(Book).filter(Book.id == ub.book_id).first()
        if book:
            result.append({
                'book': {
                    'id': book.id,
                    'title': book.title,
                    'author': book.author,
                    'cover_url': book.cover_url,
                    'average_rating': book.average_rating
                },
                'status': ub.status,
                'rating': ub.rating,
                'review': ub.review,
                'added_at': ub.added_at.isoformat() if ub.added_at else None
            })
    
    return result

@app.get("/users/{user_id}/reviews")
def get_user_reviews(
    user_id: int,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a user's reviews"""
    reviews_data = db.execute(
        user_books.select().where(
            user_books.c.user_id == user_id,
            user_books.c.review.isnot(None)
        ).order_by(user_books.c.added_at.desc()).limit(limit)
    ).fetchall()
    
    reviews = []
    for review_entry in reviews_data:
        book = db.query(Book).filter(Book.id == review_entry.book_id).first()
        if book:
            reviews.append({
                'book': {
                    'id': book.id,
                    'title': book.title,
                    'author': book.author,
                    'cover_url': book.cover_url
                },
                'rating': review_entry.rating,
                'review': review_entry.review,
                'status': review_entry.status,
                'created_at': review_entry.added_at.isoformat() if review_entry.added_at else None
            })
    
    return reviews

# ==================== SOCIAL FEATURES (CONTINUED) ====================

@app.post("/users/{user_id}/follow")
def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow another user"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing = db.execute(
        followers.select().where(
            followers.c.follower_id == current_user.id,
            followers.c.following_id == user_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    db.execute(
        followers.insert().values(
            follower_id=current_user.id,
            following_id=user_id
        )
    )
    db.commit()
    return {"message": "Successfully followed user"}

@app.delete("/users/{user_id}/follow")
def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    result = db.execute(
        followers.delete().where(
            followers.c.follower_id == current_user.id,
            followers.c.following_id == user_id
        )
    )
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    db.commit()
    return {"message": "Successfully unfollowed user"}

@app.get("/feed", response_model=List[ActivityResponse])
def get_activity_feed(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity feed from followed users"""
    # Get IDs of users that current user follows
    following_ids = db.execute(
        followers.select().where(followers.c.follower_id == current_user.id)
    ).fetchall()
    
    following_user_ids = [f.following_id for f in following_ids]
    following_user_ids.append(current_user.id)  # Include own activities
    
    # Get activities
    activities = db.query(Activity).filter(
        Activity.user_id.in_(following_user_ids)
    ).order_by(desc(Activity.created_at)).limit(limit).all()
    
    return activities

# ==================== STATS ====================

@app.get("/stats/reading")
def get_reading_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reading statistics for current user"""
    # Count by status
    read_count = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.status == 'read'
        )
    ).fetchall()
    
    currently_reading_count = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.status == 'currently_reading'
        )
    ).fetchall()
    
    want_to_read_count = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.status == 'want_to_read'
        )
    ).fetchall()
    
    owned_count = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.is_owned == True
        )
    ).fetchall()
    
    # Calculate total pages read
    read_books_data = [
        db.query(Book).filter(Book.id == ub.book_id).first()
        for ub in read_count
    ]
    total_pages = sum(book.page_count for book in read_books_data if book and book.page_count)
    
    return {
        "books_read": len(read_count),
        "currently_reading": len(currently_reading_count),
        "want_to_read": len(want_to_read_count),
        "books_owned": len(owned_count),
        "total_pages_read": total_pages
    }

# ==================== GOODREADS IMPORT ====================

from goodreads_import import goodreads_importer, GoodreadsBook

@app.post("/import/goodreads")
async def import_goodreads(
    file_content: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import books from Goodreads CSV export
    Expects the CSV content as a string in the request body
    """
    # Parse the CSV
    parsed_books, parse_errors = goodreads_importer.parse_csv(file_content)
    
    if not parsed_books and parse_errors:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {parse_errors[0]}")
    
    # Track import results
    results = {
        "total_parsed": len(parsed_books),
        "imported": 0,
        "skipped": 0,
        "errors": [],
        "books": []
    }
    
    for gr_book in parsed_books:
        try:
            # Try to find existing book by ISBN
            existing_book = None
            if gr_book.isbn13:
                existing_book = db.query(Book).filter(Book.isbn == gr_book.isbn13).first()
            if not existing_book and gr_book.isbn:
                existing_book = db.query(Book).filter(Book.isbn == gr_book.isbn).first()
            
            # If not found by ISBN, try title + author match
            if not existing_book:
                existing_book = db.query(Book).filter(
                    Book.title.ilike(gr_book.title),
                    Book.author.ilike(f"%{gr_book.author.split()[0]}%")  # Match first name
                ).first()
            
            # Create book if it doesn't exist
            if existing_book:
                book_id = existing_book.id
            else:
                new_book = Book(
                    title=gr_book.title,
                    author=gr_book.author,
                    isbn=gr_book.isbn13 or gr_book.isbn,
                    published_year=gr_book.year_published,
                    page_count=gr_book.num_pages,
                    publisher=gr_book.publisher,
                    average_rating=gr_book.average_rating or 0.0
                )
                db.add(new_book)
                db.flush()  # Get the ID
                book_id = new_book.id
            
            # Check if user already has this book
            existing_user_book = db.execute(
                user_books.select().where(
                    user_books.c.user_id == current_user.id,
                    user_books.c.book_id == book_id
                )
            ).first()
            
            if existing_user_book:
                results["skipped"] += 1
                continue
            
            # Add to user's library
            status = goodreads_importer.get_our_status(gr_book.exclusive_shelf)
            
            db.execute(user_books.insert().values(
                user_id=current_user.id,
                book_id=book_id,
                status=status,
                rating=gr_book.my_rating,
                review=gr_book.my_review,
                started_at=gr_book.date_added,
                finished_at=gr_book.date_read if status == 'read' else None,
                added_at=gr_book.date_added or datetime.utcnow()
            ))
            
            results["imported"] += 1
            results["books"].append({
                "title": gr_book.title,
                "author": gr_book.author,
                "status": status
            })
            
            # Update points
            current_user.points += 5  # Points for adding book
            if gr_book.my_rating:
                current_user.points += 10  # Points for rating
            if gr_book.my_review:
                current_user.points += 20  # Points for review
                
        except Exception as e:
            results["errors"].append(f"{gr_book.title}: {str(e)}")
    
    db.commit()
    
    return results


@app.post("/import/goodreads/preview")
async def preview_goodreads_import(
    file_content: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Preview what would be imported from Goodreads CSV
    Returns parsed books without actually importing them
    """
    parsed_books, parse_errors = goodreads_importer.parse_csv(file_content)
    
    preview = {
        "total": len(parsed_books),
        "by_status": {
            "read": 0,
            "currently_reading": 0,
            "want_to_read": 0
        },
        "with_ratings": 0,
        "with_reviews": 0,
        "sample_books": [],
        "errors": parse_errors[:5]  # First 5 errors only
    }
    
    for book in parsed_books:
        status = goodreads_importer.get_our_status(book.exclusive_shelf)
        preview["by_status"][status] = preview["by_status"].get(status, 0) + 1
        
        if book.my_rating:
            preview["with_ratings"] += 1
        if book.my_review:
            preview["with_reviews"] += 1
    
    # Sample first 10 books
    preview["sample_books"] = [
        {
            "title": b.title,
            "author": b.author,
            "status": goodreads_importer.get_our_status(b.exclusive_shelf),
            "rating": b.my_rating,
            "year": b.year_published
        }
        for b in parsed_books[:10]
    ]
    
    return preview


# ==================== DETAILED STATISTICS ====================

@app.get("/stats/detailed")
def get_detailed_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive reading statistics for charts and analysis"""
    
    # Get all user's books with details
    user_book_entries = db.execute(
        user_books.select().where(user_books.c.user_id == current_user.id)
    ).fetchall()
    
    # Get book details for each entry
    book_ids = [ub.book_id for ub in user_book_entries]
    books_dict = {}
    if book_ids:
        books = db.query(Book).filter(Book.id.in_(book_ids)).all()
        books_dict = {b.id: b for b in books}
    
    # Initialize stats
    stats = {
        "overview": {
            "total_books": len(user_book_entries),
            "books_read": 0,
            "currently_reading": 0,
            "want_to_read": 0,
            "total_pages": 0,
            "total_ratings": 0,
            "total_reviews": 0,
            "average_rating_given": 0,
        },
        "books_by_month": {},  # { "2024-01": 5, "2024-02": 3, ... }
        "books_by_year": {},   # { "2024": 20, "2023": 15, ... }
        "pages_by_month": {},  # { "2024-01": 1500, ... }
        "genres": {},          # { "Fiction": 10, "Mystery": 5, ... }
        "ratings_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        "authors": {},         # { "Author Name": 3, ... }
        "reading_pace": {
            "avg_days_per_book": None,
            "fastest_read": None,
            "slowest_read": None,
        },
        "publication_years": {},  # { "2020": 5, "2019": 3, ... }
        "monthly_goal_progress": [],  # [{ month: "Jan", target: 4, actual: 5 }, ...]
    }
    
    ratings_sum = 0
    ratings_count = 0
    reading_times = []  # List of days taken to read books
    
    for ub in user_book_entries:
        book = books_dict.get(ub.book_id)
        if not book:
            continue
            
        # Overview counts
        if ub.status == 'read':
            stats["overview"]["books_read"] += 1
            if book.page_count:
                stats["overview"]["total_pages"] += book.page_count
        elif ub.status == 'currently_reading':
            stats["overview"]["currently_reading"] += 1
        elif ub.status == 'want_to_read':
            stats["overview"]["want_to_read"] += 1
            
        if ub.rating:
            stats["overview"]["total_ratings"] += 1
            ratings_sum += ub.rating
            ratings_count += 1
            # Ratings distribution (round to nearest int for distribution)
            rating_key = min(5, max(1, round(ub.rating)))
            stats["ratings_distribution"][rating_key] += 1
            
        if ub.review:
            stats["overview"]["total_reviews"] += 1
            
        # Books by month/year (based on finished_at for read books, fallback to added_at)
        if ub.status == 'read':
            # Use finished_at if available, otherwise fall back to added_at
            date_to_use = ub.finished_at or ub.added_at
            if date_to_use:
                month_key = date_to_use.strftime("%Y-%m")
                year_key = str(date_to_use.year)
                
                stats["books_by_month"][month_key] = stats["books_by_month"].get(month_key, 0) + 1
                stats["books_by_year"][year_key] = stats["books_by_year"].get(year_key, 0) + 1
                
                if book.page_count:
                    stats["pages_by_month"][month_key] = stats["pages_by_month"].get(month_key, 0) + book.page_count
                    
            # Calculate reading time (only if both dates exist)
            if ub.started_at and ub.finished_at:
                days = (ub.finished_at - ub.started_at).days
                if days >= 0:
                    reading_times.append({
                        "days": days,
                        "title": book.title,
                        "pages": book.page_count
                    })
        
        # Genre breakdown
        if book.genre:
            stats["genres"][book.genre] = stats["genres"].get(book.genre, 0) + 1
            
        # Author breakdown (top authors)
        if book.author:
            # Handle multiple authors
            primary_author = book.author.split(',')[0].strip()
            stats["authors"][primary_author] = stats["authors"].get(primary_author, 0) + 1
            
        # Publication years
        if book.published_year:
            year_key = str(book.published_year)
            stats["publication_years"][year_key] = stats["publication_years"].get(year_key, 0) + 1
    
    # Calculate averages
    if ratings_count > 0:
        stats["overview"]["average_rating_given"] = round(ratings_sum / ratings_count, 2)
        
    # Reading pace
    if reading_times:
        avg_days = sum(rt["days"] for rt in reading_times) / len(reading_times)
        stats["reading_pace"]["avg_days_per_book"] = round(avg_days, 1)
        
        # Sort by days
        sorted_times = sorted(reading_times, key=lambda x: x["days"])
        if sorted_times:
            stats["reading_pace"]["fastest_read"] = {
                "title": sorted_times[0]["title"],
                "days": sorted_times[0]["days"]
            }
            stats["reading_pace"]["slowest_read"] = {
                "title": sorted_times[-1]["title"],
                "days": sorted_times[-1]["days"]
            }
    
    # Sort and limit authors (top 10)
    stats["authors"] = dict(
        sorted(stats["authors"].items(), key=lambda x: x[1], reverse=True)[:10]
    )
    
    # Sort months chronologically
    stats["books_by_month"] = dict(sorted(stats["books_by_month"].items()))
    stats["pages_by_month"] = dict(sorted(stats["pages_by_month"].items()))
    
    # Generate monthly goal progress for current year
    current_year = datetime.now().year
    if current_user.reading_goal and current_user.reading_goal_year == current_year:
        monthly_target = current_user.reading_goal / 12
        for month in range(1, 13):
            month_key = f"{current_year}-{month:02d}"
            actual = stats["books_by_month"].get(month_key, 0)
            stats["monthly_goal_progress"].append({
                "month": datetime(current_year, month, 1).strftime("%b"),
                "target": round(monthly_target, 1),
                "actual": actual
            })
    
    return stats


@app.get("/stats/reading-streak")
def get_reading_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's reading streak and consistency stats"""
    
    # Get all finished books
    finished_books = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.status == 'read'
        )
    ).fetchall()
    
    if not finished_books:
        return {
            "current_streak_months": 0,
            "longest_streak_months": 0,
            "books_this_month": 0,
            "books_this_year": 0,
            "most_productive_month": None,
            "reading_since": None
        }
    
    # Calculate streaks based on months with at least one book
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Count books by month (use finished_at or fall back to added_at)
    months_with_books = {}
    for book in finished_books:
        date_to_use = book.finished_at or book.added_at
        if date_to_use:
            key = (date_to_use.year, date_to_use.month)
            months_with_books[key] = months_with_books.get(key, 0) + 1
    
    if not months_with_books:
        return {
            "current_streak_months": 0,
            "longest_streak_months": 0,
            "books_this_month": 0,
            "books_this_year": 0,
            "most_productive_month": None,
            "reading_since": None
        }
    
    # Current streak (consecutive months reading backwards from now)
    current_streak = 0
    check_year, check_month = current_year, current_month
    
    while (check_year, check_month) in months_with_books:
        current_streak += 1
        check_month -= 1
        if check_month == 0:
            check_month = 12
            check_year -= 1
    
    # Find longest streak
    all_months = sorted(months_with_books.keys())
    longest_streak = 0
    temp_streak = 0
    prev_month = None
    
    for year, month in all_months:
        if prev_month is None:
            temp_streak = 1
        else:
            prev_year, prev_m = prev_month
            expected_month = prev_m + 1
            expected_year = prev_year
            if expected_month > 12:
                expected_month = 1
                expected_year += 1
            
            if year == expected_year and month == expected_month:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        
        prev_month = (year, month)
    
    longest_streak = max(longest_streak, temp_streak)
    
    # Most productive month
    most_productive = max(months_with_books.items(), key=lambda x: x[1])
    
    return {
        "current_streak_months": current_streak,
        "longest_streak_months": longest_streak,
        "books_this_month": months_with_books.get((current_year, current_month), 0),
        "books_this_year": sum(
            count for (year, _), count in months_with_books.items() 
            if year == current_year
        ),
        "most_productive_month": {
            "month": datetime(most_productive[0][0], most_productive[0][1], 1).strftime("%B %Y"),
            "count": most_productive[1]
        },
        "reading_since": min(all_months)[0] if all_months else None
    }


# ==================== READING CIRCLES ====================

def generate_invite_code(length: int = 8) -> str:
    """Generate a random invite code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


@app.post("/circles", status_code=status.HTTP_201_CREATED)
def create_circle(
    circle_data: CircleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new reading circle"""
    # Generate unique invite code
    invite_code = generate_invite_code()
    while db.query(ReadingCircle).filter(ReadingCircle.invite_code == invite_code).first():
        invite_code = generate_invite_code()
    
    # Create circle
    circle = ReadingCircle(
        name=circle_data.name,
        description=circle_data.description,
        invite_code=invite_code,
        is_private=circle_data.is_private,
        created_by=current_user.id
    )
    db.add(circle)
    db.flush()
    
    # Add creator as admin member
    member = CircleMember(
        circle_id=circle.id,
        user_id=current_user.id,
        role='admin'
    )
    db.add(member)
    
    # Create activity
    activity = CircleActivity(
        circle_id=circle.id,
        user_id=current_user.id,
        activity_type='created_circle',
        content=f"created the circle"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(circle)
    
    return {
        "id": circle.id,
        "name": circle.name,
        "description": circle.description,
        "invite_code": circle.invite_code,
        "is_private": circle.is_private,
        "created_by": circle.created_by,
        "creator_username": current_user.username,
        "member_count": 1,
        "created_at": circle.created_at
    }


@app.get("/circles")
def get_my_circles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get circles the current user is a member of"""
    memberships = db.query(CircleMember).filter(
        CircleMember.user_id == current_user.id
    ).all()
    
    circle_ids = [m.circle_id for m in memberships]
    circles = db.query(ReadingCircle).filter(ReadingCircle.id.in_(circle_ids)).all() if circle_ids else []
    
    results = []
    for circle in circles:
        member_count = db.query(CircleMember).filter(CircleMember.circle_id == circle.id).count()
        creator = db.query(User).filter(User.id == circle.created_by).first()
        membership = next((m for m in memberships if m.circle_id == circle.id), None)
        
        results.append({
            "id": circle.id,
            "name": circle.name,
            "description": circle.description,
            "cover_url": circle.cover_url,
            "invite_code": circle.invite_code,
            "is_private": circle.is_private,
            "created_by": circle.created_by,
            "creator_username": creator.username if creator else "Unknown",
            "member_count": member_count,
            "my_role": membership.role if membership else None,
            "my_points": membership.circle_points if membership else 0,
            "created_at": circle.created_at
        })
    
    return results


@app.get("/circles/discover")
def discover_circles(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Discover public circles to join"""
    # Get user's current circles
    my_circle_ids = [m.circle_id for m in db.query(CircleMember).filter(
        CircleMember.user_id == current_user.id
    ).all()]
    
    # Get public circles user isn't in
    circles = db.query(ReadingCircle).filter(
        ReadingCircle.is_private == False,
        ~ReadingCircle.id.in_(my_circle_ids) if my_circle_ids else True
    ).order_by(desc(ReadingCircle.created_at)).limit(limit).all()
    
    results = []
    for circle in circles:
        member_count = db.query(CircleMember).filter(CircleMember.circle_id == circle.id).count()
        creator = db.query(User).filter(User.id == circle.created_by).first()
        
        results.append({
            "id": circle.id,
            "name": circle.name,
            "description": circle.description,
            "cover_url": circle.cover_url,
            "is_private": circle.is_private,
            "created_by": circle.created_by,
            "creator_username": creator.username if creator else "Unknown",
            "member_count": member_count,
            "created_at": circle.created_at
        })
    
    return results


@app.get("/circles/{circle_id}")
def get_circle(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get circle details"""
    circle = db.query(ReadingCircle).filter(ReadingCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    # Check membership
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    # If private and not a member, deny access
    if circle.is_private and not membership:
        raise HTTPException(status_code=403, detail="This is a private circle")
    
    # Get members
    members = db.query(CircleMember).filter(CircleMember.circle_id == circle_id).all()
    member_data = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            member_data.append({
                "user_id": m.user_id,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "role": m.role,
                "circle_points": m.circle_points,
                "joined_at": m.joined_at
            })
    
    # Sort by points (leaderboard)
    member_data.sort(key=lambda x: x['circle_points'], reverse=True)
    
    creator = db.query(User).filter(User.id == circle.created_by).first()
    
    return {
        "id": circle.id,
        "name": circle.name,
        "description": circle.description,
        "cover_url": circle.cover_url,
        "invite_code": circle.invite_code if membership else None,
        "is_private": circle.is_private,
        "created_by": circle.created_by,
        "creator_username": creator.username if creator else "Unknown",
        "member_count": len(members),
        "created_at": circle.created_at,
        "members": member_data,
        "is_member": membership is not None,
        "is_admin": membership.role == 'admin' if membership else False
    }


@app.post("/circles/join/{invite_code}")
def join_circle_by_code(
    invite_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a circle using invite code"""
    circle = db.query(ReadingCircle).filter(ReadingCircle.invite_code == invite_code.upper()).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    # Check if already a member
    existing = db.query(CircleMember).filter(
        CircleMember.circle_id == circle.id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You're already a member of this circle")
    
    # Add as member
    member = CircleMember(
        circle_id=circle.id,
        user_id=current_user.id,
        role='member'
    )
    db.add(member)
    
    # Create activity
    activity = CircleActivity(
        circle_id=circle.id,
        user_id=current_user.id,
        activity_type='joined',
        content=f"joined the circle"
    )
    db.add(activity)
    
    db.commit()
    
    return {"message": "Successfully joined the circle", "circle_id": circle.id, "circle_name": circle.name}


@app.post("/circles/{circle_id}/join")
def join_circle(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a public circle"""
    circle = db.query(ReadingCircle).filter(ReadingCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    if circle.is_private:
        raise HTTPException(status_code=403, detail="This is a private circle. Use an invite code to join.")
    
    # Check if already a member
    existing = db.query(CircleMember).filter(
        CircleMember.circle_id == circle.id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You're already a member of this circle")
    
    # Add as member
    member = CircleMember(
        circle_id=circle.id,
        user_id=current_user.id,
        role='member'
    )
    db.add(member)
    
    # Create activity
    activity = CircleActivity(
        circle_id=circle.id,
        user_id=current_user.id,
        activity_type='joined',
        content=f"joined the circle"
    )
    db.add(activity)
    
    db.commit()
    
    return {"message": "Successfully joined the circle"}


@app.delete("/circles/{circle_id}/leave")
def leave_circle(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a circle"""
    circle = db.query(ReadingCircle).filter(ReadingCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=400, detail="You're not a member of this circle")
    
    # Can't leave if you're the only admin
    if membership.role == 'admin':
        admin_count = db.query(CircleMember).filter(
            CircleMember.circle_id == circle_id,
            CircleMember.role == 'admin'
        ).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="You can't leave as the only admin. Transfer ownership or delete the circle.")
    
    db.delete(membership)
    db.commit()
    
    return {"message": "You've left the circle"}


@app.delete("/circles/{circle_id}")
def delete_circle(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a circle (admin only)"""
    circle = db.query(ReadingCircle).filter(ReadingCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id,
        CircleMember.role == 'admin'
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only admins can delete the circle")
    
    db.delete(circle)
    db.commit()
    
    return {"message": "Circle deleted"}


# ==================== CIRCLE CHALLENGES ====================

@app.post("/circles/{circle_id}/challenges")
def create_challenge(
    circle_id: int,
    challenge_data: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new challenge in a circle"""
    # Verify membership
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member to create challenges")
    
    # Validate challenge data based on type
    if challenge_data.challenge_type == 'book_race':
        if not challenge_data.target_book_id:
            raise HTTPException(status_code=400, detail="Book race requires a target book")
        book = db.query(Book).filter(Book.id == challenge_data.target_book_id).first()
        if not book:
            raise HTTPException(status_code=404, detail="Target book not found")
    elif challenge_data.challenge_type in ['books_count', 'pages_count']:
        if not challenge_data.target_count or challenge_data.target_count <= 0:
            raise HTTPException(status_code=400, detail="Count challenges require a positive target count")
    elif challenge_data.challenge_type == 'genre_challenge':
        if not challenge_data.target_genre or not challenge_data.target_count:
            raise HTTPException(status_code=400, detail="Genre challenge requires a genre and target count")
    
    # Create challenge
    challenge = CircleChallenge(
        circle_id=circle_id,
        name=challenge_data.name,
        description=challenge_data.description,
        challenge_type=challenge_data.challenge_type,
        target_book_id=challenge_data.target_book_id,
        target_count=challenge_data.target_count,
        target_genre=challenge_data.target_genre,
        start_date=challenge_data.start_date,
        end_date=challenge_data.end_date,
        created_by=current_user.id
    )
    db.add(challenge)
    db.flush()
    
    # Initialize progress for all members
    members = db.query(CircleMember).filter(CircleMember.circle_id == circle_id).all()
    for member in members:
        progress = ChallengeProgress(
            challenge_id=challenge.id,
            user_id=member.user_id,
            current_value=0
        )
        db.add(progress)
    
    # Create activity
    activity = CircleActivity(
        circle_id=circle_id,
        user_id=current_user.id,
        activity_type='challenge_created',
        challenge_id=challenge.id,
        content=f"created a new challenge: {challenge_data.name}"
    )
    db.add(activity)
    
    db.commit()
    
    return {"message": "Challenge created", "challenge_id": challenge.id}


@app.get("/circles/{circle_id}/challenges")
def get_circle_challenges(
    circle_id: int,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get challenges in a circle"""
    # Verify membership
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member to view challenges")
    
    query = db.query(CircleChallenge).filter(CircleChallenge.circle_id == circle_id)
    if active_only:
        now = datetime.utcnow()
        query = query.filter(
            CircleChallenge.is_active == True,
            CircleChallenge.end_date >= now
        )
    
    challenges = query.order_by(desc(CircleChallenge.created_at)).all()
    
    results = []
    for challenge in challenges:
        # Get progress for all members
        progress_entries = db.query(ChallengeProgress).filter(
            ChallengeProgress.challenge_id == challenge.id
        ).all()
        
        progress_data = []
        for p in progress_entries:
            user = db.query(User).filter(User.id == p.user_id).first()
            
            # Calculate percentage
            if challenge.challenge_type == 'book_race':
                book = db.query(Book).filter(Book.id == challenge.target_book_id).first()
                max_val = book.page_count if book and book.page_count else 100
            else:
                max_val = challenge.target_count or 100
            
            percentage = min((p.current_value / max_val) * 100, 100) if max_val > 0 else 0
            
            # Mark if this is the current user
            is_current_user = p.user_id == current_user.id
            
            progress_data.append({
                "user_id": p.user_id,
                "username": user.username if user else "Unknown",
                "avatar_url": user.avatar_url if user else None,
                "current_value": p.current_value,
                "completed": p.completed,
                "completed_at": p.completed_at,
                "percentage": round(percentage, 1),
                "is_current_user": is_current_user
            })
        
        # Sort by progress (leaders first)
        progress_data.sort(key=lambda x: (-x['current_value'], x['username']))
        
        # Get target book info if applicable
        target_book = None
        user_library_status = None
        if challenge.target_book_id:
            target_book = db.query(Book).filter(Book.id == challenge.target_book_id).first()
            
            # Check if current user has this book in their library
            user_book = db.execute(
                user_books.select().where(
                    user_books.c.user_id == current_user.id,
                    user_books.c.book_id == challenge.target_book_id
                )
            ).fetchone()
            
            if user_book:
                user_library_status = {
                    "in_library": True,
                    "status": user_book.status,
                    "current_page": user_book.current_page or 0,
                    "rating": user_book.rating
                }
            else:
                user_library_status = {
                    "in_library": False,
                    "status": None,
                    "current_page": 0,
                    "rating": None
                }
        
        results.append({
            "id": challenge.id,
            "circle_id": challenge.circle_id,
            "name": challenge.name,
            "description": challenge.description,
            "challenge_type": challenge.challenge_type,
            "target_book_id": challenge.target_book_id,
            "target_book_title": target_book.title if target_book else None,
            "target_book_author": target_book.author if target_book else None,
            "target_book_cover": target_book.cover_url if target_book else None,
            "target_book_pages": target_book.page_count if target_book else None,
            "target_count": challenge.target_count,
            "target_genre": challenge.target_genre,
            "start_date": challenge.start_date,
            "end_date": challenge.end_date,
            "is_active": challenge.is_active,
            "created_by": challenge.created_by,
            "created_at": challenge.created_at,
            "progress": progress_data,
            "user_library_status": user_library_status
        })
    
    return results


@app.put("/circles/{circle_id}/challenges/{challenge_id}/progress")
def update_challenge_progress(
    circle_id: int,
    challenge_id: int,
    value: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update your progress on a challenge"""
    # Verify membership
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member")
    
    challenge = db.query(CircleChallenge).filter(
        CircleChallenge.id == challenge_id,
        CircleChallenge.circle_id == circle_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if not challenge.is_active:
        raise HTTPException(status_code=400, detail="This challenge is no longer active")
    
    progress = db.query(ChallengeProgress).filter(
        ChallengeProgress.challenge_id == challenge_id,
        ChallengeProgress.user_id == current_user.id
    ).first()
    
    if not progress:
        progress = ChallengeProgress(
            challenge_id=challenge_id,
            user_id=current_user.id,
            current_value=0
        )
        db.add(progress)
    
    old_value = progress.current_value
    progress.current_value = max(0, value)
    
    # Check for completion
    completed_now = False
    if challenge.challenge_type == 'book_race':
        book = db.query(Book).filter(Book.id == challenge.target_book_id).first()
        target = book.page_count if book and book.page_count else 0
    else:
        target = challenge.target_count or 0
    
    if progress.current_value >= target and not progress.completed:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        completed_now = True
        
        # Award bonus points
        membership.circle_points += 50  # Completion bonus
        
        # Create activity
        activity = CircleActivity(
            circle_id=circle_id,
            user_id=current_user.id,
            activity_type='challenge_complete',
            challenge_id=challenge_id,
            content=f"completed the challenge: {challenge.name}!"
        )
        db.add(activity)
    
    # Award points for progress
    points_earned = max(0, progress.current_value - old_value)
    if challenge.challenge_type == 'book_race':
        membership.circle_points += points_earned  # 1 point per page
    else:
        membership.circle_points += points_earned * 10  # 10 points per book/item
    
    # Create progress activity for significant updates
    if progress.current_value - old_value >= 50 or completed_now:
        activity = CircleActivity(
            circle_id=circle_id,
            user_id=current_user.id,
            activity_type='progress_update',
            challenge_id=challenge_id,
            content=f"made progress: now at {progress.current_value}"
        )
        db.add(activity)
    
    db.commit()
    
    return {
        "message": "Progress updated",
        "current_value": progress.current_value,
        "completed": progress.completed,
        "completed_now": completed_now
    }


@app.post("/circles/{circle_id}/challenges/{challenge_id}/sync")
def sync_challenge_from_library(
    circle_id: int,
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync challenge progress from user's library (for book races)"""
    # Verify membership
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member")
    
    challenge = db.query(CircleChallenge).filter(
        CircleChallenge.id == challenge_id,
        CircleChallenge.circle_id == circle_id
    ).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.challenge_type != 'book_race':
        raise HTTPException(status_code=400, detail="Sync only works for book race challenges")
    
    if not challenge.target_book_id:
        raise HTTPException(status_code=400, detail="No target book for this challenge")
    
    # Get user's progress on this book from their library
    user_book = db.execute(
        user_books.select().where(
            user_books.c.user_id == current_user.id,
            user_books.c.book_id == challenge.target_book_id
        )
    ).fetchone()
    
    if not user_book:
        raise HTTPException(status_code=400, detail="Add this book to your library first")
    
    library_page = user_book.current_page or 0
    
    # If the user has finished the book, set to max pages
    if user_book.status == 'read':
        book = db.query(Book).filter(Book.id == challenge.target_book_id).first()
        if book and book.page_count:
            library_page = book.page_count
    
    # Get or create challenge progress
    progress = db.query(ChallengeProgress).filter(
        ChallengeProgress.challenge_id == challenge_id,
        ChallengeProgress.user_id == current_user.id
    ).first()
    
    if not progress:
        progress = ChallengeProgress(
            challenge_id=challenge_id,
            user_id=current_user.id,
            current_value=0
        )
        db.add(progress)
    
    old_value = progress.current_value
    
    # Only update if library has more progress
    if library_page > progress.current_value:
        progress.current_value = library_page
        
        # Check for completion
        book = db.query(Book).filter(Book.id == challenge.target_book_id).first()
        target = book.page_count if book and book.page_count else 0
        
        completed_now = False
        if progress.current_value >= target and not progress.completed:
            progress.completed = True
            progress.completed_at = datetime.utcnow()
            completed_now = True
            membership.circle_points += 50
            
            activity = CircleActivity(
                circle_id=circle_id,
                user_id=current_user.id,
                activity_type='challenge_complete',
                challenge_id=challenge_id,
                content=f"completed the challenge: {challenge.name}!"
            )
            db.add(activity)
        
        # Award points for progress
        points_earned = max(0, progress.current_value - old_value)
        membership.circle_points += points_earned
        
        db.commit()
        
        return {
            "message": "Progress synced from library",
            "current_value": progress.current_value,
            "synced_from": library_page,
            "completed": progress.completed,
            "completed_now": completed_now
        }
    
    return {
        "message": "Library progress is not ahead of challenge progress",
        "current_value": progress.current_value,
        "library_page": library_page,
        "completed": progress.completed
    }


@app.get("/circles/{circle_id}/activity")
def get_circle_activity(
    circle_id: int,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity feed for a circle"""
    # Verify membership
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member to view activity")
    
    activities = db.query(CircleActivity).filter(
        CircleActivity.circle_id == circle_id
    ).order_by(desc(CircleActivity.created_at)).limit(limit).all()
    
    results = []
    for activity in activities:
        user = db.query(User).filter(User.id == activity.user_id).first()
        book = db.query(Book).filter(Book.id == activity.book_id).first() if activity.book_id else None
        
        results.append({
            "id": activity.id,
            "user_id": activity.user_id,
            "username": user.username if user else "Unknown",
            "avatar_url": user.avatar_url if user else None,
            "activity_type": activity.activity_type,
            "book_title": book.title if book else None,
            "book_cover": book.cover_url if book else None,
            "content": activity.content,
            "created_at": activity.created_at
        })
    
    return results


@app.get("/circles/{circle_id}/leaderboard")
def get_circle_leaderboard(
    circle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the circle leaderboard"""
    # Verify membership
    membership = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id,
        CircleMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member to view leaderboard")
    
    members = db.query(CircleMember).filter(
        CircleMember.circle_id == circle_id
    ).order_by(desc(CircleMember.circle_points)).all()
    
    leaderboard = []
    for rank, member in enumerate(members, 1):
        user = db.query(User).filter(User.id == member.user_id).first()
        
        # Count challenges completed
        challenges_completed = db.query(ChallengeProgress).filter(
            ChallengeProgress.user_id == member.user_id,
            ChallengeProgress.completed == True
        ).join(CircleChallenge).filter(
            CircleChallenge.circle_id == circle_id
        ).count()
        
        leaderboard.append({
            "rank": rank,
            "user_id": member.user_id,
            "username": user.username if user else "Unknown",
            "avatar_url": user.avatar_url if user else None,
            "circle_points": member.circle_points,
            "challenges_completed": challenges_completed,
            "is_current_user": member.user_id == current_user.id
        })
    
    return leaderboard


# Helper function
def update_book_rating(db: Session, book_id: int):
    """Recalculate and update a book's average rating"""
    ratings = db.execute(
        user_books.select().where(
            user_books.c.book_id == book_id,
            user_books.c.rating.isnot(None)
        )
    ).fetchall()
    
    if ratings:
        avg_rating = sum(r.rating for r in ratings) / len(ratings)
        db.query(Book).filter(Book.id == book_id).update({
            Book.average_rating: avg_rating,
            Book.ratings_count: len(ratings)
        })
    else:
        db.query(Book).filter(Book.id == book_id).update({
            Book.average_rating: 0.0,
            Book.ratings_count: 0
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
