"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentServiceFactory = exports.TossPayService = exports.KakaoPayService = void 0;
exports.createTossPayment = createTossPayment;
exports.confirmTossPayment = confirmTossPayment;
exports.createKakaoPayment = createKakaoPayment;
exports.confirmKakaoPayment = confirmKakaoPayment;
exports.createNaverPayment = createNaverPayment;
exports.confirmNaverPayment = confirmNaverPayment;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class KakaoPayService {
    constructor() {
        this.baseUrl = process.env.KAKAO_PAY_API_URL || 'https://kapi.kakao.com';
        this.cid = process.env.KAKAO_PAY_CID || '';
        this.secretKey = process.env.KAKAO_PAY_SECRET_KEY || '';
    }
    async requestPayment(request) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/payment/ready`, {
                cid: this.cid,
                partner_order_id: request.orderId,
                partner_user_id: request.customerEmail || 'guest',
                item_name: request.orderName,
                quantity: 1,
                total_amount: request.amount,
                tax_free_amount: 0,
                approval_url: request.successUrl,
                cancel_url: request.cancelUrl,
                fail_url: request.failUrl
            }, {
                headers: {
                    'Authorization': `KakaoAK ${this.secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            });
            return {
                success: true,
                paymentKey: response.data.tid,
                orderId: request.orderId,
                amount: request.amount,
                approvalUrl: response.data.next_redirect_pc_url
            };
        }
        catch (error) {
            logger_1.logger.error('KakaoPay payment request failed:', error.response?.data || error.message);
            return {
                success: false,
                orderId: request.orderId,
                amount: request.amount,
                failReason: error.response?.data?.msg || error.message
            };
        }
    }
    async approvePayment(tid, pgToken, orderId) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/payment/approve`, {
                cid: this.cid,
                tid: tid,
                partner_order_id: orderId,
                partner_user_id: 'guest',
                pg_token: pgToken
            }, {
                headers: {
                    'Authorization': `KakaoAK ${this.secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('KakaoPay payment approval failed:', error.response?.data || error.message);
            throw error;
        }
    }
}
exports.KakaoPayService = KakaoPayService;
class TossPayService {
    constructor() {
        this.baseUrl = process.env.TOSS_PAY_API_URL || 'https://api.tosspayments.com';
        this.clientKey = process.env.TOSS_PAY_CLIENT_KEY || '';
        this.secretKey = process.env.TOSS_PAY_SECRET_KEY || '';
    }
    async requestPayment(request) {
        try {
            return {
                success: true,
                orderId: request.orderId,
                amount: request.amount,
                approvalUrl: `${this.baseUrl}/v1/payments`
            };
        }
        catch (error) {
            logger_1.logger.error('TossPay payment request failed:', error.message);
            return {
                success: false,
                orderId: request.orderId,
                amount: request.amount,
                failReason: error.message
            };
        }
    }
    async confirmPayment(paymentKey, orderId, amount) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/payments/confirm`, {
                paymentKey,
                orderId,
                amount
            }, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('TossPay payment confirmation failed:', error.response?.data || error.message);
            throw error;
        }
    }
    async cancelPayment(paymentKey, cancelReason) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/payments/${paymentKey}/cancel`, {
                cancelReason
            }, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('TossPay payment cancellation failed:', error.response?.data || error.message);
            throw error;
        }
    }
}
exports.TossPayService = TossPayService;
class PaymentServiceFactory {
    static createService(method) {
        switch (method) {
            case 'KAKAOPAY':
                return new KakaoPayService();
            case 'TOSSPAY':
                return new TossPayService();
            default:
                throw new Error(`Unsupported payment method: ${method}`);
        }
    }
}
exports.PaymentServiceFactory = PaymentServiceFactory;
const index_1 = require("../index");
async function createTossPayment(userId, amount, orderId) {
    const orderIdToUse = orderId || `toss_${Date.now()}_${userId.slice(-6)}`;
    const tossService = new TossPayService();
    const payment = await index_1.prisma.payment.create({
        data: {
            id: orderIdToUse,
            userId,
            amount,
            method: 'CARD',
            status: 'PENDING',
            orderId: orderIdToUse
        }
    });
    return {
        paymentId: payment.id,
        orderId: orderIdToUse,
        amount,
        clientKey: process.env.TOSS_PAY_CLIENT_KEY,
        successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        failUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/fail`
    };
}
async function confirmTossPayment(paymentKey, orderId, amount, userId) {
    const tossService = new TossPayService();
    try {
        const confirmResult = await tossService.confirmPayment(paymentKey, orderId, amount);
        const payment = await index_1.prisma.payment.update({
            where: { id: orderId },
            data: {
                status: 'COMPLETED',
                gatewayId: paymentKey,
                gatewayData: confirmResult,
                paidAt: new Date()
            }
        });
        await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                balance: { increment: amount }
            }
        });
        return { payment, confirmResult };
    }
    catch (error) {
        await index_1.prisma.payment.update({
            where: { id: orderId },
            data: { status: 'FAILED' }
        });
        throw error;
    }
}
async function createKakaoPayment(userId, amount) {
    const orderId = `kakao_${Date.now()}_${userId.slice(-6)}`;
    const kakaoService = new KakaoPayService();
    const paymentRequest = {
        orderId,
        amount,
        orderName: `INSTAUP 포인트 충전 ${amount.toLocaleString()}원`,
        customerName: '사용자',
        customerEmail: 'user@example.com',
        successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/kakao/success`,
        failUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/fail`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`
    };
    const result = await kakaoService.requestPayment(paymentRequest);
    if (result.success) {
        await index_1.prisma.payment.create({
            data: {
                id: orderId,
                userId,
                amount,
                method: 'KAKAOPAY',
                status: 'PENDING',
                orderId,
                gatewayId: result.paymentKey
            }
        });
    }
    return result;
}
async function confirmKakaoPayment(tid, pgToken, userId) {
    const kakaoService = new KakaoPayService();
    try {
        const approveResult = await kakaoService.approvePayment(tid, pgToken, 'orderId');
        const payment = await index_1.prisma.payment.findFirst({
            where: { gatewayId: tid }
        });
        if (!payment) {
            throw new Error('결제 정보를 찾을 수 없습니다.');
        }
        await index_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                gatewayData: approveResult,
                paidAt: new Date()
            }
        });
        await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                balance: { increment: payment.amount }
            }
        });
        return { payment, approveResult };
    }
    catch (error) {
        throw error;
    }
}
async function createNaverPayment(userId, amount) {
    const orderId = `naver_${Date.now()}_${userId.slice(-6)}`;
    const payment = await index_1.prisma.payment.create({
        data: {
            id: orderId,
            userId,
            amount,
            method: 'CARD',
            status: 'PENDING',
            orderId
        }
    });
    return {
        paymentId: payment.id,
        orderId,
        amount,
        approvalUrl: `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(process.env.FRONTEND_URL || 'http://localhost:5173')}/payment/naver/callback&state=${orderId}`,
        message: '네이버페이 결제 준비 완료'
    };
}
async function confirmNaverPayment(orderId, userId) {
    const payment = await index_1.prisma.payment.findUnique({
        where: { id: orderId }
    });
    if (!payment) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
    }
    await index_1.prisma.payment.update({
        where: { id: orderId },
        data: {
            status: 'COMPLETED',
            paidAt: new Date()
        }
    });
    await index_1.prisma.user.update({
        where: { id: userId },
        data: {
            balance: { increment: payment.amount }
        }
    });
    return { payment };
}
