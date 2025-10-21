import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { getAllClasses } from "../../services/classService";
import { getTeacherByEmail } from "../../services/teacherService";
import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const { accounts } = useMsal();
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayClasses = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setLoading(true);

        // Get current user info to identify the teacher
        const account = accounts[0];
        const userEmail = account.username;

        // Get teacher info to get their ID
        const teacherResponse = await fetch(
          `http://localhost:8000/teacher?email=${userEmail}`
        );
        const teachers = await teacherResponse.json();

        if (!teachers || teachers.length === 0) {
          console.warn("No teacher found for email:", userEmail);
          setTodayClasses([]);
          return;
        }

        const teacher = teachers[0];
        const teacherId = teacher.id;

        // Use the new dedicated API endpoint to get today's classes for this teacher
        const todayClassesResponse = await fetch(
          `http://localhost:8000/teacher/${teacherId}/classes/today`
        );
        const filteredClasses = await todayClassesResponse.json();

        setTodayClasses(filteredClasses);
      } catch (error) {
        console.error("Error fetching today's classes:", error);
        setTodayClasses([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTodayClasses();
  }, [accounts]);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12; // Convert 0 to 12
    return `${formattedHour}:${minute} ${ampm}`;
  };

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-grid">
        {/* My Classes Section */}
        <div className="my-classes">
          <h2>My Classes Today</h2>
          <div className="class-cards">
            {loading ? (
              <p>Loading classes...</p>
            ) : todayClasses.length > 0 ? (
              todayClasses.map((cls) => (
                <div className="class-card" key={cls.id}>
                  <div className="class-header">
                    <h3>{cls.subject}</h3>
                    <p>Grade: {cls.grade}</p>
                    <span className="class-time">
                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </span>
                  </div>
                  <div className="class-details">
                    <p>Status: Upcoming</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No classes scheduled for today.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
