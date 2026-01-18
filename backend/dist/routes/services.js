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
// GET /services - List all active service providers
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield prisma.serviceProvider.findMany({
            where: { active: true },
            include: {
                entity: {
                    select: {
                        id: true,
                        type: true,
                        verified: true
                    }
                }
            }
        });
        res.json(services);
    }
    catch (error) {
        console.error("Fetch Services Error:", error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
}));
// GET /services/:id - Get details
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const service = yield prisma.serviceProvider.findUnique({
            where: { id },
            include: { entity: true }
        });
        if (!service)
            return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch details' });
    }
}));
// POST /services - Register/Update Service Provider Profile
router.post('/', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { entityId, name, description, category, website, contactEmail } = req.body;
    if (!entityId || !name || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        // Verify ownership (the authenticated user must own the entity)
        const entity = yield prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity)
            return res.status(404).json({ error: 'Entity not found' });
        if (entity.userId !== req.userId)
            return res.status(403).json({ error: 'Unauthorized to manage this entity' });
        // Upsert Service Provider Profile
        const serviceProvider = yield prisma.serviceProvider.upsert({
            where: { entityId },
            update: {
                name, description, category, website, contactEmail,
                updatedAt: new Date()
            },
            create: {
                entityId, name, description, category, website, contactEmail,
                verified: entity.verified, // Inherit verification status
                active: true
            }
        });
        res.json({ success: true, serviceProvider });
    }
    catch (error) {
        console.error("Register Service Error:", error);
        res.status(500).json({ error: 'Failed to register service provider' });
    }
}));
// POST /services/promote - Promote Entity to Govt Service (Admin)
router.post('/promote', authMiddleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { entityId, description, contactEmail } = req.body;
    if (!entityId) {
        return res.status(400).json({ error: 'Entity ID is required' });
    }
    try {
        const entity = yield prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity)
            return res.status(404).json({ error: 'Entity not found' });
        // Upsert Service Provider with Govt Flag
        const serviceProvider = yield prisma.serviceProvider.upsert({
            where: { entityId },
            update: {
                isGovernmentService: true,
                category: 'GOVT',
                verified: true,
                active: true,
                contactEmail: contactEmail || undefined,
                // Don't overwrite description if not provided, unless it's null
            },
            create: {
                entityId,
                name: entity.name,
                description: description || `Government Service provided by ${entity.name}`,
                category: 'GOVT',
                contactEmail: contactEmail,
                isGovernmentService: true,
                verified: true,
                active: true
            }
        });
        res.json({ success: true, serviceProvider });
    }
    catch (error) {
        console.error("Promote Service Error:", error);
        res.status(500).json({ error: 'Failed to promote service' });
    }
}));
exports.default = router;
