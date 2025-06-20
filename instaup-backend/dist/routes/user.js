"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/dashboard', async (req, res) => {
    res.json({
        success: true,
        message: '사용자 대시보드 API'
    });
});
exports.default = router;
