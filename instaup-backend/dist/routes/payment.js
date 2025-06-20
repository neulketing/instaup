"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const topupService_1 = require("../services/topupService");
const paymentService_1 = require("../services/paymentService");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post('/topup', async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: '올바른 충전 금액을 입력해주세요.'
            });
        }
        const result = await (0, topupService_1.topUpBalance)(userId, amount);
        res.json({
            success: true,
            data: result,
            message: `${amount}원이 충전되었습니다.`
        });
    }
    catch (error) {
        console.error('TopUp error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/toss/create', async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        const userId = req.user.id;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: '올바른 결제 금액을 입력해주세요.'
            });
        }
        const result = await (0, paymentService_1.createTossPayment)(userId, amount, orderId);
        res.json({
            success: true,
            data: result,
            message: '토스페이먼츠 결제가 생성되었습니다.'
        });
    }
    catch (error) {
        console.error('Toss payment create error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '결제 생성 중 오류가 발생했습니다.'
        });
    }
});
router.post('/toss/confirm', async (req, res) => {
    try {
        const { paymentKey, orderId, amount } = req.body;
        const userId = req.user.id;
        const result = await (0, paymentService_1.confirmTossPayment)(paymentKey, orderId, amount, userId);
        res.json({
            success: true,
            data: result,
            message: '결제가 성공적으로 완료되었습니다.'
        });
    }
    catch (error) {
        console.error('Toss payment confirm error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '결제 확인 중 오류가 발생했습니다.'
        });
    }
});
router.post('/kakao/ready', async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: '올바른 결제 금액을 입력해주세요.'
            });
        }
        const result = await (0, paymentService_1.createKakaoPayment)(userId, amount);
        res.json({
            success: true,
            data: result,
            message: '카카오페이 결제가 준비되었습니다.'
        });
    }
    catch (error) {
        console.error('KakaoPay ready error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '카카오페이 결제 준비 중 오류가 발생했습니다.'
        });
    }
});
router.post('/kakao/approve', async (req, res) => {
    try {
        const { tid, pgToken } = req.body;
        const userId = req.user.id;
        const result = await (0, paymentService_1.confirmKakaoPayment)(tid, pgToken, userId);
        res.json({
            success: true,
            data: result,
            message: '카카오페이 결제가 완료되었습니다.'
        });
    }
    catch (error) {
        console.error('KakaoPay approve error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '카카오페이 결제 승인 중 오류가 발생했습니다.'
        });
    }
});
router.post('/naver/create', async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: '올바른 결제 금액을 입력해주세요.'
            });
        }
        const result = await (0, paymentService_1.createNaverPayment)(userId, amount);
        res.json({
            success: true,
            data: result,
            message: '네이버페이 결제가 생성되었습니다.'
        });
    }
    catch (error) {
        console.error('NaverPay create error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '네이버페이 결제 생성 중 오류가 발생했습니다.'
        });
    }
});
router.post('/bank-transfer', async (req, res) => {
    try {
        const { amount, bankInfo, depositorName } = req.body;
        const userId = req.user.id;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: '올바른 입금 금액을 입력해주세요.'
            });
        }
        if (!depositorName) {
            return res.status(400).json({
                success: false,
                error: '입금자명을 입력해주세요.'
            });
        }
        const paymentId = `bank_${Date.now()}_${userId.slice(-6)}`;
        const bankTransferInfo = {
            paymentId,
            userId,
            amount,
            method: 'BANK_TRANSFER',
            status: 'PENDING',
            bankInfo: {
                accountNumber: '카카오뱅크 3333-1234567',
                accountHolder: 'INSTAUP',
                depositorName
            },
            createdAt: new Date().toISOString()
        };
        res.json({
            success: true,
            data: bankTransferInfo,
            message: '무통장 입금 정보가 생성되었습니다. 입금 후 확인까지 최대 10분 소요됩니다.'
        });
    }
    catch (error) {
        console.error('Bank transfer error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '무통장 입금 처리 중 오류가 발생했습니다.'
        });
    }
});
router.post('/toss/confirm', async (req, res) => {
    try {
        res.json({
            success: true,
            message: '토스페이 결제 API (준비중)'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
