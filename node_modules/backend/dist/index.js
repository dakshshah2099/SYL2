"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const entities_1 = __importDefault(require("./routes/entities"));
const services_1 = __importDefault(require("./routes/services"));
const govAI_1 = __importDefault(require("./routes/govAI"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 1. Security Middleware
app.use((0, helmet_1.default)());
// 2. CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'http://localhost:5173']
        : '*',
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
// 3. Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
// 4. Body Parser (Limited)
app.use(express_1.default.json({ limit: '10kb' }));
// 5. Routes
app.use('/api/auth', auth_1.default);
app.use('/api/entities', entities_1.default);
app.use('/api/services', services_1.default);
app.use('/api/gov-ai', govAI_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
// 6. Global Error Handler (Must be last)
app.use(errorHandler_1.errorHandler);
// 7. Server Start Logic
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying ${port + 1}...`);
            startServer(port + 1);
        }
        else {
            console.error('Server startup error:', error);
            process.exit(1);
        }
    });
};
startServer(Number(PORT));
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});
