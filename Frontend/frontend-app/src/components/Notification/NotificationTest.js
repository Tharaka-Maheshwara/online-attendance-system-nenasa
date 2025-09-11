import React, { useState, useEffect } from 'react';
import './NotificationTest.css';

const NotificationTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotificationHistory();
  }, []);

  const fetchNotificationHistory = async () => {
    try {
      const response = await fetch('/api/notifications/history');
      const data = await response.json();
      setNotificationHistory(data);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  const testEmailConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Error testing email:', error);
      setTestResult({ success: false, message: 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    const testData = {
      studentName: 'Test Student',
      parentEmail: 'parent@example.com', // Change this to a real email for testing
      classId: 1,
      studentId: 1,
      isPresent: true,
      date: new Date().toISOString().split('T')[0]
    };

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/send-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      const result = await response.json();
      alert(result.success ? 'Test notification sent!' : 'Failed: ' + result.message);
      fetchNotificationHistory(); // Refresh history
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-test">
      <h2>Notification System Test</h2>
      
      <div className="test-section">
        <h3>Email Configuration Test</h3>
        <p>Test if the email service is properly configured and can connect.</p>
        <button 
          onClick={testEmailConnection} 
          disabled={loading}
          className="test-btn"
        >
          {loading ? 'Testing...' : 'Test Email Connection'}
        </button>
        
        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.message}
          </div>
        )}
      </div>

      <div className="test-section">
        <h3>Send Test Notification</h3>
        <p>Send a test attendance notification to a sample email address.</p>
        <button 
          onClick={sendTestNotification} 
          disabled={loading}
          className="test-btn"
        >
          {loading ? 'Sending...' : 'Send Test Notification'}
        </button>
      </div>

      <div className="history-section">
        <h3>Notification History</h3>
        <div className="history-table">
          {notificationHistory.length === 0 ? (
            <p>No notifications sent yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Student ID</th>
                </tr>
              </thead>
              <tbody>
                {notificationHistory.map(notification => (
                  <tr key={notification.id}>
                    <td>{new Date(notification.sentAt).toLocaleDateString()}</td>
                    <td>{notification.recipientEmail}</td>
                    <td>{notification.subject}</td>
                    <td>
                      <span className={`status ${notification.status}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td>{notification.studentId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="setup-info">
        <h3>Setup Instructions</h3>
        <div className="info-box">
          <h4>Email Configuration (Backend)</h4>
          <p>To enable email notifications, set these environment variables:</p>
          <ul>
            <li><code>EMAIL_USER</code>: Your Gmail address</li>
            <li><code>EMAIL_PASS</code>: Your Gmail app password</li>
          </ul>
          <p><strong>Note:</strong> For Gmail, you need to enable 2-factor authentication and generate an app password.</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
