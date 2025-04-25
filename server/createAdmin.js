// Script to create an admin user during deployment
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set');
    process.exit(1);
  }

  try {
    // Check if the admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      // Update the existing user to ensure they're an admin
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { isAdmin: true },
      });
      
      console.log(`Updated existing user ${adminEmail} to admin status`);
      return;
    }

    // Create a new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin User',
        isAdmin: true,
      },
    });

    console.log(`Created admin user: ${adminUser.email}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('Admin user creation process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in admin user creation:', error);
    process.exit(1);
  }); 