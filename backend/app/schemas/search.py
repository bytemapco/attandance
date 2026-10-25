from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


SearchCategory = Literal["student", "faculty", "class", "session", "action", "navigation"]


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique ID for search result item")
    title: str = Field(..., description="Primary title or display name")
    subtitle: Optional[str] = Field(None, description="Descriptive subtitle or metadata string")
    category: SearchCategory = Field(..., description="Entity category")
    href: str = Field(..., description="Navigation route or target URL")
    badge: Optional[str] = Field(None, description="Optional badge or tag (e.g. '95% Att.', 'LIVE')")
    icon_type: Optional[str] = Field(None, description="Icon identifier for frontend rendering")


class GlobalSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    query: str = Field(..., description="Search query string")
    total_results: int = Field(..., description="Total matching items count")
    results: list[SearchResultItem] = Field(default_factory=list, description="Categorized search result items")
