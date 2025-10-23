import React, { useState, useEffect, useCallback } from "react";
import "./StudentAttendanceHistory.css";
import { getAccessToken } from "../../utils/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StudentAttendanceHistory = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState("monthly");
  const [chartData, setChartData] = useState(null);
  const [subjectChartData, setSubjectChartData] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 0,
    lateDays: 0,
  });

  const fetchGrades = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch("http://localhost:8000/class", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const classData = await response.json();
        const uniqueGrades = [...new Set(classData.map((c) => c.grade))].sort();
        setGrades(uniqueGrades);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `http://localhost:8000/attendance/analysis/subjects/${selectedGrade}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const subjectData = await response.json();
        setSubjects(subjectData);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  }, [selectedGrade]);

  const fetchAttendanceAnalysis = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `http://localhost:8000/attendance/analysis/comprehensive/${selectedGrade}/${selectedSubject}?type=${analysisType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const analysisData = await response.json();
        setChartData(analysisData.chartData);
        setSubjectChartData(analysisData.subjectDistribution);
        setAttendanceStats(analysisData.stats);
      }
    } catch (error) {
      console.error("Error fetching attendance analysis:", error);
    }
  }, [selectedGrade, selectedSubject, analysisType]);

  const fetchStudentsByGradeAndSubject = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `http://localhost:8000/attendance/analysis/students/${selectedGrade}/${selectedSubject}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
      }
    } catch (error) {
      console.error("Error fetching students by grade and subject:", error);
      setStudents([]);
    }
  }, [selectedGrade, selectedSubject]);

  // Fetch grades when component mounts
  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Fetch subjects when grade is selected
  useEffect(() => {
    if (selectedGrade) {
      fetchSubjects();
      setSelectedSubject("");
    } else {
      setSubjects([]);
    }
  }, [selectedGrade, fetchSubjects]);

  // Fetch attendance analysis and students when grade and subject are selected
  useEffect(() => {
    if (selectedGrade && selectedSubject) {
      fetchAttendanceAnalysis();
      fetchStudentsByGradeAndSubject();
    }
  }, [
    selectedGrade,
    selectedSubject,
    analysisType,
    fetchAttendanceAnalysis,
    fetchStudentsByGradeAndSubject,
  ]);

  // Reset students when grade or subject changes
  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudent(null);
    }
  }, [students]);

  useEffect(() => {
    if (!selectedGrade || !selectedSubject) {
      // If no grade/subject selected, clear the students list
      setStudents([]);
      setAttendanceHistory([]);
      setChartData(null);
      setSubjectChartData(null);
      setAttendanceStats({
        totalClasses: 0,
        attendedClasses: 0,
        attendancePercentage: 0,
        lateDays: 0,
      });
      setSearchTerm("");
    }
  }, [selectedGrade, selectedSubject]);

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

  useEffect(() => {
    if (!selectedStudent) {
      setAttendanceHistory([]);
    } else {
      fetchStudentAttendanceHistory(selectedStudent.id);
      setStatusFilter("all");
      setDateFilter("");
    }
  }, [selectedStudent]);

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

      {/* Grade and Subject Selection */}
      <div className="analysis-controls">
        <div className="selection-row">
          <div className="select-group">
            <label htmlFor="grade-select">📚 Select Grade:</label>
            <select
              id="grade-select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="select-input"
            >
              <option value="">Choose Grade...</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="select-group">
            <label htmlFor="subject-select">📖 Select Subject:</label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="select-input"
              disabled={!selectedGrade}
            >
              <option value="">Choose Subject...</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="select-group">
            <label htmlFor="analysis-type">📊 Analysis Type:</label>
            <select
              id="analysis-type"
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="select-input"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {chartData && subjectChartData && (
        <div className="charts-section">
          <div className="chart-container">
            <h3>
              📈 Attendance Analysis -{" "}
              {analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}
            </h3>
            <div className="chart-wrapper">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                    title: {
                      display: true,
                      text: `${
                        analysisType.charAt(0).toUpperCase() +
                        analysisType.slice(1)
                      } Attendance for Grade ${selectedGrade} - ${selectedSubject}`,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: function (value) {
                          return value + "%";
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="chart-container">
            <h3>🥧 Subject Distribution</h3>
            <div className="chart-wrapper small-chart">
              <Doughnut
                data={subjectChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    title: {
                      display: true,
                      text: "Attendance Distribution by Status",
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h4>Total Classes</h4>
                <p className="stat-value">{attendanceStats.totalClasses}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h4>Attended</h4>
                <p className="stat-value">{attendanceStats.attendedClasses}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h4>Attendance Rate</h4>
                <p className="stat-value">
                  {attendanceStats.attendancePercentage}%
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h4>Late Days</h4>
                <p className="stat-value">{attendanceStats.lateDays}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="content-layout">
        {/* Students List Section */}
        <div className="students-section">
          <div className="students-header">
            <h3>
              👥 Students ({filteredStudents.length})
              {selectedGrade && selectedSubject && (
                <span className="filter-info">
                  - Grade {selectedGrade}, {selectedSubject}
                </span>
              )}
            </h3>
            <div className="search-container">
              <input
                type="text"
                placeholder={
                  selectedGrade && selectedSubject
                    ? `Search students in Grade ${selectedGrade} - ${selectedSubject}...`
                    : "Search students..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="students-list">
            {!selectedGrade || !selectedSubject ? (
              <div className="no-students">
                <p>
                  Please select a grade and subject to see the list of students.
                </p>
              </div>
            ) : (
              <>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`student-card ${
                      selectedStudent?.id === student.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedStudent(student)}
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

                {filteredStudents.length === 0 && students.length > 0 && (
                  <div className="no-students">
                    <p>No students found matching your search.</p>
                  </div>
                )}
              </>
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
