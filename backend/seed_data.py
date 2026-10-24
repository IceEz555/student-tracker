from sqlalchemy.orm import Session
import models

def seed_database(db: Session):
    # Only seed if no students exist
    if db.query(models.Student).count() > 0:
        return

    students_data = [
        {"student_code": "6701001", "number": 1, "first_name": "กิตติศักดิ์", "last_name": "มีสุข", "classroom": "ม.4/1", "email": "kittisak@school.ac.th", "note": "หัวหน้าห้อง"},
        {"student_code": "6701002", "number": 2, "first_name": "ณัชชา", "last_name": "แสงทอง", "classroom": "ม.4/1", "email": "natcha@school.ac.th", "note": ""},
        {"student_code": "6701003", "number": 3, "first_name": "ธนภัทร", "last_name": "รัตนวิชัย", "classroom": "ม.4/1", "email": "thanapat@school.ac.th", "note": ""},
        {"student_code": "6701004", "number": 4, "first_name": "ปาริฉัตร", "last_name": "วงศ์สว่าง", "classroom": "ม.4/1", "email": "parichat@school.ac.th", "note": ""},
        {"student_code": "6701005", "number": 5, "first_name": "ภานุพงศ์", "last_name": "ใจดี", "classroom": "ม.4/1", "email": "panupong@school.ac.th", "note": "มักส่งงานก่อนกำหนด"},
        {"student_code": "6701006", "number": 6, "first_name": "วรัญญา", "last_name": "พงษ์ศิริ", "classroom": "ม.4/1", "email": "waranya@school.ac.th", "note": ""},
        {"student_code": "6702001", "number": 1, "first_name": "ชนินทร์", "last_name": "ศรีสวัสดิ์", "classroom": "ม.4/2", "email": "chanin@school.ac.th", "note": "ตัวแทนนักกีฬา"},
        {"student_code": "6702002", "number": 2, "first_name": "พิชญา", "last_name": "คงมั่น", "classroom": "ม.4/2", "email": "pitchaya@school.ac.th", "note": ""},
    ]

    student_objects = []
    for s in students_data:
        student = models.Student(**s)
        db.add(student)
        student_objects.append(student)
    db.commit()

    assignments_data = [
        {
            "title": "ใบงานที่ 1: ระบบสมการเชิงเส้นสองตัวแปร",
            "description": "แก้โจทย์ปัญหา 5 ข้อพร้อมแสดงวิธีทำอย่างละเอียด",
            "subject": "คณิตศาสตร์",
            "classroom": "ทั้งหมด",
            "max_score": 10.0,
            "due_date": "2026-10-28"
        },
        {
            "title": "รายงานการทดลอง: แรงและการเคลื่อนที่",
            "description": "บันทึกผลการทดลองการตกอย่างอิสระและสรุปผล",
            "subject": "ฟิสิกส์",
            "classroom": "ทั้งหมด",
            "max_score": 15.0,
            "due_date": "2026-10-30"
        },
        {
            "title": "แบบฝึกหัด Tenses & Grammar Unit 3",
            "description": "ทำแบบฝึกหัด Present Perfect vs Past Simple",
            "subject": "ภาษาอังกฤษ",
            "classroom": "ทั้งหมด",
            "max_score": 10.0,
            "due_date": "2026-11-02"
        },
        {
            "title": "มินิโปรเจกต์: Flowchart อัลกอริทึม",
            "description": "เขียนผังงานแก้ปัญหาการคำนวณเกรดเฉลี่ย",
            "subject": "วิทยาการคำนวณ",
            "classroom": "ทั้งหมด",
            "max_score": 20.0,
            "due_date": "2026-11-05"
        }
    ]

    assignment_objects = []
    for a in assignments_data:
        assignment = models.Assignment(**a)
        db.add(assignment)
        assignment_objects.append(assignment)
    db.commit()

    # Pre-populate sample submissions
    # Sample matrix pattern for realistic demo
    preset_statuses = [
        # Student 1: All done
        [("graded", 10.0, "ทำได้ยอดเยี่ยม"), ("graded", 14.5, "ลายมือเรียบร้อย ผลการทดลองชัดเจน"), ("submitted", None, None), ("pending", None, None)],
        # Student 2: Good progress
        [("graded", 9.0, "ตรวจแล้ว ถูกต้องเกือบหมด"), ("submitted", None, None), ("graded", 8.5, "ดีมาก"), ("pending", None, None)],
        # Student 3: Some late
        [("late", 7.0, "ส่งล่าช้า 1 วัน หัก 1 คะแนน"), ("pending", None, None), ("pending", None, None), ("pending", None, None)],
        # Student 4: Great
        [("graded", 10.0, "ยอดเยี่ยม"), ("graded", 15.0, "คะแนนเต็ม"), ("submitted", None, None), ("submitted", None, None)],
        # Student 5: Early submitter
        [("graded", 9.5, "ดีมาก"), ("graded", 14.0, "ดีมาก"), ("graded", 10.0, "สมบูรณ์แบบ"), ("submitted", None, None)],
        # Student 6: Incomplete
        [("pending", None, None), ("pending", None, None), ("submitted", None, None), ("pending", None, None)],
        # Student 7 (4/2): Mixed
        [("graded", 8.0, "ผ่านเกณฑ์"), ("submitted", None, None), ("pending", None, None), ("pending", None, None)],
        # Student 8 (4/2): Graded
        [("graded", 9.0, "ดีมาก"), ("graded", 13.0, "ผ่าน"), ("submitted", None, None), ("pending", None, None)],
    ]

    for s_idx, student in enumerate(student_objects):
        pattern = preset_statuses[s_idx % len(preset_statuses)]
        for a_idx, assignment in enumerate(assignment_objects):
            status, score, feedback = pattern[a_idx % len(pattern)]
            sub = models.Submission(
                student_id=student.id,
                assignment_id=assignment.id,
                status=status,
                score=score,
                feedback=feedback
            )
            db.add(sub)

    db.commit()
    print("Database seeded with sample Thai student tracker data successfully.")
