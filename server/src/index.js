import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerUser, loginUser, createGuestUser } from './auth.js';
import { roomManager } from './roomManager.js';
import { setupSocketHandler } from './socketHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for Chrome Extension & Web Client
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Socket.io Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

setupSocketHandler(io);

// -----------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Moviesparty Sync Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// User Registration
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    const result = registerUser(email, password, name);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// User Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = loginUser(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// Guest Auth Endpoint
app.post('/api/auth/guest', (req, res) => {
  try {
    const { name } = req.body;
    const result = createGuestUser(name);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Query Room Public Info
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const snapshot = roomManager.getRoomSnapshot(roomId);
  if (!snapshot) {
    return res.status(404).json({ success: false, error: 'Room not found' });
  }
  res.json({ success: true, room: snapshot });
});

// Start Server
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Moviesparty Backend Server listening on http://localhost:${PORT}`);
  });
}

export { app, server, io };
