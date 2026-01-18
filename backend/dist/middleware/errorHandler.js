"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    // In production, don't leak stack traces
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;
    res.status(statusCode).json(Object.assign({ success: false, error: message }, (process.env.NODE_ENV !== 'production' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
