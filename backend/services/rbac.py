"""
Role-Based Access Control (RBAC) for managing user permissions.
"""
from typing import List, Literal

# Type for user roles
UserRole = Literal["USER", "RISK", "ADMIN"]


# Mock user database (in production, this would query a real database)
_USER_DB = {
    "user1": {"role": "USER", "books": ["PM_BOOK1"]},
    "user2": {"role": "RISK", "books": ["PM_BOOK1", "PM_BOOK2", "HF_BOOK1"]},
    "admin1": {"role": "ADMIN", "books": ["*"]},  # * means all books
    "demo": {"role": "RISK", "books": ["PM_BOOK1", "TECH_DESK", "HEALTH_DESK"]},
}


def get_role(user_id: str) -> UserRole:
    """
    Get user role from user database.

    Args:
        user_id: User identifier

    Returns:
        User role (USER, RISK, or ADMIN)
    """
    user_data = _USER_DB.get(user_id, {"role": "USER"})
    role = user_data.get("role", "USER")

    # Validate role
    if role not in ["USER", "RISK", "ADMIN"]:
        return "USER"

    return role


def get_books(user_id: str) -> List[str]:
    """
    Get list of books/portfolios the user has access to.

    Args:
        user_id: User identifier

    Returns:
        List of book identifiers
    """
    user_data = _USER_DB.get(user_id)

    if not user_data:
        # Default fallback for unknown users
        return ["PM_BOOK1"]

    books = user_data.get("books", ["PM_BOOK1"])

    # If user has access to all books
    if "*" in books:
        return get_all_books()

    return books


def get_all_books() -> List[str]:
    """
    Get all available books in the system.

    Returns:
        List of all book identifiers
    """
    # In production, this would query a database
    return [
        "PM_BOOK1",
        "PM_BOOK2",
        "HF_BOOK1",
        "HF_BOOK2",
        "TECH_DESK",
        "HEALTH_DESK",
        "CLOUD_DESK",
        "AI_DESK",
        "CYBER_DESK",
        "MEDDEV_DESK",
        "BIOTECH_DESK",
    ]


def has_access_to_book(user_id: str, book: str) -> bool:
    """
    Check if user has access to a specific book.

    Args:
        user_id: User identifier
        book: Book identifier

    Returns:
        True if user has access, False otherwise
    """
    user_books = get_books(user_id)
    return book in user_books or "*" in user_books


def add_user(user_id: str, role: UserRole, books: List[str]):
    """
    Add or update a user in the system.

    Args:
        user_id: User identifier
        role: User role
        books: List of books user has access to
    """
    _USER_DB[user_id] = {
        "role": role,
        "books": books
    }
