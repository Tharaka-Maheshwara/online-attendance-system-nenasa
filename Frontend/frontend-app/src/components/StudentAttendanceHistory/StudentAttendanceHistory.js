import React, { useState, useEffect } from "react";
import "./StudentAttendanceHistory.css";
import { getAccessToken } from "../../utils/auth";

const StudentAttendanceHistory = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState(null);

  // Fetch students when component mounts
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const response = await fetch("http://localhost:8000/student", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
      } else {
        throw new Error("Failed to fetch students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendanceHistory = async (studentId) => {
    try {
      setHistoryLoading(true);
      setError(null);
      const token = await getAccessToken();
      const response = await fetch(
        `http://localhost:8000/attendance/history/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const historyData = await response.json();
        setAttendanceHistory(historyData);
      } else {
        throw new Error("Failed to fetch attendance history");
      }
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      setError("Failed to load attendance history");
      setAttendanceHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setAttendanceHistory([]);
    if (student) {
      fetchStudentAttendanceHistory(student.id);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "present":
        return "status-present";
      case "absent":
        return "status-absent";
      case "late":
        return "status-late";
      default:
        return "status-unknown";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return "✅";
      case "absent":
        return "❌";
      case "late":
        return "🕐";
      default:
        return "❓";
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.registerNumber &&
        student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter attendance history based on filters
  const filteredHistory = attendanceHistory.filter((record) => {
    const statusMatch =
      statusFilter === "all" || record.status === statusFilter;
    const dateMatch = !dateFilter || record.date === dateFilter;
    return statusMatch && dateMatch;
  });

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    if (attendanceHistory.length === 0)
      return { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };

    const total = attendanceHistory.length;
    const present = attendanceHistory.filter(
      (r) => r.status === "present"
    ).length;
    const absent = attendanceHistory.filter(
      (r) => r.status === "absent"
    ).length;
    const late = attendanceHistory.filter((r) => r.status === "late").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, percentage };
  };

  if (loading) {
    return (
      <div className="student-attendance-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-attendance-history">
      <div className="header">
        <h2>📊 Student Attendance History</h2>
        <p>
          Select a student to view their detailed attendance history with class
          information
        </p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="content-layout">
        {/* Students List Section */}
        <div className="students-section">
          <div className="students-header">
            <h3>👥 Students ({filteredStudents.length})</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="students-list">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`student-card ${
                  selectedStudent?.id === student.id ? "selected" : ""
                }`}
                onClick={() => handleStudentSelect(student)}
              >
                <div className="student-info">
                  <h4>{student.name}</h4>
                  <p className="student-email">{student.email}</p>
                  {student.registerNumber && (
                    <p className="student-register">
                      ID: {student.registerNumber}
                    </p>
                  )}
                </div>
                <div className="student-arrow">
                  {selectedStudent?.id === student.id ? "📋" : "👁️"}
                </div>
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="no-students">
                <p>No students found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance History Section */}
        <div className="history-section">
          {!selectedStudent ? (
            <div className="no-selection">
              <div className="no-selection-icon">📋</div>
              <h3>No Student Selected</h3>
              <p>
                Please select a student from the left to view their attendance
                history.
              </p>
            </div>
          ) : (
            <>
              {/* Student Info Header */}
              <div className="selected-student-info">
                <h3>📊 Attendance History: {selectedStudent.name}</h3>
                <p>
                  Student ID:{" "}
                  {selectedStudent.registerNumber || selectedStudent.id}
                </p>
                <p>Email: {selectedStudent.email}</p>
              </div>

              {/* Attendance Statistics */}
              <div className="attendance-stats">
                {(() => {
                  const stats = getAttendanceStats();
                  return (
                    <div className="stats-grid">
                      <div className="stat-card total">
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total Classes</div>
                      </div>
                      <div className="stat-card present">
                        <div className="stat-number">{stats.present}</div>
                        <div className="stat-label">Present</div>
                      </div>
                      <div className="stat-card absent">
                        <div className="stat-number">{stats.absent}</div>
                        <div className="stat-label">Absent</div>
                      </div>
                      <div className="stat-card late">
                        <div className="stat-number">{stats.late}</div>
                        <div className="stat-label">Late</div>
                      </div>
                      <div className="stat-card percentage">
                        <div className="stat-number">{stats.percentage}%</div>
                        <div className="stat-label">Attendance Rate</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Filters */}
              <div className="filters-section">
                <div className="filter-group">
                  <label>Status Filter:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Date Filter:</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-input"
                  />
                </div>

                {(statusFilter !== "all" || dateFilter) && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setDateFilter("");
                    }}
                    className="clear-filters-btn"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Attendance History Table */}
              <div className="history-table-container">
                {historyLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading attendance history...</p>
                  </div>
                ) : (
                  <>
                    {filteredHistory.length === 0 ? (
                      <div className="no-history">
                        <p>No attendance records found for this student.</p>
                      </div>
                    ) : (
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Class Name</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Marked At</th>
                            <th>Method</th>
                            <th>Marked By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map((record) => (
                            <tr key={record.id}>
                              <td className="date-cell">
                                {new Date(record.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </td>
                              <td className="class-name">
                                {record.className || "Unknown Class"}
                              </td>
                              <td className="subject">
                                {record.classSubject || "N/A"}
                              </td>
                              <td>
                                <span
                                  className={`status-badge ${getStatusBadgeClass(
                                    record.status
                                  )}`}
                                >
                                  {getStatusIcon(record.status)}{" "}
                                  {record.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="timestamp">
                                {record.timestamp
                                  ? new Date(record.timestamp).toLocaleString(
                                      "en-US",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      }
                                    )
                                  : "N/A"}
                              </td>
                              <td className="method">
                                {record.method ? (
                                  <span
                                    className={`method-badge ${record.method}`}
                                  >
                                    {record.method.toUpperCase()}
                                  </span>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="marked-by">
                                {record.markedByName || "System"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {filteredHistory.length > 0 && (
                      <div className="table-footer">
                        <p>
                          Showing {filteredHistory.length} of{" "}
                          {attendanceHistory.length} records
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceHistory;
