"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNotification = sendAdminNotification;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
async function sendAdminNotification(data) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        logger_1.logger.warn('Slack webhook URL not configured, skipping notification');
        return;
    }
    let message = '';
    const emoji = data.type.includes('success') ? '✅' : '❌';
    switch (data.type) {
        case 'order_success':
            message = `${emoji} 주문 성공\n사용자: ${data.userId}\n주문 ID: ${data.orderId}\n금액: ${data.amount?.toLocaleString()}원`;
            break;
        case 'order_failed':
            message = `${emoji} 주문 실패\n사용자: ${data.userId}\n주문 ID: ${data.orderId}\n오류: ${data.error}`;
            break;
        case 'topup_success':
            message = `${emoji} 충전 성공\n사용자: ${data.userId}\n충전 금액: ${data.amount?.toLocaleString()}원`;
            break;
        case 'topup_failed':
            message = `${emoji} 충전 실패\n사용자: ${data.userId}\n오류: ${data.error}`;
            break;
    }
    try {
        await axios_1.default.post(webhookUrl, {
            text: message,
            username: 'INSTAUP Bot',
            icon_emoji: ':robot_face:'
        });
        logger_1.logger.info('Admin notification sent successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to send admin notification:', error);
    }
}
