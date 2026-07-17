# CollabDocs - Real-Time Collaborative Document Editor

CollabDocs is a production-ready, Google Docs-inspired collaborative document editor supporting real-time editing, role-based sharing permissions, dynamic Markdown previews, version history tracking, and rollback operations.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Key Features](#key-features)
3. [Folder Structure](#folder-structure)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Socket.IO Events](#socketio-events)
7. [Installation & Local Setup](#installation--local-setup)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Deployment Guide](#deployment-guide)

---

## Tech Stack

### Frontend
- **React (Vite)**: Quick bootstrap runtime.
- **Tailwind CSS**: Sleek utility-first style formatting.
- **React Router DOM**: Layout and authentication route shielding.
- **Axios**: Promised-based REST operations carrying authorization headers.
- **Socket.IO Client**: Persistent full-duplex socket interactions.
- **React Markdown**: Direct Markdown-to-HTML parser.
- **React Hot Toast**: Action alerts and notification logs.

### Backend
- **Node.js & Express.js**: REST routing APIs.
- **MongoDB & Mongoose**: Object modeling and document storage.
- **JWT & bcryptjs**: Secure encryption and token validations.
- **Socket.IO**: Real-time room mappings and broadcasts.
- **Dotenv & CORS**: Cross-origin headers and configuration parameters.

---

## Key Features

- **Authentication**: Dynamic user sign-up with custom avatars, secure password hashing, and persistent JWT sessions.
- **Workspace Dashboard**: Document list controls, quick filter parameters, search bars, and inline renaming / deletion actions.
- **Markdown Editor**: Tabbed and split-pane layout configurations, code snippet formatting toolbar, and live preview rendering.
- **Real-Time Collaboration**: Auto-saves, active online user presences, and active typing bubble overlays.
- **Sharing Configurations**: Role-based access constraints (Owner, Editor, Viewer).
- **Version Checkpoints & Rollbacks**: Snapshots logged automatically, allowing rollbacks to historical content points.
- **Theme Configurations**: Light and dark mode support with cached user choices.

---

## Folder Structure

```text
CollabDocs/
├── client/                     # Frontend Project React (Vite)
│   ├── src/
│   │   ├── components/         # Shared UI components (Navbar, Spinner)
│   │   ├── context/            # AuthContext, ThemeContext providers
│   │   ├── hooks/              # Custom useSocket hook
│   │   ├── pages/              # Login, Register, Dashboard, Editor pages
│   │   ├── services/           # API config (Axios request instances)
│   │   ├── App.jsx             # Main router tree
│   │   └── main.jsx            # React root injection point
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Backend API & Socket Server
│   ├── config/                 # DB connectors
│   ├── controllers/            # Auth, Document handlers
│   ├── middleware/             # Auth JWT validators
│   ├── models/                 # User, Document, Version schemas
│   ├── routes/                 # Express API routers
│   ├── socket/                 # Socket event loop mappings
│   ├── server.js               # Express & Socket.IO bootstrapper
│   └── .env
└── package.json                # Workspace scripts manager
```

---

## Database Schema

### User Collection
```json
{
  "name": "String (required)",
  "email": "String (required, unique)",
  "password": "String (hashed, required)",
  "avatar": "String (URI)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Document Collection
```json
{
  "title": "String (default: 'Untitled Document')",
  "content": "String (default: '')",
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

### Version Collection
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

### Authentication

#### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### Login User
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response** (200 OK): Contains user properties and token credentials.

#### Fetch Current User Profile
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <Token>`
- **Response** (200 OK): Decoded user properties object.

---

### Documents

#### Fetch Documents List
- **URL**: `/api/documents`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <Token>`
- **Response**: List of documents owned by or shared with the authenticated user.

#### Create Document
- **URL**: `/api/documents`
- **Method**: `POST`
- **Body**: `{ "title": "Optional Title" }`
- **Response**: Populated Document object.

#### Fetch Document Details
- **URL**: `/api/documents/:id`
- **Method**: `GET`
- **Response**: Document data and user role permission mapping.

#### Save Document Content
- **URL**: `/api/documents/:id`
- **Method**: `PUT`
- **Body**: `{ "title": "New Title", "content": "Updated content..." }`

#### Delete Document
- **URL**: `/api/documents/:id`
- **Method**: `DELETE`

#### Edit Collaborator Settings
- **URL**: `/api/documents/share`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "documentId": "...",
    "email": "collaborator@example.com",
    "role": "editor", // or "viewer"
    "remove": false
  }
  ```

#### Fetch Version History Checkpoints
- **URL**: `/api/documents/:id/history`
- **Method**: `GET`

#### Rollback Document Content
- **URL**: `/api/documents/:id/rollback`
- **Method**: `POST`
- **Body**: `{ "versionId": "..." }`

---

## Socket.IO Events

| Event Name | Sender | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-document` | Client | `{ documentId, user }` | Joins the room room channel. |
| `leave-document` | Client | `{ documentId, userId }` | Gracefully unsubscribes from the channel. |
| `user-list` | Server | `[ onlineUsers ]` | Emitted to a user upon entering a room. |
| `user-online` | Server | `[ onlineUsers ]` | Broadcasts to the room that a user entered. |
| `user-offline` | Server | `[ onlineUsers ]` | Broadcasts to the room that a user disconnected. |
| `send-changes` | Client | `{ documentId, content, selectionStart, selectionEnd, user }` | Sends edit events. |
| `receive-changes`| Server | `{ content, selectionStart, selectionEnd, user }` | Delivers edits to other collaborators. |
| `save-document` | Client | `{ documentId, content }` | Triggers auto-save in MongoDB. |
| `typing` | Client | `{ documentId, user }` | Shows other users typing indicator. |
| `stop-typing` | Client | `{ documentId, user }` | Clears typing indicator status. |

---

## Installation & Local Setup

### Prerequisites
- Node.js installed (v16+)
- Local MongoDB instance running or a MongoDB Atlas URI

### Step 1: Install Dependencies
Clone the repository, navigate to the folder, and install packages:
```bash
npm install
```
This triggers the postinstall routine to load packages inside `server/` and `client/`.

### Step 2: Configure Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri_here
JWT_SECRET=any_fallback_secret_code
CLIENT_URL=http://localhost:5173
```

### Step 3: Run the Application
Start the frontend and backend servers concurrently:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Troubleshooting Guide

- **MongoDB connection timeout error**: Ensure MongoDB is running locally or check if your MongoDB Atlas IP Whitelist allows access from your current network.
- **Port already in use**: If port 5000 or 5173 is occupied, run `npx kill-port 5000` or change configuration parameters in `server/.env` and `client/vite.config.js`.
- **WS handshake failures**: Ensure `CLIENT_URL` matches the frontend server URL (e.g., matching trailing slashes or subdomains).

---

## Deployment Guide

### Database (MongoDB Atlas)
1. Register on MongoDB Atlas and set up a free Shared Cluster.
2. In Network Access, whitelist `0.0.0.0/32` (anywhere).
3. Create a database user and copy the Connection String URI.

### Backend (Render)
1. Set up a Web Service on Render linked to your repository.
2. Build command: `npm install` inside server directory.
3. Start command: `node server.js` inside server directory.
4. Set Environment Variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (points to Vercel).

### Frontend (Vercel)
1. Deploy your frontend project linked to the client folder.
2. Configure proxy endpoints or modify Axios baseURL in production environments.
