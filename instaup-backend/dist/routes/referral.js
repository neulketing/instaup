"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOrderCommissions = processOrderCommissions;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const index_1 = require("../index");
const router = (0, express_1.Router)();
function generateUniqueReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'INSTA';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function calculateCommission(orderAmount, level) {
    const rates = {
        1: 0.05,
        2: 0.03,
        3: 0.02
    };
    return Math.floor(orderAmount * (rates[level] || 0));
}
async function findReferralChain(userId) {
    const chain = [];
    let currentUserId = userId;
    for (let level = 1; level <= 3; level++) {
        const referral = await index_1.prisma.referral.findFirst({
            where: { referredId: currentUserId },
            select: { referrerId: true }
        });
        if (!referral)
            break;
        chain.push({ level, referrerId: referral.referrerId });
        currentUserId = referral.referrerId;
    }
    return chain;
}
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        let stats = await index_1.prisma.referralStats.findUnique({
            where: { userId }
        });
        if (!stats) {
            stats = await index_1.prisma.referralStats.create({
                data: { userId }
            });
        }
        const directReferrals = await index_1.prisma.referral.count({
            where: { referrerId: userId, level: 1 }
        });
        const activeReferrals = await index_1.prisma.referral.count({
            where: {
                referrerId: userId,
                level: 1,
                status: 'ACTIVE'
            }
        });
        const level2Referrals = await index_1.prisma.referral.count({
            where: { referrerId: userId, level: 2 }
        });
        const level3Referrals = await index_1.prisma.referral.count({
            where: { referrerId: userId, level: 3 }
        });
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);
        const thisMonthCommissions = await index_1.prisma.referralCommission.aggregate({
            where: {
                referral: { referrerId: userId },
                status: 'PAID',
                paidAt: { gte: thisMonthStart }
            },
            _sum: { amount: true }
        });
        const pendingCommissions = await index_1.prisma.referralCommission.aggregate({
            where: {
                referral: { referrerId: userId },
                status: 'PENDING'
            },
            _sum: { amount: true }
        });
        const totalCommissions = await index_1.prisma.referralCommission.aggregate({
            where: {
                referral: { referrerId: userId },
                status: 'PAID'
            },
            _sum: { amount: true }
        });
        const updatedStats = await index_1.prisma.referralStats.update({
            where: { userId },
            data: {
                directReferrals,
                activeReferrals,
                level2Referrals,
                level3Referrals,
                totalCommission: totalCommissions._sum.amount || 0,
                thisMonthCommission: thisMonthCommissions._sum.amount || 0,
                pendingCommission: pendingCommissions._sum.amount || 0
            }
        });
        res.json({
            success: true,
            data: updatedStats
        });
    }
    catch (error) {
        console.error('Get referral stats error:', error);
        res.status(500).json({
            success: false,
            error: '통계 조회 중 오류가 발생했습니다.'
        });
    }
});
router.get('/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const referrals = await index_1.prisma.referral.findMany({
            where: { referrerId: userId },
            include: {
                referred: {
                    select: {
                        id: true,
                        email: true,
                        nickname: true,
                        createdAt: true
                    }
                },
                commissions: {
                    include: {
                        order: {
                            select: {
                                id: true,
                                finalPrice: true,
                                createdAt: true,
                                service: {
                                    select: { name: true, platform: true }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
        const total = await index_1.prisma.referral.count({
            where: { referrerId: userId }
        });
        res.json({
            success: true,
            data: {
                referrals,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get referral history error:', error);
        res.status(500).json({
            success: false,
            error: '추천 내역 조회 중 오류가 발생했습니다.'
        });
    }
});
router.get('/commissions', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const whereClause = {
            referral: { referrerId: userId }
        };
        if (status && ['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
            whereClause.status = status;
        }
        const commissions = await index_1.prisma.referralCommission.findMany({
            where: whereClause,
            include: {
                referral: {
                    include: {
                        referred: {
                            select: { nickname: true }
                        }
                    }
                },
                order: {
                    select: {
                        id: true,
                        finalPrice: true,
                        service: {
                            select: { name: true, platform: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
        const total = await index_1.prisma.referralCommission.count({
            where: whereClause
        });
        res.json({
            success: true,
            data: {
                commissions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get commissions error:', error);
        res.status(500).json({
            success: false,
            error: '커미션 내역 조회 중 오류가 발생했습니다.'
        });
    }
});
router.post('/claim', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { commissionIds } = req.body;
        if (!commissionIds || !Array.isArray(commissionIds)) {
            return res.status(400).json({
                success: false,
                error: '유효한 커미션 ID가 필요합니다.'
            });
        }
        const result = await index_1.prisma.$transaction(async (tx) => {
            const commissions = await tx.referralCommission.findMany({
                where: {
                    id: { in: commissionIds },
                    referral: { referrerId: userId },
                    status: 'PENDING'
                }
            });
            if (commissions.length === 0) {
                throw new Error('지급 가능한 커미션이 없습니다.');
            }
            const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
            await tx.user.update({
                where: { id: userId },
                data: {
                    balance: { increment: totalAmount }
                }
            });
            await tx.referralCommission.updateMany({
                where: {
                    id: { in: commissionIds }
                },
                data: {
                    status: 'PAID',
                    paidAt: new Date()
                }
            });
            return { totalAmount, count: commissions.length };
        });
        res.json({
            success: true,
            data: {
                message: '커미션이 성공적으로 지급되었습니다.',
                totalAmount: result.totalAmount,
                count: result.count
            }
        });
    }
    catch (error) {
        console.error('Claim commissions error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '커미션 지급 중 오류가 발생했습니다.'
        });
    }
});
router.get('/code', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다.'
            });
        }
        const referralLink = `${process.env.FRONTEND_URL || 'https://instaup.co.kr'}/signup?ref=${user.referralCode}`;
        res.json({
            success: true,
            data: {
                referralCode: user.referralCode,
                referralLink
            }
        });
    }
    catch (error) {
        console.error('Get referral code error:', error);
        res.status(500).json({
            success: false,
            error: '추천인 코드 조회 중 오류가 발생했습니다.'
        });
    }
});
async function processOrderCommissions(orderId) {
    try {
        const order = await index_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true }
        });
        if (!order)
            return;
        const referralChain = await findReferralChain(order.userId);
        if (referralChain.length === 0)
            return;
        for (const { level, referrerId } of referralChain) {
            const referral = await index_1.prisma.referral.findFirst({
                where: {
                    referrerId,
                    referredId: level === 1 ? order.userId : referralChain[level - 2]?.referrerId
                }
            });
            if (!referral)
                continue;
            const commissionAmount = calculateCommission(order.finalPrice, level);
            if (commissionAmount > 0) {
                await index_1.prisma.referralCommission.create({
                    data: {
                        referralId: referral.id,
                        orderId: order.id,
                        amount: commissionAmount,
                        rate: level === 1 ? 0.05 : level === 2 ? 0.03 : 0.02,
                        type: level === 1 ? 'ORDER_COMMISSION' :
                            level === 2 ? 'LEVEL2_COMMISSION' : 'LEVEL3_COMMISSION'
                    }
                });
                if (level === 1 && !referral.isFirstOrderRewarded) {
                    await index_1.prisma.referralCommission.create({
                        data: {
                            referralId: referral.id,
                            orderId: order.id,
                            amount: referral.firstOrderBonus,
                            rate: 0,
                            type: 'FIRST_ORDER_BONUS'
                        }
                    });
                    await index_1.prisma.referral.update({
                        where: { id: referral.id },
                        data: {
                            isFirstOrderRewarded: true,
                            firstOrderRewardedAt: new Date(),
                            status: 'ACTIVE'
                        }
                    });
                }
            }
        }
    }
    catch (error) {
        console.error('Process order commissions error:', error);
    }
}
exports.default = router;
