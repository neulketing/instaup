"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
// Initialize Prisma
exports.prisma = new client_1.PrismaClient();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "https://same-4001w3tt33q-latest.netlify.app",
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoints
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        await exports.prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: 'connected',
            version: '1.0.0',
            phase: 'skeleton'
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: 'disconnected',
            error: 'Database connection failed'
        });
    }
});
app.get('/version', (req, res) => {
    res.json({
        version: '1.0.0',
        phase: 'skeleton',
        build: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
        timestamp: new Date().toISOString(),
        node_version: process.version
    });
});
app.get('/', (req, res) => {
    res.json({
        message: 'Instaup Backend API - Phase 1 Skeleton',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            version: '/version'
        }
    });
});
// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
// Start server
const PORT = Number(process.env.PORT) || 3000;
async function startServer() {
    try {
        // Connect to database
        await exports.prisma.$connect();
        console.log('✅ Database connected successfully');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Instaup Backend Server (Phase 1) running on port ${PORT}`);
            console.log(`📍 Health Check: http://0.0.0.0:${PORT}/health`);
            console.log(`📍 Version: http://0.0.0.0:${PORT}/version`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await exports.prisma.$disconnect();
    process.exit(0);
});
startServer();
