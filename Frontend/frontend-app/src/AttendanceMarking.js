import React, { useState, useEffect, useRef } from "react";
import QRCode from 'react-qr-code';
import QrScanner from 'qr-scanner';
import { useMsal } from "@azure/msal-react";
import './AttendanceMarking.css';

const AttendanceMarking = () => {
  const { accounts } = useMsal();
  const [userRole, setUserRole] = useState('student');
  const [markingMode, setMarkingMode] = useState('manual'); // 'manual' or 'qr'
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    fetchUserRole();
    fetchClasses();
  }, [accounts]);

  const fetchUserRole = async () => {
    try {
      if (accounts.length > 0) {
        const user = accounts[0];
        // Use the email from Azure AD account
        const userEmail = user.username || user.name;
        console.log('Fetching user role for:', userEmail);
        
        const response = await fetch(`http://localhost:8000/users/profile/${userEmail}`);
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          console.log('User role fetched:', userData.role);
        } else {
          console.error('Failed to fetch user role:', response.status);
          // Default to student if user not found
          setUserRole('student');
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to student on error
      setUserRole('student');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:8000/class');
      if (response.ok) {
        const classData = await response.json();
        setClasses(classData);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Mock data for demo
      setClasses([
        { id: 1, name: 'Grade 12 - Physics', code: 'PHY12' },
        { id: 2, name: 'Grade 11 - Chemistry', code: 'CHE11' },
        { id: 3, name: 'Grade 10 - Biology', code: 'BIO10' }
      ]);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      // Fetch all users with student role
      const response = await fetch(`http://localhost:8000/users`);
      if (response.ok) {
        const allUsers = await response.json();
        // Filter only students
        const studentData = allUsers.filter(user => user.role === 'student');
        setStudents(studentData);
        
        // Initialize attendance state
        const initialAttendance = {};
        studentData.forEach(student => {
          initialAttendance[student.id] = 'absent';
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Mock data for demo
      const mockStudents = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com' },
        { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com' },
        { id: 5, name: 'David Brown', email: 'david@example.com' }
      ];
      setStudents(mockStudents);
      
      const initialAttendance = {};
      mockStudents.forEach(student => {
        initialAttendance[student.id] = 'absent';
      });
      setAttendance(initialAttendance);
    }
  };

  const generateQRCode = () => {
    if (!selectedClass) return;
    
    const classData = classes.find(c => c.id === parseInt(selectedClass));
    const teacherInfo = accounts[0];
    
    const qrData = {
      classId: selectedClass,
      className: classData?.name,
      timestamp: Date.now(),
      teacherId: teacherInfo?.username || teacherInfo?.name,
      action: 'mark_attendance',
      validUntil: Date.now() + (30 * 60 * 1000) // Valid for 30 minutes
    };
    
    console.log('Generated QR Code data:', qrData);
    setQrCode(JSON.stringify(qrData));
  };

  const startQRScanning = async () => {
    try {
      setScanning(true);
      setScanResult('');
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      
      if (videoRef.current) {
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data);
            setScanResult(result.data);
            markAttendanceFromQR(result.data);
            stopQRScanning();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
          }
        );
        
        qrScannerRef.current = qrScanner;
        await qrScanner.start();
        console.log('QR Scanner started successfully');
      }
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      alert('Camera access denied or not available. Please allow camera access and try again.');
      setScanning(false);
    }
  };

  const stopQRScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  const markAttendanceFromQR = async (qrData) => {
    try {
      const data = JSON.parse(qrData);
      console.log('QR Data received:', data);
      
      if (data.classId && userRole === 'student') {
        // Get current user info
        const currentUser = accounts[0];
        const userEmail = currentUser.username || currentUser.name;
        
        // Find the current user in the backend to get their ID
        const response = await fetch(`http://localhost:8000/users/profile/${userEmail}`);
        if (response.ok) {
          const userData = await response.json();
          console.log('Current user data:', userData);
          
          // Mark attendance for this student
          const attendanceData = {
            classId: parseInt(data.classId),
            date: new Date().toISOString().split('T')[0],
            attendance: [{
              studentId: userData.id,
              status: 'present',
              timestamp: new Date().toISOString()
            }]
          };
          
          console.log('Submitting attendance:', attendanceData);
          
          const attendanceResponse = await fetch('http://localhost:8000/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(attendanceData)
          });
          
          if (attendanceResponse.ok) {
            alert('Attendance marked successfully!');
            console.log('Attendance saved successfully');
          } else {
            const errorData = await attendanceResponse.json();
            console.error('Failed to save attendance:', errorData);
            alert('Failed to save attendance: ' + (errorData.message || 'Unknown error'));
          }
        } else {
          alert('User not found in system!');
        }
      } else {
        alert('Invalid QR code or unauthorized access!');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      alert('Invalid QR code format!');
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    if (classId) {
      fetchStudents(classId);
    }
  };

  const saveAttendance = async () => {
    try {
      const attendanceData = {
        classId: selectedClass,
        date: new Date().toISOString().split('T')[0],
        attendance: Object.entries(attendance).map(([studentId, status]) => ({
          studentId: parseInt(studentId),
          status,
          timestamp: new Date().toISOString()
        }))
      };

      const response = await fetch('http://localhost:8000/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData)
      });

      if (response.ok) {
        alert('Attendance saved successfully!');
      } else {
        alert('Failed to save attendance!');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance!');
    }
  };

  return (
    <div className="attendance-marking">
      <div className="attendance-header">
        <h2>Attendance Marking</h2>
        <div className="mode-selector">
          <button 
            className={markingMode === 'manual' ? 'active' : ''}
            onClick={() => setMarkingMode('manual')}
          >
            📝 Manual
          </button>
          <button 
            className={markingMode === 'qr' ? 'active' : ''}
            onClick={() => setMarkingMode('qr')}
          >
            📱 QR Code
          </button>
        </div>
      </div>

      {userRole === 'teacher' || userRole === 'admin' ? (
        <div className="teacher-interface">
          <div className="class-selector">
            <label>Select Class:</label>
            <select 
              value={selectedClass} 
              onChange={(e) => handleClassChange(e.target.value)}
            >
              <option value="">-- Select a Class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
          </div>

          {markingMode === 'qr' && selectedClass && (
            <div className="qr-generation">
              <h3>QR Code for Attendance</h3>
              <button onClick={generateQRCode} className="generate-qr-btn">
                Generate QR Code
              </button>
              {qrCode && (
                <div className="qr-display">
                  <QRCode value={qrCode} size={200} />
                  <p>Students can scan this QR code to mark attendance</p>
                </div>
              )}
            </div>
          )}

          {markingMode === 'manual' && selectedClass && students.length > 0 && (
            <div className="manual-attendance">
              <h3>Mark Attendance Manually</h3>
              <div className="student-list">
                {students.map(student => (
                  <div key={student.id} className="student-row">
                    <div className="student-info">
                      <span className="student-name">{student.display_name || student.email}</span>
                      <span className="student-email">{student.email}</span>
                    </div>
                    <div className="attendance-options">
                      <label>
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          value="present"
                          checked={attendance[student.id] === 'present'}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                        />
                        Present
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          value="absent"
                          checked={attendance[student.id] === 'absent'}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                        />
                        Absent
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          value="late"
                          checked={attendance[student.id] === 'late'}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                        />
                        Late
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={saveAttendance} className="save-attendance-btn">
                Save Attendance
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="student-interface">
          {markingMode === 'qr' && (
            <div className="qr-scanning">
              <h3>Scan QR Code for Attendance</h3>
              {!scanning ? (
                <button onClick={startQRScanning} className="scan-qr-btn">
                  📷 Start Scanning
                </button>
              ) : (
                <div className="scanner-container">
                  <video ref={videoRef} className="qr-video"></video>
                  <button onClick={stopQRScanning} className="stop-scan-btn">
                    Stop Scanning
                  </button>
                </div>
              )}
              {scanResult && (
                <div className="scan-result">
                  <p>Scanned: {scanResult}</p>
                </div>
              )}
            </div>
          )}
          
          {markingMode === 'manual' && (
            <div className="student-manual">
              <h3>Manual Check-in</h3>
              <p>Select your class and mark your attendance:</p>
              <div className="class-selector">
                <label>Select Your Class:</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => handleClassChange(e.target.value)}
                >
                  <option value="">-- Select a Class --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>
              {selectedClass && (
                <button onClick={saveAttendance} className="checkin-btn">
                  ✓ Check In
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
