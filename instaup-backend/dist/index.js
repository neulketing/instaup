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
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const service_1 = __importDefault(require("./routes/service"));
const order_1 = __importDefault(require("./routes/order"));
const payment_1 = __importDefault(require("./routes/payment"));
const admin_1 = __importDefault(require("./routes/admin"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const referral_1 = __importDefault(require("./routes/referral"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
exports.prisma = new client_1.PrismaClient();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "https://delicate-profiterole-bbf92a.netlify.app",
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimiter_1.rateLimiter);
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/services', service_1.default);
app.use('/api/order', order_1.default);
app.use('/api/payment', payment_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/referral', referral_1.default);
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        await exports.prisma.$connect();
        console.log('✅ Database connected successfully');
        const server = await (async () => {
            const httpServer = require('http').createServer(app);
            const { Server } = require('socket.io');
            const { initializeSocket } = require('./services/socketService');
            const io = new Server(httpServer, { cors: { origin: process.env.CORS_ORIGIN, credentials: true } });
            initializeSocket(io);
            httpServer.listen(PORT, () => {
                console.log(`🚀 INSTAUP Backend Server with WebSocket running on port ${PORT}`);
            });
            return httpServer;
        })();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
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
