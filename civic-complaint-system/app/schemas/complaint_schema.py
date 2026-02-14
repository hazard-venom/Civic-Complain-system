from pydantic import BaseModel
from typing import Optional


class ComplaintCreate(BaseModel):
    title: str
    category: str
    description: str
    location: str


class ComplaintOut(BaseModel):
    id: int
    title: str
    status: str
    image: Optional[str] = None

    class Config:
        from_attributes = True
