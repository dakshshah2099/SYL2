import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import entityRoutes from './routes/entities';
import serviceRoutes from './routes/services';
import govAIRoutes from './routes/govAI';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// 1. Security Middleware
app.use(helmet());

// 2. CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'http://localhost:5173']
        : '*',
    credentials: true
};
app.use(cors(corsOptions));

// 3. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// 4. Body Parser (Limited)
app.use(express.json({ limit: '10kb' }));

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/gov-ai', govAIRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// 6. Global Error Handler (Must be last)
app.use(errorHandler);

export default app;
