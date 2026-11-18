# CollabDocs - Real-Time Collaborative Document Editor

[![Frontend Deploy](https://img.shields.io/badge/Frontend-Netlify-00C7B7?logo=netlify&logoColor=white)](https://realtime-syncdocs.netlify.app)
[![Backend Deploy](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://realtime-syncdocs.onrender.com/health)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

CollabDocs is a production-ready, full-stack collaborative Markdown document editor inspired by Google Docs and Notion. It supports instant real-time multi-user editing via WebSockets (Socket.IO), live cursor & typing awareness, role-based sharing permissions, Markdown preview, version checkpoints, and one-click rollback operations.

---

## 🌐 Live Application Links

| Component | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Netlify** | [https://realtime-syncdocs.netlify.app](https://realtime-syncdocs.netlify.app) | Live |
| **Backend API Server** | **Render** | [https://realtime-syncdocs.onrender.com](https://realtime-syncdocs.onrender.com) | Live |
| **API Health Check** | **Render** | [https://realtime-syncdocs.onrender.com/health](https://realtime-syncdocs.onrender.com/health) | `{"status":"ok"}` |

### ⚡ Quick Demo Access (No Sign-Up Required)
You can test the application immediately using the pre-seeded demo account:
* **Email:** `demo@collabdocs.com`
* **Password:** `password123`

*(Or click "Register" to create your own account with a custom avatar).*

---

## 🔒 Security & Privacy

* **Authentication & Encryption**: Passwords are encrypted using salted `bcryptjs` hashing. Sessions are maintained via secure, signed JSON Web Tokens (JWT).
* **Dual Database Architecture**: Features full MongoDB Atlas support alongside an automatic zero-config in-memory fallback. If MongoDB is offline, the app continues functioning seamlessly without data loss during user sessions.
* **Granular Role-Based Access Control (RBAC)**: Enforces Owner, Editor, and Viewer permissions on both client and server layers.
* **Safe Client Bundles**: Zero API keys or secrets are packaged in client-side production JavaScript. `VITE_API_URL` points strictly to the public backend gateway.
* **CORS Protection**: Socket.IO and Express HTTP endpoints validate origin headers to prevent unauthorized cross-site requests.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Key Features](#key-features)
3. [Folder Structure](#folder-structure)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Socket.IO Real-Time Events](#socketio-real-time-events)
7. [Installation & Local Setup](#installation--local-setup)
8. [Deployment Architecture](#deployment-architecture)

---

## Tech Stack

### Frontend
- **React 19 (Vite)**: Lightning-fast Single-Page Application (SPA) development and optimized bundling.
- **Tailwind CSS**: Modern responsive utility styling.
- **Lucide Icons**: Clean, consistent icon set.
- **React Router DOM**: Client-side protected and authenticated routing.
- **Axios**: Configured HTTP client with automatic JWT token interceptor.
- **Socket.IO Client**: Persistent full-duplex WebSocket connections for sub-millisecond collaboration.
- **React Markdown**: Real-time Markdown parser and live document preview.
- **React Hot Toast**: Real-time user feedback and collaborator alerts.

### Backend
- **Node.js & Express.js**: RESTful API engine.
- **Socket.IO**: Real-time room mappings, broadcast distribution, and active user presence tracking.
- **MongoDB & Mongoose**: Flexible document and version history persistence.
- **In-Memory / JSON DB Engine**: Zero-dependency fallback database system.
- **JWT & bcryptjs**: Stateless token authentication and password hashing.
- **CORS & Dotenv**: Environment parameter management and strict domain origin validation.

---

## Key Features

- **Real-Time Collaboration**: Sub-millisecond synchronised typing across multiple browser tabs and users with Socket.IO rooms.
- **Collaborator Presence & Typing Indicators**: See who is currently viewing the document and get visual indicators when someone is typing.
- **Interactive Markdown Editor**: Split-screen side-by-side editing, tabbed previewing, syntax formatting shortcuts, and live HTML rendering.
- **Document Management**: Dashboard with search, category filtering, title renaming, and deletion.
- **Granular Permissions & Sharing**: Invite users via email with specific roles (`Editor` or `Viewer`). Viewers are locked into read-only mode in real-time.
- **Version History & Rollback**: Automatic version snapshots recorded as documents are edited, with one-click restore to any past version.
- **Theme Support**: Persistent Light and Dark modes.

---

## Folder Structure

```text
Real-Time Collaborative Document Editor/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/
│   │   └── _redirects          # Netlify SPA routing fallback
│   ├── src/
│   │   ├── components/         # Shared UI (Navbar, Spinner, Modals)
│   │   ├── context/            # AuthContext, ThemeContext providers
│   │   ├── hooks/              # useSocket custom hook
│   │   ├── pages/              # Login, Register, Dashboard, Editor
│   │   ├── services/           # Axios API service
│   │   ├── App.jsx             # React routing setup
│   │   └── main.jsx            # Application entry point
│   ├── vercel.json             # Vercel SPA routing configuration
│   └── vite.config.js          # Vite build and proxy settings
├── server/                     # Backend API & WebSocket Server
│   ├── config/                 # MongoDB connection & InMemory fallback DB
│   ├── controllers/            # Auth and Document business logic
│   ├── middleware/             # JWT auth validation
│   ├── models/                 # Mongoose schemas (User, Document, Version)
│   ├── routes/                 # Express API routes
│   ├── socket/                 # Socket.IO connection and event handlers
│   ├── server.js               # Server entry point
│   └── package.json            # Backend dependencies
├── render.yaml                 # Render cloud service deployment blueprint
├── package.json                # Root workspace configuration
└── README.md                   # Project documentation
```

---

## Database Schema

### User Schema
```json
{
  "name": "String (required)",
  "email": "String (required, unique)",
  "password": "String (hashed with bcrypt)",
  "avatar": "String (URI)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Document Schema
```json
{
  "title": "String (default: 'Untitled Document')",
  "content": "String (default: '')",
  "category": "String (default: 'General')",
  "owner": "ObjectId (ref: User)",
  "collaborators": [
    {
      "userId": "ObjectId (ref: User)",
      "role": "String (enum: ['editor', 'viewer'])"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Version Schema
```json
{
  "documentId": "ObjectId (ref: Document)",
  "content": "String",
  "editedBy": "ObjectId (ref: User)",
  "createdAt": "Date"
}
```

---

## API Documentation

### Authentication Routes (`/api/auth`)

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Create new user account |
| `/api/auth/login` | `POST` | Public | Authenticate user and receive JWT token |
| `/api/auth/me` | `GET` | Private | Retrieve logged-in user details |
| `/api/auth/reset-password` | `POST` | Public | Reset account password |

### Document Routes (`/api/documents`)

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/documents` | `GET` | Private | Retrieve all accessible documents (owned + shared) |
| `/api/documents` | `POST` | Private | Create a new document |
| `/api/documents/:id` | `GET` | Private | Retrieve document details, content, and permissions |
| `/api/documents/:id` | `PUT` | Private | Update document title, content, or category |
| `/api/documents/:id` | `DELETE` | Private (Owner) | Delete document |
| `/api/documents/share` | `POST` | Private (Owner) | Manage collaborators and roles |
| `/api/documents/:id/history` | `GET` | Private | Fetch version snapshots |
| `/api/documents/:id/rollback`| `POST` | Private (Editor) | Rollback content to a historical version |

---

## Socket.IO Real-Time Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-document` | Client ➔ Server | `{ documentId, user }` | Subscribes client to a document's real-time room |
| `leave-document` | Client ➔ Server | `{ documentId, userId }` | Unsubscribes client from the room |
| `user-online` | Server ➔ Room | `[ onlineUsers ]` | Broadcasts updated list of active users |
| `user-offline` | Server ➔ Room | `[ onlineUsers ]` | Broadcasts user exit from the room |
| `send-changes` | Client ➔ Server | `{ documentId, content, user }`| Transmits incremental edit changes |
| `receive-changes`| Server ➔ Room | `{ content, user }` | Delivers real-time edits to other collaborators |
| `typing` | Client ➔ Server | `{ documentId, user }` | Notifies collaborators that a user is typing |
| `stop-typing` | Client ➔ Server | `{ documentId, user }` | Clears active typing bubble indicator |
| `save-document` | Client ➔ Server | `{ documentId, content }` | Automatically saves document state |

---

## Installation & Local Setup

### Prerequisites
* Node.js v18 or later
* npm (bundled with Node.js)
* Optional: MongoDB local instance or MongoDB Atlas URI (if omitted, in-memory DB runs automatically)

### Step 1: Clone and Install
```bash
git clone https://github.com/Naha2005/realtime-syncdocs.git
cd realtime-syncdocs
npm install
```

### Step 2: Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_collabdocs_key_12345
CLIENT_URL=http://localhost:5173
# Optional: MONGO_URI=mongodb://localhost:27017/collabdocs
```

### Step 3: Run the Application
```bash
npm run dev
```
* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend**: [http://localhost:5000](http://localhost:5000)

---

## Deployment Architecture

```text
[ Client (Browser) ]
       │
       ├─── Static Assets (HTML/CSS/JS) ───► Netlify CDN (https://realtime-syncdocs.netlify.app)
       │
       ├─── REST API Requests (/api/*) ────► Render Node.js Server (https://realtime-syncdocs.onrender.com)
       │
       └─── WebSocket Connections ─────────► Render Socket.IO Server (Persistent 24/7)
                                                      │
                                                      ├──► MongoDB Atlas (Cloud Database)
                                                      └──► Fallback InMemory DB (Local State)
```

### Why this setup?
* **Netlify**: Ultra-fast global CDN for static React assets, automated HTTPS, and continuous git deployments.
* **Render**: Persistent Node.js container required to keep real-time **Socket.IO (WebSocket)** connections open 24/7, which serverless platforms (like standard Vercel/Netlify functions) cannot maintain.
