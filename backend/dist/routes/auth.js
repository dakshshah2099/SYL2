"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';
// Middleware to authenticate
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});
// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------
const updateLoginStats = (userId_1, success_1, ...args_1) => __awaiter(void 0, [userId_1, success_1, ...args_1], void 0, function* (userId, success, location = 'Unknown') {
    try {
        if (success) {
            yield prisma.user.update({
                where: { id: userId },
                data: {
                    lastLogin: new Date(),
                    lastLoginLocation: location,
                    failedLoginAttempts: 0 // Reset on success
                }
            });
        }
        else {
            if (!userId)
                return; // Can't log failed attempt if user not found, though could log by IP later
            yield prisma.user.update({
                where: { id: userId },
                data: {
                    failedLoginAttempts: { increment: 1 },
                    lastFailedLogin: new Date()
                }
            });
        }
    }
    catch (e) {
        console.error("Failed to update login stats", e);
    }
});
const sendSMS = (phone, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const isConfigured = apiKey && apiKey !== 'your_api_key_here';
    console.log(`[AUTH] SMS Config Check: Phone=${!!phone}, KeyConfigured=${isConfigured}`);
    if (phone && isConfigured) {
        try {
            // Ensure 10 digit or compatible format. 2factor works best with 10 digit for India.
            const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/OTP1`;
            console.log(`[AUTH] Calling 2Factor API: .../SMS/${phone}/...`);
            const response = yield (0, node_fetch_1.default)(url);
            const data = yield response.json();
            console.log('[AUTH] 2Factor Response:', data);
        }
        catch (smsError) {
            console.error('[AUTH] Failed to send SMS via 2Factor:', smsError);
        }
    }
    else if (phone && !isConfigured) {
        console.log('[AUTH] Skipping SMS: API Key not set');
    }
});
// ----------------------------------------------------------------------
// HELPER ROUTES
// ----------------------------------------------------------------------
// CHECK-PHONE: Check if user exists (Individual)
router.post('/check-phone', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.body;
    const user = yield prisma.user.findUnique({ where: { phone } });
    return res.json({ exists: !!user });
}));
// CHECK-EMAIL: Check if user exists (Organization)
router.post('/check-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield prisma.user.findUnique({ where: { email } });
    return res.json({ exists: !!user });
}));
// ----------------------------------------------------------------------
// ORGANIZATION REGISTRATION FLOW
// ----------------------------------------------------------------------
// ORG REQUEST: Submit Verification Request
router.post('/org-request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, registrationNumber, jurisdiction, address } = req.body;
    if (!name || !email || !registrationNumber) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const existing = yield prisma.orgRegistrationRequest.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Request already submitted for this email' });
        }
        const userExists = yield prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(409).json({ error: 'Account already exists for this email' });
        }
        yield prisma.orgRegistrationRequest.create({
            data: {
                name,
                email,
                registrationNumber,
                jurisdiction: jurisdiction || 'Unknown',
                address: address || 'Unknown'
            }
        });
        return res.json({ success: true, message: 'Request submitted for verification' });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to submit request' });
    }
}));
// ----------------------------------------------------------------------
// INDIVIDUAL REGISTRATION FLOW
// ----------------------------------------------------------------------
// REGISTER: Create New User & Entity (INDIVIDUAL ONLY)
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, password, type = 'INDIVIDUAL' } = req.body;
    if (type === 'ORG') {
        return res.status(403).json({ error: 'Organizations cannot self-register. Please submit a request.' });
    }
    if (!phone || !password) {
        return res.status(400).json({ success: false, error: 'Phone and password are required' });
    }
    try {
        let userId;
        const existingUser = yield prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
            // Verify password using bcrypt
            const valid = yield bcryptjs_1.default.compare(password, existingUser.password);
            if (!valid) {
                return res.status(400).json({ success: false, error: 'User already exists with different credentials' });
            }
            userId = existingUser.id;
        }
        else {
            const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
            const newUser = yield prisma.user.create({
                data: { phone, password: hashedPassword }
            });
            userId = newUser.id;
        }
        // Create New Entity
        const entityPrefix = 'ind';
        const defaultName = 'New Profile';
        const newEntity = yield prisma.entity.create({
            data: {
                id: `${entityPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId: userId,
                type: 'INDIVIDUAL',
                name: defaultName,
                verified: false
            }
        });
        return res.json({ success: true, message: 'Profile created successfully', entityId: newEntity.id });
    }
    catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}));
// ----------------------------------------------------------------------
// LOGIN FLOW (INDIVIDUAL & ORGANIZATION)
// ----------------------------------------------------------------------
// LOGIN: Validate Phone/Email & Password
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, email, password } = req.body;
    try {
        let user;
        if (phone) {
            user = yield prisma.user.findUnique({ where: { phone } });
        }
        else if (email) {
            user = yield prisma.user.findUnique({ where: { email } });
        }
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const validPassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            yield updateLoginStats(user.id, false);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        let token;
        if (email) {
            // ORG LOGIN (Direct Token - Password based)
            token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
            const sessionId = `s-${Date.now()}`;
            yield prisma.session.create({
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
            yield updateLoginStats(user.id, true, 'Detected (Local)');
            return res.json({ success: true, token, user });
        }
        else {
            // INDIVIDUAL LOGIN (OTP based)
            // Generate Real OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
            yield prisma.user.update({
                where: { id: user.id },
                data: { otp, otpExpiresAt }
            });
            console.log(`[AUTH] OTP for ${phone}: ${otp}`);
            yield sendSMS(phone, otp);
            return res.json({ success: true, message: 'OTP sent successfully' });
        }
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}));
// SEND OTP: Generate & Send OTP (For Login or Password Reset)
router.post('/send-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, email } = req.body;
    if (!phone && !email) {
        return res.status(400).json({ error: 'Phone or Email is required' });
    }
    try {
        let user;
        if (phone) {
            user = yield prisma.user.findUnique({ where: { phone } });
        }
        else {
            user = yield prisma.user.findUnique({ where: { email } });
        }
        if (!user) {
            // Security: Don't reveal user existence
            return res.status(404).json({ error: 'User not found' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        yield prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpiresAt }
        });
        console.log(`[AUTH] OTP for ${phone || email}: ${otp}`);
        if (phone) {
            yield sendSMS(phone, otp);
        }
        return res.json({ success: true, message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// VERIFY OTP: Validate OTP & Login
router.post('/verify-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, email, otp } = req.body;
    if ((!phone && !email) || !otp) {
        return res.status(400).json({ error: 'Phone/Email and OTP are required' });
    }
    try {
        let user;
        if (phone) {
            user = yield prisma.user.findUnique({ where: { phone } });
        }
        else {
            user = yield prisma.user.findUnique({ where: { email } });
        }
        if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            if (user)
                yield updateLoginStats(user.id, false);
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }
        // Clear OTP
        yield prisma.user.update({
            where: { id: user.id },
            data: { otp: null, otpExpiresAt: null }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        // CREATE SESSION (Required for authMiddleware)
        const sessionId = `s-${Date.now()}`;
        yield prisma.session.create({
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
        yield updateLoginStats(user.id, true);
        return res.json({ success: true, token, user });
    }
    catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// ----------------------------------------------------------------------
// GOVERNMENT RELATED ROUTES
// ----------------------------------------------------------------------
// REGISTER GOVT: Create New Entity (Service Based)
router.post('/register-gov', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, password, serviceName } = req.body;
    if (!serviceId || !password || !serviceName) {
        return res.status(400).json({ success: false, error: 'Service ID, Password, and Service Name are required' });
    }
    try {
        const existingUser = yield prisma.user.findUnique({ where: { serviceId } });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Service ID already registered' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma.user.create({
            data: { serviceId, password: hashedPassword }
        });
        const newEntity = yield prisma.entity.create({
            data: {
                id: `govt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId: newUser.id,
                type: 'GOVT',
                name: serviceName,
                verified: true
            }
        });
        return res.json({ success: true, message: 'Government Service Registered', entityId: newEntity.id });
    }
    catch (error) {
        console.error('Gov Register error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}));
// LOGIN GOVT: Service ID & Password (No OTP)
router.post('/login-gov', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, password, deviceInfo } = req.body;
    try {
        const user = yield prisma.user.findUnique({ where: { serviceId } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid Service ID or Password' });
        }
        const validPassword = yield bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            yield updateLoginStats(user.id, false);
            return res.status(401).json({ success: false, error: 'Invalid Service ID or Password' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, serviceId: user.serviceId }, JWT_SECRET, { expiresIn: '12h' });
        const sessionId = `s-govt-${Date.now()}`;
        yield prisma.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                device: (deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.device) || 'Unknown Device',
                browser: (deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.browser) || 'Unknown',
                os: (deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.os) || 'Unknown',
                location: 'Secure Govt Network',
                ip: (deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ip) || '127.0.0.1',
                token: token,
                isCurrent: true
            }
        });
        yield updateLoginStats(user.id, true, 'Secure Govt Network');
        return res.json({ success: true, token, user });
    }
    catch (error) {
        console.error('Gov Login error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}));
// GOVT: FETCH ORG REQUESTS
router.get('/govt/org-requests', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = yield prisma.orgRegistrationRequest.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
}));
// GOVT: APPROVE ORG REQUEST
router.post('/govt/org-requests/:id/approve', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const request = yield prisma.orgRegistrationRequest.findUnique({ where: { id } });
        if (!request || request.status !== 'pending') {
            return res.status(404).json({ error: 'Request not found or already processed' });
        }
        // 1. Create User
        const tempPassword = Math.random().toString(36).slice(-8);
        const newUser = yield prisma.user.create({
            data: {
                email: request.email,
                password: tempPassword
            }
        });
        // 2. Create Entity
        yield prisma.entity.create({
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
        yield prisma.orgRegistrationRequest.update({
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
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to approve organization' });
    }
}));
// GOVT: REJECT ORG REQUEST
router.post('/govt/org-requests/:id/reject', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.orgRegistrationRequest.update({
            where: { id },
            data: { status: 'rejected' }
        });
        res.json({ success: true, message: 'Request rejected' });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to reject request' });
    }
}));
// ----------------------------------------------------------------------
// SECURITY & USER STATS
// ----------------------------------------------------------------------
// GET USER SECURITY STATS
router.get('/user-security', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                lastLogin: true,
                lastLoginLocation: true,
                failedLoginAttempts: true,
                lastFailedLogin: true,
                passwordChangedAt: true
            }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json(user);
    }
    catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}));
// PUT /auth/password - Change Password
router.put('/password', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing old or new password' });
    }
    try {
        const user = yield prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Verify old password
        const valid = yield bcryptjs_1.default.compare(oldPassword, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Incorrect current password' });
        // Hash new password
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        // Update
        yield prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date()
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: 'Failed to change password' });
    }
}));
// DELETE /auth/account - Delete entire account
router.delete('/account', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    const userId = req.userId; // Middleware provides this
    try {
        const user = yield prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Verify password
        const valid = yield bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Invalid password' });
        // Delete user (Cascading delete handles entities, sessions, etc. if configured, OR we do manual cleanup)
        // Prisma schema usually handles cascade if @relation(onDelete: Cascade) is set.
        // If not, we might need manual cleanup. checking schema... assuming Cascade for now or simple delete.
        yield prisma.user.delete({ where: { id: userId } });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
}));
// POST /auth/reset-password - Reset Password via OTP
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, otp, newPassword, email } = req.body;
    if ((!phone && !email) || !otp || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        let user;
        if (phone) {
            user = yield prisma.user.findUnique({ where: { phone } });
        }
        else {
            user = yield prisma.user.findUnique({ where: { email } });
        }
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Verify OTP
        if (user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        // Hash new password
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        // Update User (Clear OTP)
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiresAt: null,
                passwordChangedAt: new Date()
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
}));
// GOVT: Get All Verified Organizations for Promotion
router.get('/govt/organizations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Ideally check if req.user is Govt Official
    try {
        const orgs = yield prisma.entity.findMany({
            where: { type: 'ORG', verified: true },
            include: {
                serviceProvider: {
                    select: { isGovernmentService: true, id: true }
                }
            }
        });
        res.json(orgs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
}));
exports.default = router;
