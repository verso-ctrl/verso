# Bookshelf Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                    (React + Tailwind CSS)                        │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
                │  HTTP Requests                  │  WebSocket (future)
                │  (Axios)                        │
                ▼                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / ROUTER                          │
│                         (FastAPI)                                  │
├───────────────────────────────────────────────────────────────────┤
│  Authentication    │   Books API    │   AI Service   │   Social  │
│   Middleware       │   Endpoints    │   Integration  │   Features│
└─────────┬──────────┴────────┬───────┴────────┬───────┴───────────┘
          │                   │                │
          │                   │                │
          ▼                   ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   Auth Service  │  │  Book Service   │  │  Claude AI API   │
│   (JWT Tokens)  │  │  (CRUD + Rec)   │  │  (Anthropic)     │
└────────┬────────┘  └────────┬────────┘  └──────────────────┘
         │                    │
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────┐
│           DATABASE LAYER                 │
│         (SQLAlchemy ORM)                │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Users   │  │  Books   │  │Activity││
│  └──────────┘  └──────────┘  └────────┘│
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │UserBooks │  │Collections│ │Followers││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   SQLite DB  │
         │  (bookshelf  │
         │     .db)     │
         └──────────────┘
```

## Component Details

### Frontend Layer (React)

**Pages:**
- `/login`, `/register` - Authentication
- `/` - Dashboard with stats and activity feed
- `/library` - User's book collection with filters
- `/discover` - Browse and search books
- `/recommendations` - AI-powered suggestions
- `/profile` - User settings and information
- `/books/:id` - Detailed book view

**State Management (Zustand):**
- `authStore` - User authentication state
- `libraryStore` - Book collection and stats

**Services:**
- `api.js` - Centralized API communication
- Axios interceptors for auth tokens

### Backend Layer (FastAPI)

**Routes:**

```
/auth/*
├── POST /register          - Create new account
├── POST /login             - Login user
├── GET  /me                - Get current user
└── PUT  /me                - Update profile

/books/*
├── GET    /books           - List books (search, filter)
├── GET    /books/{id}      - Get book details
└── POST   /books           - Create new book

/my-books/*
├── GET    /my-books        - Get user's books
├── POST   /my-books        - Add book to library
├── PUT    /my-books/{id}   - Update book status/rating
└── DELETE /my-books/{id}   - Remove from library

/collections/*
├── GET  /collections                      - List collections
├── POST /collections                      - Create collection
└── POST /collections/{id}/books/{book_id} - Add book

/recommendations
└── GET  /recommendations   - Get AI suggestions

/users/*
├── POST   /users/{id}/follow   - Follow user
└── DELETE /users/{id}/follow   - Unfollow user

/feed
└── GET /feed               - Activity feed

/stats/*
└── GET /stats/reading      - Reading statistics
```

### Database Schema

**Core Tables:**

```sql
Users
├── id (PK)
├── username (unique)
├── email (unique)
├── hashed_password
├── full_name
├── bio
└── created_at

Books
├── id (PK)
├── title
├── author
├── isbn (unique)
├── description
├── cover_url
├── published_year
├── genre
├── page_count
├── average_rating
└── ratings_count

UserBooks (Junction Table)
├── id (PK)
├── user_id (FK)
├── book_id (FK)
├── status (enum)
├── rating
├── review
├── is_owned
├── started_at
├── finished_at
└── added_at

Collections
├── id (PK)
├── user_id (FK)
├── name
├── description
├── is_public
└── created_at

Activities
├── id (PK)
├── user_id (FK)
├── activity_type
├── book_id (FK)
├── content
└── created_at

Followers
├── follower_id (FK)
├── following_id (FK)
└── created_at
```

## Data Flow Examples

### Adding a Book to Library

```
1. User clicks "Add to Library" on Discover page
   ↓
2. Frontend: userBooksAPI.addBookToLibrary(bookData)
   ↓
3. Axios: POST /my-books with auth token
   ↓
4. Backend: Validates token, creates UserBook entry
   ↓
5. Database: Insert into user_books table
   ↓
6. Backend: Create Activity entry for feed
   ↓
7. Response: Success confirmation
   ↓
8. Frontend: Refresh library, show notification
```

### Getting AI Recommendations

```
1. User clicks "Get Recommendations"
   ↓
2. Frontend: recommendationsAPI.getRecommendations()
   ↓
3. Backend: Fetch user's reading history from DB
   ↓
4. AI Service: Build reading profile
   - Extract genres, authors, ratings
   - Format prompt for Claude
   ↓
5. Claude API: Analyze and generate recommendations
   ↓
6. AI Service: Parse response, format data
   ↓
7. Response: List of recommended books with reasoning
   ↓
8. Frontend: Display recommendations in UI
```

### User Authentication Flow

```
Login:
1. User enters credentials
   ↓
2. POST /auth/login
   ↓
3. Verify password hash
   ↓
4. Generate JWT token
   ↓
5. Return token to client
   ↓
6. Store in localStorage
   ↓
7. Set in Axios headers

Subsequent Requests:
1. Request includes JWT in Authorization header
   ↓
2. auth.get_current_user() validates token
   ↓
3. Returns user object
   ↓
4. Proceed with request
```

## Security Architecture

**Authentication:**
- JWT tokens with expiration
- Bcrypt password hashing
- OAuth2 password flow

**Authorization:**
- Middleware validates tokens
- Users can only modify their own data
- Public vs private collections

**API Security:**
- CORS configured for allowed origins
- Request validation with Pydantic
- SQL injection prevention via ORM

## AI Integration

**Claude AI Service:**
```python
1. Collect user reading data:
   - Read books with ratings
   - Genre preferences
   - Review sentiment

2. Build context prompt:
   - Reading profile summary
   - Recent books
   - Specific request context

3. Call Claude API:
   - Model: claude-sonnet-4
   - Temperature: optimized for recommendations
   - Max tokens: sufficient for detailed response

4. Process response:
   - Parse JSON recommendations
   - Extract reasoning
   - Format for frontend

5. Fallback handling:
   - Simple genre-based matching
   - If API unavailable
```

## Performance Considerations

**Backend:**
- Async database operations ready
- Query optimization with indexes
- Pagination for large datasets

**Frontend:**
- Code splitting with React Router
- Lazy loading components
- Optimized bundle size with Vite

**Database:**
- Indexes on foreign keys
- Efficient join queries
- Connection pooling

## Scalability Options

**Horizontal Scaling:**
- Stateless API (JWT in requests)
- Multiple backend instances with load balancer
- Shared database connection

**Database:**
- Easy migration to PostgreSQL
- Read replicas for queries
- Caching layer (Redis)

**Frontend:**
- CDN for static assets
- Server-side rendering (Next.js migration)
- Progressive Web App features

## Monitoring & Logging

**Backend:**
- FastAPI automatic request logging
- Error tracking and reporting
- API performance metrics

**Frontend:**
- Console error logging
- Network request monitoring
- User analytics (optional)

---

This architecture provides a solid foundation that's easy to understand, maintain, and extend as your book tracking platform grows!
