# Product Requirements Document (PRD)

## Simple Chat System

### 🎯 Objective
Build a real-time chat application with:
- Personal messaging
- Group chat creation and management
- File attachment support with preview

### 🔧 Tech Stack
- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Sockets:** Socket.IO (for real-time communication)
- **File Storage:** AWS S3 / Cloudinary / Local storage (for attachments)
- **Dev Environment:** Cursor

### 📚 Features & Requirements

#### 1. 🧍‍♂️ Individual (Personal) Chat
- Users can search and initiate 1:1 chat with other users.
- Chat history is persisted in MongoDB.
- Messages appear in real-time via WebSocket.

#### 2. 👨‍👩‍👧 Group Chat
- Users can create named chat groups.
- Group chat supports multiple members.
- Only group members can view and send messages.

#### 3. 📩 Join / Invite to Group
- User can invite others to join a group.
- Join requests can be accepted or rejected.
- Optionally, generate a group invite link.

#### 4. 📎 Attachments Support
- Users can send:
  - Images (.jpg, .png)
  - PDFs
  - Videos (.mp4)
- Backend stores file metadata and file URL.
- Limit file size (e.g., 10MB max per file).

#### 5. 🖼️ Attachment Preview
- **Images:** inline preview in chat bubble.
- **PDFs:** display name + icon; click to view.
- **Videos:** embedded video player.
- Thumbnails and previews shown based on MIME type.

### 🗂️ MongoDB Schema Overview

#### Users
```js
{
  _id,
  username,
  email,
  passwordHash,
  profileImage,
  joinedGroups: [groupIds]
}
```

#### Messages
```js
{
  _id,
  senderId,
  receiverId, // null for group
  groupId,    // null for 1:1
  content,
  type: "text" | "image" | "pdf" | "video",
  fileUrl,
  timestamp
}
```

#### Groups
```js
{
  _id,
  name,
  createdBy,
  members: [userIds],
  invites: [userIds],
  createdAt
}
```

### 🔁 Real-Time Flow with Socket.IO
- `socket.emit("join", userId)`
- `socket.emit("message", { toUser/group, content })`
- `socket.on("message", handler)` → render in UI

### 📋 Milestones

| Milestone | Feature                   | Target Time |
|-----------|---------------------------|-------------|
| M1        | User registration/login   | Day 1       |
| M2        | 1:1 chat with text        | Day 2       |
| M3        | Group creation/invite     | Day 3       |
| M4        | Attachments sending       | Day 4       |
| M5        | Attachment preview + polish | Day 5     |

### 🧪 Testing
- Manual testing in development
- Simulate chat with multiple users
- Validate file uploads, previews
- Check edge cases: large files, invalid types, etc.
