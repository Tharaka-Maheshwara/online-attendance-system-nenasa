# Real-Time Notifications System - Socket.IO Implementation

## 📡 Overview

This system implements real-time notifications using **Socket.IO** for instant updates when teachers add:

- 📚 **Lecture Notes**
- 📢 **Announcements**

Students who are **actively online** will receive **live notifications** immediately.

---

## 🏗️ Architecture

### Backend (NestJS + Socket.IO)

#### 1. **Events Gateway** (`events.gateway.ts`)

- WebSocket server using Socket.IO
- Handles client connections and room management
- Emits real-time events to students

**Key Features:**

- User registration with email and role
- Student class registration (joins rooms for each enrolled class)
- Emit to specific classes or students
- Connection/disconnection logging

#### 2. **Integration Points**

**Lecture Note Controller:**

- After creating a lecture note, emits `newLectureNote` event
- Sent to all students in that specific class

**Announcement Controller:**

- After creating an announcement, emits `newAnnouncement` event
- Sent to all students in that specific class

---

### Frontend (React + Socket.IO Client)

#### 1. **Socket Context** (`SocketContext.js`)

- Centralized socket connection management
- Automatic user registration on connect
- Automatic class registration for students
- Notification state management

#### 2. **Student Components**

**StudentLectureNotes.js:**

- Listens for `newLectureNote` events
- Shows toast notification
- Auto-refreshes lecture notes list
- Auto-hides notification after 5 seconds

**StudentAnnouncements.js:**

- Listens for `newAnnouncement` events
- Shows toast notification
- Auto-refreshes announcements list
- Auto-hides notification after 5 seconds

---

## 🔌 Socket Events

### Client → Server

| Event                    | Data                           | Description                         |
| ------------------------ | ------------------------------ | ----------------------------------- |
| `register`               | `{ userEmail, role }`          | Register user connection            |
| `registerStudentClasses` | `{ studentEmail, classIds[] }` | Register student's enrolled classes |

### Server → Client

| Event               | Data                                 | Description                     |
| ------------------- | ------------------------------------ | ------------------------------- |
| `registered`        | `{ success, message }`               | Registration confirmation       |
| `classesRegistered` | `{ success, classIds[] }`            | Class registration confirmation |
| `newLectureNote`    | `{ type, data, message, timestamp }` | New lecture note added          |
| `newAnnouncement`   | `{ type, data, message, timestamp }` | New announcement posted         |

---

## 🚀 How It Works

### Teacher Adds Lecture Note/Announcement:

1. Teacher uploads lecture note or creates announcement via UI
2. Backend saves to database
3. Backend emits socket event to **class room** (e.g., `class-3`)
4. All students enrolled in that class who are **online** receive the event
5. Student's browser shows **toast notification**
6. List auto-refreshes to show new item

### Student Experience:

1. Student logs in
2. Socket connects automatically
3. Student registers with their email
4. System fetches student's enrolled classes
5. Student joins socket rooms for each class
6. Student stays connected while browsing
7. **Instant notification** appears when teacher adds content

---

## 💻 Installation & Setup

### Backend

```bash
cd Backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### Frontend

```bash
cd Frontend/frontend-app
npm install socket.io-client
```

---

## 🎯 Key Features

✅ **Real-time Updates** - Instant notifications
✅ **Room-based Broadcasting** - Targeted by class
✅ **Auto-reconnection** - Handles connection drops
✅ **Toast Notifications** - Beautiful UI alerts
✅ **Auto-refresh Lists** - Data stays current
✅ **CORS Enabled** - Frontend-backend communication
✅ **Connection Logging** - Debug and monitoring

---

## 🔧 Configuration

### Backend Socket Server

**Port:** `8000` (same as REST API)
**CORS Origin:** `http://localhost:3000`
**Transports:** WebSocket, Polling

### Frontend Socket Client

**Server URL:** `http://localhost:8000`
**Auto-connect:** Yes
**Reconnection:** Enabled (5 attempts, 1s delay)

---

## 📱 UI Components

### Toast Notification

- **Position:** Top-right corner
- **Duration:** 5 seconds (auto-hide)
- **Design:** Modern card with icon, title, message
- **Colors:**
  - Lecture Notes: Purple/Blue (`#667eea`)
  - Announcements: Orange (`#f59e0b`)
- **Animation:** Slide in from right
- **Close Button:** Manual dismiss option

---

## 🧪 Testing

### Test Real-time Notifications:

1. **Open Two Browsers:**

   - Browser 1: Teacher account
   - Browser 2: Student account

2. **Teacher Actions:**

   - Add a lecture note for a class
   - OR create an announcement

3. **Student View:**
   - Should see toast notification immediately
   - List should auto-refresh
   - New item appears at top

### Debug Console:

Check browser console for:

- `✅ Socket connected`
- `✅ User registered`
- `✅ Classes registered`
- `📚 New lecture note received`
- `📢 New announcement received`

---

## 🛠️ Troubleshooting

### No Notifications Received?

1. Check browser console for socket connection
2. Verify student is enrolled in the class
3. Check backend logs for emitted events
4. Ensure CORS is configured correctly
5. Try refreshing the student page

### Connection Issues?

1. Verify backend server is running on port 8000
2. Check firewall settings
3. Clear browser cache
4. Check network tab for WebSocket connection

---

## 📈 Future Enhancements

- [ ] Push notifications (browser notifications API)
- [ ] Sound alerts for new notifications
- [ ] Notification center/inbox
- [ ] Read/unread status
- [ ] Notification preferences
- [ ] Email fallback for offline users
- [ ] Mobile app support

---

## 🎉 Summary

The system provides **instant, real-time communication** between teachers and students. When a teacher adds content, students receive immediate notifications, creating an **interactive and engaging learning experience**!

**Key Benefits:**

- ⚡ Instant updates
- 🎯 Class-specific targeting
- 📱 Modern UI/UX
- 🔄 Auto-refresh data
- 🔌 Reliable connection handling
