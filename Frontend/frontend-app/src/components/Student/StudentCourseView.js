import React, { useState, useEffect } from "react";
import { getAllCourses, getActiveCourses } from "../../services/courseService";
import "./StudentCourseView.css";

const StudentCourseView = () => {
  const [courses, setCourses] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' or 'available'

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data =
        filter === "available"
          ? await getActiveCourses()
          : await getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCourse(null);
  };

  // Function to determine if course should be available or unavailable
  const getCourseAvailabilityStatus = (course) => {
    const currentDate = new Date();
    const startDate = new Date(course.startDate);
    const enrolledStudents = course.enrolledStudents || 0;
    const maxStudents = course.maxStudents;

    // Course is unavailable if:
    // 1. Enrolled students equals max students (course is full)
    // 2. Start date has passed
    if (enrolledStudents >= maxStudents || startDate < currentDate) {
      return {
        isAvailable: false,
        reason:
          enrolledStudents >= maxStudents
            ? "Course is full"
            : "Course has already started",
      };
    }

    // Course is available if manually set to active and above conditions are not met
    return {
      isAvailable: course.isActive,
      reason: course.isActive
        ? "Available for enrollment"
        : "Currently unavailable",
    };
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAvailableSpots = (course) => {
    return course.maxStudents - (course.enrolledStudents || 0);
  };

  return (
    <div className="student-course-view">
      <div className="course-header">
        <h2>Available Courses</h2>
        <div className="filter-container">
          <label>Filter: </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Courses</option>
            <option value="available">Available Only</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading">Loading courses...</div>}

      <div className="courses-grid">
        {courses.map((course) => {
          const availability = getCourseAvailabilityStatus(course);
          const availableSpots = getAvailableSpots(course);
          const currentDate = new Date();
          const startDate = new Date(course.startDate);
          const hasStarted = startDate < currentDate;

          return (
            <div key={course.id} className="course-card">
              <div className="course-card-header">
                <h3 className="course-name">{course.courseName}</h3>
                <span
                  className={`status-badge ${
                    availability.isAvailable ? "available" : "unavailable"
                  }`}
                >
                  {availability.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                </span>
              </div>

              <div className="course-info">
                <div className="info-row">
                  <span className="label">Teacher:</span>
                  <span className="value">
                    {course.teacher ? (
                      <div className="teacher-info">
                        {course.teacher.profileImage && (
                          <img 
                            src={`http://localhost:8000${course.teacher.profileImage}`}
                            alt={course.teacher.name}
                            className="teacher-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span>{course.teacher.name}</span>
                      </div>
                    ) : (
                      <span className="no-teacher">Not assigned</span>
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Duration:</span>
                  <span className="value">{course.duration}</span>
                </div>
                <div className="info-row">
                  <span className="label">Start Date:</span>
                  <span className={`value ${hasStarted ? "date-passed" : ""}`}>
                    {formatDate(course.startDate)}
                    {hasStarted && " ⏰"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Price:</span>
                  <span className="value price">
                    {formatPrice(course.price)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Available Spots:</span>
                  <span
                    className={`value ${
                      availableSpots === 0 ? "spots-full" : ""
                    }`}
                  >
                    {availableSpots} / {course.maxStudents}
                    {availableSpots === 0 && " 🔴"}
                  </span>
                </div>
              </div>

              {course.description && (
                <div className="course-preview-description">
                  {course.description.length > 100
                    ? `${course.description.substring(0, 100)}...`
                    : course.description}
                </div>
              )}

              <div className="card-actions">
                <button
                  className="btn-view-details"
                  onClick={() => openDetailsModal(course)}
                >
                  View Details
                </button>
                {availability.isAvailable && (
                  <button className="btn-enroll" disabled>
                    Contact Admin to Enroll
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && !loading && (
        <div className="no-courses">
          <p>No courses found.</p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCourse && (
        <div className="modal-overlay">
          <div className="modal details-modal">
            <div className="modal-header">
              <h3>Course Details</h3>
              <button className="close-btn" onClick={closeDetailsModal}>
                ×
              </button>
            </div>
            <div className="details-content">
              <div className="detail-item">
                <strong>Course Name:</strong>
                <span>{selectedCourse.courseName}</span>
              </div>
              <div className="detail-item">
                <strong>Teacher:</strong>
                {selectedCourse.teacher ? (
                  <div className="teacher-detail">
                    {selectedCourse.teacher.profileImage && (
                      <img 
                        src={`http://localhost:8000${selectedCourse.teacher.profileImage}`}
                        alt={selectedCourse.teacher.name}
                        className="teacher-detail-avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <span>{selectedCourse.teacher.name}</span>
                  </div>
                ) : (
                  <span className="no-teacher">No teacher assigned</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Duration:</strong>
                <span>{selectedCourse.duration}</span>
              </div>
              <div className="detail-item">
                <strong>Start Date:</strong>
                <span>{formatDate(selectedCourse.startDate)}</span>
              </div>
              <div className="detail-item">
                <strong>Available Spots:</strong>
                <span>
                  {getAvailableSpots(selectedCourse)} out of{" "}
                  {selectedCourse.maxStudents}
                </span>
              </div>
              <div className="detail-item">
                <strong>Currently Enrolled:</strong>
                <span>{selectedCourse.enrolledStudents || 0}</span>
              </div>
              <div className="detail-item">
                <strong>Price:</strong>
                <span>{formatPrice(selectedCourse.price)}</span>
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                {(() => {
                  const availability =
                    getCourseAvailabilityStatus(selectedCourse);
                  return (
                    <div className="status-container">
                      <span
                        className={`status ${
                          availability.isAvailable ? "active" : "inactive"
                        }`}
                      >
                        {availability.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                      </span>
                      <div className="status-reason">{availability.reason}</div>
                    </div>
                  );
                })()}
              </div>
              {selectedCourse.description && (
                <div className="detail-item description-item">
                  <strong>Course Description:</strong>
                  <p className="description-text">
                    {selectedCourse.description}
                  </p>
                </div>
              )}
              <div className="detail-item">
                <strong>Created:</strong>
                <span>{formatDate(selectedCourse.createdAt)}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeDetailsModal}>
                Close
              </button>
              {(() => {
                const availability =
                  getCourseAvailabilityStatus(selectedCourse);
                return availability.isAvailable ? (
                  <button className="btn-primary" disabled>
                    Contact Admin to Enroll
                  </button>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCourseView;
