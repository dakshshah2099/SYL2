import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Truncating database...');

    // Disable foreign key checks to allow truncation
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    try {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE SecurityAlert;');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE Consent;');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE Session;');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE AccessLog;');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE Entity;');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE User;');
        console.log('All tables truncated successfully.');
    } catch (error) {
        console.error('Error truncating tables:', error);
    } finally {
        // Re-enable foreign key checks
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
