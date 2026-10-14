# MERN Collaborative Document Sharing & Group Management System

A full-stack collaborative web application built on the **MERN** stack (MongoDB, Express, React, Node.js) with real-time notifications via **Socket.io**, role-based access control (**RBAC**), local file uploads via **Multer**, and user management.

---

## 🌟 Features Implemented

1. **Authentication & Profile System**:
   - Secure Sign-Up and Sign-In with bcrypt password hashing and JWT token authorization.
   - Comprehensive Profile page containing **5-6 profile fields**: Full Name, Job Title, Bio, Avatar URL, Skills (array/chips), Location, and Phone Number.

2. **Group Management & Administration**:
   - Create workspaces / groups with the creator automatically becoming the default **Admin**.
   - Admin can invite members by email with assigned initial roles (`Viewer`, `Editor`, `Admin`).
   - Secure token-based invite links (`/join-group?token=...&groupId=...`) allowing members to accept and join.
   - Any member can create separate groups where they become the default Admin.

3. **Document Sharing & Permission Rights**:
   - Secure upload validation for **PDF, JPEG, PNG, and DOCX** up to 20MB.
   - Role-Based Access Control (**RBAC**): Admins have deletion/management rights; Editors and Viewers adhere to configured permissions.
   - Direct download and view capabilities.
   - Google Drive integration hooks and storage provider abstraction.

4. **Real-Time Notification System**:
   - Instant in-app notification alerts via **Socket.io** triggered whenever any member uploads a document to a group.
   - Persistent database storage in MongoDB with unread badge counter and "mark all read" capability.

5. **Scalability Architecture Hooks**:
   - Group Chat & Comments schema (`server/models/Comment.js`) with dedicated socket handler (`server/sockets/chatSocket.js`).
   - Document Versioning fields (`version`, `parentDocumentId`).

---

## 📁 Project Structure

```text
practice1/
├── package.json               # Root scripts for client & server
├── server/
│   ├── config/db.js           # Mongoose MongoDB connection
│   ├── controllers/           # Auth, Group, Document, Notification logic
│   ├── middleware/            # Auth JWT, RBAC group permissions, Multer upload
│   ├── models/                # User, Group, Document, Notification, Comment
│   ├── routes/                # Express API endpoints
│   ├── sockets/               # Real-time Socket.io handlers
│   ├── uploads/               # Local file storage
│   ├── .env                   # Server environment variables
│   ├── server.js              # Express app + HTTP server entry
│   └── package.json
└── client/
    ├── src/
    │   ├── api/axiosInstance.js
    │   ├── components/        # Navbar, DocumentList, Modals, Dropdowns
    │   ├── context/           # AuthContext, SocketContext
    │   ├── pages/             # Login, Register, Profile, Dashboard, GroupDetail, JoinGroup
    │   ├── App.jsx            # Router and layout
    │   ├── index.css          # Tailwind CSS styling
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    ├── .env                   # Frontend environment variables
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the following in the project root:
```bash
npm run install:all
```
*(Or manually run `npm install` inside both `server/` and `client/` directories)*

### 2. Start Backend Server
Ensure MongoDB is running locally (`mongodb://127.0.0.1:27017`):
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

### 3. Start Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
# Vite client will run on http://localhost:5173
```

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new user account with profile fields
- `POST /api/auth/login` - Authenticate user & return JWT token
- `GET /api/auth/profile` - Get current user profile (Protected)
- `PUT /api/auth/profile` - Update user profile fields (Protected)

### Groups (`/api/groups`)
- `POST /api/groups` - Create a group (Creator is default Admin)
- `GET /api/groups` - Get all groups current user belongs to
- `GET /api/groups/:groupId` - Get detailed group workspace
- `POST /api/groups/:groupId/invite` - Admin invites user by email
- `POST /api/groups/join` - Accept invitation and join group
- `PUT /api/groups/:groupId/members/:userId` - Admin updates member role

### Documents (`/api/documents`)
- `POST /api/documents/upload` - Upload PDF/DOCX/image file & notify members
- `GET /api/documents/group/:groupId` - Get all documents for a group
- `DELETE /api/documents/:id` - Delete document (Admin/Editor permission check)

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Get all user notifications
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `PUT /api/notifications/:id/read` - Mark single notification as read
