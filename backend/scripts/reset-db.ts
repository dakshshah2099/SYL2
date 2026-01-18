import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database truncation...');

    try {
        // 1. Delete Child Tables (Leaf nodes)
        // Although Cascade is set in schema, deleteMany relies on DB configuration.
        // Explicit deletion is safer for a script.
        console.log('Deleting AccessLogs...');
        await prisma.accessLog.deleteMany({});

        console.log('Deleting SecurityAlerts...');
        await prisma.securityAlert.deleteMany({});

        console.log('Deleting Consents...');
        await prisma.consent.deleteMany({});

        // 2. Delete Entities (Parents of above, Children of User)
        console.log('Deleting Entities...');
        await prisma.entity.deleteMany({});

        // 3. Delete Sessions (Children of User)
        console.log('Deleting Sessions...');
        await prisma.session.deleteMany({});

        // 4. Delete Users (Root)
        console.log('Deleting Users...');
        await prisma.user.deleteMany({});

        console.log('✅ Database truncated successfully.');
    } catch (error) {
        console.error('❌ Error truncating database:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
