import React, { useState, useEffect } from 'react';
import { getAllClasses, createClass, updateClass, deleteClass } from '../../services/classService';
import './ClassManagement.css';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await getAllClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateClass(currentClass.id, formData);
        alert('Class updated successfully!');
      } else {
        await createClass(formData);
        alert('Class created successfully!');
      }
      resetForm();
      loadClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class.');
    }
  };

  const handleEdit = (cls) => {
    setIsEditing(true);
    setCurrentClass(cls);
    setFormData({
      subject: cls.subject || '',
      dayOfWeek: cls.dayOfWeek || '',
      startTime: cls.startTime || '',
      endTime: cls.endTime || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(id);
        alert('Class deleted successfully!');
        loadClasses();
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class.');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentClass(null);
    setFormData({ subject: '', dayOfWeek: '', startTime: '', endTime: '' });
  };

  return (
    <div className="class-management">
      <div className="header">
        <h2>Class Management</h2>
        <button className="add-btn" onClick={() => { setShowForm(true); setIsEditing(false); }}>
          Add New Class
        </button>
      </div>

      {showForm && (
        <div className="class-form-container">
          <h3>{isEditing ? 'Edit Class' : 'Add New Class'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label>Subject *</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Day of Week</label>
                    <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleInputChange}>
                        <option value="">Select Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                    </select>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>End Time</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} />
                </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
              <button type="submit" className="submit-btn">{isEditing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="classes-list">
        <h3>Available Classes</h3>
        <div className="classes-table">
            <table>
            <thead>
                <tr>
                <th>Subject</th>
                <th>Day of Week</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {classes.map((cls) => (
                <tr key={cls.id}>
                    <td>{cls.subject}</td>
                    <td>{cls.dayOfWeek || '-'}</td>
                    <td>{cls.startTime || '-'}</td>
                    <td>{cls.endTime || '-'}</td>
                    <td>
                    <div className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEdit(cls)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(cls.id)}>Delete</button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;