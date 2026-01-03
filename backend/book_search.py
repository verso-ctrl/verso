"""
Commercial Book Search API
Uses Open Library as primary source with intelligent fallbacks
"""

import requests
from typing import List, Dict, Optional
import time
from functools import lru_cache

class BookSearchService:
    """Multi-source book search optimized for commercial use"""
    
    def __init__(self):
        self.open_library_url = "https://openlibrary.org"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Bookshelf/1.0 (Commercial Book Tracker)'
        })
    
    def search_books(self, query: str, max_results: int = 20) -> List[Dict]:
        """
        Search for books using Open Library API
        Free, unlimited, commercial-friendly
        """
        url = f"{self.open_library_url}/search.json"
        params = {
            'q': query,
            'limit': max_results,
            'fields': 'key,title,author_name,first_publish_year,isbn,cover_i,publisher,number_of_pages_median,subject,ratings_average'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            books = []
            for doc in data.get('docs', []):
                book = self._format_book(doc)
                if book:
                    books.append(book)
            
            return books
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def get_book_by_isbn(self, isbn: str) -> Optional[Dict]:
        """Look up book by ISBN"""
        url = f"{self.open_library_url}/api/books"
        params = {
            'bibkeys': f'ISBN:{isbn}',
            'format': 'json',
            'jscmd': 'data'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            data = response.json()
            
            book_data = data.get(f'ISBN:{isbn}')
            if book_data:
                return self._format_book_detailed(book_data, isbn)
            
            # Fallback to search if direct lookup fails
            results = self.search_books(f"isbn:{isbn}", max_results=1)
            return results[0] if results else None
            
        except Exception as e:
            print(f"ISBN lookup error: {e}")
            return None
    
    def get_book_details(self, open_library_key: str) -> Optional[Dict]:
        """Get detailed book information from Open Library key"""
        url = f"{self.open_library_url}{open_library_key}.json"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'title': data.get('title'),
                'description': self._extract_description(data),
                'authors': self._extract_authors(data),
                'publish_date': data.get('publish_date'),
                'publishers': data.get('publishers', []),
                'number_of_pages': data.get('number_of_pages'),
                'subjects': data.get('subjects', [])[:10],  # Top 10 subjects
            }
        except Exception as e:
            print(f"Details error: {e}")
            return None
    
    def _format_book(self, doc: Dict) -> Optional[Dict]:
        """Format Open Library doc into our book schema"""
        try:
            # Get primary ISBN (prefer ISBN-13)
            isbns = doc.get('isbn', [])
            isbn = None
            if isbns:
                # Prefer 13-digit ISBNs
                isbn_13 = [i for i in isbns if len(i) == 13]
                isbn = isbn_13[0] if isbn_13 else isbns[0]
            
            # Build cover URL
            cover_id = doc.get('cover_i')
            cover_url = None
            if cover_id:
                # Use Medium size (default), can also use S, M, L
                cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"
            
            # Extract genre from subjects
            subjects = doc.get('subject', [])
            genre = None
            if subjects:
                # Map common subjects to genres
                genre_map = {
                    'fiction': 'Fiction',
                    'mystery': 'Mystery',
                    'thriller': 'Thriller', 
                    'romance': 'Romance',
                    'science fiction': 'Science Fiction',
                    'fantasy': 'Fantasy',
                    'horror': 'Horror',
                    'biography': 'Biography',
                    'history': 'History',
                    'self-help': 'Self-Help',
                    'young adult': 'Young Adult',
                    'children': 'Children',
                    'nonfiction': 'Non-Fiction',
                    'non-fiction': 'Non-Fiction',
                }
                for subject in subjects[:10]:
                    subject_lower = subject.lower()
                    for key, value in genre_map.items():
                        if key in subject_lower:
                            genre = value
                            break
                    if genre:
                        break
            
            return {
                'title': doc.get('title', 'Unknown Title'),
                'author': ', '.join(doc.get('author_name', ['Unknown Author'])),
                'isbn': isbn,
                'published_year': doc.get('first_publish_year'),
                'cover_url': cover_url,
                'publisher': ', '.join(doc.get('publisher', [])[:3]) if doc.get('publisher') else None,
                'page_count': doc.get('number_of_pages_median'),
                'open_library_key': doc.get('key'),
                'genre': genre,
                'average_rating': doc.get('ratings_average'),
            }
        except Exception as e:
            print(f"Format error: {e}")
            return None
    
    def _format_book_detailed(self, data: Dict, isbn: str) -> Dict:
        """Format detailed book data from ISBN lookup"""
        return {
            'title': data.get('title', 'Unknown Title'),
            'author': ', '.join([a['name'] for a in data.get('authors', [])]),
            'isbn': isbn,
            'published_year': data.get('publish_date', '')[:4] if data.get('publish_date') else None,
            'cover_url': data.get('cover', {}).get('medium'),
            'publisher': ', '.join(data.get('publishers', [])[:1]),
            'page_count': data.get('number_of_pages'),
        }
    
    def _extract_description(self, data: Dict) -> Optional[str]:
        """Extract description from various possible fields"""
        description = data.get('description')
        
        if isinstance(description, dict):
            return description.get('value')
        elif isinstance(description, str):
            return description
        
        # Try first sentence as fallback
        first_sentence = data.get('first_sentence')
        if isinstance(first_sentence, dict):
            return first_sentence.get('value')
        
        return None
    
    def _extract_authors(self, data: Dict) -> List[str]:
        """Extract author names from author references"""
        authors = []
        for author_ref in data.get('authors', []):
            if isinstance(author_ref, dict):
                author_key = author_ref.get('author', {}).get('key')
                if author_key:
                    # Could fetch author name from API, but skip for performance
                    # Just use the key as identifier for now
                    authors.append(author_key.split('/')[-1])
        return authors
    
    @lru_cache(maxsize=1000)
    def get_cached_cover(self, isbn: str) -> Optional[str]:
        """
        Get cover URL with caching
        Good for repeated lookups in recommendations, etc.
        """
        book = self.get_book_by_isbn(isbn)
        return book.get('cover_url') if book else None


# Additional free APIs you can integrate

class NYTBooksAPI:
    """New York Times Books API - Free bestseller data"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key  # Free key from https://developer.nytimes.com/
        self.base_url = "https://api.nytimes.com/svc/books/v3"
    
    def get_bestsellers(self, list_name: str = "combined-print-and-e-book-fiction"):
        """Get current bestsellers - adds credibility to books"""
        url = f"{self.base_url}/lists/current/{list_name}.json"
        params = {'api-key': self.api_key}
        
        response = requests.get(url, params=params)
        data = response.json()
        
        return data.get('results', {}).get('books', [])


class ISBNdbAPI:
    """ISBNdb - Free tier: 1,000 requests/day"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key  # Free from https://isbndb.com/
        self.base_url = "https://api2.isbndb.com"
    
    def get_book(self, isbn: str) -> Optional[Dict]:
        """Supplement Open Library with better data quality"""
        url = f"{self.base_url}/book/{isbn}"
        headers = {'Authorization': self.api_key}
        
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                return response.json().get('book')
        except:
            pass
        
        return None
    def get_trending_books(self, max_results: int = 40) -> List[Dict]:
        """
        Get trending/popular books - recent books sorted by popularity
        Uses Open Library's trending endpoint and search for recent popular fiction
        """
        books = []
        
        # Get current year for filtering
        from datetime import datetime
        current_year = datetime.now().year
        
        # Search for popular books from recent years (last 5 years)
        # Use subject:fiction and sort by rating to get popular books
        queries = [
            f"subject:fiction first_publish_year:[{current_year-3} TO {current_year}]",
            f"subject:thriller first_publish_year:[{current_year-3} TO {current_year}]",
            f"subject:mystery first_publish_year:[{current_year-3} TO {current_year}]",
            f"subject:fantasy first_publish_year:[{current_year-2} TO {current_year}]",
            f"subject:romance first_publish_year:[{current_year-2} TO {current_year}]",
        ]
        
        seen_titles = set()
        
        for query in queries:
            if len(books) >= max_results:
                break
                
            try:
                url = f"{self.open_library_url}/search.json"
                params = {
                    'q': query,
                    'limit': 15,
                    'sort': 'rating',  # Sort by rating to get popular ones
                    'fields': 'key,title,author_name,first_publish_year,isbn,cover_i,publisher,number_of_pages_median,subject,ratings_average,ratings_count'
                }
                
                response = self.session.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                for doc in data.get('docs', []):
                    # Skip duplicates
                    title_key = doc.get('title', '').lower()
                    if title_key in seen_titles:
                        continue
                    seen_titles.add(title_key)
                    
                    # Only include books with covers for better presentation
                    if not doc.get('cover_i'):
                        continue
                    
                    book = self._format_book(doc)
                    if book:
                        books.append(book)
                        
                    if len(books) >= max_results:
                        break
                        
            except Exception as e:
                print(f"Trending search error: {e}")
                continue
        
        # Sort by year (newest first), then by rating
        books.sort(key=lambda x: (
            -(x.get('published_year') or 0),
            -(x.get('average_rating') or 0)
        ))
        
        return books[:max_results]


# Usage example for your FastAPI app
"""
from book_search import BookSearchService

book_service = BookSearchService()

@app.get("/books/search")
def search_books(q: str, limit: int = 20):
    return book_service.search_books(q, max_results=limit)

@app.get("/books/isbn/{isbn}")
def get_book_by_isbn(isbn: str):
    return book_service.get_book_by_isbn(isbn)
"""
