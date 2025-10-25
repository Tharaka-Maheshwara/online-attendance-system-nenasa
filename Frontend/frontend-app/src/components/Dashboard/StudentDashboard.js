import React, { useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { accounts } = useMsal();
  const [todayClasses, setTodayClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allClassesLoading, setAllClassesLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    lateClasses: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    const fetchClasses = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setLoading(true);
        setAllClassesLoading(true);

        // Get current user email
        const userEmail = accounts[0].username;

        // Fetch today's classes for this student
        const todayResponse = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/classes/today`
        );

        if (todayResponse.ok) {
          const todayClassesData = await todayResponse.json();
          setTodayClasses(todayClassesData);
        } else {
          console.error("Failed to fetch today's classes");
          setTodayClasses([]);
        }

        // Fetch all classes for this student
        const allResponse = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/classes/all`
        );

        if (allResponse.ok) {
          const allClassesData = await allResponse.json();
          setAllClasses(allClassesData);
        } else {
          console.error("Failed to fetch all classes");
          setAllClasses([]);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        setTodayClasses([]);
        setAllClasses([]);
      } finally {
        setLoading(false);
        setAllClassesLoading(false);
      }
    };

    fetchClasses();
  }, [accounts]);

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

      currentMonthRecords.forEach((record) => {
        const classKey = `${record.classInfo?.subject || "Unknown"}_${
          record.classInfo?.grade || "N/A"
        }`;

        if (!attendanceByClass[classKey]) {
          attendanceByClass[classKey] = {
            subject: record.classInfo?.subject || "Unknown",
            grade: record.classInfo?.grade || "N/A",
            teacherName: record.classInfo?.teacherName || "TBA",
            totalClasses: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            attendanceRate: 0,
            recentRecords: [],
          };
        }

        attendanceByClass[classKey].totalClasses++;
        attendanceByClass[classKey].recentRecords.push({
          date: record.date,
          status: record.status,
          timestamp: record.timestamp,
        });

        // Count attendance status
        if (record.status === "present") {
          attendanceByClass[classKey].presentCount++;
          totalPresent++;
        } else if (record.status === "absent") {
          attendanceByClass[classKey].absentCount++;
          totalAbsent++;
        } else if (record.status === "late") {
          attendanceByClass[classKey].lateCount++;
          totalLate++;
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
        // Keep only the last 10 records
        classData.recentRecords = classData.recentRecords.slice(0, 10);

        // Add all historical records for "View Full History" (from all months)
        const allRecordsForClass = attendanceRecords.filter((record) => {
          const recordClassKey = `${record.classInfo?.subject || "Unknown"}_${
            record.classInfo?.grade || "N/A"
          }`;
          return recordClassKey === classKey;
        });
        classData.allRecords = allRecordsForClass.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
      });

      setAttendanceSummary(attendanceByClass);

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

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hour, minute] = timeString.split(":");
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const getClassStatus = (startTime, endTime) => {
    if (!startTime || !endTime) return "upcoming";

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const classStart = startHour * 60 + startMinute;
    const classEnd = endHour * 60 + endMinute;

    if (currentTime >= classStart && currentTime <= classEnd) {
      return "current";
    } else if (currentTime > classEnd) {
      return "completed";
    }
    return "upcoming";
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "current":
        return "In Progress";
      case "upcoming":
        return "Upcoming";
      default:
        return "Upcoming";
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = {
      Sunday: "Sun",
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
    };
    return days[dayOfWeek] || dayOfWeek;
  };

  const getDayOrder = () => {
    return [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-grid">
        {/* Personal Stats */}
        <div className="personal-stats">
          <h2>
            My Attendance Summary -{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="stats-cards">
            <div className="stat-card primary">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>This Month's Attendance</h3>
                <p className="stat-percentage">
                  {overallStats.attendanceRate}%
                </p>
                <span className="stat-detail">
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
            <div className="stat-card secondary">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>Classes This Month</h3>
                <p className="stat-percentage">{overallStats.presentClasses}</p>
              </div>
            </div>
            <div className="stat-card tertiary">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>Late This Month</h3>
                <p className="stat-number">{overallStats.lateClasses}</p>
                <span className="stat-detail">Late arrivals</span>
              </div>
            </div>
            <div className="stat-card quaternary">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>Absences This Month</h3>
                <p className="stat-number">{overallStats.absentClasses}</p>
                <span className="stat-detail">Days absent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="todays-schedule">
          <h2>Today's Classes</h2>
          <div className="schedule-list">
            {loading ? (
              <div className="loading-message">Loading today's classes...</div>
            ) : todayClasses.length > 0 ? (
              todayClasses.map((cls) => {
                const status = getClassStatus(cls.startTime, cls.endTime);
                return (
                  <div className={`today-class-card ${status}`} key={cls.id}>
                    <div className="class-time-section">
                      <div className="time-display">
                        <span className="start-time">
                          {cls.startTime ? formatTime(cls.startTime) : "TBA"}
                        </span>
                        <span className="time-separator">-</span>
                        <span className="end-time">
                          {cls.endTime ? formatTime(cls.endTime) : "TBA"}
                        </span>
                      </div>
                      <div className={`status-badge ${status}`}>
                        {getStatusText(status)}
                      </div>
                    </div>

                    <div className="class-details-section">
                      <div className="subject-header">
                        <h3 className="subject-name">{cls.subject}</h3>
                        <span className="grade-badge">
                          Grade {cls.grade || "N/A"}
                        </span>
                      </div>

                      <div className="teacher-info">
                        <span className="teacher-label">Teacher:</span>
                        <span className="teacher-name">
                          {cls.teacherName || "TBA"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-classes-message">
                <div className="no-classes-icon">🎉</div>
                <p className="no-classes-title">
                  No classes scheduled for today!
                </p>
                <span className="no-classes-subtitle">
                  Enjoy your free day or catch up on your studies.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* All Enrolled Classes */}
        <div className="enrolled-classes">
          <h2>My Enrolled Classes</h2>
          <div className="classes-content">
            {allClassesLoading ? (
              <div className="loading-message">Loading your classes...</div>
            ) : allClasses.length > 0 ? (
              <div className="classes-cards-grid">
                {getDayOrder().map((day) => {
                  const dayClasses = allClasses.filter(
                    (cls) => cls.dayOfWeek === day
                  );
                  if (dayClasses.length === 0) return null;

                  return dayClasses.map((cls) => (
                    <div key={cls.id} className="class-card">
                      <div className="card-header">
                        <div className="day-badge">
                          <span className="day-short">{getDayName(day)}</span>
                          <span className="day-full">{day}</span>
                        </div>
                        <div className="time-badge">
                          {cls.startTime ? formatTime(cls.startTime) : "TBA"}
                          {cls.endTime && ` - ${formatTime(cls.endTime)}`}
                        </div>
                      </div>

                      <div className="card-content">
                        <h3 className="subject-title">{cls.subject}</h3>

                        <div className="class-details">
                          <div className="detail-row">
                            <span className="detail-label">Grade:</span>
                            <span className="grade-badge">
                              {cls.grade || "N/A"}
                            </span>
                          </div>

                          <div className="detail-row">
                            <span className="detail-label">Teacher:</span>
                            <span className="detail-value">
                              {cls.teacherName || "TBA"}
                            </span>
                          </div>

                          <div className="detail-row">
                            <span className="detail-label">Monthly Fee:</span>
                            <span className="fee-value">
                              {cls.monthlyFees
                                ? `Rs. ${cls.monthlyFees}`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })}
              </div>
            ) : (
              <div className="no-classes-message">
                <p>📚 No classes found!</p>
                <span>
                  Please contact your administrator to enroll in classes.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Summary by Class */}
        <div className="attendance-by-class">
          <h2>
            My Attendance by Class -{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="attendance-content">
            {attendanceLoading ? (
              <div className="loading-message">Loading attendance data...</div>
            ) : Object.keys(attendanceSummary).length > 0 ? (
              <div className="attendance-cards-grid">
                {Object.entries(attendanceSummary).map(
                  ([classKey, classData]) => (
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
                          <span className="teacher-name">
                            {classData.teacherName}
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
                              <span className="stat-value">
                                {classData.lateCount}
                              </span>
                              <span className="stat-percentage">
                                {classData.totalClasses > 0
                                  ? Math.round(
                                      (classData.lateCount /
                                        classData.totalClasses) *
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
                          <div className="recent-records">
                            {classData.recentRecords
                              .slice(0, 5)
                              .map((record, index) => (
                                <div
                                  key={index}
                                  className={`record-item ${record.status}`}
                                >
                                  <span className="record-date">
                                    {new Date(record.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </span>
                                  <span
                                    className={`record-status ${record.status}`}
                                  >
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
                          {classData.recentRecords.length > 5 && (
                            <div className="view-more-container">
                              <button
                                className="view-more-btn"
                                onClick={() => {
                                  const allRecords =
                                    classData.allRecords ||
                                    classData.recentRecords;
                                  alert(
                                    `Full attendance history for ${
                                      classData.subject
                                    }:\n\n${allRecords
                                      .map(
                                        (record) =>
                                          `${new Date(
                                            record.date
                                          ).toLocaleDateString()} - ${record.status.toUpperCase()}`
                                      )
                                      .join("\n")}`
                                  );
                                }}
                              >
                                View Full History (
                                {
                                  (
                                    classData.allRecords ||
                                    classData.recentRecords
                                  ).length
                                }{" "}
                                records)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="no-attendance-message">
                <p>
                  📊 No attendance records found for{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                  !
                </p>
                <span>
                  Attendance records for this month will appear here once you
                  start attending classes.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
