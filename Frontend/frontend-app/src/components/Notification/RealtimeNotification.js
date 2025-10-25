import React, { useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import "./RealtimeNotification.css";

const RealtimeNotification = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) {
      console.log("⚠️ RealtimeNotification: Socket not available");
      return;
    }

    console.log("🔔 RealtimeNotification: Setting up event listeners");

    // Listen for new lecture notes
    const handleNewLectureNote = (data) => {
      console.log("📚 New lecture note notification:", data);

      const notification = {
        id: Date.now(),
        type: "lecture-note",
        icon: "📚",
        title: "New Lecture Note",
        message: data.message,
        subject: data.data?.classInfo?.subject || "Subject",
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);
      playNotificationSound();
    };

    // Listen for new announcements
    const handleNewAnnouncement = (data) => {
      console.log("📢 New announcement notification:", data);

      const notification = {
        id: Date.now(),
        type: "announcement",
        icon: "📢",
        title: "New Announcement",
        message: data.message,
        subject: data.data?.classInfo?.subject || "Subject",
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);
      playNotificationSound();
    };

    socket.on("newLectureNote", handleNewLectureNote);
    socket.on("newAnnouncement", handleNewAnnouncement);

    console.log("✅ RealtimeNotification: Event listeners registered");

    return () => {
      console.log("🔕 RealtimeNotification: Cleaning up event listeners");
      socket.off("newLectureNote", handleNewLectureNote);
      socket.off("newAnnouncement", handleNewAnnouncement);
    };
  }, [socket]);

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 5)); // Keep max 5

    // Auto remove after 8 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 8000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const playNotificationSound = () => {
    // Create a beep sound
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (notifications.length === 0) return null;

  return (
    <div className="realtime-notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`realtime-notification ${notification.type}`}
        >
          <div className="notification-icon">{notification.icon}</div>
          <div className="notification-content">
            <div className="notification-header">
              <h4>{notification.title}</h4>
              <span className="notification-time">
                {formatTime(notification.timestamp)}
              </span>
            </div>
            <p className="notification-message">{notification.message}</p>
            <span className="notification-subject">
              📚 {notification.subject}
            </span>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default RealtimeNotification;
