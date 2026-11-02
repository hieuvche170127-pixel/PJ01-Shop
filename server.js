const dotenv = require("dotenv");
dotenv.config(); // Move dotenv.config() to top before any local modules load

const express = require("express");
const { connect } = require("mongoose");
const router = require("./src/routers/index.js");
const cors = require("cors");
const { initScheduler } = require("./src/config/scheduler");
const http = require("http");
const { initSocketServer } = require("./src/services/socketService");

const app = express();

app.use(require('./src/config/corsPolicy').middleware);
app.use(express.json());

app.use(require('./src/middleware/requestLogger'));

const PORT = process.env.PORT || 9999;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopii';

// Improve MongoDB connection with error handling
console.log('Connecting to MongoDB...');
connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use("/api", router);

// Fallback route for handling payment redirects
app.get('/', (req, res) => {
  const { paymentStatus } = req.query;
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  if (paymentStatus) {
    // Redirect to frontend with payment status
    return res.redirect(`${frontendUrl}?paymentStatus=${paymentStatus}`);
  }
  
  // Default redirect to frontend
  res.redirect(frontendUrl);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  require('./src/utils/logger').error('Unhandled request error', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal Server Error' : err.message
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Store io instance on app for potential use in request handlers
app.set('io', io);

// Listen on server (not app)
server.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
  console.log(`WebSocket server is running`);
  
  // Initialize schedulers after server starts
  initScheduler();
});
