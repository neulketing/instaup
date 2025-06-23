import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'

// Routes
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import serviceRoutes from './routes/service'
import orderRoutes from './routes/order'
import paymentRoutes from './routes/payment'
import adminRoutes from './routes/admin.routes'
import analyticsRoutes from './routes/analytics'
import referralRoutes from './routes/referral'

// Middleware
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'

const app = express()

// Initialize Prisma
export const prisma = new PrismaClient()

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://instaup.kr",
    "https://instaup-clean.netlify.app",
    "https://delicate-profiterole-bbf92a.netlify.app",
    process.env.CORS_ORIGIN || "https://same-4001w3tt33q-latest.netlify.app"
  ].filter(Boolean),
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/referral', referralRoutes)

// Test API route (임시)
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API 라우트 테스트 성공',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  })
})

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      version: '1.0.0',
      phase: 'production-ready',
      port: process.env.PORT || 3000,
      cors_origins: [
        "https://instaup.kr",
        "https://instaup-clean.netlify.app",
        process.env.CORS_ORIGIN
      ].filter(Boolean),
      railway_deployment: process.env.RAILWAY_GIT_COMMIT_SHA ? 'active' : 'local'
    })
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: 'Database connection failed',
      error_details: error.message,
      env_check: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        PORT: process.env.PORT || 'DEFAULT:3000',
        NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
      }
    })
  }
})

app.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    phase: 'skeleton',
    build: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
    timestamp: new Date().toISOString(),
    node_version: process.version
  })
})

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    // Connect to database with retry logic
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      try {
        await prisma.$connect()
        console.log('✅ Database connected successfully')
        break;
      } catch (dbError) {
        retryCount++;
        console.log(`❌ Database connection attempt ${retryCount}/${maxRetries} failed:`, dbError);
        if (retryCount === maxRetries) {
          throw dbError;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }

    // Create HTTP server with Socket.io
    const httpServer = require('http').createServer(app)

    // Initialize Socket.io with more permissive CORS for Railway
    const { Server } = require('socket.io')
    const { initializeSocket } = require('./services/socketService')
    const io = new Server(httpServer, {
      cors: {
        origin: [
          "https://instaup.kr",
          "https://instaup-clean.netlify.app",
          "http://localhost:5173",
          process.env.CORS_ORIGIN
        ].filter(Boolean),
        credentials: true
      }
    })

    initializeSocket(io)

    // Start server on 0.0.0.0 for Railway compatibility
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 INSTAUP Backend Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'No DATABASE_URL'}`)
      console.log(`🌐 CORS Origins: ${JSON.stringify([
        "https://instaup.kr",
        "https://instaup-clean.netlify.app",
        process.env.CORS_ORIGIN
      ].filter(Boolean))}`)
    })

    return httpServer
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'NOT_SET'
      }
    })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()
