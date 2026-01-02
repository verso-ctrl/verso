"""
Goodreads CSV Import Service
Parses and imports data from Goodreads export CSV files
"""

import csv
import io
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass


@dataclass
class GoodreadsBook:
    """Parsed book from Goodreads CSV"""
    title: str
    author: str
    isbn: Optional[str]
    isbn13: Optional[str]
    my_rating: Optional[int]
    average_rating: Optional[float]
    publisher: Optional[str]
    num_pages: Optional[int]
    year_published: Optional[int]
    date_read: Optional[datetime]
    date_added: Optional[datetime]
    bookshelves: List[str]
    exclusive_shelf: str  # read, currently-reading, to-read
    my_review: Optional[str]


class GoodreadsImporter:
    """Parse and process Goodreads CSV export files"""
    
    # Map Goodreads shelves to our status
    SHELF_MAP = {
        'read': 'read',
        'currently-reading': 'currently_reading',
        'to-read': 'want_to_read',
    }
    
    def parse_csv(self, csv_content: str) -> Tuple[List[GoodreadsBook], List[str]]:
        """
        Parse Goodreads CSV export
        Returns: (list of parsed books, list of error messages)
        """
        books = []
        errors = []
        
        try:
            reader = csv.DictReader(io.StringIO(csv_content))
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    book = self._parse_row(row)
                    if book:
                        books.append(book)
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    
        except Exception as e:
            errors.append(f"CSV parsing error: {str(e)}")
            
        return books, errors
    
    def _parse_row(self, row: Dict) -> Optional[GoodreadsBook]:
        """Parse a single CSV row into a GoodreadsBook"""
        title = row.get('Title', '').strip()
        if not title:
            return None
            
        # Parse author (remove parenthetical info like birth year)
        author = row.get('Author', '').strip()
        if '(' in author:
            author = author.split('(')[0].strip()
        
        # Handle "Last, First" format
        if ',' in author and author.count(',') == 1:
            parts = author.split(',')
            author = f"{parts[1].strip()} {parts[0].strip()}"
            
        # Parse ISBNs (remove = and quotes from Goodreads format)
        isbn = self._clean_isbn(row.get('ISBN', ''))
        isbn13 = self._clean_isbn(row.get('ISBN13', ''))
        
        # Parse ratings
        my_rating = self._parse_int(row.get('My Rating', ''))
        if my_rating == 0:
            my_rating = None  # Goodreads uses 0 for unrated
            
        avg_rating = self._parse_float(row.get('Average Rating', ''))
        
        # Parse other fields
        publisher = row.get('Publisher', '').strip() or None
        num_pages = self._parse_int(row.get('Number of Pages', ''))
        year_published = self._parse_int(row.get('Year Published', ''))
        if not year_published:
            year_published = self._parse_int(row.get('Original Publication Year', ''))
        
        # Parse dates
        date_read = self._parse_date(row.get('Date Read', ''))
        date_added = self._parse_date(row.get('Date Added', ''))
        
        # Parse shelves
        bookshelves_str = row.get('Bookshelves', '')
        bookshelves = [s.strip() for s in bookshelves_str.split(',') if s.strip()]
        
        exclusive_shelf = row.get('Exclusive Shelf', 'to-read').strip()
        
        # Parse review
        my_review = row.get('My Review', '').strip() or None
        
        return GoodreadsBook(
            title=title,
            author=author or 'Unknown Author',
            isbn=isbn,
            isbn13=isbn13,
            my_rating=my_rating,
            average_rating=avg_rating,
            publisher=publisher,
            num_pages=num_pages,
            year_published=year_published,
            date_read=date_read,
            date_added=date_added,
            bookshelves=bookshelves,
            exclusive_shelf=exclusive_shelf,
            my_review=my_review
        )
    
    def _clean_isbn(self, isbn_str: str) -> Optional[str]:
        """Clean Goodreads ISBN format (="0123456789")"""
        if not isbn_str:
            return None
        # Remove = sign and quotes
        cleaned = isbn_str.replace('=', '').replace('"', '').strip()
        # Validate - should be digits only
        if cleaned and cleaned.isdigit() and len(cleaned) in [10, 13]:
            return cleaned
        return None
    
    def _parse_int(self, value: str) -> Optional[int]:
        """Safely parse integer"""
        try:
            cleaned = value.strip()
            if cleaned:
                return int(cleaned)
        except (ValueError, AttributeError):
            pass
        return None
    
    def _parse_float(self, value: str) -> Optional[float]:
        """Safely parse float"""
        try:
            cleaned = value.strip()
            if cleaned:
                return float(cleaned)
        except (ValueError, AttributeError):
            pass
        return None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse Goodreads date format (YYYY/MM/DD)"""
        if not date_str or not date_str.strip():
            return None
        try:
            return datetime.strptime(date_str.strip(), '%Y/%m/%d')
        except ValueError:
            try:
                # Try alternative format
                return datetime.strptime(date_str.strip(), '%m/%d/%Y')
            except ValueError:
                return None
    
    def get_our_status(self, exclusive_shelf: str) -> str:
        """Convert Goodreads shelf to our status"""
        return self.SHELF_MAP.get(exclusive_shelf, 'want_to_read')


# Singleton instance
goodreads_importer = GoodreadsImporter()
