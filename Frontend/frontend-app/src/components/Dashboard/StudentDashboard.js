import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { accounts } = useMsal();
  const [todayClasses, setTodayClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allClassesLoading, setAllClassesLoading] = useState(true);

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "status-badge present";
      case "current":
        return "status-badge current";
      case "upcoming":
        return "status-badge upcoming";
      default:
        return "status-badge upcoming";
    }
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
          <h2>My Attendance Summary</h2>
          <div className="stats-cards">
            <div className="stat-card primary">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Overall Attendance</h3>
                <p className="stat-percentage">87%</p>
                <span className="stat-detail">Good standing</span>
              </div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>This Month</h3>
                <p className="stat-percentage">92%</p>
                <span className="stat-detail">18/20 days</span>
              </div>
            </div>
            <div className="stat-card tertiary">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>Late Arrivals</h3>
                <p className="stat-number">3</p>
                <span className="stat-detail">This month</span>
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


      </div>
    </div>
  );
};

export default StudentDashboard;
