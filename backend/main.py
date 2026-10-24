from typing import Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import crud
from seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Populate seed data if empty
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Student Assignment Tracker API",
    description="API สำหรับระบบติดตามการเรียนและการส่งงานของนักเรียน",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Student Tracker API", "version": "1.0.0"}


# --- Dashboard & Matrix ---
@app.get("/api/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(classroom: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db, classroom=classroom)


@app.get("/api/matrix", response_model=schemas.TrackerMatrixResponse)
def get_tracker_matrix(
    classroom: Optional[str] = Query(None, description="กรองตามห้อง เช่น ม.4/1"),
    subject: Optional[str] = Query(None, description="กรองตามวิชา เช่น คณิตศาสตร์"),
    search: Optional[str] = Query(None, description="ค้นหาชื่อหรือรหัสนักเรียน"),
    db: Session = Depends(get_db)
):
    return crud.get_tracker_matrix(db, classroom=classroom, subject=subject, search=search)


# --- Students ---
@app.get("/api/students", response_model=List[schemas.StudentOut])
def list_students(
    classroom: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_students(db, classroom=classroom, search=search)


@app.post("/api/students", response_model=schemas.StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Student).filter(models.Student.student_code == student.student_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="รหัสนักเรียนนี้มีอยู่ในระบบแล้ว")
    return crud.create_student(db, student)


@app.get("/api/students/{student_id}", response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลนักเรียน")
    return student


@app.put("/api/students/{student_id}", response_model=schemas.StudentOut)
def update_student(student_id: int, student_in: schemas.StudentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_student(db, student_id, student_in)
    if not updated:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลนักเรียน")
    return updated


@app.delete("/api/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    success = crud.delete_student(db, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลนักเรียน")
    return None


# --- Assignments ---
@app.get("/api/assignments", response_model=List[schemas.AssignmentOut])
def list_assignments(
    classroom: Optional[str] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_assignments(db, classroom=classroom, subject=subject)


@app.post("/api/assignments", response_model=schemas.AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(assignment: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    return crud.create_assignment(db, assignment)


@app.get("/api/assignments/{assignment_id}", response_model=schemas.AssignmentOut)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลชิ้นงาน/การบ้าน")
    return assignment


@app.put("/api/assignments/{assignment_id}", response_model=schemas.AssignmentOut)
def update_assignment(assignment_id: int, assignment_in: schemas.AssignmentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_assignment(db, assignment_id, assignment_in)
    if not updated:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลชิ้นงาน/การบ้าน")
    return updated


@app.delete("/api/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    success = crud.delete_assignment(db, assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลชิ้นงาน/การบ้าน")
    return None


# --- Submissions & Grading ---
@app.post("/api/submissions", response_model=schemas.SubmissionOut)
def record_submission(submission: schemas.SubmissionCreate, db: Session = Depends(get_db)):
    return crud.update_or_create_submission(
        db=db,
        student_id=submission.student_id,
        assignment_id=submission.assignment_id,
        status=submission.status,
        score=submission.score,
        feedback=submission.feedback
    )


@app.post("/api/seed/reset")
def reset_seed_data(db: Session = Depends(get_db)):
    # Clean tables and reseed
    db.query(models.Submission).delete()
    db.query(models.Assignment).delete()
    db.query(models.Student).delete()
    db.commit()
    seed_database(db)
    return {"message": "รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว"}
