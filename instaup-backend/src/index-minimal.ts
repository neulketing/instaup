import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'

const app = express()

// Initialize Prisma
export const prisma = new PrismaClient()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || "https://same-4001w3tt33q-latest.netlify.app",
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

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
      phase: 'skeleton'
    })
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: 'Database connection failed'
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

app.get('/', (req, res) => {
  res.json({
    message: 'Instaup Backend API - Phase 1 Skeleton',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      version: '/version'
    }
  })
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// Start server
const PORT = Number(process.env.PORT) || 3000

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Instaup Backend Server (Phase 1) running on port ${PORT}`)
      console.log(`📍 Health Check: http://0.0.0.0:${PORT}/health`)
      console.log(`📍 Version: http://0.0.0.0:${PORT}/version`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
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
