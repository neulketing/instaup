"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    info(message, meta) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta || '');
    }
    error(message, meta) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, meta || '');
    }
    warn(message, meta) {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta || '');
    }
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta || '');
        }
    }
}
exports.logger = new Logger();
exports.default = exports.logger;
