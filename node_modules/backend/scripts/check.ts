import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to Prisma...');
    await prisma.$connect();
    console.log('Connected!');

    const count = await prisma.user.count();
    console.log(`User count: ${count}`);
}

main()
    .catch(e => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
