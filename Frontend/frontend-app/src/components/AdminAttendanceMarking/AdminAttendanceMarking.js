import React, { useState, useEffect } from 'react';
import './AdminAttendanceMarking.css';

const AdminAttendanceMarking = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch students
        fetch('/student')
            .then(res => res.json())
            .then(data => setStudents(data))
            .catch(err => console.error("Error fetching students:", err));

        // Fetch classes
        fetch('/class')
            .then(res => res.json())
            .then(data => setClasses(data))
            .catch(err => console.error("Error fetching classes:", err));
    }, []);

    const handleMarkAttendance = (status) => {
        if (!selectedStudent || !selectedClass || !date) {
            setMessage('Please select student, class, and date.');
            return;
        }

        const attendanceData = {
            studentId: parseInt(selectedStudent),
            classId: parseInt(selectedClass),
            date: date,
            status: status,
            isPresent: status === 'present',
            timestamp: new Date().toISOString()
        };

        fetch('/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Assuming JWT token is stored in localStorage
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(attendanceData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setMessage(`Attendance marked as ${status} for student ID ${selectedStudent}.`);
            } else {
                setMessage(`Failed to mark attendance. ${data.message}`);
            }
        })
        .catch(err => {
            console.error("Error marking attendance:", err);
            setMessage('An error occurred while marking attendance.');
        });
    };

    return (
        <div className="admin-attendance-marking-container">
            <h2>Mark Student Attendance (Admin)</h2>
            {message && <p className="message">{message}</p>}
            <div className="form-group">
                <label htmlFor="student-select">Select Student:</label>
                <select id="student-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                    <option value="">--Select a Student--</option>
                    {students.map(student => (
                        <option key={student.id} value={student.id}>{student.display_name} (ID: {student.id})</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="class-select">Select Class:</label>
                <select id="class-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    <option value="">--Select a Class--</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="date-input">Date:</label>
                <input id="date-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="button-group">
                <button onClick={() => handleMarkAttendance('present')} className="present-btn">Mark Present</button>
                <button onClick={() => handleMarkAttendance('absent')} className="absent-btn">Mark Absent</button>
            </div>
        </div>
    );
};

export default AdminAttendanceMarking;
