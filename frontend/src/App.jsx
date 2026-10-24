import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'students' | 'assignments' | 'stats'
  const [matrixData, setMatrixData] = useState({ assignments: [], rows: [], classrooms: [], subjects: [] });
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Filters
  const [selectedClassroom, setSelectedClassroom] = useState('ทั้งหมด');
  const [selectedSubject, setSelectedSubject] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [submissionModal, setSubmissionModal] = useState({
    isOpen: false,
    student: null,
    assignment: null,
    cell: null,
    status: 'pending',
    score: '',
    feedback: ''
  });

  const [studentModal, setStudentModal] = useState({
    isOpen: false,
    student_code: '',
    number: '',
    first_name: '',
    last_name: '',
    classroom: 'ม.4/1',
    email: '',
    note: ''
  });

  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    title: '',
    subject: 'คณิตศาสตร์',
    description: '',
    classroom: 'ทั้งหมด',
    max_score: 10,
    due_date: new Date().toISOString().split('T')[0]
  });

  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all primary data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClassroom !== 'ทั้งหมด') params.append('classroom', selectedClassroom);
      if (selectedSubject !== 'ทั้งหมด') params.append('subject', selectedSubject);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const [matrixRes, statsRes, studentsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/matrix?${params.toString()}`),
        fetch(`/api/stats?${selectedClassroom !== 'ทั้งหมด' ? `classroom=${encodeURIComponent(selectedClassroom)}` : ''}`),
        fetch(`/api/students?${selectedClassroom !== 'ทั้งหมด' ? `classroom=${encodeURIComponent(selectedClassroom)}` : ''}`),
        fetch(`/api/assignments?${selectedSubject !== 'ทั้งหมด' ? `subject=${encodeURIComponent(selectedSubject)}` : ''}`)
      ]);

      if (matrixRes.ok) setMatrixData(await matrixRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล (ตรวจสอบว่า Backend ทำงานอยู่)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClassroom, selectedSubject, searchTerm]);

  // Open submission grading modal
  const handleCellClick = (student, assignment, cell) => {
    setSubmissionModal({
      isOpen: true,
      student,
      assignment,
      cell,
      status: cell.status || 'pending',
      score: cell.score !== null ? cell.score : '',
      feedback: cell.feedback || ''
    });
  };

  // Save submission
  const handleSaveSubmission = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: submissionModal.student.id,
        assignment_id: submissionModal.assignment.id,
        status: submissionModal.status,
        score: submissionModal.score !== '' ? parseFloat(submissionModal.score) : null,
        feedback: submissionModal.feedback || null
      };

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('บันทึกสถานะการส่งงานเรียบร้อยแล้ว');
        setSubmissionModal(prev => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        showToast('ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Create Student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        student_code: studentModal.student_code,
        number: studentModal.number ? parseInt(studentModal.number) : null,
        first_name: studentModal.first_name,
        last_name: studentModal.last_name,
        classroom: studentModal.classroom,
        email: studentModal.email || null,
        note: studentModal.note || null
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('เพิ่มนักเรียนเรียบร้อยแล้ว');
        setStudentModal(prev => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        const error = await res.json();
        showToast(error.detail || 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: assignmentModal.title,
        subject: assignmentModal.subject,
        description: assignmentModal.description || null,
        classroom: assignmentModal.classroom,
        max_score: parseFloat(assignmentModal.max_score),
        due_date: assignmentModal.due_date || null
      };

      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('สร้างชิ้นงาน/การบ้านเรียบร้อยแล้ว');
        setAssignmentModal(prev => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        showToast('เกิดข้อผิดพลาดในการสร้างงาน');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Reset demo data
  const handleResetData = async () => {
    if (!window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดใช่หรือไม่?')) return;
    try {
      const res = await fetch('/api/seed/reset', { method: 'POST' });
      if (res.ok) {
        showToast('รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว');
        fetchData();
      }
    } catch (err) {
      showToast('ไม่สามารถรีเซ็ตข้อมูลได้');
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status, score, maxScore) => {
    switch (status) {
      case 'graded':
        return (
          <span className="status-badge graded" title="ตรวจแล้ว">
            ✓ {score !== null ? `${score}/${maxScore}` : 'ตรวจแล้ว'}
          </span>
        );
      case 'submitted':
        return (
          <span className="status-badge submitted" title="ส่งแล้ว รอตรวจ">
            ● ส่งแล้ว
          </span>
        );
      case 'late':
        return (
          <span className="status-badge late" title="ส่งล่าช้า">
            ! ส่งช้า {score !== null ? `(${score}/${maxScore})` : ''}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="status-badge pending" title="ยังไม่ส่ง">
            ○ ยังไม่ส่ง
          </span>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="brand-section">
          <div className="brand-icon">📚</div>
          <div>
            <h1 className="brand-title">StudentTracker</h1>
            <p className="brand-subtitle">ระบบติดตามการเรียนและการส่งงานนักเรียนแบบเรียลไทม์</p>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleResetData}
            title="รีเซ็ตข้อมูลตัวอย่าง"
          >
            🔄 รีเซ็ตข้อมูลตัวอย่าง
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setStudentModal(prev => ({ ...prev, isOpen: true }))}
          >
            + เพิ่มนักเรียน
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setAssignmentModal(prev => ({ ...prev, isOpen: true }))}
          >
            + เพิ่มงาน/การบ้าน
          </button>
        </div>
      </header>

      {/* Stats Summary Cards */}
      {stats && (
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper icon-indigo">👥</div>
            <div className="stat-content">
              <span className="stat-label">นักเรียนทั้งหมด</span>
              <span className="stat-value">{stats.total_students} คน</span>
              <span className="stat-subtext">ในระบบที่ติดตาม</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-cyan">📝</div>
            <div className="stat-content">
              <span className="stat-label">ชิ้นงาน/การบ้าน</span>
              <span className="stat-value">{stats.total_assignments} งาน</span>
              <span className="stat-subtext">กำหนดส่งในเทอมนี้</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-emerald">📊</div>
            <div className="stat-content">
              <span className="stat-label">อัตราการส่งงานเฉลี่ย</span>
              <span className="stat-value">{stats.submitted_rate}%</span>
              <span className="stat-subtext">ส่งแล้ว / ตรวจแล้ว</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-amber">⏳</div>
            <div className="stat-content">
              <span className="stat-label">งานค้างส่ง</span>
              <span className="stat-value">{stats.pending_count} รายการ</span>
              <span className="stat-subtext">รอติดตามความคืบหน้า</span>
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text"
              placeholder="ค้นหาชื่อ, สกุล, รหัสนักเรียน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select 
            className="select-filter"
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
          >
            <option value="ทั้งหมด">ห้องเรียน: ทั้งหมด</option>
            {matrixData.classrooms?.map(c => (
              <option key={c} value={c}>ห้อง {c}</option>
            ))}
          </select>

          <select 
            className="select-filter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="ทั้งหมด">วิชา: ทั้งหมด</option>
            {matrixData.subjects?.map(s => (
              <option key={s} value={s}>วิชา {s}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            💡 คลิกที่ช่องงานเพื่อตรวจให้คะแนนหรือเปลี่ยนสถานะ
          </span>
        </div>
      </div>

      {/* View Tabs */}
      <nav className="view-tabs">
        <button 
          className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          📊 กระดานติดตามงาน (Matrix)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 รายชื่อนักเรียน ({students.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          📝 รายการงาน/การบ้าน ({assignments.length})
        </button>
      </nav>

      {/* Tab 1: Tracker Matrix */}
      {activeTab === 'matrix' && (
        <div className="matrix-container">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="sticky-col">เลขที่ / นักเรียน</th>
                <th>ห้อง</th>
                {matrixData.assignments?.map(a => (
                  <th key={a.id} style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="tag-subject" style={{ alignSelf: 'flex-start' }}>{a.subject}</span>
                      <span title={a.title}>{a.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เต็ม {a.max_score} คะแนน</span>
                    </div>
                  </th>
                ))}
                <th>ความคืบหน้า</th>
                <th>คะแนนรวม</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={matrixData.assignments.length + 4} style={{ textAlign: 'center', padding: '40px' }}>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : matrixData.rows?.length === 0 ? (
                <tr>
                  <td colSpan={matrixData.assignments.length + 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                matrixData.rows?.map(row => (
                  <tr key={row.student.id}>
                    <td className="sticky-col">
                      <div className="student-info-cell">
                        <div className="student-avatar">
                          {row.student.number || row.student.student_code.slice(-2)}
                        </div>
                        <div>
                          <div className="student-name">
                            {row.student.first_name} {row.student.last_name}
                          </div>
                          <div className="student-meta">
                            รหัส: {row.student.student_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {row.student.classroom}
                      </span>
                    </td>
                    {row.cells.map((cell, idx) => {
                      const assignment = matrixData.assignments[idx];
                      return (
                        <td 
                          key={cell.assignment_id}
                          onClick={() => handleCellClick(row.student, assignment, cell)}
                        >
                          {renderStatusBadge(cell.status, cell.score, cell.max_score)}
                        </td>
                      );
                    })}
                    <td>
                      <div className="progress-wrapper">
                        <div className="progress-bar-bg">
                          <div 
                            className={`progress-bar-fill ${row.completion_rate >= 80 ? 'progress-fill-emerald' : row.completion_rate >= 50 ? 'progress-fill-indigo' : 'progress-fill-amber'}`}
                            style={{ width: `${row.completion_rate}%` }}
                          />
                        </div>
                        <span className="progress-text">{row.completion_rate}%</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{row.total_score}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> / {row.possible_score}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Students List */}
      {activeTab === 'students' && (
        <div className="cards-grid">
          {students.map(s => (
            <div key={s.id} className="item-card">
              <div>
                <div className="item-header">
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เลขที่ {s.number || '-'} • ห้อง {s.classroom}</div>
                    <div className="item-title">{s.first_name} {s.last_name}</div>
                  </div>
                  <span className="tag-subject">รหัส {s.student_code}</span>
                </div>
                <div className="item-desc">
                  {s.email ? `อีเมล: ${s.email}` : 'ไม่มีอีเมล'}
                  {s.note && <div>หมายเหตุ: {s.note}</div>}
                </div>
              </div>
              <div className="item-footer">
                <span>บันทึกเมื่อ: {new Date(s.created_at).toLocaleDateString('th-TH')}</span>
                <span style={{ color: 'var(--accent-cyan)' }}>กำลังศึกษา</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Assignments List */}
      {activeTab === 'assignments' && (
        <div className="cards-grid">
          {assignments.map(a => (
            <div key={a.id} className="item-card">
              <div>
                <div className="item-header">
                  <div>
                    <span className="tag-subject" style={{ marginBottom: '8px' }}>{a.subject}</span>
                    <div className="item-title">{a.title}</div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                    {a.max_score} คะแนน
                  </span>
                </div>
                <p className="item-desc">{a.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>
              </div>
              <div className="item-footer">
                <span>กำหนดส่ง: {a.due_date || 'ไม่ระบุ'}</span>
                <span>เป้าหมาย: ห้อง {a.classroom}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Update / Grade Submission */}
      {submissionModal.isOpen && (
        <div className="modal-overlay" onClick={() => setSubmissionModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">ตรวจงาน & บันทึกสถานะ</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {submissionModal.student?.first_name} {submissionModal.student?.last_name} ({submissionModal.student?.classroom})
                </p>
              </div>
              <button className="close-btn" onClick={() => setSubmissionModal(prev => ({ ...prev, isOpen: false }))}>×</button>
            </div>
            
            <form onSubmit={handleSaveSubmission}>
              <div className="modal-body">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                    ชิ้นงาน: {submissionModal.assignment?.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    วิชา: {submissionModal.assignment?.subject} • คะแนนเต็ม: {submissionModal.assignment?.max_score} คะแนน
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">สถานะการส่งงาน</label>
                  <div className="status-selector">
                    <div 
                      className={`status-option ${submissionModal.status === 'graded' ? 'selected' : ''}`}
                      onClick={() => setSubmissionModal(prev => ({ ...prev, status: 'graded' }))}
                    >
                      <span style={{ color: '#34d399' }}>✓</span> ตรวจแล้ว (Graded)
                    </div>
                    <div 
                      className={`status-option ${submissionModal.status === 'submitted' ? 'selected' : ''}`}
                      onClick={() => setSubmissionModal(prev => ({ ...prev, status: 'submitted' }))}
                    >
                      <span style={{ color: '#22d3ee' }}>●</span> ส่งแล้ว (Submitted)
                    </div>
                    <div 
                      className={`status-option ${submissionModal.status === 'late' ? 'selected' : ''}`}
                      onClick={() => setSubmissionModal(prev => ({ ...prev, status: 'late' }))}
                    >
                      <span style={{ color: '#fb7185' }}>!</span> ส่งล่าช้า (Late)
                    </div>
                    <div 
                      className={`status-option ${submissionModal.status === 'pending' ? 'selected' : ''}`}
                      onClick={() => setSubmissionModal(prev => ({ ...prev, status: 'pending' }))}
                    >
                      <span style={{ color: '#fbbf24' }}>○</span> ยังไม่ส่ง (Pending)
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">คะแนนที่ได้ (จากเต็ม {submissionModal.assignment?.max_score})</label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max={submissionModal.assignment?.max_score}
                    placeholder={`ระบุคะแนน 0 - ${submissionModal.assignment?.max_score}`}
                    value={submissionModal.score}
                    onChange={(e) => setSubmissionModal(prev => ({ ...prev, score: e.target.value }))}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ความคิดเห็น / ข้อเสนอแนะจากคุณครู</label>
                  <textarea 
                    rows="3"
                    placeholder="เช่น ทำได้ดีมาก, ควรปรับปรุงวิธีทำข้อ 3..."
                    value={submissionModal.feedback}
                    onChange={(e) => setSubmissionModal(prev => ({ ...prev, feedback: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setSubmissionModal(prev => ({ ...prev, isOpen: false }))}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Student */}
      {studentModal.isOpen && (
        <div className="modal-overlay" onClick={() => setStudentModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มนักเรียนใหม่</h3>
              <button className="close-btn" onClick={() => setStudentModal(prev => ({ ...prev, isOpen: false }))}>×</button>
            </div>
            
            <form onSubmit={handleCreateStudent}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">รหัสนักเรียน *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น 6701007" 
                      value={studentModal.student_code}
                      onChange={e => setStudentModal(prev => ({ ...prev, student_code: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">เลขที่</label>
                    <input 
                      type="number" 
                      placeholder="เช่น 7" 
                      value={studentModal.number}
                      onChange={e => setStudentModal(prev => ({ ...prev, number: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">ชื่อจริง *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="ชื่อ" 
                      value={studentModal.first_name}
                      onChange={e => setStudentModal(prev => ({ ...prev, first_name: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">นามสกุล *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="นามสกุล" 
                      value={studentModal.last_name}
                      onChange={e => setStudentModal(prev => ({ ...prev, last_name: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ห้องเรียน *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="เช่น ม.4/1" 
                    value={studentModal.classroom}
                    onChange={e => setStudentModal(prev => ({ ...prev, classroom: e.target.value }))}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">อีเมล (ถ้ามี)</label>
                  <input 
                    type="email" 
                    placeholder="student@school.ac.th" 
                    value={studentModal.email}
                    onChange={e => setStudentModal(prev => ({ ...prev, email: e.target.value }))}
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">หมายเหตุ</label>
                  <input 
                    type="text" 
                    placeholder="เช่น รองหัวหน้าห้อง" 
                    value={studentModal.note}
                    onChange={e => setStudentModal(prev => ({ ...prev, note: e.target.value }))}
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setStudentModal(prev => ({ ...prev, isOpen: false }))}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกนักเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Assignment */}
      {assignmentModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAssignmentModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">สร้างงาน/การบ้านใหม่</h3>
              <button className="close-btn" onClick={() => setAssignmentModal(prev => ({ ...prev, isOpen: false }))}>×</button>
            </div>
            
            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ชื่องาน / หัวข้อการบ้าน *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="เช่น ใบงานที่ 2: เรขาคณิตวิเคราะห์" 
                    value={assignmentModal.title}
                    onChange={e => setAssignmentModal(prev => ({ ...prev, title: e.target.value }))}
                    className="form-control" 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">วิชา *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น คณิตศาสตร์" 
                      value={assignmentModal.subject}
                      onChange={e => setAssignmentModal(prev => ({ ...prev, subject: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ห้องเรียนเป้าหมาย</label>
                    <input 
                      type="text" 
                      placeholder="เช่น ทั้งหมด หรือ ม.4/1" 
                      value={assignmentModal.classroom}
                      onChange={e => setAssignmentModal(prev => ({ ...prev, classroom: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">คะแนนเต็ม *</label>
                    <input 
                      type="number" 
                      step="0.5"
                      min="1"
                      required
                      placeholder="10" 
                      value={assignmentModal.max_score}
                      onChange={e => setAssignmentModal(prev => ({ ...prev, max_score: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">กำหนดส่ง</label>
                    <input 
                      type="date" 
                      value={assignmentModal.due_date}
                      onChange={e => setAssignmentModal(prev => ({ ...prev, due_date: e.target.value }))}
                      className="form-control" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">คำอธิบายรายละเอียดงาน</label>
                  <textarea 
                    rows="3"
                    placeholder="คำชี้แจงการส่งงาน แหล่งข้อมูลอ้างอิง..." 
                    value={assignmentModal.description}
                    onChange={e => setAssignmentModal(prev => ({ ...prev, description: e.target.value }))}
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setAssignmentModal(prev => ({ ...prev, isOpen: false }))}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกชิ้นงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}
