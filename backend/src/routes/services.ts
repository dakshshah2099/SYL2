import { Router } from 'express';
import prisma from '../db';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// GET /services - List all active service providers
router.get('/', async (req, res) => {
    try {
        const services = await prisma.serviceProvider.findMany({
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
    } catch (error) {
        console.error("Fetch Services Error:", error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// GET /services/:id - Get details
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const service = await prisma.serviceProvider.findUnique({
            where: { id },
            include: { entity: true }
        });
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch details' });
    }
});

// POST /services - Register/Update Service Provider Profile
router.post('/', authenticate, async (req: any, res: any) => {
    const { entityId, name, description, category, website, contactEmail } = req.body;

    if (!entityId || !name || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Verify ownership (the authenticated user must own the entity)
        const entity = await prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity) return res.status(404).json({ error: 'Entity not found' });
        if (entity.userId !== req.userId) return res.status(403).json({ error: 'Unauthorized to manage this entity' });

        // Upsert Service Provider Profile
        const serviceProvider = await prisma.serviceProvider.upsert({
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
    } catch (error) {
        console.error("Register Service Error:", error);
        res.status(500).json({ error: 'Failed to register service provider' });
    }
});

// POST /services/promote - Promote Entity to Govt Service (Admin)
router.post('/promote', authenticate, async (req: any, res: any) => {
    const { entityId, description, contactEmail } = req.body;

    if (!entityId) {
        return res.status(400).json({ error: 'Entity ID is required' });
    }

    try {
        const entity = await prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity) return res.status(404).json({ error: 'Entity not found' });

        // Upsert Service Provider with Govt Flag
        const serviceProvider = await prisma.serviceProvider.upsert({
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
    } catch (error) {
        console.error("Promote Service Error:", error);
        res.status(500).json({ error: 'Failed to promote service' });
    }
});

// POST /services/demote - Remove Govt Service Status (Admin)
router.post('/demote', authenticate, async (req: any, res: any) => {
    const { entityId } = req.body;

    if (!entityId) {
        return res.status(400).json({ error: 'Entity ID is required' });
    }

    try {
        const serviceProvider = await prisma.serviceProvider.update({
            where: { entityId },
            data: {
                isGovernmentService: false,
                category: 'OTHER', // Revert to generic category
            }
        });

        res.json({ success: true, serviceProvider });
    } catch (error) {
        console.error("Demote Service Error:", error);
        res.status(500).json({ error: 'Failed to demote service' });
    }
});

export default router;
