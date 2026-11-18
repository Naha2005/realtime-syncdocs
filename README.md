<div align="center">

# 📝 CollabDocs
### Next-Gen Real-Time Collaborative Document Workspace

*Empower teams with Google Docs & Notion-inspired real-time editing, Markdown rendering, instant synchronization, and role-based access.*

---

[![Frontend Deploy](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://realtime-syncdocs.netlify.app)
[![Backend Deploy](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://realtime-syncdocs.onrender.com/health)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 🌟 Live Demo & Deployments

| Component | Cloud Host | Live URL | Health Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Netlify** | [https://realtime-syncdocs.netlify.app](https://realtime-syncdocs.netlify.app) | `Active` |
| **Backend API & WebSockets** | **Render** | [https://realtime-syncdocs.onrender.com](https://realtime-syncdocs.onrender.com) | `Active` |
| **API Health Probe** | **Render** | [https://realtime-syncdocs.onrender.com/health](https://realtime-syncdocs.onrender.com/health) | `{"status":"ok"}` |

### ⚡ Quick Demo Account (Instant Access, No Sign-Up Needed)
Test real-time collaboration right away using our pre-seeded demo user:
- **Email:** `demo@collabdocs.com`
- **Password:** `password123`

> 💡 **Try Real-Time Collaboration**: Open the app in two separate browser windows (or an Incognito tab), log in, and open the same document to watch edits, user avatars, and live typing indicators sync instantly!

---

## ⚡ Core Features

```
┌────────────────────────────────────────────────────────────────────────┐
│                          COLLABDOCS PLATFORM                           │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 🚀 REAL-TIME SYNC │ 🛡️ PERMISSIONS   │ ⏱️ VERSION TIMELINES           │
│ • Sub-ms latency  │ • Owner           │ • Automatic snapshot history   │
│ • Socket.IO rooms │ • Editor (read/w) │ • Instant rollback restore     │
│ • Typing bubbles  │ • Viewer (read)   │ • Author attribution           │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ ✍️ RICH MARKDOWN  │ 🎨 USER IDENTITY  │ 🔌 HIGH AVAILABILITY           │
│ • Split-view mode │ • Dynamic Avatars │ • MongoDB Atlas Cloud          │
│ • Live HTML parse │ • Dark / Light UI │ • Zero-config in-memory backup │
│ • Quick toolbars  │ • JWT sessions    │ • Resilient offline fallback   │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

- **⚡ Sub-Millisecond WebSocket Sync**: Changes propagate instantly to active collaborators inside the document room.
- **👀 Live Presence & Typing Radar**: See active avatars in the header and visual indicators when teammates are typing.
- **📑 Markdown Workspace**: Edit Markdown with formatting shortcuts (bold, headers, code, lists) and preview formatted HTML in real-time.
- **🔒 Granular Access Control (RBAC)**: Share documents by email with designated roles:
  - **Owner**: Full control (edit, rename, share, transfer, delete).
  - **Editor**: Can read and write content.
  - **Viewer**: Read-only access with interface controls locked.
- **🕒 Version History & Snapshot Rollback**: Automatically captures versions as you work, allowing 1-click restore to any past revision.
- **🛡️ Dual Database Resilience**: Connects to **MongoDB Atlas**, with an automated, zero-config in-memory JSON fallback if the cloud database is ever disconnected.

---

## 🏗️ Architecture & Data Flow

```text
  [ User A (Browser) ]                     [ User B (Browser) ]
           │                                        ▲
           │ 1. Type change via WebSocket           │ 3. Broadcast changes
           ▼                                        │
┌───────────────────────────────────────────────────────────┐
│               Render Node.js & Socket.IO Server           │
│              (https://realtime-syncdocs.onrender.com)     │
└──────────────┬────────────────────────────┬───────────────┘
               │ 2. Auto-save delta         │
               ▼                            ▼
      ┌─────────────────┐          ┌──────────────────────┐
      │  MongoDB Atlas  │ (OR)     │ In-Memory Fallback   │
      │  Cloud Cluster  │          │ JSON Store Engine    │
      └─────────────────┘          └──────────────────────┘
```

---

## 🔒 Security & Privacy by Design

* **Credential Hashing**: Passwords are encrypted using salted `bcryptjs` (cost factor 10) before storage.
* **Stateless JWT Sessions**: Requests to protected routes require a cryptographically signed JSON Web Token passed via `Authorization: Bearer <token>`.
* **Clean Client Bundles**: Zero API keys or secrets are packaged into the client-side JavaScript bundle. The only client variable is the public API base address (`VITE_API_URL`).
* **Cross-Origin Protection (CORS)**: Restricts and validates all HTTP and WebSocket connections against authorized origins.
* **Repository Safety**: All local environment secrets (`.env`), cache files, and private databases are strictly excluded from version control via `.gitignore`.

---

## 📂 Project Organization

```text
Real-Time Collaborative Document Editor/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── public/
│   │   └── _redirects          # Netlify SPA routing rules
│   ├── src/
│   │   ├── components/         # Shared UI (Navbar, Modals, Spinners)
│   │   ├── context/            # AuthContext & ThemeContext
│   │   ├── hooks/              # useSocket WebSocket hook
│   │   ├── pages/              # Login, Register, Dashboard, Editor
│   │   ├── services/           # Axios HTTP client with JWT interceptor
│   │   ├── App.jsx             # SPA Route Declarations
│   │   └── main.jsx            # React 19 Entry
│   ├── vercel.json             # Vercel SPA rewrites
│   └── vite.config.js          # Vite build config
├── server/                     # Backend API & WebSocket Engine
│   ├── config/                 # MongoDB connector & InMemory DB fallback
│   ├── controllers/            # Auth & Document business logic
│   ├── middleware/             # JWT authentication gatekeeper
│   ├── models/                 # Mongoose Data Schemas (User, Doc, Version)
│   ├── routes/                 # Express API routes
│   ├── socket/                 # Socket.IO connection & event handlers
│   ├── .env.example            # Environment variables template
│   └── server.js               # Express & Socket.IO bootstrapper
├── render.yaml                 # Infrastructure-as-code for Render cloud
├── .gitignore                  # Production Git ignore filter
├── package.json                # Workspace scripts
└── README.md                   # Project documentation
```

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* Optional: Local MongoDB instance or MongoDB Atlas URI (runs automatically with in-memory fallback if omitted)

### 1. Clone the Repository
```bash
git clone https://github.com/Naha2005/realtime-syncdocs.git
cd realtime-syncdocs
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the server environment template:
```bash
cp server/.env.example server/.env
```
*(On Windows PowerShell: `Copy-Item server/.env.example server/.env`)*

Configure your `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_collabdocs_key_12345
CLIENT_URL=http://localhost:5173
# Optional: MONGO_URI=mongodb://localhost:27017/collabdocs
```

### 4. Run Both Servers Concurrently
```bash
npm run dev
```

* **Frontend Client:** [http://localhost:5173](http://localhost:5173)
* **Backend API & WebSockets:** [http://localhost:5000](http://localhost:5000)

---

## 📡 REST API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create a new user with custom avatar |
| `POST` | `/api/auth/login` | Public | Sign in and receive JWT token |
| `GET` | `/api/auth/me` | Private | Fetch authenticated user profile |
| `POST` | `/api/auth/reset-password` | Public | Reset user password |

### Document Management (`/api/documents`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents` | Private | List all accessible documents (owned & shared) |
| `POST` | `/api/documents` | Private | Create a new document |
| `GET` | `/api/documents/:id` | Private | Fetch document details & user role |
| `PUT` | `/api/documents/:id` | Private | Update document title, content, or category |
| `DELETE` | `/api/documents/:id` | Owner | Delete document |
| `POST` | `/api/documents/share` | Owner | Add, update, or remove collaborator permissions |
| `GET` | `/api/documents/:id/history` | Private | Retrieve version snapshots |
| `POST` | `/api/documents/:id/rollback`| Editor | Rollback content to a selected historical version |

---

## 🔌 Socket.IO Event Reference

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-document` | Client ➔ Server | `{ documentId, user }` | Joins the document's real-time room channel |
| `leave-document`| Client ➔ Server | `{ documentId, userId }` | Gracefully leaves the room channel |
| `user-online` | Server ➔ Room | `[ onlineUsers ]` | Broadcasts active collaborator list |
| `user-offline` | Server ➔ Room | `[ onlineUsers ]` | Broadcasts collaborator departure |
| `send-changes` | Client ➔ Server | `{ documentId, content, user }`| Sends delta updates to server |
| `receive-changes`| Server ➔ Room | `{ content, user }` | Dispatches edits to other active collaborators |
| `typing` | Client ➔ Server | `{ documentId, user }` | Broadcasts active typing indicator |
| `stop-typing` | Client ➔ Server | `{ documentId, user }` | Clears active typing indicator |
| `save-document` | Client ➔ Server | `{ documentId, content }` | Triggers background document save |

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more details.

```text
Copyright (c) 2026 Naha2005

Permission is granted to use, copy, modify, merge, publish, distribute, 
sublicense, and/or sell copies of the software with attribution.
```

- ✅ **Commercial Use** — Permitted
- ✅ **Modification** — Permitted
- ✅ **Distribution** — Permitted
- ✅ **Private Use** — Permitted
