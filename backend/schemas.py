from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# Student Schemas
class StudentBase(BaseModel):
    student_code: str
    number: Optional[int] = None
    first_name: str
    last_name: str
    classroom: str
    email: Optional[str] = None
    note: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    student_code: Optional[str] = None
    number: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    classroom: Optional[str] = None
    email: Optional[str] = None
    note: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Assignment Schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject: str
    classroom: Optional[str] = "ทั้งหมด"
    max_score: float = 10.0
    due_date: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    classroom: Optional[str] = None
    max_score: Optional[float] = None
    due_date: Optional[str] = None


class AssignmentOut(AssignmentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Submission Schemas
class SubmissionBase(BaseModel):
    student_id: int
    assignment_id: int
    status: str = "pending"  # pending, submitted, late, graded
    score: Optional[float] = None
    feedback: Optional[str] = None


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionUpdate(BaseModel):
    status: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None


class SubmissionOut(SubmissionBase):
    id: int
    submitted_at: Optional[datetime] = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Extended schemas for Dashboard / Matrix
class MatrixCell(BaseModel):
    assignment_id: int
    submission_id: Optional[int] = None
    status: str  # pending, submitted, late, graded
    score: Optional[float] = None
    max_score: float
    feedback: Optional[str] = None


class StudentMatrixRow(BaseModel):
    student: StudentOut
    cells: List[MatrixCell]
    submitted_count: int
    total_assignments: int
    completion_rate: float
    total_score: float
    possible_score: float


class TrackerMatrixResponse(BaseModel):
    assignments: List[AssignmentOut]
    rows: List[StudentMatrixRow]
    classrooms: List[str]
    subjects: List[str]


class DashboardStats(BaseModel):
    total_students: int
    total_assignments: int
    total_submissions: int
    submitted_rate: float
    pending_count: int
    submitted_count: int
    graded_count: int
    late_count: int
    classrooms: List[str]
