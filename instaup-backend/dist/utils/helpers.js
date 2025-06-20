"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = exports.sleep = exports.isValidKoreanPhone = exports.sanitizeInput = exports.calculateBulkDiscount = exports.generateOrderId = exports.formatKoreanCurrency = exports.validateUrl = exports.generateReferralCode = void 0;
const database_1 = require("../config/database");
const generateReferralCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existingUser = await database_1.prisma.user.findFirst({
            where: { referralCode: code }
        });
        if (!existingUser) {
            isUnique = true;
            return code;
        }
    }
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};
exports.generateReferralCode = generateReferralCode;
const validateUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.validateUrl = validateUrl;
const formatKoreanCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};
exports.formatKoreanCurrency = formatKoreanCurrency;
const generateOrderId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${random}`.toUpperCase();
};
exports.generateOrderId = generateOrderId;
const calculateBulkDiscount = (quantity, basePrice) => {
    let discountRate = 0;
    if (quantity >= 10000)
        discountRate = 0.15;
    else if (quantity >= 5000)
        discountRate = 0.10;
    else if (quantity >= 1000)
        discountRate = 0.05;
    return basePrice * (1 - discountRate);
};
exports.calculateBulkDiscount = calculateBulkDiscount;
const sanitizeInput = (input) => {
    return input.trim().replace(/[<>]/g, '');
};
exports.sanitizeInput = sanitizeInput;
const isValidKoreanPhone = (phone) => {
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    return phoneRegex.test(phone);
};
exports.isValidKoreanPhone = isValidKoreanPhone;
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.sleep = sleep;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
