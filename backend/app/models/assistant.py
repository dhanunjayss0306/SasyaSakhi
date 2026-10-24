"""Assistant (chat) data contracts."""
from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    language: str = Field(default="en", description="'en' | 'te'")
    message: str
    report_id: Optional[str] = None
    context: Optional[dict] = Field(default=None, description="Optional confirmed values etc.")


class ChatResponse(BaseModel):
    success: bool
    language: str
    answer: str
    source_ids: list[str] = Field(default_factory=list)
    mode: str = Field(description="'ai' | 'template'")
