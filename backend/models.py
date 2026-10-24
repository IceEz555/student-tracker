from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_code = Column(String(20), unique=True, index=True, nullable=False)
    number = Column(Integer, nullable=True)  # เลขที่
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    classroom = Column(String(50), index=True, nullable=False)  # เช่น ม.4/1
    email = Column(String(120), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), index=True, nullable=False)
    classroom = Column(String(50), index=True, default="ทั้งหมด")  # ม.4/1 หรือ ทั้งหมด
    max_score = Column(Float, default=10.0)
    due_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("student_id", "assignment_id", name="uq_student_assignment"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), default="pending")  # pending, submitted, late, graded
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="submissions")
    assignment = relationship("Assignment", back_populates="submissions")
