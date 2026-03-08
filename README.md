# Nenasa Online Attendance System

A full-stack online attendance management system designed for educational institutions. Built with NestJS and React, featuring Azure AD single sign-on, real-time notifications, and QR code-based attendance marking.

---

## Features

- **Role-Based Access Control** — Separate dashboards and permissions for Admins, Teachers, and Students
- **QR Code Attendance** — Students scan a session QR code to mark attendance instantly
- **Manual Attendance Override** — Admins can manually mark or correct attendance records
- **Real-Time Notifications** — Live updates via WebSocket (Socket.io) for attendance events
- **Azure AD Authentication** — Seamless Single Sign-On using Microsoft organizational accounts
- **Student & Teacher Management** — Full CRUD for managing student and teacher profiles with photo uploads
- **Course & Class Management** — Organize students into courses and classes
- **Lecture Notes** — Teachers can upload and share lecture notes; students can download them
- **Announcements** — Teachers post announcements visible to enrolled students
- **Attendance Reports** — Generate and export PDF attendance reports
- **Payment Status Tracking** — Monitor and manage student payment statuses
- **Email & SMS Notifications** — Automated parent/guardian notifications via email and SMS
- **Attendance History** — Full historical view with per-class and per-course breakdowns

---

## Technology Stack

### Backend

| Technology          | Purpose                           |
| ------------------- | --------------------------------- |
| NestJS (TypeScript) | REST API framework                |
| TypeORM             | Database ORM                      |
| MySQL               | Relational database               |
| Socket.io           | Real-time WebSocket communication |
| Azure AD / MSAL     | Authentication & authorization    |
| Microsoft Graph API | User directory integration        |
| JWT + Passport      | Token-based auth guards           |
| Multer              | File uploads (images, documents)  |
| QRCode              | QR code generation                |
| PDFKit              | PDF report generation             |
| Nodemailer          | Email notifications               |

### Frontend

| Technology       | Purpose                      |
| ---------------- | ---------------------------- |
| React 18         | UI framework                 |
| React Router v7  | Client-side routing          |
| MSAL React       | Azure AD authentication      |
| Socket.io Client | Real-time event handling     |
| Chart.js         | Attendance analytics charts  |
| jsPDF            | Client-side PDF generation   |
| QR Scanner       | Camera-based QR code reading |

---

## Project Structure

```
online-attendance-system-nenasa/
├── Backend/                        # NestJS API server
│   ├── src/
│   │   ├── auth/                   # JWT & Azure AD authentication
│   │   ├── user/                   # User management & Azure sync
│   │   ├── student/                # Student profiles & management
│   │   ├── teacher/                # Teacher profiles & management
│   │   ├── attendance/             # Attendance marking & history
│   │   ├── class/                  # Class management
│   │   ├── course/                 # Course management
│   │   ├── announcement/           # Announcements system
│   │   ├── lecture-notes/          # Lecture note uploads
│   │   ├── notification/           # Push notifications
│   │   ├── payment/                # Payment status tracking
│   │   ├── role/                   # Role management
│   │   ├── sms/                    # SMS notification service
│   │   └── events/                 # WebSocket gateway
│   ├── database/
│   │   └── migrations/             # SQL schema migration scripts
│   ├── scripts/                    # Utility & testing scripts
│   ├── uploads/                    # Uploaded files (images, documents)
│   └── test/                       # E2E tests
│
├── Frontend/
│   └── frontend-app/               # React application
│       ├── src/
│       │   ├── components/
│       │   │   ├── Dashboard/      # Role-specific dashboards
│       │   │   ├── Attendance/     # QR & manual attendance views
│       │   │   ├── Student/        # Student-facing pages
│       │   │   ├── Navbar/         # Navigation component
│       │   │   ├── Notification/   # Real-time notification panel
│       │   │   └── ...
│       │   ├── services/           # API service layer
│       │   ├── contexts/           # React context providers
│       │   ├── hooks/              # Custom React hooks
│       │   └── utils/              # Utility functions
│       └── public/
│
├── package.json                    # Root workspace scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://www.mysql.com/) 8.0+
- An [Azure AD](https://azure.microsoft.com/en-us/services/active-directory/) tenant with an app registration

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd online-attendance-system-nenasa
   ```

2. **Install all dependencies**

   ```bash
   npm run install:all
   ```

3. **Configure the Backend**

   Create `Backend/.env` from the example below:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_NAME=nenasa_attendance

   AZURE_TENANT_ID=your_tenant_id
   AZURE_CLIENT_ID=your_client_id
   AZURE_CLIENT_SECRET=your_client_secret

   JWT_SECRET=your_jwt_secret
   PORT=8000
   ```

4. **Set up the database**

   Run the migration scripts found in `Backend/database/migrations/` against your MySQL instance.

5. **Configure the Frontend**

   Update `Frontend/frontend-app/src/authConfig.js` with your Azure AD app registration details.

### Running the Application

**Start both servers simultaneously:**

```bash
npm start
```

**Or start individually:**

```bash
# Backend (http://localhost:8000)
npm run start:backend

# Frontend (http://localhost:3000)
npm run start:frontend
```

---

## API Overview

The backend exposes a RESTful API at `http://localhost:8000`. All endpoints (except auth) require a valid JWT Bearer token.

| Module         | Base Path        |
| -------------- | ---------------- |
| Authentication | `/auth`          |
| Users          | `/users`         |
| Students       | `/students`      |
| Teachers       | `/teachers`      |
| Classes        | `/classes`       |
| Courses        | `/courses`       |
| Attendance     | `/attendance`    |
| Announcements  | `/announcements` |
| Lecture Notes  | `/lecture-notes` |
| Notifications  | `/notifications` |
| Payments       | `/payments`      |
| Roles          | `/roles`         |

---

## License

MIT
