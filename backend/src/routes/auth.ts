import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// Middleware to authenticate
const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.userId = decoded.userId;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

const updateLoginStats = async (userId: string, success: boolean, location: string = 'Unknown') => {
    try {
        if (success) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    lastLogin: new Date(),
                    lastLoginLocation: location,
                    failedLoginAttempts: 0 // Reset on success
                }
            });
        } else {
            if (!userId) return; // Can't log failed attempt if user not found, though could log by IP later
            await prisma.user.update({
                where: { id: userId },
                data: {
                    failedLoginAttempts: { increment: 1 },
                    lastFailedLogin: new Date()
                }
            });
        }
    } catch (e) {
        console.error("Failed to update login stats", e);
    }
};

const sendSMS = async (phone: string, otp: string) => {
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const isConfigured = apiKey && apiKey !== 'your_api_key_here';

    console.log(`[AUTH] SMS Config Check: Phone=${!!phone}, KeyConfigured=${isConfigured}`);

    if (phone && isConfigured) {
        try {
            // Ensure 10 digit or compatible format. 2factor works best with 10 digit for India.
            const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/OTP1`;
            console.log(`[AUTH] Calling 2Factor API: .../SMS/${phone}/...`);

            const response = await fetch(url);
            const data = await response.json();
            console.log('[AUTH] 2Factor Response:', data);
        } catch (smsError) {
            console.error('[AUTH] Failed to send SMS via 2Factor:', smsError);
        }
    } else if (phone && !isConfigured) {
        console.log('[AUTH] Skipping SMS: API Key not set');
    }
};

// ----------------------------------------------------------------------
// HELPER ROUTES
// ----------------------------------------------------------------------

// CHECK-PHONE: Check if user exists (Individual)
router.post('/check-phone', async (req, res) => {
    const { phone } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });
    return res.json({ exists: !!user });
});

// CHECK-EMAIL: Check if user exists (Organization)
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    return res.json({ exists: !!user });
});

// ----------------------------------------------------------------------
// ORGANIZATION REGISTRATION FLOW
// ----------------------------------------------------------------------

// ORG REQUEST: Submit Verification Request
router.post('/org-request', async (req, res) => {
    const { name, email, registrationNumber, jurisdiction, address } = req.body;

    if (!name || !email || !registrationNumber) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const existing = await prisma.orgRegistrationRequest.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Request already submitted for this email' });
        }

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(409).json({ error: 'Account already exists for this email' });
        }

        await prisma.orgRegistrationRequest.create({
            data: {
                name,
                email,
                registrationNumber,
                jurisdiction: jurisdiction || 'Unknown',
                address: address || 'Unknown'
            }
        });

        return res.json({ success: true, message: 'Request submitted for verification' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to submit request' });
    }
});

// ----------------------------------------------------------------------
// INDIVIDUAL REGISTRATION FLOW
// ----------------------------------------------------------------------

// REGISTER: Create New User & Entity (INDIVIDUAL ONLY)
router.post('/register', async (req, res) => {
    const { phone, password, type = 'INDIVIDUAL' } = req.body;

    if (type === 'ORG') {
        return res.status(403).json({ error: 'Organizations cannot self-register. Please submit a request.' });
    }

    if (!phone || !password) {
        return res.status(400).json({ success: false, error: 'Phone and password are required' });
    }

    try {
        let userId;

        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
            // Verify password using bcrypt
            const valid = await bcrypt.compare(password, existingUser.password);
            if (!valid) {
                return res.status(400).json({ success: false, error: 'User already exists with different credentials' });
            }
            userId = existingUser.id;
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await prisma.user.create({
                data: { phone, password: hashedPassword }
            });
            userId = newUser.id;
        }

        // Create New Entity
        const entityPrefix = 'ind';
        const defaultName = 'New Profile';

        const newEntity = await prisma.entity.create({
            data: {
                id: `${entityPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId: userId,
                type: 'INDIVIDUAL',
                name: defaultName,
                verified: false
            }
        });

        return res.json({ success: true, message: 'Profile created successfully', entityId: newEntity.id });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ----------------------------------------------------------------------
// LOGIN FLOW (INDIVIDUAL & ORGANIZATION)
// ----------------------------------------------------------------------

// LOGIN: Validate Phone/Email & Password
router.post('/login', async (req, res) => {
    const { phone, email, password } = req.body;

    try {
        let user;
        if (phone) {
            user = await prisma.user.findUnique({ where: { phone } });
        } else if (email) {
            user = await prisma.user.findUnique({ where: { email } });
        }

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            await updateLoginStats(user.id, false);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        let token;

        if (email) {
            // ORG LOGIN (Direct Token - Password based)
            token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

            const sessionId = `s-${Date.now()}`;
            await prisma.session.create({
                data: {
                    id: sessionId,
                    userId: user.id,
                    device: 'Unknown',
                    browser: 'Unknown',
                    os: 'Unknown',
                    location: 'Detected (Local)',
                    ip: '127.0.0.1',
                    token: token,
                    isCurrent: true
                }
            });

            await updateLoginStats(user.id, true, 'Detected (Local)');

            return res.json({ success: true, token, user });
        } else {
            // INDIVIDUAL LOGIN (OTP based)
            // Generate Real OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            await prisma.user.update({
                where: { id: user.id },
                data: { otp, otpExpiresAt }
            });

            console.log(`[AUTH] OTP for ${phone}: ${otp}`);

            await sendSMS(phone, otp);

            return res.json({ success: true, message: 'OTP sent successfully' });
        }

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// SEND OTP: Generate & Send OTP (For Login or Password Reset)
router.post('/send-otp', async (req, res) => {
    const { phone, email } = req.body;

    if (!phone && !email) {
        return res.status(400).json({ error: 'Phone or Email is required' });
    }

    try {
        let user;
        if (phone) {
            user = await prisma.user.findUnique({ where: { phone } });
        } else {
            user = await prisma.user.findUnique({ where: { email } });
        }

        if (!user) {
            // Security: Don't reveal user existence
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpiresAt }
        });

        console.log(`[AUTH] OTP for ${phone || email}: ${otp}`);

        if (phone) {
            await sendSMS(phone, otp);
        }

        return res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// VERIFY OTP: Validate OTP & Login
router.post('/verify-otp', async (req, res) => {
    const { phone, email, otp } = req.body;

    if ((!phone && !email) || !otp) {
        return res.status(400).json({ error: 'Phone/Email and OTP are required' });
    }

    try {
        let user;
        if (phone) {
            user = await prisma.user.findUnique({ where: { phone } });
        } else {
            user = await prisma.user.findUnique({ where: { email } });
        }

        if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            if (user) await updateLoginStats(user.id, false);
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        // Clear OTP
        await prisma.user.update({
            where: { id: user.id },
            data: { otp: null, otpExpiresAt: null }
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        // CREATE SESSION (Required for authMiddleware)
        const sessionId = `s-${Date.now()}`;
        await prisma.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                device: 'Unknown',
                browser: 'Unknown',
                os: 'Unknown',
                location: 'Detected (Local)',
                ip: '127.0.0.1',
                token: token,
                isCurrent: true
            }
        });

        await updateLoginStats(user.id, true);
        return res.json({ success: true, token, user });

    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ----------------------------------------------------------------------
// GOVERNMENT RELATED ROUTES
// ----------------------------------------------------------------------

// REGISTER GOVT: Create New Entity (Service Based)
router.post('/register-gov', async (req, res) => {
    const { serviceId, password, serviceName } = req.body;

    if (!serviceId || !password || !serviceName) {
        return res.status(400).json({ success: false, error: 'Service ID, Password, and Service Name are required' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { serviceId } });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Service ID already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { serviceId, password: hashedPassword }
        });

        const newEntity = await prisma.entity.create({
            data: {
                id: `govt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId: newUser.id,
                type: 'GOVT',
                name: serviceName,
                verified: true
            }
        });

        return res.json({ success: true, message: 'Government Service Registered', entityId: newEntity.id });
    } catch (error) {
        console.error('Gov Register error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// LOGIN GOVT: Service ID & Password (No OTP)
router.post('/login-gov', async (req, res) => {
    const { serviceId, password, deviceInfo } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { serviceId } });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid Service ID or Password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            await updateLoginStats(user.id, false);
            return res.status(401).json({ success: false, error: 'Invalid Service ID or Password' });
        }

        const token = jwt.sign({ userId: user.id, serviceId: user.serviceId }, JWT_SECRET, { expiresIn: '12h' });

        const sessionId = `s-govt-${Date.now()}`;
        await prisma.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                device: deviceInfo?.device || 'Unknown Device',
                browser: deviceInfo?.browser || 'Unknown',
                os: deviceInfo?.os || 'Unknown',
                location: 'Secure Govt Network',
                ip: deviceInfo?.ip || '127.0.0.1',
                token: token,
                isCurrent: true
            }
        });

        await updateLoginStats(user.id, true, 'Secure Govt Network');

        return res.json({ success: true, token, user });

    } catch (error) {
        console.error('Gov Login error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GOVT: FETCH ORG REQUESTS
router.get('/govt/org-requests', async (req, res) => {
    try {
        const requests = await prisma.orgRegistrationRequest.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// GOVT: APPROVE ORG REQUEST
router.post('/govt/org-requests/:id/approve', async (req, res) => {
    const { id } = req.params;

    try {
        const request = await prisma.orgRegistrationRequest.findUnique({ where: { id } });
        if (!request || request.status !== 'pending') {
            return res.status(404).json({ error: 'Request not found or already processed' });
        }

        // 1. Create User
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                email: request.email,
                password: hashedPassword
            }
        });

        // 2. Create Entity
        await prisma.entity.create({
            data: {
                id: `org-${Date.now()}`,
                userId: newUser.id,
                type: 'ORG',
                name: request.name,
                registrationNumber: request.registrationNumber,
                jurisdiction: request.jurisdiction,
                details: { address: request.address },
                verified: true
            }
        });

        // 3. Update Request Status
        await prisma.orgRegistrationRequest.update({
            where: { id },
            data: { status: 'approved' }
        });

        // 4. Return Credentials
        res.json({
            success: true,
            message: 'Organization Approved',
            credentials: {
                email: request.email,
                password: tempPassword
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to approve organization' });
    }
});

// GOVT: REJECT ORG REQUEST
router.post('/govt/org-requests/:id/reject', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.orgRegistrationRequest.update({
            where: { id },
            data: { status: 'rejected' }
        });
        res.json({ success: true, message: 'Request rejected' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to reject request' });
    }
});

// ----------------------------------------------------------------------
// SECURITY & USER STATS
// ----------------------------------------------------------------------

// GET USER SECURITY STATS
router.get('/user-security', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                lastLogin: true,
                lastLoginLocation: true,
                failedLoginAttempts: true,
                lastFailedLogin: true,
                passwordChangedAt: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// PUT /auth/password - Change Password
router.put('/password', authenticate, async (req: any, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing old or new password' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify old password
        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) return res.status(401).json({ error: 'Incorrect current password' });

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date()
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// DELETE /auth/account - Delete entire account
router.delete('/account', async (req: any, res) => {
    const { password } = req.body;
    const userId = req.userId; // Middleware provides this

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });

        // Delete user (Cascading delete handles entities, sessions, etc. if configured, OR we do manual cleanup)
        // Prisma schema usually handles cascade if @relation(onDelete: Cascade) is set.
        // If not, we might need manual cleanup. checking schema... assuming Cascade for now or simple delete.
        await prisma.user.delete({ where: { id: userId } });

        res.json({ success: true });
    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});


// POST /auth/reset-password - Reset Password via OTP
router.post('/reset-password', async (req, res) => {
    const { phone, otp, newPassword, email } = req.body;

    if ((!phone && !email) || !otp || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let user;
        if (phone) {
            user = await prisma.user.findUnique({ where: { phone } });
        } else {
            user = await prisma.user.findUnique({ where: { email } });
        }

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify OTP
        if (user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update User (Clear OTP)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiresAt: null,
                passwordChangedAt: new Date()
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// GOVT: Get All Verified Organizations for Promotion
router.get('/govt/organizations', async (req, res) => {
    // Ideally check if req.user is Govt Official
    try {
        const orgs = await prisma.entity.findMany({
            where: { type: 'ORG', verified: true },
            include: {
                serviceProvider: {
                    select: { isGovernmentService: true, id: true }
                }
            }
        });
        res.json(orgs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

export default router;
