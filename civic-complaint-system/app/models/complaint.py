from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from app.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    category = Column(String(100))
    description = Column(Text)
    location = Column(String(255))

    #latitude = Column(Float, nullable=True)
    #longitude = Column(Float, nullable=True)

    image = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending")

    citizen_id = Column(Integer, ForeignKey("users.id"))
    
    
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
