import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import QrScanner from "qr-scanner";
import { useMsal } from "@azure/msal-react";
import "./AttendanceMarking.css";

const AttendanceMarking = () => {
  const { instance, accounts } = useMsal();
  const [userRole, setUserRole] = useState("student");
  const [markingMode, setMarkingMode] = useState("manual"); // 'manual' or 'qr'
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraPermission, setCameraPermission] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    fetchUserRole();
    fetchClasses();
    checkCameraPermission();
  }, [accounts]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      stopQRScanning();
    };
  }, []);

  // Get MSAL access token
  const getAccessToken = async () => {
    if (!accounts || accounts.length === 0) {
      throw new Error("No account found");
    }

    const request = {
      scopes: ["openid", "profile", "User.Read"],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error("Silent token acquisition failed:", error);
      // Fallback to popup
      const response = await instance.acquireTokenPopup(request);
      return response.accessToken;
    }
  };

  const fetchUserRole = async () => {
    try {
      if (accounts.length > 0) {
        const user = accounts[0];
        // Use the email from Azure AD account
        const userEmail = user.username || user.name;
        console.log("Fetching user role for:", userEmail);

        const response = await fetch(
          `http://localhost:8000/users/profile/${userEmail}`
        );
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          console.log("User role fetched:", userData.role);
        } else {
          console.error("Failed to fetch user role:", response.status);
          // Default to student if user not found
          setUserRole("student");
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      // Default to student on error
      setUserRole("student");
    }
  };

  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("not_supported");
        setCameraError("Camera is not supported on this device");
        return;
      }

      // Check if camera permission is already granted
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately
      setCameraPermission("granted");
      setCameraError("");
    } catch (error) {
      console.error("Camera permission check failed:", error);
      if (error.name === "NotAllowedError") {
        setCameraPermission("denied");
        setCameraError(
          "Camera access denied. Please allow camera access in your browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setCameraPermission("not_found");
        setCameraError("No camera device found on this device.");
      } else {
        setCameraPermission("error");
        setCameraError("Unable to access camera: " + error.message);
      }
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("http://localhost:8000/class");
      if (response.ok) {
        const classData = await response.json();
        setClasses(classData);
      } else {
        throw new Error("Failed to fetch classes");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      if (!classId) {
        setStudents([]);
        setAttendance({});
        return;
      }

      const selectedClassInfo = classes.find((c) => c.id === parseInt(classId));
      if (!selectedClassInfo) {
        console.error("Selected class not found");
        setStudents([]);
        setAttendance({});
        return;
      }

      const studentsResponse = await fetch("http://localhost:8000/student");
      if (studentsResponse.ok) {
        const allStudents = await studentsResponse.json();

        const enrolledStudents = allStudents.filter((student) => {
          const studentSubjects = [
            student.sub_1,
            student.sub_2,
            student.sub_3,
            student.sub_4,
          ].filter(Boolean);

          return studentSubjects.some(
            (subject) =>
              subject.toLowerCase() === selectedClassInfo.name.toLowerCase()
          );
        });

        console.log(
          `Found ${enrolledStudents.length} students enrolled in ${selectedClassInfo.name}`
        );
        setStudents(enrolledStudents);

        const initialAttendance = {};
        enrolledStudents.forEach((student) => {
          initialAttendance[student.id] = "absent";
        });
        setAttendance(initialAttendance);
      } else {
        console.error("Failed to fetch students:", studentsResponse.status);
        setStudents([]);
        setAttendance({});
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
      setAttendance({});
    }
  };

  const generateQRCode = () => {
    if (!selectedClass) return;

    const classData = classes.find((c) => c.id === parseInt(selectedClass));
    const teacherInfo = accounts[0];

    const qrData = {
      classId: selectedClass,
      className: classData?.name,
      timestamp: Date.now(),
      teacherId: teacherInfo?.username || teacherInfo?.name,
      action: "mark_attendance",
      validUntil: Date.now() + 30 * 60 * 1000, // Valid for 30 minutes
    };

    console.log("Generated QR Code data:", qrData);
    setQrCode(JSON.stringify(qrData));
  };

  const startQRScanning = async () => {
    try {
      setScanning(true);
      setScanResult("");
      setCameraError("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log("QR Code detected:", result.data);
            setScanResult(result.data);
            markAttendanceFromQR(result.data);
            stopQRScanning();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
            preferredCamera: "environment",
          }
        );

        qrScannerRef.current = qrScanner;
        await qrScanner.start();
        console.log("QR Scanner started successfully");
      }
    } catch (error) {
      console.error("Error starting QR scanner:", error);
      setScanning(false);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Camera access denied. Please click on the camera icon in your browser's address bar and allow camera access."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError(
          "No camera found on this device. Please ensure your device has a working camera."
        );
      } else if (error.name === "NotReadableError") {
        setCameraError(
          "Camera is already in use by another application. Please close other camera applications and try again."
        );
      } else if (error.name === "OverconstrainedError") {
        setCameraError(
          "Camera settings are not supported. Trying with default settings..."
        );
        retryWithBasicCamera();
      } else {
        setCameraError("Failed to start camera: " + error.message);
      }
    }
  };

  const retryWithBasicCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        const qrScanner = new QrScanner(videoRef.current, (result) => {
          console.log("QR Code detected:", result.data);
          setScanResult(result.data);
          markAttendanceFromQR(result.data);
          stopQRScanning();
        });

        qrScannerRef.current = qrScanner;
        await qrScanner.start();
        setScanning(true);
        setCameraError("");
        console.log("QR Scanner started with basic settings");
      }
    } catch (retryError) {
      console.error("Retry with basic camera failed:", retryError);
      setCameraError("Unable to access camera even with basic settings.");
      setScanning(false);
    }
  };

  const stopQRScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setCameraError("");
  };

  const markAttendanceFromQR = async (qrData) => {
    try {
      const data = JSON.parse(qrData);
      console.log("QR Data received:", data);

      if (
        data.type === "student_attendance" &&
        (userRole === "teacher" || userRole === "admin")
      ) {
        if (!selectedClass) {
          alert(
            "Please select a class first before scanning student QR codes."
          );
          return;
        }

        const studentId = data.studentId;
        const studentName = data.name;

        const selectedClassInfo = classes.find(
          (c) => c.id === parseInt(selectedClass)
        );
        if (!selectedClassInfo) {
          alert("Selected class not found.");
          return;
        }

        const studentResponse = await fetch(
          `http://localhost:8000/student/${studentId}`
        );
        if (!studentResponse.ok) {
          alert("Student not found in the system.");
          return;
        }

        const studentData = await studentResponse.json();
        const studentSubjects = [
          studentData.sub_1,
          studentData.sub_2,
          studentData.sub_3,
          studentData.sub_4,
        ].filter(Boolean);

        const isEnrolled = studentSubjects.some(
          (subject) =>
            subject.toLowerCase() === selectedClassInfo.name.toLowerCase()
        );

        if (!isEnrolled) {
          alert(
            `${studentName} is not enrolled in ${selectedClassInfo.name} class.`
          );
          return;
        }

        const newAttendance = { ...attendance };
        newAttendance[studentId] = "present";
        setAttendance(newAttendance);

        // Save attendance to the backend
        await saveStudentAttendance(studentId, "present", studentName);
      } else if (data.classId && userRole === "student") {
        const currentUser = accounts[0];
        const userEmail = currentUser.username || currentUser.name;

        const response = await fetch(
          `http://localhost:8000/users/profile/${userEmail}`
        );
        if (response.ok) {
          const userData = await response.json();

          const attendanceData = {
            classId: parseInt(data.classId),
            date: new Date().toISOString().split("T")[0],
            attendance: [
              {
                studentId: userData.id,
                status: "present",
                timestamp: new Date().toISOString(),
              },
            ],
          };

          const attendanceResponse = await fetch(
            "http://localhost:8000/attendance",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(attendanceData),
            }
          );

          if (attendanceResponse.ok) {
            alert("Attendance marked successfully!");
          } else {
            const errorData = await attendanceResponse.json();
            alert(
              "Failed to save attendance: " +
                (errorData.message || "Unknown error")
            );
          }
        } else {
          alert("User not found in system!");
        }
      } else {
        alert("Invalid QR code or unauthorized access!");
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      alert("Invalid QR code format!");
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    if (classId) {
      fetchStudents(classId);
    }
  };

  const saveStudentAttendance = async (studentId, status, studentName) => {
    try {
      if (!status) {
        alert("Please select an attendance status.");
        return;
      }

      const attendanceData = {
        classId: selectedClass,
        date: new Date().toISOString().split("T")[0],
        attendance: [
          {
            studentId: parseInt(studentId),
            status,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const token = await getAccessToken();
      const response = await fetch("http://localhost:8000/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        const studentDisplayName = studentName || `student ID ${studentId}`;
        alert(
          `✅ Attendance for ${studentDisplayName} saved successfully!\n📧 Parent email notification has been sent automatically.`
        );
      } else {
        const errorData = await response.json();
        alert(
          `Failed to save attendance: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error saving student attendance:", error);
      alert("Error saving student attendance!");
    }
  };

  // Bulk save all students' attendance
  const saveAllAttendance = async () => {
    if (!selectedClass || students.length === 0) {
      alert("Please select a class and ensure students are loaded.");
      return;
    }

    const attendanceData = {
      classId: selectedClass,
      date: new Date().toISOString().split("T")[0],
      attendance: students.map((student) => ({
        studentId: student.id,
        status: attendance[student.id] || "absent",
        timestamp: new Date().toISOString(),
      })),
    };

    try {
      const token = await getAccessToken();
      const response = await fetch("http://localhost:8000/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        alert(
          "✅ All attendance saved successfully!\n📧 Parent email notifications have been sent automatically to all students' parents."
        );
      } else {
        const errorData = await response.json();
        alert(
          `Failed to save all attendance: ${
            errorData.message || response.statusText
          }`
        );
      }
    } catch (error) {
      console.error("Error saving all attendance:", error);
      alert("Error saving all attendance!");
    }
  };

  return (
    <div className="attendance-marking">
      <div className="attendance-header">
        <h2>Attendance Marking</h2>
        {(userRole === "teacher" || userRole === "admin") && (
          <div className="mode-selector">
            <button
              className={markingMode === "manual" ? "active" : ""}
              onClick={() => setMarkingMode("manual")}
            >
              📝 Manual
            </button>
            <button
              className={markingMode === "qr" ? "active" : ""}
              onClick={() => setMarkingMode("qr")}
            >
              📱 QR Code
            </button>
          </div>
        )}
      </div>

      {userRole === "teacher" || userRole === "admin" ? (
        <div className="teacher-interface">
          <div className="class-selector">
            <label>Select Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
            >
              <option value="">-- Select a Class --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.code ? ` (${cls.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {markingMode === "qr" && selectedClass && (
            <div className="qr-scanning">
              <h3>Scan Student QR Codes</h3>
              <p>
                Scan each student's QR code to mark their attendance in{" "}
                {classes.find((c) => c.id === parseInt(selectedClass))?.name}{" "}
                class
              </p>

              {!scanning ? (
                <button onClick={startQRScanning} className="start-scan-btn">
                  📱 Start Scanning
                </button>
              ) : (
                <div className="scanner-container">
                  <div className="camera-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="qr-camera"
                    />
                    <div className="scan-overlay">
                      <div className="scan-frame"></div>
                    </div>
                  </div>
                  <button onClick={stopQRScanning} className="stop-scan-btn">
                    ⏹️ Stop Scanning
                  </button>
                  {scanResult && (
                    <div className="scan-result">
                      <p>Last scanned: {scanResult}</p>
                    </div>
                  )}
                </div>
              )}

              {cameraError && (
                <div className="camera-error">
                  <p>❌ {cameraError}</p>
                </div>
              )}

              {students.length > 0 && (
                <div className="scanned-attendance">
                  <h4>Attendance Status:</h4>
                  <div className="attendance-summary">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className={`student-status ${
                          attendance[student.id] || "absent"
                        }`}
                      >
                        <span className="status-icon">
                          {attendance[student.id] === "present" ? "✅" : "⭕"}
                        </span>
                        <span className="student-name">{student.name}</span>
                        <span className="status-text">
                          {attendance[student.id] === "present"
                            ? "Present"
                            : "Not Scanned"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {markingMode === "manual" && selectedClass && (
            <div className="manual-attendance">
              <h3>Mark Attendance Manually</h3>
              {students.length > 0 ? (
                <div className="student-list">
                  {/* Save All Attendance button */}
                  <button
                    className="save-all-attendance-btn"
                    onClick={saveAllAttendance}
                    style={{
                      marginBottom: "16px",
                      backgroundColor: "#28a745",
                      color: "white",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    💾 Save All Attendance
                  </button>
                  {students.map((student) => (
                    <div key={student.id} className="student-row">
                      <div className="student-info">
                        <span className="student-name">
                          {student.name || student.email}
                        </span>
                      </div>
                      <div className="attendance-options">
                        <label>
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="present"
                            checked={attendance[student.id] === "present"}
                            onChange={(e) =>
                              handleAttendanceChange(student.id, e.target.value)
                            }
                          />
                          Present
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="absent"
                            checked={attendance[student.id] === "absent"}
                            onChange={(e) =>
                              handleAttendanceChange(student.id, e.target.value)
                            }
                          />
                          Absent
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="late"
                            checked={attendance[student.id] === "late"}
                            onChange={(e) =>
                              handleAttendanceChange(student.id, e.target.value)
                            }
                          />
                          Late
                        </label>
                      </div>
                      <button
                        onClick={() =>
                          saveStudentAttendance(
                            student.id,
                            attendance[student.id]
                          )
                        }
                        className="save-student-attendance-btn"
                      >
                        Save
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-students-message">
                  <p>No students are enrolled in the selected class.</p>
                  <p>
                    Please check the class selection or ensure students are
                    properly enrolled.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="student-restricted">
          <div className="access-denied">
            <div className="restriction-icon">🚫</div>
            <h2>Access Restricted</h2>
            <p>Students are not allowed to mark their own attendance.</p>
            <p>
              Please contact your teacher or administrator if you need to report
              your attendance.
            </p>

            <div className="info-box">
              <h4>📋 How Attendance Works:</h4>
              <ul>
                <li>✅ Teachers mark attendance using this system</li>
                <li>
                  📧 You'll receive email notifications about your attendance
                </li>
                <li>
                  👀 You can view your attendance history in your dashboard
                </li>
                <li>📞 Contact your teacher for attendance corrections</li>
              </ul>
            </div>

            <div className="contact-info">
              <h4>📞 Need Help?</h4>
              <p>
                Contact your class teacher or school administration for
                attendance-related inquiries.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
