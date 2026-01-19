import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Govt User...');

    const serviceId = "GOVT-ADMIN";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { serviceId } });
    if (existing) {
        console.log("Govt user exists. Updating password...");
        await prisma.user.update({
            where: { serviceId },
            data: { password: hashedPassword }
        });
        return;
    }

    const newUser = await prisma.user.create({
        data: {
            serviceId,
            password: hashedPassword
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
