# 📚 StudentTracker - ระบบติดตามการเรียนและการส่งงานนักเรียน

ระบบเว็บแอปพลิเคชันสำหรับครูผู้สอนเพื่อใช้ติดตามความคืบหน้าการส่งงาน การบ้าน และบันทึกคะแนนเก็บของนักเรียนแบบเรียลไทม์ พร้อมหน้าต่างตาราง Matrix แสดงภาพรวมทั้งห้องเรียน

---

## 🚀 จุดเด่นและฟีเจอร์หลัก (Features)

1. **📊 กระดานติดตามงาน (Assignment Tracker Matrix)**
   - แสดงตารางภาพรวม 2 มิติ (รายชื่อนักเรียน x ชิ้นงานทั้งหมด)
   - แถบสถานะสีสันชัดเจน: 
     - 🟢 **ตรวจแล้ว (Graded)** พร้อมคะแนนที่ได้
     - 🔵 **ส่งแล้ว (Submitted)** รอคุณครูตรวจ
     - 🔴 **ส่งล่าช้า (Late)**
     - 🟡 **ยังไม่ส่ง (Pending)**
   - คลิกที่ช่องงานเพื่อเปิดหน้าต่าง **ตรวจให้คะแนนและใส่ข้อเสนอแนะ (Feedback)** ได้ทันทีในคลิกเดียว
   - มี Progress Bar คำนวณร้อยละความคืบหน้า (% การส่งงาน) ของนักเรียนแต่ละคนแบบอัตโนมัติ

2. **📈 แดชบอร์ดสรุปสถิติ (Overview Dashboard)**
   - สรุปยอดนักเรียนทั้งหมด, จำนวนชิ้นงาน, อัตราการส่งงานเฉลี่ยทั้งระดับชั้น, และจำนวนงานที่ยังค้างส่ง

3. **🔍 ตัวกรองและการค้นหา (Filters & Search)**
   - ค้นหาตามชื่อ, นามสกุล, หรือรหัสนักเรียนได้แบบ Instant Search
   - กรองแยกดูตามห้องเรียน (เช่น ม.4/1, ม.4/2) หรือตามรายวิชา

4. **👥 จัดการข้อมูลนักเรียนและชิ้นงาน (Management)**
   - เพิ่ม/จัดการรายชื่อนักเรียนใหม่
   - เพิ่ม/กำหนดหัวข้อการบ้าน กำหนดส่ง และคะแนนเต็ม
   - มีปุ่ม **รีเซ็ตข้อมูลตัวอย่าง (Demo Data)** สำหรับเริ่มต้นทดสอบระบบได้ทันที

---

## 🛠️ โครงสร้างเทคโนโลยี (Tech Stack)

- **หลังบ้าน (Backend)**: 
  - Python 3.14+
  - **FastAPI** (High-performance API framework พร้อม Auto Interactive Swagger Docs)
  - **SQLAlchemy 2.0** (ORM)
  - **SQLite** (ฐานข้อมูลในตัว ไม่ต้องติดตั้งโปรแกรม DB แยก พร้อมเริ่มพัฒนาได้ทันที)
  - **Uvicorn** (ASGI server)
- **หน้าบ้าน (Frontend)**:
  - **React 19** + **Vite** (โหลดเร็ว โครงสร้างคอมโพเนนต์ยืดหยุ่น)
  - **Vanilla CSS (Modern Dark Glass Theme)** ออกแบบให้สวยงามทันสมัย รองรับภาษาไทยด้วยฟอนต์ Prompt & Plus Jakarta Sans

---

## 📁 โครงสร้างโฟลเดอร์ของโปรเจกต์ (Project Structure)

```text
student-tracker/
├── backend/                  # ส่วนหลังบ้าน (Python FastAPI)
│   ├── venv/                 # Python Virtual Environment
│   ├── database.py           # การตั้งค่าเชื่อมต่อ SQLite ผ่าน SQLAlchemy
│   ├── models.py             # โมเดลตารางฐานข้อมูล (Student, Assignment, Submission)
│   ├── schemas.py            # Pydantic schemas สำหรับ validate ข้อมูลเข้า-ออก
│   ├── crud.py               # ฟังก์ชันจัดเก็บและดึงข้อมูลจากฐานข้อมูล
│   ├── seed_data.py          # ข้อมูลตัวอย่างเริ่มต้น (นักเรียนไทยและวิชาต่างๆ)
│   ├── main.py               # FastAPI application & REST API Endpoints
│   ├── run.py                # สคริปต์รันเซิร์ฟเวอร์ Backend
│   └── requirements.txt      # รายการแพ็กเกจ Python
│
├── frontend/                 # ส่วนหน้าบ้าน (React + Vite)
│   ├── src/
│   │   ├── App.jsx           # หน้าจอหลักและระบบจัดการสถานะทั้งหมด
│   │   ├── App.css           # สไตล์คอมโพเนนต์และ Glassmorphism UI
│   │   ├── index.css         # ตัวแปรดีไซน์ โทนสี และ Global Reset
│   │   └── main.jsx          # จุดเริ่มต้นของ React
│   ├── index.html            # โครงสร้างหน้าเว็บพร้อมฟอนต์ภาษาไทย
│   ├── vite.config.js        # กำหนด Proxy `/api` ชี้ไปที่ Backend อัตโนมัติ
│   └── package.json          # Node dependencies
│
├── run-backend.bat           # สคริปต์ดับเบิลคลิกเปิด Backend (Windows)
├── run-frontend.bat          # สคริปต์ดับเบิลคลิกเปิด Frontend (Windows)
├── package.json              # รันคำสั่งรวมผ่าน npm
└── README.md
```

---

## 🏁 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. วิธีเริ่มใช้งานแบบรวดเร็ว (Quick Start)

สามารถดับเบิลคลิกที่ไฟล์:
1. `run-backend.bat` เพื่อรัน Backend
2. `run-frontend.bat` เพื่อรัน Frontend

---

### 2. วิธีรันผ่าน Terminal

#### 🔹 รัน Backend (FastAPI):
```powershell
cd backend
.\venv\Scripts\python run.py
```
> เซิร์ฟเวอร์ Backend จะทำงานที่: **http://127.0.0.1:8000**  
> สามารถเปิดดูคู่มือ API แบบ Interactive (Swagger UI) ได้ที่: **http://127.0.0.1:8000/docs**

#### 🔹 รัน Frontend (React + Vite):
```powershell
cd frontend
npm run dev
```
> หน้าบ้านจะทำงานที่: **http://localhost:5173**

---

## 📡 REST API Endpoints ที่สำคัญ

| Method | Endpoint | รายละเอียด |
|---|---|---|
| `GET` | `/api/matrix` | ดึงข้อมูลตารางติดตามงาน (Matrix) รวมทุกนักเรียนและชิ้นงาน |
| `GET` | `/api/stats` | ดึงข้อมูลสรุปภาพรวมแดชบอร์ด |
| `GET` | `/api/students` | ดึงรายชื่อนักเรียน (รองรับ `classroom`, `search`) |
| `POST` | `/api/students` | เพิ่มนักเรียนใหม่ |
| `GET` | `/api/assignments` | ดึงรายการชิ้นงาน/การบ้าน (รองรับ `subject`, `classroom`) |
| `POST` | `/api/assignments` | สร้างชิ้นงาน/การบ้านใหม่ |
| `POST` | `/api/submissions` | บันทึกหรืออัปเดตสถานะการส่งงานและคะแนน |
| `POST` | `/api/seed/reset` | รีเซ็ตฐานข้อมูลกลับเป็นข้อมูลตัวอย่างตั้งต้น |