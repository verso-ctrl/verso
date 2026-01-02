"""
Seed script to populate the database with sample books
Run this after starting the backend to add some books to get started
"""

import requests
import json

API_URL = "http://localhost:8000"

# Sample books data
SAMPLE_BOOKS = [
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "description": "A dystopian social science fiction novel and cautionary tale about the dangers of totalitarianism.",
        "published_year": 1949,
        "genre": "Dystopian Fiction",
        "page_count": 328,
        "publisher": "Secker & Warburg"
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780061120084",
        "description": "A gripping, heart-wrenching, and wholly remarkable tale of coming-of-age in a South poisoned by virulent prejudice.",
        "published_year": 1960,
        "genre": "Fiction",
        "page_count": 324,
        "publisher": "J.B. Lippincott & Co."
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "description": "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
        "published_year": 1925,
        "genre": "Fiction",
        "page_count": 180,
        "publisher": "Charles Scribner's Sons"
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "description": "A romantic novel of manners that follows the character development of Elizabeth Bennet.",
        "published_year": 1813,
        "genre": "Romance",
        "page_count": 432,
        "publisher": "T. Egerton"
    },
    {
        "title": "The Catcher in the Rye",
        "author": "J.D. Salinger",
        "isbn": "9780316769174",
        "description": "The experiences of a teenager who has been expelled from prep school in New York City.",
        "published_year": 1951,
        "genre": "Fiction",
        "page_count": 234,
        "publisher": "Little, Brown and Company"
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "description": "A young wizard's journey begins at Hogwarts School of Witchcraft and Wizardry.",
        "published_year": 1997,
        "genre": "Fantasy",
        "page_count": 309,
        "publisher": "Bloomsbury"
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "description": "Bilbo Baggins enjoys a comfortable life until he's swept into an epic quest.",
        "published_year": 1937,
        "genre": "Fantasy",
        "page_count": 310,
        "publisher": "George Allen & Unwin"
    },
    {
        "title": "The Lord of the Rings",
        "author": "J.R.R. Tolkien",
        "isbn": "9780544003415",
        "description": "An epic high fantasy adventure set in Middle-earth.",
        "published_year": 1954,
        "genre": "Fantasy",
        "page_count": 1178,
        "publisher": "George Allen & Unwin"
    },
    {
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "isbn": "9780060850524",
        "description": "A dystopian novel set in a futuristic World State of genetically modified citizens.",
        "published_year": 1932,
        "genre": "Dystopian Fiction",
        "page_count": 268,
        "publisher": "Chatto & Windus"
    },
    {
        "title": "The Chronicles of Narnia",
        "author": "C.S. Lewis",
        "isbn": "9780066238500",
        "description": "A series of seven fantasy novels set in the magical land of Narnia.",
        "published_year": 1950,
        "genre": "Fantasy",
        "page_count": 767,
        "publisher": "Geoffrey Bles"
    },
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "isbn": "9780441172719",
        "description": "Set in the distant future amidst a huge interstellar empire, this epic science fiction novel explores politics, religion, and ecology.",
        "published_year": 1965,
        "genre": "Science Fiction",
        "page_count": 688,
        "publisher": "Chilton Books"
    },
    {
        "title": "The Hitchhiker's Guide to the Galaxy",
        "author": "Douglas Adams",
        "isbn": "9780345391803",
        "description": "A comedic science fiction series following the adventures of Arthur Dent after Earth's destruction.",
        "published_year": 1979,
        "genre": "Science Fiction",
        "page_count": 224,
        "publisher": "Pan Books"
    },
    {
        "title": "Fahrenheit 451",
        "author": "Ray Bradbury",
        "isbn": "9781451673319",
        "description": "A dystopian novel about a future American society where books are outlawed and 'firemen' burn any that are found.",
        "published_year": 1953,
        "genre": "Dystopian Fiction",
        "page_count": 249,
        "publisher": "Ballantine Books"
    },
    {
        "title": "Jane Eyre",
        "author": "Charlotte Brontë",
        "isbn": "9780141441146",
        "description": "The story follows the experiences of its eponymous heroine, including her growth to adulthood and her love for Mr. Rochester.",
        "published_year": 1847,
        "genre": "Romance",
        "page_count": 532,
        "publisher": "Smith, Elder & Co."
    },
    {
        "title": "Wuthering Heights",
        "author": "Emily Brontë",
        "isbn": "9780141439556",
        "description": "A passionate tale of the destructive nature of love between Heathcliff and Catherine Earnshaw.",
        "published_year": 1847,
        "genre": "Romance",
        "page_count": 464,
        "publisher": "Thomas Cautley Newby"
    }
]

def seed_database(token):
    """Seed the database with sample books"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Seeding database with sample books...")
    successful = 0
    
    for book in SAMPLE_BOOKS:
        try:
            response = requests.post(
                f"{API_URL}/books",
                json=book,
                headers=headers
            )
            if response.status_code == 201:
                print(f"✓ Added: {book['title']}")
                successful += 1
            else:
                print(f"✗ Failed to add {book['title']}: {response.text}")
        except Exception as e:
            print(f"✗ Error adding {book['title']}: {str(e)}")
    
    print(f"\nSuccessfully added {successful}/{len(SAMPLE_BOOKS)} books")

def main():
    print("=" * 60)
    print("Bookshelf Database Seeder")
    print("=" * 60)
    print()
    
    # Get credentials
    print("Please login to seed the database:")
    username = input("Username: ")
    password = input("Password: ")
    
    # Login
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"username": username, "password": password}
        )
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"\n✓ Login successful!\n")
            seed_database(token)
        else:
            print(f"\n✗ Login failed: {response.json().get('detail', 'Unknown error')}")
            print("\nPlease make sure:")
            print("1. The backend server is running (python main.py)")
            print("2. You have registered an account")
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Could not connect to the backend server.")
        print("Please make sure the backend is running at http://localhost:8000")
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")

if __name__ == "__main__":
    main()
