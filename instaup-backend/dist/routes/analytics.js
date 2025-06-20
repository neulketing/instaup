"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/user-stats', async (req, res) => {
    res.json({
        success: true,
        message: '분석 API (준비중)'
    });
});
exports.default = router;
