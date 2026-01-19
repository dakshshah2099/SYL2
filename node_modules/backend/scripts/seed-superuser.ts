
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Government Superuser...');

    const serviceId = 'admin.gov';
    const rawPassword = 'admin'; // Keeping it simple for local dev/demo
    const entityName = 'Central Government Admin';

    try {
        // 1. Check if exists
        const existingUser = await prisma.user.findUnique({
            where: { serviceId }
        });

        if (existingUser) {
            console.log('Superuser already exists.');
            return;
        }

        // 2. Create User
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const user = await prisma.user.create({
            data: {
                serviceId,
                password: hashedPassword,
                email: 'admin@gov.in', // Optional but good for record
            }
        });

        // 3. Create Entity (GOVT Type)
        const entity = await prisma.entity.create({
            data: {
                id: 'gov-superuser',
                userId: user.id,
                type: 'GOVT',
                name: entityName,
                verified: true,
                details: {
                    role: 'SUPERUSER',
                    department: 'Central Administration'
                }
            }
        });

        console.log('------------------------------------------------');
        console.log('Superuser Created Successfully!');
        console.log(`Service ID : ${serviceId}`);
        console.log(`Password   : ${rawPassword}`);
        console.log(`Entity ID  : ${entity.id}`);
        console.log('------------------------------------------------');

    } catch (e) {
        console.error('Error seeding superuser:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
