import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import "../Dashboard/StudentDashboard.css"; // Reuse styles from StudentDashboard

const StudentPaymentStatus = () => {
  const { accounts } = useMsal();
  const [classesWithPaymentStatus, setClassesWithPaymentStatus] = useState([]);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setPaymentStatusLoading(true);
        const userEmail = accounts[0].username;

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
      } catch (error) {
        console.error("Error fetching payment status:", error);
        setClassesWithPaymentStatus([]);
      } finally {
        setPaymentStatusLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [accounts]);

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

  return (
    <div className="student-dashboard">
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
    </div>
  );
};

export default StudentPaymentStatus;