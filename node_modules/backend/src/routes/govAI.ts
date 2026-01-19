import { Router } from 'express';
import prisma from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Initialize Gemini
// Note: This requires GOOGLE_API_KEY in .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.TWO_FACTOR_API_KEY || 'MISSING_KEY');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// POST /chat - Analyze Govt Data
router.post('/chat', authenticate, async (req: any, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // 1. Fetch Context Data (Real-time)

        // A. Citizen & Org Stats
        const totalCitizens = await prisma.entity.count({ where: { type: 'INDIVIDUAL' } });
        const totalOrgs = await prisma.entity.count({ where: { type: 'ORG' } });
        const pendingOrgs = await prisma.orgRegistrationRequest.count({ where: { status: 'pending' } });

        // B. Recent Access Logs (Audit Trail)
        const recentLogs = await prisma.accessLog.findMany({
            take: 20,
            orderBy: { timestamp: 'desc' },
            include: { entity: { select: { name: true, type: true } } }
        });

        // C. Recent Security Alerts (Harming Activities)
        const recentAlerts = await prisma.securityAlert.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            where: { type: 'error' }, // Focus on errors/warnings
            include: { entity: { select: { name: true } } }
        });

        // 2. Construct Prompt
        const dataContext = `
        Current System Stats:
        - Total Citizens: ${totalCitizens}
        - Total Organizations: ${totalOrgs}
        - Pending Org Requests: ${pendingOrgs}

        Recent Audit Logs (Access Requests):
        ${recentLogs.map((l: any) => `- [${l.timestamp.toISOString()}] ${l.entity.name} (${l.entity.type})accessed ${l.service} for "${l.purpose}". Status: ${l.status}`).join('\n')}

        Recent Security Alerts (Potential Threats):
        ${recentAlerts.map((a: any) => `- [${a.timestamp.toISOString()}] ALERT: ${a.title} - ${a.message} (Entity: ${a.entity.name})`).join('\n')}
        `;

        const prompt = `
        You are an AI Analyst for the Government Verification Portal.
        Your goal is to monitor for "harming activities", analyze audit logs, and provide insights.
        
        DATA CONTEXT:
        ${dataContext}

        USER QUESTION: "${message}"

        INSTRUCTIONS:
        - Analyze the data provided above.
        - If the user asks about specific activities, cite the relevant logs.
        - If everything looks normal, say so.
        - Be professional, concise, and helpful.
        - Highlight any "Denied" access logs or "Error" alerts as potential concerns.
        `;

        // 3. Call Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        res.json({ success: true, response: text });

    } catch (error: any) {
        console.error('Gov AI Error:', error);

        // Fallback for missing key or model error
        if (error.message?.includes('API key')) {
            return res.json({
                success: true,
                response: "I am unable to connect to the AI service. Please ensure the GOOGLE_API_KEY is configured in the backend settings."
            });
        }

        res.status(500).json({ error: 'AI Service Error' });
    }
});

export default router;
