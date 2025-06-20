"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: '인증 토큰이 필요합니다.'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await index_1.prisma.user.findUnique({
            where: { id: decoded.userId, isActive: true },
            select: {
                id: true,
                email: true,
                nickname: true,
                balance: true,
                totalSpent: true,
                referralCode: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '유효하지 않은 토큰입니다.'
            });
        }
        ;
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            error: '인증에 실패했습니다.'
        });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '인증이 필요합니다.'
            });
        }
        if (user.email !== 'neulketing@gmail.com') {
            return res.status(403).json({
                success: false,
                error: '관리자 권한이 필요합니다.'
            });
        }
        next();
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        res.status(403).json({
            success: false,
            error: '권한 확인 중 오류가 발생했습니다.'
        });
    }
};
exports.adminMiddleware = adminMiddleware;
