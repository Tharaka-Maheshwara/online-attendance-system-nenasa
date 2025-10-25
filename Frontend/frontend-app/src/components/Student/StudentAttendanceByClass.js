import React, { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import "./StudentAttendanceByClass.css";

const StudentAttendanceByClass = () => {
  const { accounts } = useMsal();
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    lateClasses: 0,
    attendanceRate: 0,
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchAttendanceSummary = useCallback(async () => {
    if (!accounts || accounts.length === 0) return;

    try {
      setAttendanceLoading(true);
      const userEmail = accounts[0].username;

      // First, get student info by email
      const studentResponse = await fetch(
        `http://localhost:8000/student?email=${encodeURIComponent(userEmail)}`
      );

      if (!studentResponse.ok) {
        console.error("Failed to fetch student info");
        return;
      }

      const studentsData = await studentResponse.json();
      const student = studentsData.find((s) => s.email === userEmail);

      if (!student) {
        console.error("Student not found");
        return;
      }

      // Fetch all classes that this student is enrolled in
      const allClassesResponse = await fetch(
        `http://localhost:8000/student/email/${encodeURIComponent(
          userEmail
        )}/classes/all`
      );

      let enrolledClasses = [];
      if (allClassesResponse.ok) {
        enrolledClasses = await allClassesResponse.json();
      }

      // Get attendance records for this student
      const attendanceResponse = await fetch(
        `http://localhost:8000/attendance/history/student/${student.id}`
      );

      if (!attendanceResponse.ok) {
        console.error("Failed to fetch attendance records");
        return;
      }

      const attendanceRecords = await attendanceResponse.json();

      // Get current month and year for filtering
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-11
      const currentYear = currentDate.getFullYear();

      // Filter attendance records for current month only
      const currentMonthRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        );
      });

      // Process attendance data by class/subject for current month
      const attendanceByClass = {};
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalClasses = currentMonthRecords.length;

      // Initialize attendanceByClass with all enrolled classes
      enrolledClasses.forEach((classInfo) => {
        const classKey = `${classInfo.subject}_${classInfo.grade}_${classInfo.id}`;
        attendanceByClass[classKey] = {
          classId: classInfo.id,
          subject: classInfo.subject,
          grade: classInfo.grade,
          teacherName: classInfo.teacherName || "TBA",
          dayOfWeek: classInfo.dayOfWeek,
          startTime: classInfo.startTime,
          endTime: classInfo.endTime,
          totalClasses: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          attendanceRate: 0,
          recentRecords: [],
        };
      });

      // Now populate with attendance records
      currentMonthRecords.forEach((record) => {
        // Find the matching class by classId
        const matchingClassKey = Object.keys(attendanceByClass).find(
          (key) => attendanceByClass[key].classId === record.classId
        );

        if (matchingClassKey) {
          const classData = attendanceByClass[matchingClassKey];
          
          classData.totalClasses++;
          classData.recentRecords.push({
            date: record.date,
            status: record.status,
            timestamp: record.timestamp,
          });

          // Count attendance status
          if (record.status === "present") {
            classData.presentCount++;
            totalPresent++;
          } else if (record.status === "absent") {
            classData.absentCount++;
            totalAbsent++;
          } else if (record.status === "late") {
            classData.lateCount++;
            totalLate++;
          }
        }
      });

      // Calculate attendance rates for each class
      Object.keys(attendanceByClass).forEach((classKey) => {
        const classData = attendanceByClass[classKey];
        classData.attendanceRate =
          classData.totalClasses > 0
            ? Math.round(
                (classData.presentCount / classData.totalClasses) * 100
              )
            : 0;

        // Sort recent records by date (most recent first)
        classData.recentRecords.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        // Keep only the last 10 records for display
        classData.recentRecords = classData.recentRecords.slice(0, 10);

        // Add all historical records for "View Full History" (from all months)
        const allRecordsForClass = attendanceRecords.filter(
          (record) => record.classId === classData.classId
        );
        classData.allRecords = allRecordsForClass.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
      });

      setAttendanceSummary(attendanceByClass);

      console.log("📊 Attendance Summary by Class:", attendanceByClass);
      console.log("📚 Total Enrolled Classes:", enrolledClasses.length);
      console.log("📝 Total Cards to Display:", Object.keys(attendanceByClass).length);

      // Calculate overall stats
      const overallAttendanceRate =
        totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

      setOverallStats({
        totalClasses,
        presentClasses: totalPresent,
        absentClasses: totalAbsent,
        lateClasses: totalLate,
        attendanceRate: overallAttendanceRate,
      });
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    } finally {
      setAttendanceLoading(false);
    }
  }, [accounts]);

  useEffect(() => {
    fetchAttendanceSummary();
  }, [fetchAttendanceSummary]);

  const handleViewDetails = (classKey, classData) => {
    setSelectedClass({ key: classKey, data: classData });
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedClass(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return "✓";
      case "absent":
        return "✗";
      case "late":
        return "⚠";
      default:
        return "?";
    }
  };

  const getStatusClass = (status) => {
    return status === "present"
      ? "present"
      : status === "absent"
      ? "absent"
      : status === "late"
      ? "late"
      : "";
  };

  return (
    <div className="student-attendance-by-class-page">
      <div className="page-header">
        <h1>My Attendance by Class</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Overall Stats Summary */}
      <div className="overall-stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Overall Attendance</h3>
              <p className="stat-value">{overallStats.attendanceRate}%</p>
              <span className="stat-label">
                {overallStats.attendanceRate >= 90
                  ? "Excellent standing"
                  : overallStats.attendanceRate >= 75
                  ? "Good standing"
                  : overallStats.attendanceRate >= 60
                  ? "Average standing"
                  : "Needs improvement"}
              </span>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <h3>Present</h3>
              <p className="stat-value">{overallStats.presentClasses}</p>
              <span className="stat-label">Classes attended</span>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>Late</h3>
              <p className="stat-value">{overallStats.lateClasses}</p>
              <span className="stat-label">Late arrivals</span>
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon">✗</div>
            <div className="stat-content">
              <h3>Absent</h3>
              <p className="stat-value">{overallStats.absentClasses}</p>
              <span className="stat-label">Classes missed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance by Class Cards */}
      <div className="attendance-classes-section">
        {attendanceLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading attendance data...</p>
          </div>
        ) : Object.keys(attendanceSummary).length > 0 ? (
          <div className="attendance-cards-grid">
            {Object.entries(attendanceSummary).map(([classKey, classData]) => (
              <div key={classKey} className="attendance-class-card">
                <div className="attendance-card-header">
                  <div className="subject-info">
                    <h3 className="subject-title">{classData.subject}</h3>
                    <span className="grade-indicator">
                      Grade {classData.grade}
                    </span>
                  </div>
                  <div
                    className={`attendance-rate ${
                      classData.attendanceRate >= 90
                        ? "excellent"
                        : classData.attendanceRate >= 75
                        ? "good"
                        : classData.attendanceRate >= 60
                        ? "average"
                        : "poor"
                    }`}
                  >
                    {classData.attendanceRate}%
                  </div>
                </div>

                <div className="attendance-card-content">
                  <div className="teacher-info">
                    <span className="teacher-label">Teacher:</span>
                    <span className="teacher-name">{classData.teacherName}</span>
                  </div>

                  <div className="class-schedule-info">
                    <span className="schedule-label">📅 Schedule:</span>
                    <span className="schedule-value">
                      {classData.dayOfWeek} • {classData.startTime && classData.endTime
                        ? `${classData.startTime} - ${classData.endTime}`
                        : "Time TBA"}
                    </span>
                  </div>

                  <div className="attendance-stats">
                    <div className="month-indicator">
                      <span className="month-label">
                        📅{" "}
                        {new Date().toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        Statistics
                      </span>
                    </div>
                    <div className="stat-row">
                      <div className="stat-item present">
                        <span className="stat-label">Present</span>
                        <span className="stat-value">
                          {classData.presentCount}
                        </span>
                      </div>
                      <div className="stat-item absent">
                        <span className="stat-label">Absent</span>
                        <span className="stat-value">
                          {classData.absentCount}
                        </span>
                        <span className="stat-percentage">
                          {classData.totalClasses > 0
                            ? Math.round(
                                (classData.absentCount /
                                  classData.totalClasses) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="stat-item late">
                        <span className="stat-label">Late</span>
                        <span className="stat-value">{classData.lateCount}</span>
                        <span className="stat-percentage">
                          {classData.totalClasses > 0
                            ? Math.round(
                                (classData.lateCount / classData.totalClasses) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="stat-item total">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">
                          {classData.totalClasses}
                        </span>
                        <span className="stat-percentage">Classes</span>
                      </div>
                    </div>
                  </div>

                  <div className="attendance-progress">
                    <div className="progress-label">
                      <span>Attendance Progress</span>
                      <span className="progress-text">
                        {classData.attendanceRate}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${
                          classData.attendanceRate >= 90
                            ? "excellent"
                            : classData.attendanceRate >= 75
                            ? "good"
                            : classData.attendanceRate >= 60
                            ? "average"
                            : "poor"
                        }`}
                        style={{ width: `${classData.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="recent-attendance">
                    <h4>Recent Attendance</h4>
                    {classData.recentRecords && classData.recentRecords.length > 0 ? (
                      <>
                        <div className="recent-records">
                          {classData.recentRecords.slice(0, 5).map((record, index) => (
                            <div key={index} className={`record-item ${record.status}`}>
                              <span className="record-date">
                                {new Date(record.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className={`record-status ${record.status}`}>
                                {record.status === "present"
                                  ? "✓"
                                  : record.status === "absent"
                                  ? "✗"
                                  : record.status === "late"
                                  ? "⚠"
                                  : "?"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="card-actions">
                          <button
                            className="view-details-btn"
                            onClick={() => handleViewDetails(classKey, classData)}
                          >
                            <span className="btn-icon">📋</span>
                            View Full Details
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="no-records-notice">
                        <p>📝 No attendance records for this month yet.</p>
                        <span>Records will appear here after classes begin.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-attendance-message">
            <div className="no-data-icon">📊</div>
            <p className="no-data-title">
              No enrolled classes found!
            </p>
            <span className="no-data-subtitle">
              Please contact your administrator to enroll in classes. Once enrolled, your attendance records will appear here.
            </span>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedClass && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>{selectedClass.data.subject}</h2>
                <span className="modal-grade">Grade {selectedClass.data.grade}</span>
              </div>
              <button className="close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-stats-summary">
                <div className="modal-stat-card">
                  <div className="modal-stat-icon excellent">📊</div>
                  <div className="modal-stat-info">
                    <span className="modal-stat-label">Attendance Rate</span>
                    <span className="modal-stat-value">
                      {selectedClass.data.attendanceRate}%
                    </span>
                  </div>
                </div>
                <div className="modal-stat-card">
                  <div className="modal-stat-icon present">✓</div>
                  <div className="modal-stat-info">
                    <span className="modal-stat-label">Present</span>
                    <span className="modal-stat-value">
                      {selectedClass.data.presentCount}
                    </span>
                  </div>
                </div>
                <div className="modal-stat-card">
                  <div className="modal-stat-icon late">⚠</div>
                  <div className="modal-stat-info">
                    <span className="modal-stat-label">Late</span>
                    <span className="modal-stat-value">
                      {selectedClass.data.lateCount}
                    </span>
                  </div>
                </div>
                <div className="modal-stat-card">
                  <div className="modal-stat-icon absent">✗</div>
                  <div className="modal-stat-info">
                    <span className="modal-stat-label">Absent</span>
                    <span className="modal-stat-value">
                      {selectedClass.data.absentCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-teacher-info">
                <span className="modal-teacher-label">👨‍🏫 Teacher:</span>
                <span className="modal-teacher-name">
                  {selectedClass.data.teacherName}
                </span>
              </div>

              <div className="modal-attendance-history">
                <h3>Complete Attendance History</h3>
                {(selectedClass.data.allRecords || selectedClass.data.recentRecords).length > 0 ? (
                  <>
                    <div className="history-table-container">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Status</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedClass.data.allRecords || selectedClass.data.recentRecords).map(
                            (record, index) => {
                              const recordDate = new Date(record.date);
                              return (
                                <tr key={index} className={getStatusClass(record.status)}>
                                  <td>{index + 1}</td>
                                  <td>
                                    {recordDate.toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td>
                                    {recordDate.toLocaleDateString("en-US", {
                                      weekday: "short",
                                    })}
                                  </td>
                                  <td>
                                    <span className={`status-badge ${record.status}`}>
                                      <span className="status-icon">
                                        {getStatusIcon(record.status)}
                                      </span>
                                      <span className="status-text">
                                        {record.status.charAt(0).toUpperCase() +
                                          record.status.slice(1)}
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    {record.timestamp
                                      ? new Date(record.timestamp).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "N/A"}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="history-summary">
                      <p>
                        Total Records: {(selectedClass.data.allRecords || selectedClass.data.recentRecords).length}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="modal-no-records">
                    <div className="modal-no-records-icon">📝</div>
                    <p>No attendance records available yet</p>
                    <span>Attendance history will appear here once classes begin.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-close-btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceByClass;
