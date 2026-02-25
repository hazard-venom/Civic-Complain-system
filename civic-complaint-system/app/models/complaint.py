from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from datetime import datetime
from app.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(40), unique=True, index=True, nullable=True)
    title = Column(String(255))
    category = Column(String(100))
    priority = Column(String(20), default="Low")
    description = Column(Text)
    location = Column(String(255))

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    image = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending")
    officer_remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    pmo_escalated = Column(Boolean, default=False, nullable=False)
    pmo_escalated_at = Column(DateTime, nullable=True)

    citizen_id = Column(Integer, ForeignKey("users.id"))
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
