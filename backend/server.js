const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { startScheduler, stopScheduler } = require('./services/schedulerService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const listRoutes = require('./routes/listRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW() AS current_time');
    res.status(200).json({
      status: 'healthy',
      service: 'Task Management System Backend',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbTest.rows[0].current_time
    });
  } catch (error) {
    res.status(200).json({
      status: 'degraded',
      service: 'Task Management System Backend',
      timestamp: new Date().toISOString(),
      database: 'unreachable',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start background recurring task scheduler
startScheduler(60000); // scans every 60 seconds

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Task Management API Server running`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});

// Graceful Shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  stopScheduler();
  server.close(() => {
    console.log('HTTP server closed.');
    db.pool.end(() => {
      console.log('Database pool closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
