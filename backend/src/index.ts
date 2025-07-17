import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import archiveRoutes from './routes/archive';
import { createSchedulerRoutes } from './routes/scheduler';
import { SchedulerService } from './services/SchedulerService';
import { SchedulerController } from './controllers/SchedulerController';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize Scheduler Service
const schedulerService = new SchedulerService();
const schedulerController = new SchedulerController(schedulerService);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for archived content
  crossOriginEmbedderPolicy: false
}));
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000',
  /^https:\/\/.*\.vercel\.app$/,  // Allow all Vercel domains
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/archives', archiveRoutes);
app.use('/api/scheduler', createSchedulerRoutes(schedulerController));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      scheduler: schedulerService.getActiveJobsCount() + ' jobs active'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Initialize scheduler
    await schedulerService.initializeScheduler();
    
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`⏰ Scheduler active with ${schedulerService.getActiveJobsCount()} jobs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  schedulerService.shutdown();
  await prisma.$disconnect();
  process.exit(0);
});

startServer(); 