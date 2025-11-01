import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import QrScanner from "qr-scanner";
import { useMsal } from "@azure/msal-react";
import "./AttendanceMarking.css";

const AttendanceMarking = () => {
  const { instance, accounts } = useMsal();
  const [userRole, setUserRole] = useState("student");
  const [markingMode, setMarkingMode] = useState("manual"); // 'manual' or 'qr'
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [markingPayment, setMarkingPayment] = useState(null);
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraPermission, setCameraPermission] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    fetchUserRole();
    fetchGrades();
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

  const fetchGrades = async () => {
    try {
      const response = await fetch("http://localhost:8000/attendance/grades");
      if (response.ok) {
        const gradeData = await response.json();
        setGrades(gradeData);
        console.log("Available grades:", gradeData);
      } else {
        console.error("Failed to fetch grades - Status:", response.status);
        setGrades([]);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      setGrades([]);
    }
  };

  const fetchClasses = async (grade) => {
    try {
      if (!grade) {
        setClasses([]);
        setSelectedClass("");
        setStudents([]);
        setAttendance({});
        return;
      }

      const response = await fetch(
        `http://localhost:8000/attendance/classes/by-grade/${grade}`
      );
      if (response.ok) {
        const classData = await response.json();
        setClasses(classData);
        console.log(`Classes for grade ${grade}:`, classData);
      } else {
        console.error("Failed to fetch classes - Status:", response.status);
        setClasses([]);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
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
          // Check if student's grade matches the class grade
          if (student.grade !== selectedClassInfo.grade) {
            return false;
          }

          const studentSubjects = [
            student.sub_1,
            student.sub_2,
            student.sub_3,
            student.sub_4,
          ].filter(Boolean);

          return studentSubjects.some(
            (subject) =>
              subject.toLowerCase() === selectedClassInfo.subject.toLowerCase()
          );
        });

        console.log(
          `Found ${enrolledStudents.length} students enrolled in Grade ${selectedClassInfo.grade} ${selectedClassInfo.subject}`
        );
        setStudents(enrolledStudents);

        const initialAttendance = {};
        enrolledStudents.forEach((student) => {
          initialAttendance[student.id] = ""; // No default selection
        });
        setAttendance(initialAttendance);

        // After setting initial attendance, fetch today's records to update with existing data
        setTimeout(() => {
          fetchTodayAttendanceRecords(classId);
        }, 100);
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

  const fetchTodayAttendanceRecords = async (classId) => {
    try {
      const classToFetch = classId || selectedClass;
      if (!classToFetch) {
        setAttendanceRecords([]);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `http://localhost:8000/attendance/class/${classToFetch}/date/${today}`
      );

      if (response.ok) {
        const records = await response.json();
        console.log("Today's attendance records:", records);

        // Enrich records with student details
        const enrichedRecords = await Promise.all(
          records.map(async (record) => {
            try {
              const studentResponse = await fetch(
                `http://localhost:8000/student/${record.studentId}`
              );
              const studentData = studentResponse.ok
                ? await studentResponse.json()
                : { name: "Unknown Student" };

              return {
                ...record,
                studentName: studentData.name || "Unknown Student",
                studentRegisterNumber: studentData.registerNumber || "",
              };
            } catch (error) {
              console.error("Error fetching student details:", error);
              return {
                ...record,
                studentName: "Unknown Student",
                studentRegisterNumber: "",
              };
            }
          })
        );

        setAttendanceRecords(enrichedRecords);
        setShowAttendanceTable(enrichedRecords.length > 0);

        // Update attendance state with existing records for radio buttons
        const existingAttendance = {};
        enrichedRecords.forEach((record) => {
          existingAttendance[record.studentId] = record.status;
        });

        // Merge with current attendance state (preserve any unsaved changes)
        setAttendance((prevAttendance) => ({
          ...prevAttendance,
          ...existingAttendance,
        }));
      } else {
        console.error("Failed to fetch attendance records:", response.status);
        setAttendanceRecords([]);
        setShowAttendanceTable(false);
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      setAttendanceRecords([]);
      setShowAttendanceTable(false);
    }
  };

  const fetchPaymentStatuses = async (classId) => {
    try {
      if (!classId) {
        setPaymentStatuses([]);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/payment/class/${classId}/status`
      );

      if (response.ok) {
        const paymentData = await response.json();
        console.log("Payment statuses for class:", paymentData);
        setPaymentStatuses(paymentData);
      } else {
        console.error("Failed to fetch payment statuses:", response.status);
        setPaymentStatuses([]);
      }
    } catch (error) {
      console.error("Error fetching payment statuses:", error);
      setPaymentStatuses([]);
    }
  };

  const markPaymentAsPaid = async (studentId) => {
    try {
      setMarkingPayment(studentId);

      // Immediately update the local payment status to show PAID
      setPaymentStatuses((prevStatuses) =>
        prevStatuses.map((status) =>
          status.studentId === studentId
            ? {
                ...status,
                paymentStatus: "paid",
                paidDate: new Date().toISOString(),
              }
            : status
        )
      );

      const currentUser = accounts[0];
      const userEmail = currentUser.username || currentUser.name;

      // Get current user info to get their ID
      const userResponse = await fetch(
        `http://localhost:8000/users/profile/${userEmail}`
      );

      if (!userResponse.ok) {
        alert("Failed to get user information");
        // Revert the optimistic update on error
        setPaymentStatuses((prevStatuses) =>
          prevStatuses.map((status) =>
            status.studentId === studentId
              ? { ...status, paymentStatus: "pending", paidDate: null }
              : status
          )
        );
        return;
      }

      const userData = await userResponse.json();

      const response = await fetch("http://localhost:8000/payment/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: parseInt(studentId),
          classId: parseInt(selectedClass),
          paidBy: userData.id,
        }),
      });

      if (response.ok) {
        const studentName =
          students.find((s) => s.id === studentId)?.name || "Student";
        alert(`✅ Payment marked as paid for ${studentName}`);
        // Keep the optimistic update - no need to refresh from server
      } else {
        const errorData = await response.json();
        alert(
          `Failed to mark payment as paid: ${
            errorData.message || "Unknown error"
          }`
        );
        // Revert the optimistic update on error
        setPaymentStatuses((prevStatuses) =>
          prevStatuses.map((status) =>
            status.studentId === studentId
              ? { ...status, paymentStatus: "pending", paidDate: null }
              : status
          )
        );
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      alert("Error updating payment status!");
      // Revert the optimistic update on error
      setPaymentStatuses((prevStatuses) =>
        prevStatuses.map((status) =>
          status.studentId === studentId
            ? { ...status, paymentStatus: "pending", paidDate: null }
            : status
        )
      );
    } finally {
      setMarkingPayment(null);
    }
  };

  const generateQRCode = () => {
    if (!selectedClass) return;

    const classData = classes.find((c) => c.id === parseInt(selectedClass));
    const teacherInfo = accounts[0];

    const qrData = {
      classId: selectedClass,
      className: classData?.subject,
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
            subject.toLowerCase() === selectedClassInfo.subject.toLowerCase()
        );

        if (!isEnrolled) {
          alert(
            `${studentName} is not enrolled in ${selectedClassInfo.subject} class.`
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
            const wasAlreadyMarked = attendanceRecords.some(
              (record) => record.studentId === userData.id
            );
            const action = wasAlreadyMarked ? "updated" : "marked";

            alert(`Attendance ${action} successfully!`);
            // Refresh attendance records table
            fetchTodayAttendanceRecords();
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

  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedClass("");
    setStudents([]);
    setAttendance({});

    if (grade) {
      fetchClasses(grade);
    } else {
      setClasses([]);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    if (classId) {
      fetchStudents(classId);
      fetchPaymentStatuses(classId);
      // fetchTodayAttendanceRecords will be called from fetchStudents
    } else {
      setAttendanceRecords([]);
      setPaymentStatuses([]);
      setShowAttendanceTable(false);
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
        grade: selectedGrade,
        subject: classes.find((c) => c.id === parseInt(selectedClass))?.subject,
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
        const wasAlreadyMarked = attendanceRecords.some(
          (record) => record.studentId === parseInt(studentId)
        );
        const action = wasAlreadyMarked ? "updated" : "saved";

        alert(
          `✅ Attendance for ${studentDisplayName} ${action} successfully!\n📧 Parent email notification has been sent automatically.`
        );
        // Refresh attendance records table
        fetchTodayAttendanceRecords();
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
    if (!selectedClass || !selectedGrade || students.length === 0) {
      alert("Please select a grade, subject and ensure students are loaded.");
      return;
    }

    // Check if all students have attendance status selected
    const unselectedStudents = students.filter(
      (student) => !attendance[student.id]
    );
    if (unselectedStudents.length > 0) {
      const unselectedNames = unselectedStudents.map((s) => s.name).join(", ");
      alert(
        `Please select attendance status for all students. Missing: ${unselectedNames}`
      );
      return;
    }

    const attendanceData = {
      classId: selectedClass,
      grade: selectedGrade,
      subject: classes.find((c) => c.id === parseInt(selectedClass))?.subject,
      date: new Date().toISOString().split("T")[0],
      attendance: students.map((student) => ({
        studentId: student.id,
        status: attendance[student.id],
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
        const alreadyMarkedCount = students.filter((student) =>
          attendanceRecords.some((record) => record.studentId === student.id)
        ).length;

        const action = alreadyMarkedCount > 0 ? "saved/updated" : "saved";

        alert(
          `✅ All attendance ${action} successfully!\n📧 Parent email notifications have been sent automatically to all students' parents.`
        );
        // Refresh attendance records table
        fetchTodayAttendanceRecords();
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
        <div className="header-left">
          <h2>Attendance Marking</h2>
          <div className="current-date">
            📅{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        {userRole === "admin" && (
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

      {userRole === "admin" ? (
        <div className="teacher-interface">
          <div className="grade-selector">
            <label>Select Grade:</label>
            <select
              value={selectedGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
            >
              <option value="">-- Select a Grade --</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          {selectedGrade && (
            <div className="class-selector">
              <label>Select Subject:</label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                <option value="">-- Select a Subject --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.subject}
                  </option>
                ))}
              </select>
            </div>
          )}

          {markingMode === "qr" && selectedClass && selectedGrade && (
            <div className="qr-scanning">
              <h3>Scan Student QR Codes</h3>
              <p>
                Scan each student's QR code to mark their attendance in{" "}
                {classes.find((c) => c.id === parseInt(selectedClass))?.subject}{" "}
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
                          attendance[student.id] || "not-selected"
                        }`}
                      >
                        <span className="status-icon">
                          {attendance[student.id] === "present"
                            ? "✅"
                            : attendance[student.id]
                            ? "⭕"
                            : "❓"}
                        </span>
                        <span className="student-name">
                          {student.name}
                          {attendanceRecords.some(
                            (record) => record.studentId === student.id
                          ) && (
                            <small className="already-marked-text">
                              {" "}
                              (Previously Marked)
                            </small>
                          )}
                        </span>
                        <span className="status-text">
                          {attendance[student.id] === "present"
                            ? "Present"
                            : attendance[student.id] === "absent"
                            ? "Absent"
                            : attendance[student.id] === "late"
                            ? "Late"
                            : "Not Selected"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {markingMode === "manual" && selectedClass && selectedGrade && (
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
                  {students.map((student) => {
                    const paymentStatus = paymentStatuses.find(
                      (ps) => ps.studentId === student.id
                    );
                    return (
                      <div
                        key={student.id}
                        className={`student-row ${
                          attendanceRecords.some(
                            (record) => record.studentId === student.id
                          )
                            ? "already-marked"
                            : ""
                        }`}
                      >
                        <div className="student-info">
                          <span className="student-name">
                            {student.name || student.email}
                            {attendanceRecords.some(
                              (record) => record.studentId === student.id
                            ) && (
                              <span className="already-marked-badge">
                                ✓ Already Marked
                              </span>
                            )}
                            {/* Payment Status Badge */}
                            <span
                              className={`payment-status-badge ${
                                paymentStatus?.paymentStatus === "paid"
                                  ? "payment-paid"
                                  : paymentStatus?.paymentStatus === "pending"
                                  ? "payment-pending"
                                  : "payment-unpaid"
                              }`}
                            >
                              {paymentStatus?.paymentStatus === "paid"
                                ? "💰 Paid"
                                : paymentStatus?.paymentStatus === "pending"
                                ? "⏳ Pending"
                                : "❌ Unpaid"}
                            </span>
                          </span>
                          {/* Payment Information */}
                          {paymentStatus && (
                            <div className="payment-info">
                              <small>
                                Monthly Fee: Rs. {paymentStatus.monthlyFee} |
                                Due Date:{" "}
                                {new Date(
                                  paymentStatus.dueDate
                                ).toLocaleDateString()}
                                {paymentStatus.paidDate &&
                                  ` | Paid: ${new Date(
                                    paymentStatus.paidDate
                                  ).toLocaleDateString()}`}
                              </small>
                            </div>
                          )}
                        </div>
                        <div className="attendance-and-payment-controls">
                          <div className="attendance-options">
                            <label>
                              <input
                                type="radio"
                                name={`attendance-${student.id}`}
                                value="present"
                                checked={attendance[student.id] === "present"}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    student.id,
                                    e.target.value
                                  )
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
                                  handleAttendanceChange(
                                    student.id,
                                    e.target.value
                                  )
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
                                  handleAttendanceChange(
                                    student.id,
                                    e.target.value
                                  )
                                }
                              />
                              Late
                            </label>
                          </div>
                          <div className="button-group">
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
                            {/* Payment Mark as Paid Button */}
                            {paymentStatus &&
                              paymentStatus.paymentStatus !== "paid" && (
                                <button
                                  onClick={() => markPaymentAsPaid(student.id)}
                                  className="mark-payment-btn"
                                  disabled={markingPayment === student.id}
                                >
                                  {markingPayment === student.id
                                    ? "Marking..."
                                    : "Mark Payment"}
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
            {userRole === "student" ? (
              <>
                <p>Students are not allowed to mark their own attendance.</p>
                <p>
                  Please contact your teacher or administrator if you need to
                  report your attendance.
                </p>
              </>
            ) : userRole === "teacher" ? (
              <>
                <p>
                  Teachers no longer have access to attendance marking features.
                </p>
                <p>Only administrators can mark attendance in this system.</p>
              </>
            ) : (
              <>
                <p>You do not have permission to access this feature.</p>
                <p>Please contact your administrator for access.</p>
              </>
            )}

            <div className="info-box">
              <h4>📋 How Attendance Works:</h4>
              <ul>
                <li>✅ Administrators mark attendance using this system</li>
                <li>
                  📧 You'll receive email notifications about your attendance
                </li>
                <li>
                  👀 You can view your attendance history in your dashboard
                </li>
                <li>
                  📞 Contact your administrator for attendance corrections
                </li>
              </ul>
            </div>

            <div className="contact-info">
              <h4>📞 Need Help?</h4>
              <p>
                Contact your school administration for attendance-related
                inquiries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Attendance Records Table */}
      {userRole === "admin" && showAttendanceTable && (
        <div className="attendance-records-section">
          <div className="records-header">
            <h3>Today's Attendance Records</h3>
            <div className="records-date">
              📅{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Register No.</th>
                  <th>Status</th>
                  <th>Time Marked</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => (
                  <tr key={`${record.id}-${index}`}>
                    <td className="student-name-cell">{record.studentName}</td>
                    <td className="register-cell">
                      {record.studentRegisterNumber || "-"}
                    </td>
                    <td className={`status-cell status-${record.status}`}>
                      <span className={`status-badge ${record.status}`}>
                        {record.status === "present" && "✅ Present"}
                        {record.status === "absent" && "❌ Absent"}
                        {record.status === "late" && "⏰ Late"}
                      </span>
                    </td>
                    <td className="time-cell">
                      {record.timestamp
                        ? new Date(record.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )
                        : new Date(record.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                    </td>
                    <td className="method-cell">{record.method || "Manual"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attendanceRecords.length === 0 && (
            <div className="no-records-message">
              <p>No attendance records found for today.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
