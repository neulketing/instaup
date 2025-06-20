"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
function generateUniqueReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'INSTA';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
const register = async (req, res) => {
    try {
        const { email, password, nickname, referralCode: inputReferralCode } = req.body;
        const existingUser = await index_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: '이미 등록된 이메일입니다.'
            });
        }
        let referrer = null;
        if (inputReferralCode) {
            referrer = await index_1.prisma.user.findUnique({
                where: { referralCode: inputReferralCode }
            });
            if (!referrer) {
                return res.status(400).json({
                    success: false,
                    error: '유효하지 않은 추천인 코드입니다.'
                });
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        let newReferralCode;
        do {
            newReferralCode = generateUniqueReferralCode();
        } while (await index_1.prisma.user.findUnique({ where: { referralCode: newReferralCode } }));
        const result = await index_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    nickname,
                    referralCode: newReferralCode,
                    referredBy: referrer?.id || null,
                    balance: 10000
                },
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
            if (referrer) {
                await tx.referral.create({
                    data: {
                        referrerId: referrer.id,
                        referredId: user.id,
                        level: 1,
                        status: 'PENDING'
                    }
                });
                await tx.user.update({
                    where: { id: referrer.id },
                    data: {
                        balance: { increment: 10000 }
                    }
                });
                const referralRecord = await tx.referral.findFirst({
                    where: {
                        referrerId: referrer.id,
                        referredId: user.id
                    }
                });
                if (referralRecord) {
                    await tx.referralCommission.create({
                        data: {
                            referralId: referralRecord.id,
                            orderId: user.id,
                            amount: 10000,
                            rate: 0,
                            type: 'SIGNUP_BONUS',
                            status: 'PAID',
                            paidAt: new Date()
                        }
                    });
                    await tx.referral.update({
                        where: { id: referralRecord.id },
                        data: {
                            isSignupRewarded: true,
                            signupRewardedAt: new Date()
                        }
                    });
                }
                const referrerReferral = await tx.referral.findFirst({
                    where: { referredId: referrer.id }
                });
                if (referrerReferral) {
                    await tx.referral.create({
                        data: {
                            referrerId: referrerReferral.referrerId,
                            referredId: user.id,
                            level: 2,
                            status: 'PENDING'
                        }
                    });
                    const level2ReferrerReferral = await tx.referral.findFirst({
                        where: { referredId: referrerReferral.referrerId }
                    });
                    if (level2ReferrerReferral) {
                        await tx.referral.create({
                            data: {
                                referrerId: level2ReferrerReferral.referrerId,
                                referredId: user.id,
                                level: 3,
                                status: 'PENDING'
                            }
                        });
                    }
                }
            }
            await tx.referralStats.create({
                data: {
                    userId: user.id
                }
            });
            return user;
        });
        const token = jsonwebtoken_1.default.sign({ userId: result.id, email: result.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: result.id, email: result.email, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            success: true,
            data: { user: result, token, refreshToken },
            message: referrer
                ? '회원가입이 완료되었습니다. 추천인 보너스가 지급되었습니다!'
                : '회원가입이 완료되었습니다.'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: '회원가입 중 오류가 발생했습니다.'
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await index_1.prisma.user.findUnique({
            where: { email, isActive: true }
        });
        if (!user || !await bcryptjs_1.default.compare(password, user.password)) {
            return res.status(401).json({
                success: false,
                error: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: { user: userWithoutPassword, token, refreshToken },
            message: '로그인 성공'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: '로그인 중 오류가 발생했습니다.'
        });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
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
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: '프로필 조회 중 오류가 발생했습니다.'
        });
    }
};
exports.getProfile = getProfile;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: '리프레시 토큰이 필요합니다.'
            });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET);
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
                    error: '유효하지 않은 리프레시 토큰입니다.'
                });
            }
            const newAccessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
            const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.json({
                success: true,
                data: {
                    user,
                    token: newAccessToken,
                    refreshToken: newRefreshToken
                },
                message: '토큰이 갱신되었습니다.'
            });
        }
        catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: '만료되거나 유효하지 않은 리프레시 토큰입니다.'
            });
        }
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            error: '토큰 갱신 중 오류가 발생했습니다.'
        });
    }
};
exports.refreshToken = refreshToken;
