const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin(email) {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      return;
    }

    // Update the user to be an admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });

    console.log(`User ${updatedUser.name} (${updatedUser.email}) has been made an admin.`);
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if email was provided
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address: node makeAdmin.js user@example.com');
  process.exit(1);
}

// Make the user an admin
makeAdmin(email); 