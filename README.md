# SimpleChat - Real-time Chat Application

A modern real-time chat application built with React, Node.js, Socket.IO, and MongoDB.

## Features

- 🔐 User authentication (JWT)
- 💬 Real-time 1:1 messaging
- 👥 Group chat functionality
- 📎 File attachments (images, PDFs, videos)
- 👁️ Online/offline status
- ✅ Message delivery indicators
- 📱 Responsive design

## Tech Stack

### Frontend
- React with TypeScript
- Vite
- Socket.IO Client
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js & Express
- Socket.IO
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/iraviteja/simple-chat.git
cd simple-chat
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
yarn install
```

### Configuration

1. Create a `.env` file in the backend directory:
```env
PORT=5005
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
yarn dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
simple-chat/
├── backend/
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── socket/         # Socket.IO handlers
│   ├── uploads/        # File uploads directory
│   └── server.js       # Express server
└── frontend/
    ├── src/
    │   ├── components/ # React components
    │   ├── contexts/   # React contexts
    │   ├── pages/      # Page components
    │   ├── services/   # API services
    │   ├── styles/     # CSS files
    │   └── types/      # TypeScript types
    └── package.json
```

## License

MIT