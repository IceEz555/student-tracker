from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas


# --- Students ---
def get_students(db: Session, classroom: Optional[str] = None, search: Optional[str] = None) -> List[models.Student]:
    query = db.query(models.Student)
    if classroom and classroom != "ทั้งหมด":
        query = query.filter(models.Student.classroom == classroom)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Student.student_code.like(search_pattern)) |
            (models.Student.first_name.like(search_pattern)) |
            (models.Student.last_name.like(search_pattern))
        )
    return query.order_by(models.Student.number.asc(), models.Student.student_code.asc()).all()


def get_student(db: Session, student_id: int) -> Optional[models.Student]:
    return db.query(models.Student).filter(models.Student.id == student_id).first()


def create_student(db: Session, student_in: schemas.StudentCreate) -> models.Student:
    db_student = models.Student(**student_in.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    # Initialize empty submission records for existing assignments for this student's classroom
    assignments = db.query(models.Assignment).filter(
        (models.Assignment.classroom == "ทั้งหมด") | (models.Assignment.classroom == db_student.classroom)
    ).all()
    for assignment in assignments:
        sub = models.Submission(
            student_id=db_student.id,
            assignment_id=assignment.id,
            status="pending",
            score=None
        )
        db.add(sub)
    db.commit()

    return db_student


def update_student(db: Session, student_id: int, student_in: schemas.StudentUpdate) -> Optional[models.Student]:
    db_student = get_student(db, student_id)
    if not db_student:
        return None
    for field, value in student_in.model_dump(exclude_unset=True).items():
        setattr(db_student, field, value)
    db.commit()
    db.refresh(db_student)
    return db_student


def delete_student(db: Session, student_id: int) -> bool:
    db_student = get_student(db, student_id)
    if not db_student:
        return False
    db.delete(db_student)
    db.commit()
    return True


# --- Assignments ---
def get_assignments(db: Session, classroom: Optional[str] = None, subject: Optional[str] = None) -> List[models.Assignment]:
    query = db.query(models.Assignment)
    if classroom and classroom != "ทั้งหมด":
        query = query.filter((models.Assignment.classroom == classroom) | (models.Assignment.classroom == "ทั้งหมด"))
    if subject and subject != "ทั้งหมด":
        query = query.filter(models.Assignment.subject == subject)
    return query.order_by(models.Assignment.id.asc()).all()


def get_assignment(db: Session, assignment_id: int) -> Optional[models.Assignment]:
    return db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()


def create_assignment(db: Session, assignment_in: schemas.AssignmentCreate) -> models.Assignment:
    db_assignment = models.Assignment(**assignment_in.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)

    # Initialize submissions for all matching students
    students_query = db.query(models.Student)
    if db_assignment.classroom != "ทั้งหมด":
        students_query = students_query.filter(models.Student.classroom == db_assignment.classroom)
    students = students_query.all()

    for s in students:
        sub = models.Submission(
            student_id=s.id,
            assignment_id=db_assignment.id,
            status="pending",
            score=None
        )
        db.add(sub)
    db.commit()

    return db_assignment


def update_assignment(db: Session, assignment_id: int, assignment_in: schemas.AssignmentUpdate) -> Optional[models.Assignment]:
    db_assignment = get_assignment(db, assignment_id)
    if not db_assignment:
        return None
    for field, value in assignment_in.model_dump(exclude_unset=True).items():
        setattr(db_assignment, field, value)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def delete_assignment(db: Session, assignment_id: int) -> bool:
    db_assignment = get_assignment(db, assignment_id)
    if not db_assignment:
        return False
    db.delete(db_assignment)
    db.commit()
    return True


# --- Submissions ---
def get_submissions(db: Session, student_id: Optional[int] = None, assignment_id: Optional[int] = None) -> List[models.Submission]:
    query = db.query(models.Submission)
    if student_id:
        query = query.filter(models.Submission.student_id == student_id)
    if assignment_id:
        query = query.filter(models.Submission.assignment_id == assignment_id)
    return query.all()


def update_or_create_submission(
    db: Session,
    student_id: int,
    assignment_id: int,
    status: str,
    score: Optional[float] = None,
    feedback: Optional[str] = None
) -> models.Submission:
    sub = db.query(models.Submission).filter(
        models.Submission.student_id == student_id,
        models.Submission.assignment_id == assignment_id
    ).first()

    submitted_at = datetime.utcnow() if status in ["submitted", "late", "graded"] else None

    if not sub:
        sub = models.Submission(
            student_id=student_id,
            assignment_id=assignment_id,
            status=status,
            score=score,
            feedback=feedback,
            submitted_at=submitted_at
        )
        db.add(sub)
    else:
        sub.status = status
        sub.score = score
        sub.feedback = feedback
        if status in ["submitted", "late", "graded"] and not sub.submitted_at:
            sub.submitted_at = datetime.utcnow()
        elif status == "pending":
            sub.submitted_at = None

    db.commit()
    db.refresh(sub)
    return sub


# --- Matrix & Analytics ---
def get_tracker_matrix(
    db: Session,
    classroom: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None
) -> schemas.TrackerMatrixResponse:
    # Get students
    students = get_students(db, classroom=classroom, search=search)
    # Get assignments
    assignments = get_assignments(db, classroom=classroom, subject=subject)

    # All unique classrooms and subjects
    all_classrooms = [c[0] for c in db.query(models.Student.classroom).distinct().all() if c[0]]
    all_subjects = [s[0] for s in db.query(models.Assignment.subject).distinct().all() if s[0]]

    rows: List[schemas.StudentMatrixRow] = []

    # Map existing submissions for quick lookup: (student_id, assignment_id) -> Submission
    submissions = db.query(models.Submission).all()
    sub_map = {(s.student_id, s.assignment_id): s for s in submissions}

    for student in students:
        cells: List[schemas.MatrixCell] = []
        submitted_count = 0
        total_score = 0.0
        possible_score = 0.0

        for assignment in assignments:
            possible_score += assignment.max_score
            sub = sub_map.get((student.id, assignment.id))
            status = sub.status if sub else "pending"
            score = sub.score if sub else None
            sub_id = sub.id if sub else None
            feedback = sub.feedback if sub else None

            if status in ["submitted", "late", "graded"]:
                submitted_count += 1
            if score is not None:
                total_score += score

            cells.append(
                schemas.MatrixCell(
                    assignment_id=assignment.id,
                    submission_id=sub_id,
                    status=status,
                    score=score,
                    max_score=assignment.max_score,
                    feedback=feedback
                )
            )

        total_assignments = len(assignments)
        completion_rate = round((submitted_count / total_assignments * 100), 1) if total_assignments > 0 else 0.0

        rows.append(
            schemas.StudentMatrixRow(
                student=schemas.StudentOut.model_validate(student),
                cells=cells,
                submitted_count=submitted_count,
                total_assignments=total_assignments,
                completion_rate=completion_rate,
                total_score=round(total_score, 1),
                possible_score=round(possible_score, 1)
            )
        )

    return schemas.TrackerMatrixResponse(
        assignments=[schemas.AssignmentOut.model_validate(a) for a in assignments],
        rows=rows,
        classrooms=sorted(all_classrooms),
        subjects=sorted(all_subjects)
    )


def get_dashboard_stats(db: Session, classroom: Optional[str] = None) -> schemas.DashboardStats:
    s_query = db.query(models.Student)
    a_query = db.query(models.Assignment)
    sub_query = db.query(models.Submission)

    if classroom and classroom != "ทั้งหมด":
        s_query = s_query.filter(models.Student.classroom == classroom)
        sub_query = sub_query.join(models.Student).filter(models.Student.classroom == classroom)

    total_students = s_query.count()
    total_assignments = a_query.count()
    total_submissions = sub_query.count()

    pending_count = sub_query.filter(models.Submission.status == "pending").count()
    submitted_count = sub_query.filter(models.Submission.status == "submitted").count()
    graded_count = sub_query.filter(models.Submission.status == "graded").count()
    late_count = sub_query.filter(models.Submission.status == "late").count()

    total_done = submitted_count + graded_count + late_count
    submitted_rate = round((total_done / total_submissions * 100), 1) if total_submissions > 0 else 0.0

    all_classrooms = [c[0] for c in db.query(models.Student.classroom).distinct().all() if c[0]]

    return schemas.DashboardStats(
        total_students=total_students,
        total_assignments=total_assignments,
        total_submissions=total_submissions,
        submitted_rate=submitted_rate,
        pending_count=pending_count,
        submitted_count=submitted_count,
        graded_count=graded_count,
        late_count=late_count,
        classrooms=sorted(all_classrooms)
    )
