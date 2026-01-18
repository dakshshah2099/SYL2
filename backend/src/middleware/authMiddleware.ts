import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

export interface AuthRequest extends Request {
    userId?: string;
    token?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.userId = decoded.userId;
        req.token = token; // Store token for current session check

        // CRITICAL: Check if session exists in DB (Logout support)
        const session = await prisma.session.findFirst({
            where: { token: token }
        });

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalidated' });
        }

        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
