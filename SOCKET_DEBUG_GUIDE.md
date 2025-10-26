# Socket.IO Real-Time Updates - Debugging Guide

## 🔍 Verification Checklist

### 1. Backend Server Status

Check if the backend server is running on port 8000:

```powershell
# Check if backend is running
netstat -ano | findstr :8000
```

Expected output: Should show a listening process on port 8000

### 2. Frontend Connection Check

Open browser Developer Tools (F12) and check Console:

**Expected Console Logs:**

```
✅ Socket connected: <socket-id>
✅ User registered: { success: true, message: 'Successfully connected...' }
📚 Registering student classes: [1, 2, 3, ...]
✅ Classes registered: { success: true, classIds: [...] }
🔔 RealtimeNotification: Setting up event listeners
✅ RealtimeNotification: Event listeners registered
```

**Problem Indicators:**

```
❌ Socket connection error: ...
❌ Socket disconnected
⚠️ RealtimeNotification: Socket not available
```

### 3. Backend Logs

Check terminal where backend is running for these logs:

**Expected Logs:**

```
Client connected: <socket-id>
User registered: <email> (<role>)
Student classes registered: <email> -> 1, 2, 3, ...
Emitting new lecture note to class <id>
Emitting new announcement to class <id>
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Socket Not Connecting

**Symptoms:** No socket logs in browser console

**Solution:**

1. Verify backend is running:

   ```powershell
   cd Backend
   npm run start:dev
   ```

2. Check CORS configuration in `Backend/src/main.ts`:

   ```typescript
   app.enableCors({
     origin: ["http://localhost:3000", "http://localhost:3001"],
     credentials: true,
   });
   ```

3. Verify EventsGateway CORS in `Backend/src/events/events.gateway.ts`:
   ```typescript
   @WebSocketGateway({
     cors: {
       origin: 'http://localhost:3000',
       credentials: true,
     },
   })
   ```

### Issue 2: User Not Registering

**Symptoms:** Socket connects but no "User registered" log

**Possible Causes:**

- User not logged in (no MSAL account)
- currentUser not in sessionStorage
- SocketContext not wrapped around App

**Solution:**

1. Check if user is logged in:

   ```javascript
   // In browser console
   JSON.parse(sessionStorage.getItem("currentUser"));
   ```

2. Verify App.js structure:
   ```javascript
   <SocketProvider>
     <Router>
       <RealtimeNotification />
       {/* routes */}
     </Router>
   </SocketProvider>
   ```

### Issue 3: Classes Not Registering (Students)

**Symptoms:** "User registered" appears but no "Classes registered"

**Solution:**

1. Test student classes API manually:

   ```powershell
   # Replace with actual student email
   curl http://localhost:8000/student/email/student@example.com/classes/all
   ```

2. Check if student has enrolled classes in database
3. Verify API endpoint returns correct data format: `[{id: 1, ...}, {id: 2, ...}]`

### Issue 4: Events Not Being Emitted

**Symptoms:** Socket connected, user registered, but no notifications on teacher action

**Solution:**

1. Verify EventsGateway is injected in controllers:

   ```typescript
   constructor(
     private readonly lectureNoteService: LectureNoteService,
     private readonly eventsGateway: EventsGateway,
   ) {}
   ```

2. Check if EventsModule is imported in feature modules:

   ```typescript
   // In lecture-notes/lecture-note.module.ts
   @Module({
     imports: [TypeOrmModule.forFeature([LectureNote]), EventsModule],
     // ...
   })
   ```

3. Verify emit is called after save:

   ```typescript
   const lectureNote = await this.lectureNoteService.createLectureNote(dto);

   // Must be AFTER the save
   this.eventsGateway.emitNewLectureNote(classId, {
     id: lectureNote.id,
     title: lectureNote.title,
     // ...
   });
   ```

### Issue 5: Events Emitted But Not Received

**Symptoms:** Backend logs show "Emitting...", but student doesn't receive

**Solution:**

1. Verify student joined the correct room:

   - Backend logs should show: "Student classes registered: email -> 1, 2, 3"
   - Event should be emitted to correct class: "Emitting new lecture note to class 1"

2. Check event names match exactly:

   - Backend emits: `'newLectureNote'`
   - Frontend listens: `socket.on('newLectureNote', ...)`

3. Test with Socket.IO client:
   ```javascript
   // In browser console
   const { socket } = window.__SOCKET_CONTEXT__;
   socket.on("newLectureNote", (data) => {
     console.log("TEST RECEIVED:", data);
   });
   ```

---

## 🧪 Testing Steps

### Manual Test 1: Connection Test

1. Start backend: `npm run start:dev` in Backend folder
2. Start frontend: `npm start` in frontend-app folder
3. Login as student
4. Open browser console (F12)
5. Verify logs appear in order

### Manual Test 2: Lecture Note Notification

1. Login as student in one browser window
2. Login as teacher in another (or incognito)
3. Teacher uploads a lecture note for a class the student is in
4. Student should see:
   - Console log: "📚 New lecture note notification"
   - Side popup notification with title and message
   - Beep sound plays

### Manual Test 3: Announcement Notification

1. Same setup as Test 2
2. Teacher creates an announcement
3. Student should see:
   - Console log: "📢 New announcement notification"
   - Side popup notification
   - Beep sound plays

### Manual Test 4: Room Targeting

1. Login as Student A (enrolled in Class 1 and 2)
2. Login as Student B (enrolled in Class 3)
3. Teacher uploads note to Class 1
4. Only Student A should receive notification
5. Student B should NOT receive notification

---

## 🔧 Quick Fix Commands

### Restart Everything

```powershell
# Kill all Node processes (BE CAREFUL!)
taskkill /F /IM node.exe

# Start backend
cd Backend
npm run start:dev

# Start frontend (new terminal)
cd Frontend\frontend-app
npm start
```

### Clear Cache and Reinstall

```powershell
# Backend
cd Backend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install

# Frontend
cd Frontend\frontend-app
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Check Dependencies

```powershell
# Backend - should see these packages
cd Backend
npm list @nestjs/websockets @nestjs/platform-socket.io socket.io

# Frontend - should see this package
cd Frontend\frontend-app
npm list socket.io-client
```

---

## 📊 Monitoring Tools

### Browser DevTools Network Tab

1. Open DevTools → Network tab
2. Filter: WS (WebSocket)
3. Should see connection to `ws://localhost:8000/socket.io/`
4. Status should be "101 Switching Protocols"
5. Click on connection to see messages

### Socket.IO Client Testing

Add to browser console for debugging:

```javascript
// Check socket state
const { socket, isConnected } = window.__SOCKET_CONTEXT__;
console.log("Socket:", socket);
console.log("Connected:", isConnected);
console.log("Socket ID:", socket?.id);

// Test emit
socket.emit("test", { message: "hello" });

// Test listen
socket.on("test-response", (data) => console.log("Received:", data));
```

---

## ✅ Success Indicators

When everything works correctly, you should see:

### Backend Terminal:

```
🚀 Backend is running on: http://localhost:8000
Client connected: abc123
User registered: student@example.com (student)
Student classes registered: student@example.com -> 1, 2, 3
Emitting new lecture note to class 1
```

### Frontend Console:

```
✅ Socket connected: abc123
✅ User registered: { success: true, ... }
📚 Registering student classes: [1, 2, 3]
✅ Classes registered: { success: true, classIds: [1, 2, 3] }
🔔 RealtimeNotification: Setting up event listeners
✅ RealtimeNotification: Event listeners registered
📚 New lecture note notification: { type: 'lecture-note', ... }
```

### Student Browser:

- ✅ Side popup appears in top-right
- ✅ Beep sound plays
- ✅ Notification shows title, message, subject
- ✅ Notification auto-dismisses after 8 seconds
- ✅ Can manually close with ✕ button

---

## 🆘 Still Not Working?

If you've tried everything above and it's still not working:

1. **Check EventsModule in AppModule:**

   ```typescript
   // Backend/src/app.module.ts
   @Module({
     imports: [
       // ...
       EventsModule,  // Must be imported!
     ],
   })
   ```

2. **Verify SocketProvider wraps entire app:**

   ```javascript
   // Frontend/frontend-app/src/App.js
   function AppContent() {
     return (
       <SocketProvider>
         {" "}
         {/* Must wrap Router */}
         <Router>
           <RealtimeNotification /> {/* Must be inside SocketProvider */}
           {/* ... */}
         </Router>
       </SocketProvider>
     );
   }
   ```

3. **Check for port conflicts:**

   ```powershell
   netstat -ano | findstr :8000
   netstat -ano | findstr :3000
   ```

4. **Try changing WebSocket transport:**

   ```javascript
   // In SocketContext.js
   const newSocket = io("http://localhost:8000", {
     transports: ["polling", "websocket"], // Try polling first
     // ...
   });
   ```

5. **Enable Socket.IO debug mode:**
   ```javascript
   localStorage.debug = "socket.io-client:*";
   // Refresh page
   ```

---

## 📝 Next Steps

Once you confirm the issue, update the relevant file:

- Connection issues → `SocketContext.js`
- Event emission → Controller files
- Event reception → `RealtimeNotification.js`
- Room joining → `EventsGateway.ts`

Need more help? Check the main documentation: `REAL_TIME_NOTIFICATIONS.md`
