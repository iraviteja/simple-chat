# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SimpleChat is a real-time chat application with personal messaging, group chat functionality, and file attachment support. Built with React (frontend) and Node.js/Express (backend) using Socket.IO for real-time communication.

## Development Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm start           # Run production server
npm run dev         # Run with nodemon (install nodemon first)
```

### Frontend
```bash
cd frontend
yarn install        # Install dependencies
yarn dev           # Run development server
yarn build         # Build for production
```

## Architecture

### Backend Structure
- `server.js` - Main Express server with Socket.IO integration
- `models/` - MongoDB schemas (User, Message, Group)
- `routes/` - API endpoints (auth, users, messages, groups)
- `middleware/` - Authentication middleware
- `socket/` - Socket.IO event handlers
- `uploads/` - File storage directory

### Frontend Structure
- `src/pages/` - Main page components (Login, Register, Chat)
- `src/components/` - Reusable UI components
- `src/contexts/` - React contexts (Auth, Socket)
- `src/services/` - API service layer
- `src/types/` - TypeScript type definitions

### Key Features
1. JWT-based authentication
2. Real-time messaging via Socket.IO
3. File uploads (images, PDFs, videos) with preview
4. Group chat creation and management
5. Online/offline status tracking
6. Message read receipts

### Database
MongoDB with collections for users, messages, and groups. Indexes on message queries for performance.

### Environment Variables
Backend requires `.env` file with:
- PORT
- MONGODB_URI
- JWT_SECRET