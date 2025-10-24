import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { accounts } = useMsal();
  const [todayClasses, setTodayClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [classesWithPaymentStatus, setClassesWithPaymentStatus] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allClassesLoading, setAllClassesLoading] = useState(true);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setLoading(true);
        setAllClassesLoading(true);
        setPaymentStatusLoading(true);
        setAnnouncementsLoading(true);

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

        // Fetch classes with payment status
        const paymentResponse = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/classes/payment-status`
        );

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          setClassesWithPaymentStatus(paymentData);
        } else {
          console.error("Failed to fetch payment status");
          setClassesWithPaymentStatus([]);
        }

        // Fetch announcements for enrolled classes
        const announcementsResponse = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/announcements`
        );

        if (announcementsResponse.ok) {
          const announcementsData = await announcementsResponse.json();
          setAnnouncements(announcementsData);
        } else {
          console.error("Failed to fetch announcements");
          setAnnouncements([]);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        setTodayClasses([]);
        setAllClasses([]);
        setClassesWithPaymentStatus([]);
        setAnnouncements([]);
      } finally {
        setLoading(false);
        setAllClassesLoading(false);
        setPaymentStatusLoading(false);
        setAnnouncementsLoading(false);
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

  const getPaymentStatusText = (status) => {
    const statusTexts = {
      pending: "Pending",
      paid: "Paid",
      overdue: "Overdue",
    };
    return statusTexts[status] || "Unknown";
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthNumber - 1] || "Unknown";
  };

  const getPriorityText = (priority) => {
    const priorityTexts = {
      low: "Low",
      normal: "Normal",
      high: "High",
    };
    return priorityTexts[priority] || "Normal";
  };

  const formatAnnouncementDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Today";
    } else if (diffDays === 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatAnnouncementTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
                  <div className={`schedule-item ${status}`} key={cls.id}>
                    <div className="time-slot">
                      {cls.startTime ? formatTime(cls.startTime) : "TBA"}
                      {cls.endTime && ` - ${formatTime(cls.endTime)}`}
                    </div>
                    <div className="class-info">
                      <h4>{cls.subject}</h4>
                      <p>Grade: {cls.grade || "N/A"}</p>
                      <p>Teacher: {cls.teacherName || "TBA"}</p>
                    </div>
                    <div className="attendance-status">
                      <span className={getStatusBadgeClass(status)}>
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-classes-message">
                <p>🎉 No classes scheduled for today!</p>
                <span>Enjoy your free day or catch up on your studies.</span>
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
              <div className="classes-by-day">
                {getDayOrder().map((day) => {
                  const dayClasses = allClasses.filter(
                    (cls) => cls.dayOfWeek === day
                  );
                  if (dayClasses.length === 0) return null;

                  return (
                    <div key={day} className="day-schedule">
                      <h3 className="day-header">
                        <span className="day-name">{getDayName(day)}</span>
                        <span className="day-full-name">{day}</span>
                      </h3>
                      <div className="day-classes">
                        {dayClasses.map((cls) => (
                          <div key={cls.id} className="class-card">
                            <div className="class-header">
                              <h4 className="subject-title">{cls.subject}</h4>
                              <span className="class-time">
                                {cls.startTime
                                  ? formatTime(cls.startTime)
                                  : "TBA"}
                                {cls.endTime && ` - ${formatTime(cls.endTime)}`}
                              </span>
                            </div>
                            <div className="class-details">
                              <div className="class-detail-item">
                                <span className="detail-label">Grade:</span>
                                <span className="detail-value">
                                  {cls.grade || "N/A"}
                                </span>
                              </div>
                              <div className="class-detail-item">
                                <span className="detail-label">Teacher:</span>
                                <span className="detail-value">
                                  {cls.teacherName || "TBA"}
                                </span>
                              </div>
                              {cls.monthlyFees && (
                                <div className="class-detail-item">
                                  <span className="detail-label">
                                    Monthly Fee:
                                  </span>
                                  <span className="detail-value">
                                    Rs. {cls.monthlyFees}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
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

        {/* Payment Status */}
        <div className="payment-status-section">
          <h2>Payment Status</h2>
          <div className="payment-content">
            {paymentStatusLoading ? (
              <div className="loading-message">Loading payment status...</div>
            ) : classesWithPaymentStatus.length > 0 ? (
              <div className="payment-cards">
                {classesWithPaymentStatus.map((cls) => (
                  <div key={cls.id} className="payment-card">
                    <div className="payment-header">
                      <h4 className="payment-subject">{cls.subject}</h4>
                      <span className={`payment-status ${cls.paymentStatus}`}>
                        {getPaymentStatusText(cls.paymentStatus)}
                      </span>
                    </div>
                    <div className="payment-details">
                      <div className="payment-detail-item">
                        <span className="detail-label">Grade:</span>
                        <span className="detail-value">
                          {cls.grade || "N/A"}
                        </span>
                      </div>
                      <div className="payment-detail-item">
                        <span className="detail-label">Monthly Fee:</span>
                        <span className="detail-value">
                          Rs. {cls.monthlyFee || 0}
                        </span>
                      </div>
                      <div className="payment-detail-item">
                        <span className="detail-label">Month:</span>
                        <span className="detail-value">
                          {getMonthName(cls.currentMonth)} {cls.currentYear}
                        </span>
                      </div>
                      {cls.paymentDate && (
                        <div className="payment-detail-item">
                          <span className="detail-label">Paid Date:</span>
                          <span className="detail-value">
                            {new Date(cls.paymentDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="payment-actions">
                      {cls.paymentStatus === "pending" && (
                        <small className="payment-note">
                          💡 Please contact administration for payment
                        </small>
                      )}
                      {cls.paymentStatus === "paid" && (
                        <small className="payment-note">
                          ✅ Payment confirmed
                        </small>
                      )}
                      {cls.paymentStatus === "overdue" && (
                        <small className="payment-note">
                          ⚠️ Payment overdue - please pay immediately
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-classes-message">
                <p>💳 No payment information available!</p>
                <span>
                  Please contact your administrator for payment details.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="announcements-section">
          <h2>Class Announcements</h2>
          <div className="announcements-content">
            {announcementsLoading ? (
              <div className="loading-message">Loading announcements...</div>
            ) : announcements.length > 0 ? (
              <div className="announcements-list">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="announcement-card">
                    <div className="announcement-header">
                      <div className="announcement-title-section">
                        <h4 className="announcement-title">
                          {announcement.title}
                        </h4>
                        <span
                          className={`announcement-priority ${announcement.priority}`}
                        >
                          {getPriorityText(announcement.priority)}
                        </span>
                      </div>
                      <div className="announcement-meta">
                        <span className="announcement-date">
                          {formatAnnouncementDate(announcement.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="announcement-class-info">
                      <span className="class-subject">
                        📚{" "}
                        {announcement.classInfo?.subject || "Unknown Subject"}
                      </span>
                      <span className="class-details">
                        Grade {announcement.classInfo?.grade || "N/A"} • 👨‍🏫{" "}
                        {announcement.classInfo?.teacherName ||
                          "Unknown Teacher"}
                      </span>
                    </div>
                    <div className="announcement-message">
                      <p>{announcement.message}</p>
                    </div>
                    <div className="announcement-footer">
                      <small className="teacher-email">
                        From: {announcement.teacherEmail}
                      </small>
                      <small className="announcement-time">
                        {formatAnnouncementTime(announcement.createdAt)}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-announcements-message">
                <p>📢 No announcements yet!</p>
                <span>
                  Your teachers will post important updates and announcements
                  here.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="student-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn secondary">
              <span className="btn-icon">📝</span>
              Request Leave
            </button>
            <button className="action-btn tertiary">
              <span className="btn-icon">📊</span>
              View Reports
            </button>
            <button className="action-btn quaternary">
              <span className="btn-icon">👤</span>
              Update Profile
            </button>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="recent-attendance">
          <h2>Recent Attendance</h2>
          <div className="attendance-calendar">
            <div className="calendar-header">
              <span>Last 7 Days</span>
            </div>
            <div className="calendar-days">
              <div className="day-item">
                <span className="day-label">Mon</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Tue</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Wed</span>
                <div className="day-status absent">✗</div>
              </div>
              <div className="day-item">
                <span className="day-label">Thu</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Fri</span>
                <div className="day-status late">L</div>
              </div>
              <div className="day-item">
                <span className="day-label">Sat</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Sun</span>
                <div className="day-status holiday">H</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="notifications">
          <h2>Notifications</h2>
          <div className="notification-list">
            <div className="notification-item warning">
              <div className="notification-icon">⚠️</div>
              <div className="notification-content">
                <p>
                  Your attendance is below 90%. Please maintain regular
                  attendance.
                </p>
                <span className="notification-time">2 hours ago</span>
              </div>
            </div>
            <div className="notification-item info">
              <div className="notification-icon">📅</div>
              <div className="notification-content">
                <p>Chemistry class moved to Lab 2 tomorrow</p>
                <span className="notification-time">1 day ago</span>
              </div>
            </div>
            <div className="notification-item success">
              <div className="notification-icon">✅</div>
              <div className="notification-content">
                <p>Leave request approved for September 15th</p>
                <span className="notification-time">2 days ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="subject-attendance">
          <h2>Subject-wise Attendance</h2>
          <div className="subject-list">
            <div className="subject-item">
              <div className="subject-name">Mathematics</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "95%" }}></div>
                </div>
                <span className="progress-text">95%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Physics</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "88%" }}></div>
                </div>
                <span className="progress-text">88%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Chemistry</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "82%" }}></div>
                </div>
                <span className="progress-text">82%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Biology</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "90%" }}></div>
                </div>
                <span className="progress-text">90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
