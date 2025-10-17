import React, { useState, useEffect } from "react";
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  updateEnrollmentCount,
} from "../../services/courseService";
import "./CourseManagement.css";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [tempEnrollmentValue, setTempEnrollmentValue] = useState("");
  const [modalType, setModalType] = useState("add"); // 'add' or 'edit'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseName: "",
    duration: "",
    startDate: "",
    maxStudents: "",
    price: "",
    description: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      courseName: "",
      duration: "",
      startDate: "",
      maxStudents: "",
      price: "",
      description: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setModalType("add");
    setSelectedCourse(null);
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setFormData({
      courseName: course.courseName,
      duration: course.duration,
      startDate: course.startDate.split("T")[0], // Format date for input
      maxStudents: course.maxStudents.toString(),
      price: course.price.toString(),
      description: course.description || "",
    });
    setModalType("edit");
    setSelectedCourse(course);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCourse(null);
    resetForm();
  };

  const openDetailsModal = (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCourse(null);
  };

  const startEditingEnrollment = (courseId, currentValue) => {
    setEditingEnrollment(courseId);
    setTempEnrollmentValue(currentValue.toString());
  };

  const cancelEditingEnrollment = () => {
    setEditingEnrollment(null);
    setTempEnrollmentValue("");
  };

  const saveEnrollmentCount = async (courseId) => {
    try {
      const newCount = parseInt(tempEnrollmentValue);
      if (isNaN(newCount) || newCount < 0) {
        alert("Please enter a valid number greater than or equal to 0");
        return;
      }

      setLoading(true);
      await updateEnrollmentCount(courseId, newCount);

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId
            ? { ...course, enrolledStudents: newCount }
            : course
        )
      );

      setEditingEnrollment(null);
      setTempEnrollmentValue("");
      alert("Enrollment count updated successfully!");
    } catch (error) {
      console.error("Error updating enrollment count:", error);
      alert("Failed to update enrollment count");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const courseData = {
        ...formData,
        maxStudents: parseInt(formData.maxStudents),
        price: parseFloat(formData.price),
      };

      if (modalType === "add") {
        await createCourse(courseData);
        alert("Course created successfully!");
      } else {
        await updateCourse(selectedCourse.id, courseData);
        alert("Course updated successfully!");
      }

      closeModal();
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        setLoading(true);
        await deleteCourse(courseId);
        alert("Course deleted successfully!");
        fetchCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course");
      } finally {
        setLoading(false);
      }
    }
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
        : "Manually set as unavailable",
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

  return (
    <div className="course-management">
      <div className="course-header">
        <h2>Course Management</h2>
        <button className="btn-primary" onClick={openAddModal}>
          Add New Course
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      <div className="course-table-container">
        <table className="course-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Duration</th>
              <th>Start Date</th>
              <th>Max Students</th>
              <th>Enrolled ✏️</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>
                  <div className="course-name">
                    <strong>{course.courseName}</strong>
                  </div>
                </td>
                <td>{course.duration}</td>
                <td>
                  {(() => {
                    const currentDate = new Date();
                    const startDate = new Date(course.startDate);
                    const hasStarted = startDate < currentDate;
                    return (
                      <span
                        className={hasStarted ? "date-passed" : ""}
                        title={hasStarted ? "Course has already started" : ""}
                      >
                        {formatDate(course.startDate)}
                        {hasStarted && " ⏰"}
                      </span>
                    );
                  })()}
                </td>
                <td>{course.maxStudents}</td>
                <td>
                  {editingEnrollment === course.id ? (
                    <div className="enrollment-edit">
                      <input
                        type="number"
                        value={tempEnrollmentValue}
                        onChange={(e) => setTempEnrollmentValue(e.target.value)}
                        min="0"
                        className="enrollment-input"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            saveEnrollmentCount(course.id);
                          } else if (e.key === "Escape") {
                            cancelEditingEnrollment();
                          }
                        }}
                        autoFocus
                      />
                      <div className="enrollment-actions">
                        <button
                          className="btn-save"
                          onClick={() => saveEnrollmentCount(course.id)}
                          disabled={loading}
                        >
                          ✓
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={cancelEditingEnrollment}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span
                      className={`enrollment-count editable ${
                        (course.enrolledStudents || 0) >= course.maxStudents
                          ? "full"
                          : ""
                      }`}
                      onClick={() =>
                        startEditingEnrollment(
                          course.id,
                          course.enrolledStudents || 0
                        )
                      }
                      title={
                        (course.enrolledStudents || 0) >= course.maxStudents
                          ? "Course is full - Click to edit enrollment count"
                          : "Click to edit enrollment count"
                      }
                    >
                      {course.enrolledStudents || 0}
                      {(course.enrolledStudents || 0) >= course.maxStudents &&
                        " 🔴"}
                    </span>
                  )}
                </td>
                <td>{formatPrice(course.price)}</td>
                <td>
                  {(() => {
                    const availability = getCourseAvailabilityStatus(course);
                    return (
                      <span
                        className={`status ${
                          availability.isAvailable ? "active" : "inactive"
                        }`}
                        title={availability.reason}
                      >
                        {availability.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                      </span>
                    );
                  })()}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-details"
                      onClick={() => openDetailsModal(course)}
                    >
                      More Details
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(course)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(course.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalType === "add" ? "Add New Course" : "Edit Course"}</h3>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="course-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="courseName">Course Name *</label>
                  <input
                    type="text"
                    id="courseName"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="duration">Duration *</label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 6 months, 1 year"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxStudents">Max Students *</label>
                  <input
                    type="number"
                    id="maxStudents"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price (LKR) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Course description (optional)"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : modalType === "add"
                    ? "Add Course"
                    : "Update Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <strong>Duration:</strong>
                <span>{selectedCourse.duration}</span>
              </div>
              <div className="detail-item">
                <strong>Start Date:</strong>
                <span>{formatDate(selectedCourse.startDate)}</span>
              </div>
              <div className="detail-item">
                <strong>Maximum Students:</strong>
                <span>{selectedCourse.maxStudents}</span>
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
                        title={availability.reason}
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
                  <strong>Description:</strong>
                  <p className="description-text">
                    {selectedCourse.description}
                  </p>
                </div>
              )}
              <div className="detail-item">
                <strong>Created:</strong>
                <span>{formatDate(selectedCourse.createdAt)}</span>
              </div>
              {selectedCourse.updatedAt && (
                <div className="detail-item">
                  <strong>Last Updated:</strong>
                  <span>{formatDate(selectedCourse.updatedAt)}</span>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
