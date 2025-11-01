import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import QRCode from "react-qr-code";
import "./StudentQRCode.css";

const StudentQRCode = () => {
  const { accounts } = useMsal();
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setQrLoading(true);
        const userEmail = accounts[0].username;

        const response = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/qrcode`
        );

        if (response.ok) {
          const data = await response.json();
          setQrCodeData(data.qrCode);
          setStudentInfo(data.student);
        } else {
          console.error("Failed to fetch QR code");
        }
      } catch (error) {
        console.error("Error fetching QR code:", error);
      } finally {
        setQrLoading(false);
      }
    };

    fetchQRCode();
  }, [accounts]);

  const downloadQRCode = () => {
    if (!studentInfo) return;

    const svg = document.getElementById("student-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${studentInfo.name}-QRCode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="student-qr-page">
      <div className="qr-page-container">
        <div className="qr-page-header">
          <h1>📱 My QR Code</h1>
          <p className="qr-page-subtitle">
            Your personal attendance QR code for quick class check-in
          </p>
        </div>

        <div className="qr-page-content">
          {qrLoading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Loading your QR code...</p>
            </div>
          ) : qrCodeData && studentInfo ? (
            <div className="qr-display-grid">
              <div className="qr-info-card">
                <div className="info-header">
                  <h2>📝 Student Information</h2>
                </div>
                <div className="info-content">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{studentInfo.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Register Number:</span>
                    <span className="info-value">
                      {studentInfo.registerNumber}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{studentInfo.email}</span>
                  </div>
                </div>

                <div className="info-instructions">
                  <h3>📋 How to Use</h3>
                  <ul>
                    <li>Show this QR code to your teacher during class</li>
                    <li>Teacher will scan it to mark your attendance</li>
                    <li>Download and save on your phone for easy access</li>
                    <li>Keep your QR code private and secure</li>
                  </ul>
                </div>
              </div>

              <div className="qr-code-card">
                <div className="qr-code-wrapper-main">
                  <QRCode
                    id="student-qr-code"
                    value={JSON.stringify({
                      type: "student_attendance",
                      studentId: studentInfo.id,
                      name: studentInfo.name,
                      registerNumber: studentInfo.registerNumber,
                    })}
                    size={280}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
                <button
                  className="download-qr-btn-main"
                  onClick={downloadQRCode}
                >
                  📥 Download QR Code
                </button>
                <p className="qr-tip">
                  💡 Save this QR code on your mobile phone for quick access
                  during classes
                </p>
              </div>
            </div>
          ) : (
            <div className="error-section">
              <div className="error-icon">❌</div>
              <h3>Unable to load QR code</h3>
              <p>Please contact your administrator if this issue persists.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentQRCode;
