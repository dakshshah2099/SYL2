import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create User
    const user = await prisma.user.upsert({
        where: { phone: '9876543210' },
        update: {},
        create: {
            phone: '9876543210',
            password: 'password123', // In real app, hash this!
        },
    });
    console.log({ user });

    // 2. Create Entities
    const indEntity = await prisma.entity.create({
        data: {
            id: 'DID-2024-IN-78432156',
            userId: user.id,
            type: 'INDIVIDUAL',
            name: 'Rajesh Kumar Sharma',
            verified: true,
            details: {
                dob: '1985-03-22',
                attributes: [
                    { id: 'p1', name: 'Full Name', value: 'Rajesh Kumar Sharma', category: 'personal', stored: true, shared: true, lastAccessed: '2025-01-15 14:30', visibility: 'public' },
                    { id: 'p3', name: 'Aadhaar Number', value: 'XXXX-XXXX-4532', category: 'personal', stored: true, shared: true, lastAccessed: '2025-01-14 09:15', visibility: 'protected' }
                ]
            },
        },
    });

    const orgEntity = await prisma.entity.create({
        data: {
            id: 'ORG-KL-2023-998877',
            userId: user.id,
            type: 'ORG',
            name: 'Green Earth Farmers Co-op',
            verified: true,
            registrationNumber: 'COOP-REG-8822',
            jurisdiction: 'Kerala, India',
            details: {
                attributes: [
                    { id: 'o1', name: 'Registration No.', value: 'COOP-REG-8822', category: 'legal', stored: true, shared: true, lastAccessed: '2025-01-10', visibility: 'public' }
                ]
            },
        },
    });

    // 3. Create Sessions
    await prisma.session.create({
        data: {
            id: "s1",
            userId: user.id,
            device: "Chrome on Windows 11",
            browser: "Chrome",
            os: "Windows 11",
            location: "Jaipur, Rajasthan",
            ip: "103.XX.XX.45",
            isCurrent: true,
            token: "mock_token_valid"
        }
    });

    await prisma.session.create({
        data: {
            id: "s2",
            userId: user.id,
            device: "Safari on iPhone 14",
            browser: "Safari",
            os: "iOS 16",
            location: "Jaipur, Rajasthan",
            ip: "103.XX.XX.78",
            isCurrent: false
        }
    });

    // 4. Create Consents
    await prisma.consent.create({
        data: {
            id: "c1",
            entityId: indEntity.id,
            serviceName: "State Health Department",
            entityType: "Government",
            purpose: "COVID-19 Vaccination Drive",
            status: "active",
            grantedOn: new Date("2025-01-10"),
            expiresOn: new Date("2025-04-10"),
            verified: true,
            attributes: ["Full Name", "Date of Birth", "Blood Group"]
        }
    });

    // 5. Create Alerts
    await prisma.securityAlert.create({
        data: {
            id: "alert1",
            entityId: indEntity.id,
            type: "warning",
            title: "Unusual Login Location",
            message: "Login attempt detected from Delhi, NCR. Verify this session.",
            timestamp: new Date("2025-01-15T09:00:00Z"),
            acknowledged: false
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
