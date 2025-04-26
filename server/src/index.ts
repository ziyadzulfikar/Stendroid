import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import authRoutes from './routes/auth';
import routes from './routes';
import earlyBirdRoutes from './routes/earlyBird';
import adminAPIRoutes from './routes/admin';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import initSocketServer from './config/socketServer';
import requestLogger from './middlewares/requestLogger';
import { cleanupOldLogs } from './utils/cleanLogs';
import logger from './config/logger';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5001;
const prisma = new PrismaClient();

// Run database setup
const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // Check database connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Create tables if they don't exist (development only approach)
    console.log('Pushing schema to database...');
    exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
      if (error) {
        console.error(`Schema push error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Schema push stderr: ${stderr}`);
        return;
      }
      console.log(`Schema push output: ${stdout}`);
    });
  } catch (error) {
    console.error('Database setup error:', error);
  }
};

// Clean up old log files
cleanupOldLogs();

// Middleware
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Get frontend URL from environment variable
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Support multiple origins via comma-separated list in CORS_ALLOWED_ORIGINS
    const additionalOrigins = process.env.CORS_ALLOWED_ORIGINS 
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];
    
    const allowedOrigins = [frontendUrl, ...additionalOrigins];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/early-bird', earlyBirdRoutes);
app.use('/api/admin', adminAPIRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Client app fallback (redirect to client app for all other routes)
app.get('*', (_req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  
  // API error response
  res.status(500).json({ 
    status: 500,
    message: 'Something went wrong!'
  });
});

// Initialize app
setupDatabase().then(() => {
  // Initialize Socket.IO
  initSocketServer(server);
  
  // Start the server
  server.listen(port, () => {
    logger.info(`HTTP Server is running on http://localhost:${port}`);
    logger.info(`WebSocket Server is running on ws://localhost:${port}`);
    logger.info(`API Server ready to serve client-side application`);
  });
}); 