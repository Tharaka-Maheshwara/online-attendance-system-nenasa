import React, { useState } from "react";
import "./RegisterNumberLookup.css";

const RegisterNumberLookup = () => {
  const [formData, setFormData] = useState({
    register_number: "",
    display_name: "",
    email: "",
    role: "",
    contactNumber: "",
    parentName: "",
    parentEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegisterNumberChange = async (e) => {
    const registerNumber = e.target.value;

    // Update the register_number field
    setFormData((prev) => ({
      ...prev,
      register_number: registerNumber,
    }));

    // Clear previous message
    setMessage("");

    // If register_number is empty, clear other fields
    if (!registerNumber.trim()) {
      setFormData((prev) => ({
        ...prev,
        display_name: "",
        email: "",
        role: "",
        contactNumber: "",
        parentName: "",
        parentEmail: "",
      }));
      return;
    }

    // Auto-fill when register_number is entered
    if (registerNumber.trim().length >= 3) {
      // Start lookup after 3 characters
      await lookupUserByRegisterNumber(registerNumber.trim());
    }
  };

  const lookupUserByRegisterNumber = async (registerNumber) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:8000/users/by-register/${registerNumber}`
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.user) {
          // Auto-fill the form with user data
          setFormData((prev) => ({
            ...prev,
            display_name: result.user.display_name || "",
            email: result.user.email || "",
            role: result.user.role || "",
            contactNumber: result.user.contactNumber || "",
            parentName: result.user.parentName || "",
            parentEmail: result.user.parentEmail || "",
          }));

          setMessage(
            `✅ User found: ${result.user.display_name} (${result.user.email})`
          );
        }
      } else if (response.status === 404) {
        // User not found - clear fields but keep register_number
        setFormData((prev) => ({
          register_number: prev.register_number,
          display_name: "",
          email: "",
          role: "",
          contactNumber: "",
          parentName: "",
          parentEmail: "",
        }));
        setMessage("❌ No user found with this register number");
      } else {
        setMessage("⚠️ Error looking up user");
      }
    } catch (error) {
      console.error("Error looking up user:", error);
      setMessage("⚠️ Network error occurred");
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Form data:\n" + JSON.stringify(formData, null, 2));
  };

  const clearForm = () => {
    setFormData({
      register_number: "",
      display_name: "",
      email: "",
      role: "",
      contactNumber: "",
      parentName: "",
      parentEmail: "",
    });
    setMessage("");
  };

  return (
    <div className="register-lookup-container">
      <h1>Register Number Auto-Fill Demo</h1>
      <p className="description">
        Enter a register number to automatically fill Name and Email fields from
        the nenasa_users table.
      </p>

      <div className="lookup-form-container">
        <form onSubmit={handleSubmit} className="lookup-form">
          <div className="form-group">
            <label htmlFor="register_number">
              Register Number *
              {loading && (
                <span className="loading-indicator"> 🔍 Looking up...</span>
              )}
            </label>
            <input
              type="text"
              id="register_number"
              name="register_number"
              value={formData.register_number}
              onChange={handleRegisterNumberChange}
              placeholder="Enter register number (e.g., john.doe, student123)"
              className="form-control"
              required
            />
            {message && (
              <div
                className={`message ${
                  message.includes("✅")
                    ? "success"
                    : message.includes("❌")
                    ? "error"
                    : "warning"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="display_name">Full Name</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="Auto-filled from user data"
                className="form-control auto-filled"
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Auto-filled from user data"
                className="form-control auto-filled"
                readOnly
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="Auto-filled from user data"
                className="form-control auto-filled"
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                type="text"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="Auto-filled from user data"
                className="form-control auto-filled"
                readOnly
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="parentName">Parent Name</label>
              <input
                type="text"
                id="parentName"
                name="parentName"
                value={formData.parentName}
                onChange={handleInputChange}
                placeholder="Auto-filled from user data"
                className="form-control auto-filled"
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="parentEmail">Parent Email</label>
              <input
                type="email"
                id="parentEmail"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleInputChange}
                placeholder="Auto-filled from user data"
                className="form-control auto-filled"
                readOnly
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-secondary"
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formData.register_number}
            >
              Submit Form
            </button>
          </div>
        </form>

        <div className="info-panel">
          <h3>How it works:</h3>
          <ul>
            <li>✨ Enter a register number (minimum 3 characters)</li>
            <li>🔍 System automatically looks up user in nenasa_users table</li>
            <li>📝 Name, Email, and other fields auto-fill if user exists</li>
            <li>⚡ Real-time feedback shows success/error status</li>
            <li>🎯 Perfect for attendance marking, enrollment forms, etc.</li>
          </ul>

          <h4>Test Register Numbers:</h4>
          <p className="test-numbers">
            Try entering register numbers of existing users in your system. You
            can check the User Management page to see available register
            numbers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterNumberLookup;
