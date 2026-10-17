const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const initializeSockets = require('./sockets/socketHandler');
const { isCloudinaryConfigured } = require('./config/cloudinary');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local static file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach socket instance to express app for access in controllers
app.set('socketio', io);

// Initialize Socket events and rooms
initializeSockets(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    storage: {
      provider: isCloudinaryConfigured() ? 'cloudinary' : 'local_disk',
      cloudinaryConfigured: isCloudinaryConfigured(),
    },
  });
});

// API Routes
app.use('/api/v1', require('./routes/upload.routes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📦 Storage Provider: ${
      isCloudinaryConfigured() ? 'Cloudinary (Connected)' : 'Local Disk (uploads/)'
    }`
  );
});
