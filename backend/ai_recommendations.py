import os
from typing import List, Optional
from sqlalchemy.orm import Session
from database import User, Book, user_books
import json

class AIRecommendationService:
    def __init__(self):
        # In production, use environment variable
        self.client = None
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if api_key:
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=api_key)
            except Exception as e:
                print(f"Warning: Could not initialize Anthropic client: {e}")
                self.client = None
                
    def get_user_reading_profile(self, db: Session, user_id: int) -> dict:
        """Build a comprehensive reading profile for the user"""
        # Get user's read books with ratings
        read_books = db.execute(
            user_books.select().where(
                user_books.c.user_id == user_id,
                user_books.c.status.in_(['read', 'currently_reading'])
            )
        ).fetchall()
        
        books_data = []
        for ub in read_books:
            book = db.query(Book).filter(Book.id == ub.book_id).first()
            if book:
                books_data.append({
                    'title': book.title,
                    'author': book.author,
                    'genre': book.genre,
                    'rating': ub.rating,
                    'review': ub.review,
                    'status': ub.status
                })
        
        return {
            'books_read': books_data,
            'total_books': len(books_data),
            'average_rating': sum(b['rating'] for b in books_data if b['rating']) / len([b for b in books_data if b['rating']]) if any(b['rating'] for b in books_data) else 0
        }
    
    def get_recommendations(
        self, 
        db: Session, 
        user_id: int, 
        count: int = 10,
        based_on_book_id: Optional[int] = None
    ) -> tuple[List[dict], str]:
        """Generate AI-powered book recommendations"""
        
        if not self.client:
            # Fallback to simple recommendations if no API key
            return self._get_simple_recommendations(db, user_id, count), "Generated using similarity matching"
        
        profile = self.get_user_reading_profile(db, user_id)
        
        # Build context for Claude
        if based_on_book_id:
            based_on_book = db.query(Book).filter(Book.id == based_on_book_id).first()
            context = f"User wants recommendations similar to '{based_on_book.title}' by {based_on_book.author}."
        else:
            context = "User wants general book recommendations based on their reading history."
        
        # Create prompt for Claude
        prompt = f"""Based on this reader's profile, recommend {count} books they would enjoy.

Reading Profile:
- Books Read: {profile['total_books']}
- Average Rating Given: {profile['average_rating']:.1f}/5

Recent Books:
{self._format_books_for_prompt(profile['books_read'][:10])}

{context}

Please provide {count} book recommendations. For each book, provide:
1. Title
2. Author
3. Genre
4. Brief description (2-3 sentences)
5. Why this reader would enjoy it

Format your response as a JSON array of objects with keys: title, author, genre, description, reasoning"""

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            response_text = message.content[0].text
            
            # Extract JSON from response
            # Claude might wrap it in markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            recommendations = json.loads(response_text)
            
            # Format reasoning
            reasoning = "AI-powered recommendations based on your reading history and preferences."
            
            return recommendations, reasoning
            
        except Exception as e:
            print(f"AI recommendation error: {e}")
            return self._get_simple_recommendations(db, user_id, count), "Generated using similarity matching due to AI service unavailability"
    
    def _format_books_for_prompt(self, books: List[dict]) -> str:
        """Format books for the AI prompt"""
        formatted = []
        for book in books:
            rating_str = f"⭐ {book['rating']}/5" if book['rating'] else "No rating"
            review_str = f"\n  Review: {book['review'][:100]}..." if book['review'] else ""
            formatted.append(
                f"- {book['title']} by {book['author']} ({book['genre'] or 'Unknown genre'}) - {rating_str}{review_str}"
            )
        return '\n'.join(formatted)
    
    def _get_simple_recommendations(self, db: Session, user_id: int, count: int) -> List[dict]:
        """Fallback recommendations based on genre matching"""
        # Get user's favorite genres
        read_books = db.execute(
            user_books.select().where(user_books.c.user_id == user_id)
        ).fetchall()
        
        genres = []
        for ub in read_books:
            book = db.query(Book).filter(Book.id == ub.book_id).first()
            if book and book.genre:
                genres.append(book.genre)
        
        # Get books in similar genres that user hasn't read
        read_book_ids = [ub.book_id for ub in read_books]
        
        similar_books = db.query(Book).filter(
            Book.genre.in_(genres) if genres else True,
            Book.id.notin_(read_book_ids) if read_book_ids else True
        ).order_by(Book.average_rating.desc()).limit(count).all()
        
        return [
            {
                'title': book.title,
                'author': book.author,
                'genre': book.genre,
                'description': book.description or 'No description available',
                'reasoning': f'Similar genre to your favorite books'
            }
            for book in similar_books
        ]

# Global instance
ai_service = AIRecommendationService()
