from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

# Book schemas
class BookCreate(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    published_year: Optional[int] = None
    genre: Optional[str] = None
    page_count: Optional[int] = None
    publisher: Optional[str] = None

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    isbn: Optional[str]
    description: Optional[str]
    cover_url: Optional[str]
    published_year: Optional[int]
    genre: Optional[str]
    page_count: Optional[int]
    publisher: Optional[str]
    average_rating: float
    ratings_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class BookSearch(BaseModel):
    query: str
    limit: int = 20

# User book schemas
class UserBookCreate(BaseModel):
    book_id: int
    status: str = Field(..., pattern='^(read|currently_reading|want_to_read|owned)$')
    rating: Optional[float] = Field(None, ge=0, le=5)
    review: Optional[str] = None
    is_owned: bool = False
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

class UserBookUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern='^(read|currently_reading|want_to_read|owned)$')
    rating: Optional[float] = Field(None, ge=0, le=5)
    review: Optional[str] = None
    current_page: Optional[int] = None
    is_owned: Optional[bool] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

class UserBookResponse(BaseModel):
    book: BookResponse
    status: str
    rating: Optional[float]
    review: Optional[str]
    current_page: Optional[int]
    is_owned: bool
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    added_at: datetime

# Collection schemas
class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: bool = True

class CollectionResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    is_public: bool
    created_at: datetime
    book_count: int = 0
    
    class Config:
        from_attributes = True

# Activity schemas
class ActivityResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    book_id: Optional[int]
    content: Optional[str]
    created_at: datetime
    user: UserResponse
    book: Optional[BookResponse]
    
    class Config:
        from_attributes = True

# AI Recommendation schemas
class RecommendationRequest(BaseModel):
    user_id: int
    count: int = Field(default=10, ge=1, le=50)
    based_on_book_id: Optional[int] = None

class RecommendationResponse(BaseModel):
    books: List[BookResponse]
    reasoning: str

# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ==================== READING CIRCLES SCHEMAS ====================

class CircleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    is_private: bool = False

class CircleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    is_private: Optional[bool] = None

class CircleMemberResponse(BaseModel):
    user_id: int
    username: str
    avatar_url: Optional[str]
    role: str
    circle_points: int
    joined_at: datetime

class CircleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    cover_url: Optional[str]
    invite_code: str
    is_private: bool
    created_by: int
    creator_username: str
    member_count: int
    created_at: datetime

class CircleDetailResponse(CircleResponse):
    members: List[CircleMemberResponse]
    is_member: bool
    is_admin: bool

class ChallengeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    challenge_type: str = Field(..., pattern='^(book_race|books_count|pages_count|genre_challenge)$')
    target_book_id: Optional[int] = None  # Required for book_race
    target_count: Optional[int] = None  # Required for count challenges
    target_genre: Optional[str] = None  # Required for genre_challenge
    start_date: datetime
    end_date: datetime

class ChallengeProgressResponse(BaseModel):
    user_id: int
    username: str
    avatar_url: Optional[str]
    current_value: int
    completed: bool
    completed_at: Optional[datetime]
    percentage: float

class ChallengeResponse(BaseModel):
    id: int
    circle_id: int
    name: str
    description: Optional[str]
    challenge_type: str
    target_book_id: Optional[int]
    target_book_title: Optional[str]
    target_book_cover: Optional[str]
    target_book_pages: Optional[int]
    target_count: Optional[int]
    target_genre: Optional[str]
    start_date: datetime
    end_date: datetime
    is_active: bool
    created_by: int
    created_at: datetime
    progress: List[ChallengeProgressResponse]
    
class CircleActivityResponse(BaseModel):
    id: int
    user_id: int
    username: str
    avatar_url: Optional[str]
    activity_type: str
    book_title: Optional[str]
    book_cover: Optional[str]
    content: Optional[str]
    created_at: datetime
