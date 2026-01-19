import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Govt User...');

    const serviceId = "GOVT-ADMIN";
    const password = "admin123";

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { serviceId } });
    if (existing) {
        console.log("Govt user already exists.");
        return;
    }

    const newUser = await prisma.user.create({
        data: {
            serviceId,
            password
        }
    });

    await prisma.entity.create({
        data: {
            id: `govt-admin-${Date.now()}`,
            userId: newUser.id,
            type: 'GOVT',
            name: 'Ministry of Digital Identity',
            verified: true
        }
    });

    console.log("Govt User Created: GOVT-ADMIN / admin123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
