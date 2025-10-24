// FilePath: prisma/seed.ts
// Title: Prisma seed for first admin user (with deletion if exists)
// Reason: Ensures a clean, consistent initialization by removing the existing admin user before creating a new one.

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'evillan0315@gmail.com';
  const plainPassword = 'Admin@123'; // Consider loading from environment variable for security

  console.log('🔄 Seeding admin user...');

  // Delete existing admin user if exists
  await prisma.user.delete({
    where: { email: adminEmail },
  }).catch(() => {
    // Ignore if user does not exist
  });

  // Hash password before storing
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Create fresh admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Eddie Villanueva',
      username: 'eddie',
      role: 'ADMIN',
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
    include: { password: true },
  });

  console.log('✅ Admin user recreated successfully:');
  console.log({
    email: adminUser.email,
    role: adminUser.role,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

