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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/entities - Get all entities for the user
router.get('/', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const entities = yield prisma.entity.findMany({
            where: { userId: req.userId },
            include: { consents: true, alerts: true }
        });
        // Transform for frontend if needed (e.g., parse details JSON)
        const formatted = entities.map(e => (Object.assign(Object.assign({}, e), e.details // Spread details JSON into top level if frontend expects it
        )));
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch entities' });
    }
}));
// POST /api/entities - Create new entity (profile)
// POST /api/entities - Create new entity (profile)
router.post('/', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type = 'INDIVIDUAL', name, details, registrationNumber, jurisdiction } = req.body;
        // Validation/Defaults
        const isOrg = type === 'ORG';
        const entityPrefix = isOrg ? 'org' : 'ind';
        const finalName = name || (isOrg ? 'New Organization' : 'New Profile');
        // Determine Unique ID for Global Constraint Logic (Consistent with PUT)
        let uniqueId = null;
        if (registrationNumber && registrationNumber.trim() !== '') {
            uniqueId = registrationNumber;
        }
        else if (details && details.idNumber && details.idNumber.trim() !== '') {
            uniqueId = details.idNumber;
        }
        const newEntity = yield prisma.entity.create({
            data: {
                id: `${entityPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId: req.userId,
                type: type,
                name: finalName,
                verified: !!details, // If details provided, assume verified (atomic creation)
                details: details || {},
                registrationNumber: registrationNumber,
                jurisdiction: jurisdiction,
                uniqueId: uniqueId
            }
        });
        res.json({ success: true, entity: newEntity });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'Identity Document Number already registered with another profile.'
            });
        }
        console.error("Create entity error:", error);
        res.status(500).json({ error: 'Failed to create profile' });
    }
}));
// PUT /api/entities/:id - Update entity details
router.put('/:id', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, details, verified, registrationNumber, jurisdiction } = req.body;
        // Verify ownership
        const entity = yield prisma.entity.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!entity) {
            return res.status(404).json({ error: 'Entity not found' });
        }
        // Determine Unique ID for Global Constraint
        // Priority: Registration Number (Org) > ID Number (Individual)
        let uniqueId = null;
        if (registrationNumber && registrationNumber.trim() !== '') {
            uniqueId = registrationNumber;
        }
        else if (details && details.idNumber && details.idNumber.trim() !== '') {
            uniqueId = details.idNumber;
        }
        const updated = yield prisma.entity.update({
            where: { id: req.params.id },
            data: {
                name,
                details,
                verified,
                registrationNumber, // For Organizations
                jurisdiction, // For Organizations
                uniqueId: uniqueId // Enforce Uniqueness
            }
        });
        res.json({ success: true, entity: updated });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'Identity Document Number already registered with another profile.'
            });
        }
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update entity' });
    }
}));
// GET /api/entities/sessions - Get user sessions
router.get('/sessions', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessions = yield prisma.session.findMany({
            where: { userId: req.userId },
            orderBy: { lastActive: 'desc' }
        });
        // Dynamic check for current session based on token
        const sessionsWithCurrent = sessions.map(s => (Object.assign(Object.assign({}, s), { current: s.token === req.token // Ensure logic matches exact token
         })));
        res.json(sessionsWithCurrent);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
}));
// POST /api/entities/sessions/terminate-all
router.post('/sessions/terminate-all', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[SESSION] Terminating ALL others for user ${req.userId}`);
        const result = yield prisma.session.deleteMany({
            where: {
                userId: req.userId,
                token: { not: req.token } // Preserves current session
            }
        });
        console.log(`[SESSION] Terminated ${result.count} other sessions`);
        res.json({ success: true, count: result.count });
    }
    catch (error) {
        console.error("[SESSION] Error terminating all:", error);
        res.status(500).json({ error: 'Failed to terminate sessions' });
    }
}));
// POST /api/entities/sessions/:id/terminate
router.post('/sessions/:id/terminate', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield prisma.session.deleteMany({
            where: { id: req.params.id, userId: req.userId }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Session not found or already deleted' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("[SESSION] Error terminating:", error);
        res.status(500).json({ error: 'Failed to terminate session' });
    }
}));
// CONSENT MANAGEMENT
// REQUEST CONSENT (For Org/Govt simulation)
router.post('/consents/request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetUserId, requesterId, purpose, attributes, serviceName } = req.body; // targetUserId can be phone for simulation
    try {
        // Find target user/entity by phone if needed, for now assume Entity ID is passed or we find via Phone
        let targetEntityId = targetUserId;
        // If target starts with + (phone), resolve to Entity
        if (targetUserId.startsWith('+') || targetUserId.match(/^\d+$/)) {
            const user = yield prisma.user.findUnique({ where: { phone: targetUserId } });
            if (!user)
                return res.status(404).json({ error: 'User not found' });
            // Get Primary Entity (INDIVIDUAL)
            const entity = yield prisma.entity.findFirst({ where: { userId: user.id, type: 'INDIVIDUAL' } });
            if (!entity)
                return res.status(404).json({ error: 'User has no profile' });
            targetEntityId = entity.id;
        }
        const newConsent = yield prisma.consent.create({
            data: {
                entityId: targetEntityId,
                requesterId: requesterId,
                serviceName: serviceName || 'Unknown Service',
                entityType: 'ORG', // Default to ORG for simulation
                purpose: purpose,
                status: 'pending',
                attributes: attributes || [], // Requested attributes
                // grantedOn and expiresOn are null initially
            }
        });
        // Create a Security Alert for the user
        yield prisma.securityAlert.create({
            data: {
                entityId: targetEntityId,
                type: 'info',
                title: 'Data Access Request',
                message: `${serviceName} requested access to your data.`,
            }
        });
        return res.json({ success: true, consentId: newConsent.id });
    }
    catch (error) {
        console.error('Consent Request Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}));
// GET PENDING CONSENTS
router.get('/:entityId/consents/pending', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { entityId } = req.params;
    try {
        const pending = yield prisma.consent.findMany({
            where: { entityId, status: 'pending' },
            orderBy: { id: 'desc' }
        });
        return res.json(pending);
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET OUTBOUND CONSENTS (Granted TO this entity)
router.get('/:entityId/consents/outbound', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { entityId } = req.params;
    try {
        const outbound = yield prisma.consent.findMany({
            where: {
                requesterId: entityId,
                status: 'active'
            },
            include: {
                entity: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        details: true, // Needed to show the actual data
                        verified: true
                    }
                }
            },
            orderBy: { grantedOn: 'desc' }
        });
        return res.json(outbound);
    }
    catch (error) {
        console.error("Outbound error:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// RESPOND TO CONSENT (Approve/Reject)
router.post('/consents/:consentId/respond', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { consentId } = req.params;
    const { action, grantedAttributes, duration = 90 } = req.body; // action: 'approve' | 'reject', duration in days (default 90)
    try {
        if (action === 'reject') {
            yield prisma.consent.update({
                where: { id: consentId },
                data: { status: 'rejected' }
            });
            return res.json({ success: true, status: 'rejected' });
        }
        if (action === 'approve') {
            yield prisma.consent.update({
                where: { id: consentId },
                data: {
                    status: 'active',
                    attributes: grantedAttributes, // Only save what was granted
                    grantedOn: new Date(),
                    expiresOn: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
                }
            });
            // Log Access
            const consent = yield prisma.consent.findUnique({ where: { id: consentId } });
            if (consent) {
                yield prisma.accessLog.create({
                    data: {
                        entityId: consent.entityId,
                        service: consent.serviceName,
                        purpose: 'Consent Granted',
                        status: 'Success',
                        attributes: grantedAttributes
                    }
                });
            }
            return res.json({ success: true, status: 'active' });
        }
        return res.status(400).json({ error: 'Invalid action' });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}));
// REVOKE CONSENT
router.post('/consents/:consentId/revoke', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.consent.update({
            where: { id: req.params.consentId }, // Changed from req.params.id to req.params.consentId
            data: { status: 'revoked' }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to revoke consent' });
    }
}));
// POST /api/entities/alerts/:id/dismiss
router.post('/alerts/:id/dismiss', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.securityAlert.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to dismiss alert' });
    }
}));
// POST /api/entities/alerts/:id/acknowledge
router.post('/alerts/:id/acknowledge', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.securityAlert.update({
            where: { id: req.params.id },
            data: { acknowledged: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
}));
// ACCESS TRANSPARENCY
// GET /api/entities/access-logs
router.get('/access-logs', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield prisma.accessLog.findMany({
            where: { entityId: req.userId }, // Assuming entityId maps to userId broadly or we need to look up entity first. 
            // In schema: AccessLog.entityId refers to Entity.id.
            // We need to find the user's entity first.
        });
        // Let's get the entity first
        const entity = yield prisma.entity.findFirst({
            where: { userId: req.userId }
        });
        if (!entity)
            return res.json([]);
        const entityLogs = yield prisma.accessLog.findMany({
            where: { entityId: entity.id },
            orderBy: { timestamp: 'desc' }
        });
        res.json(entityLogs);
    }
    catch (error) {
        console.error("Access Log Error:", error);
        res.status(500).json({ error: 'Failed to fetch access logs' });
    }
}));
// POST /api/entities/consents/:consentId/access (Triggered when Data is Viewed)
router.post('/consents/:consentId/access', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { consentId } = req.params;
    try {
        const consent = yield prisma.consent.findUnique({
            where: { id: consentId },
            include: { entity: true }
        });
        if (!consent)
            return res.status(404).json({ error: 'Consent not found' });
        // Verify that the caller is the Requester [requesterId match] or we trust the frontend simulation
        // ideally: verify req.userId owns the requesterId entity.
        yield prisma.accessLog.create({
            data: {
                entityId: consent.entityId, // The user whose data is accessed
                service: consent.serviceName,
                entityType: 'ORG', // Assuming Org is accessing
                purpose: `Accessed data for: ${consent.purpose}`,
                status: 'Success',
                attributes: (consent.attributes || []) // Explicit cast to avoid JsonValue mismatch
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Log Access Error:", error);
        res.status(500).json({ error: 'Failed to log access' });
    }
}));
// PUT /api/entities/settings - Update User Preferences
router.put('/settings', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = req.body; // Expect JSON object { theme, notifications: {...} }
        yield prisma.user.update({
            where: { id: req.userId },
            data: { settings: settings }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Update Settings Error:", error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
}));
exports.default = router;
