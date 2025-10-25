# Socket.IO Live Update දෝශ නිරාකරණය (Debugging Guide)

## 🔍 පියවර 1: Backend සහ Frontend ක්‍රියාත්මක කරන්න

### Backend ආරම්භ කරන්න:
```powershell
cd Backend
npm run start:dev
```

**අපේක්ෂිත Output:**
```
🚀 Backend is running on: http://localhost:8000
```

### Frontend ආරම්භ කරන්න (නව terminal එකක):
```powershell
cd Frontend\frontend-app
npm start
```

---

## 🧪 පියවර 2: Socket Connection පරීක්ෂා කරන්න

### විකල්පය 1: Test HTML පිටුව භාවිතා කරන්න (RECOMMENDED ✅)

1. Browser එකේ මෙම file එක විවෘත කරන්න:
   ```
   d:\Online Attendance Systems\online-attendance-system-nenasa\test-socket-connection.html
   ```

2. Page එක load වූ පසු, ඔබට පෙනෙන්න ඕනි:
   - ✅ Connected - Socket ID: xxx
   - Event Log එකේ "Connected!" message එක

3. **පියවර පියවරට පරීක්ෂා කරන්න:**

   **a) User Register කරන්න:**
   - Email field එකේ: `student@example.com` (හෝ ඔබේ email)
   - "Register User" button එක click කරන්න
   - Log එකේ පෙනෙන්න ඕනි: `✅ User registered`

   **b) Classes Register කරන්න:**
   - Class IDs field එකේ: `1,2,3` (student enroll වෙලා ඇති classes)
   - "Register Classes" button එක click කරන්න
   - Log එකේ පෙනෙන්න ඕනි: `✅ Classes registered: {classIds: [1,2,3], rooms: [...]}`

   **c) Test Notification යවන්න:**
   - "Send Test Notification" button එක click කරන්න
   - ඔබට පෙනෙන්න ඕනි:
     * Log එකේ: `📢 New Announcement received`
     * Yellow notification box එකක් පහළින්
     * Beep sound එකක්

### විකල්පය 2: Frontend Application එකෙන් පරීක්ෂා කරන්න

1. **Student ලෙස Login වන්න:**
   - Frontend app එක විවෘත කරන්න (http://localhost:3000)
   - MSAL login කරන්න

2. **Browser Console එක විවෘත කරන්න (F12):**
   
   **අපේක්ෂිත Console Logs:**
   ```
   ✅ Socket connected: abc123
   ✅ User registered: { success: true, ... }
   📚 Registering student classes: [1, 2, 3]
   ✅ Classes registered: { success: true, classIds: [1, 2, 3], rooms: [...] }
   🔔 RealtimeNotification: Setting up event listeners
   ✅ RealtimeNotification: Event listeners registered
   ```

3. **Backend Terminal එකෙහි Logs පරීක්ෂා කරන්න:**
   ```
   [EventsGateway] Client connected: abc123
   [EventsGateway] User registered: student@example.com (student)
   [EventsGateway] Student classes registered: student@example.com -> 1, 2, 3
   [EventsGateway] Student student@example.com joined room: class-1
   [EventsGateway] Student student@example.com joined room: class-2
   [EventsGateway] Student student@example.com joined room: class-3
   [EventsGateway] Client abc123 is now in rooms: abc123, class-1, class-2, class-3
   ```

---

## 🎯 පියවර 3: Live Notification පරීක්ෂා කරන්න

### Test Notification API භාවිතයෙන්:

Browser console එකේ හෝ Postman එකෙන්:

```javascript
// Browser console එකේ run කරන්න:
fetch('http://localhost:8000/announcements/test-notification/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log('API Response:', data));
```

**හෝ Postman/Thunder Client එකෙන්:**
- Method: `POST`
- URL: `http://localhost:8000/announcements/test-notification/1`
- (මෙහි `1` යනු class ID එක - ඔබේ student enroll වෙලා ඇති class එකක් භාවිතා කරන්න)

### අපේක්ෂිත ප්‍රතිඵල:

**Backend Terminal:**
```
[EventsGateway] TEST: Emitting test notification to class 1
[EventsGateway] TEST: Event emitted to room: class-1
```

**Student Browser (Console):**
```
📢 New announcement notification: { type: 'announcement', message: 'Test notification...', ... }
```

**Student Browser (Screen):**
- Side එකෙන් popup notification එකක් appear වෙන්න ඕනි (top-right corner)
- 📢 icon එක සහිත
- "Test Notification" title එක
- Beep sound එකක්

---

## ❌ දෝශ ඇත්නම් (Troubleshooting)

### දෝශය 1: "Socket not connected"

**විසඳුම:**
1. Backend ක්‍රියාත්මකද බලන්න:
   ```powershell
   netstat -ano | findstr :8000
   ```
   Output එකක් නැත්නම්, backend restart කරන්න.

2. CORS error එකක් ඇත්නම්, `Backend/src/main.ts` එකේ මෙය පරීක්ෂා කරන්න:
   ```typescript
   app.enableCors({
     origin: ['http://localhost:3000', 'http://localhost:3001'],
     credentials: true,
   });
   ```

### දෝශය 2: "User registered" log නැත

**විසඳුම:**
1. Login වෙලාද බලන්න (MSAL account තිබෙන්න ඕනි)
2. Browser console එකේ run කරන්න:
   ```javascript
   JSON.parse(sessionStorage.getItem('currentUser'))
   ```
   Result එකක් නැත්නම්, logout කරලා නැවත login වන්න.

### දෝශය 3: "Classes registered" log නැත

**විසඳුම:**
1. Student ට classes enroll වෙලාද බලන්න:
   ```javascript
   // Browser console එකේ:
   fetch('http://localhost:8000/student/email/YOUR_EMAIL/classes/all')
     .then(r => r.json())
     .then(d => console.log('Enrolled classes:', d));
   ```

2. Array එකක් return වෙනවද බලන්න `[{id: 1, ...}, {id: 2, ...}]`

### දෝශය 4: Test notification යැව්වත් receive වෙන්නේ නැත

**විසඳුම:**
1. Backend logs එකේ මෙය පෙනේද:
   ```
   [EventsGateway] TEST: Emitting test notification to class X
   [EventsGateway] TEST: Event emitted to room: class-X
   ```

2. Student එම class එකට enroll වෙලාද:
   - Test notification class ID = 1
   - Student enrolled classes = [1, 2, 3]
   - මෙයින් 1 තිබෙනවද?

3. Room එකට join වෙලාද:
   ```
   [EventsGateway] Student EMAIL joined room: class-1
   [EventsGateway] Client ID is now in rooms: ..., class-1, ...
   ```

4. Frontend listener එක set වෙලාද:
   ```
   🔔 RealtimeNotification: Setting up event listeners
   ✅ RealtimeNotification: Event listeners registered
   ```

---

## ✅ සාර්ථක වීම තහවුරු කරන්න

සියල්ල නිවැරදිව ක්‍රියා කරන විට:

1. **Backend logs:**
   ```
   Client connected: abc123
   User registered: student@example.com (student)
   Student classes registered: student@example.com -> 1, 2, 3
   Student joined rooms: class-1, class-2, class-3
   ```

2. **Frontend console:**
   ```
   ✅ Socket connected
   ✅ User registered
   ✅ Classes registered
   🔔 Event listeners registered
   ```

3. **Test notification යැවීමෙන් පසු:**
   - Backend: `TEST: Emitting test notification to class X`
   - Frontend console: `📢 New announcement notification: ...`
   - Screen: Side popup notification පෙනේ
   - Sound: Beep sound ඇසේ

---

## 🚀 ඊළඟ පියවර

Test notification ක්‍රියා කරන්නේ නම්:

1. **Teacher ලෙස login වන්න** (වෙනම browser window/incognito)
2. **Announcement එකක් create කරන්න** එක්තරා class එකකට
3. **Student window එක බලන්න** - notification එක පෙනෙන්න ඕනි!

---

## 📞 තවමත් ක්‍රියා නොකරන්නේ නම්

1. **Browser cache clear කරන්න:**
   - Ctrl+Shift+Delete
   - Cache සහ Cookies clear කරන්න
   - Page refresh කරන්න (Ctrl+F5)

2. **Backend restart කරන්න:**
   ```powershell
   # Backend terminal එකේ Ctrl+C
   npm run start:dev
   ```

3. **Frontend restart කරන්න:**
   ```powershell
   # Frontend terminal එකේ Ctrl+C
   npm start
   ```

4. **Node modules reinstall කරන්න:**
   ```powershell
   # Backend
   cd Backend
   Remove-Item -Recurse -Force node_modules
   npm install

   # Frontend
   cd Frontend\frontend-app
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

---

## 📝 Important Notes

- Port 8000 (Backend) සහ 3000 (Frontend) ඕනි
- Student account එකට database එකේ class enrollments තිබෙන්න ඕනි
- MSAL authentication ක්‍රියාත්මක වෙන්න ඕනි
- Browser එකේ WebSocket support තිබෙන්න ඕනි (Chrome, Firefox, Edge recommended)

Good luck! 🎉
