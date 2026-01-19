
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting full database truncation...');

    try {
        // Delete in reverse order of dependency
        console.log('Deleting GlobalMandate...');
        await prisma.globalMandate.deleteMany({});

        console.log('Deleting ServiceProvider...');
        await prisma.serviceProvider.deleteMany({});

        console.log('Deleting OrgRegistrationRequest...');
        await prisma.orgRegistrationRequest.deleteMany({});

        console.log('Deleting Consent...');
        await prisma.consent.deleteMany({});

        console.log('Deleting SecurityAlert...');
        await prisma.securityAlert.deleteMany({});

        console.log('Deleting AccessLog...');
        await prisma.accessLog.deleteMany({});

        console.log('Deleting Session...');
        await prisma.session.deleteMany({});

        console.log('Deleting Entity...');
        await prisma.entity.deleteMany({});

        console.log('Deleting User...');
        await prisma.user.deleteMany({});

        console.log('Database truncated successfully.');
    } catch (e) {
        console.error('Error truncating database:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
