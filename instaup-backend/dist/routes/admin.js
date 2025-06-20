"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.use(auth_1.adminMiddleware);
router.get('/dashboard', async (req, res) => {
    res.json({
        success: true,
        data: {
            totalUsers: 1367,
            totalOrders: 3241,
            totalRevenue: 18750000,
            completionRate: 96.2
        },
        message: '관리자 대시보드'
    });
});
exports.default = router;
