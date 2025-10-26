import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useMsal } from "@azure/msal-react";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { accounts } = useMsal();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!accounts || accounts.length === 0) {
      return;
    }

    const userEmail = accounts[0].username;
    const userRole = getCurrentUserRole();

    // Create socket connection
    const newSocket = io("http://localhost:8000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);

      // Register user with their email and role
      newSocket.emit("register", { userEmail, role: userRole });
    });

    newSocket.on("registered", (data) => {
      console.log("✅ User registered:", data);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log("🔌 Closing socket connection");
      newSocket.close();
    };
  }, [accounts]);

  // Register student classes when socket is connected
  useEffect(() => {
    if (!socket || !isConnected || !accounts || accounts.length === 0) {
      return;
    }

    const userRole = getCurrentUserRole();
    if (userRole === "student") {
      // Fetch student's enrolled classes and register
      fetchAndRegisterClasses(socket, accounts[0].username);
    }
  }, [socket, isConnected, accounts]);

  const fetchAndRegisterClasses = async (socket, userEmail) => {
    try {
      const response = await fetch(
        `http://localhost:8000/student/email/${encodeURIComponent(
          userEmail
        )}/classes/all`
      );

      if (response.ok) {
        const classes = await response.json();
        const classIds = classes.map((c) => c.id);

        console.log("📚 Registering student classes:", classIds);
        socket.emit("registerStudentClasses", {
          studentEmail: userEmail,
          classIds,
        });

        socket.on("classesRegistered", (data) => {
          console.log("✅ Classes registered:", data);
        });
      }
    } catch (error) {
      console.error("❌ Error fetching student classes:", error);
    }
  };

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const value = {
    socket,
    isConnected,
    notifications,
    addNotification,
    clearNotifications,
    removeNotification,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Helper function to get current user role
function getCurrentUserRole() {
  try {
    const user = sessionStorage.getItem("currentUser");
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.role;
    }
  } catch (e) {
    console.error("Error getting user role:", e);
  }
  return "student";
}
