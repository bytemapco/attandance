from typing import Generic, TypeVar, Sequence
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="1-based page index")
    page_size: int = Field(10, ge=1, le=100, description="Items per page (max 100)")
    sort_by: str | None = Field(None, description="Field name to sort by")
    sort_order: str = Field("asc", pattern="^(asc|desc)$", description="Sort direction")
    q: str | None = Field(None, description="Search query string")


class PaginatedResponse(BaseModel, Generic[T]):
    items: Sequence[T]
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(cls, items: Sequence[T], total_items: int, page: int, page_size: int):
        total_pages = max(1, (total_items + page_size - 1) // page_size) if total_items > 0 else 1
        return cls(
            items=items,
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )
