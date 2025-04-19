import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import routes from './routes';
import earlyBirdRoutes from './routes/earlyBird';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';

dotenv.config();

const app = express();
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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/early-bird', earlyBirdRoutes);

// Health check route
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the API' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize app
setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}); 