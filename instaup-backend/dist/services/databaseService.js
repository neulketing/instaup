"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.disconnectDatabase = disconnectDatabase;
const logger_1 = require("../utils/logger");
async function initializeDatabase() {
    try {
        logger_1.logger.info("✅ Database initialization started");
        return true;
    }
    catch (error) {
        logger_1.logger.error("❌ Database connection failed:", error);
        throw error;
    }
}
async function disconnectDatabase() {
    try {
        logger_1.logger.info("🔌 Database disconnected");
    }
    catch (error) {
        logger_1.logger.error("Database disconnect error:", error);
    }
}
