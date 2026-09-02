import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvVars() {
  const settingsPath = path.join(__dirname, '..', 'local.settings.json');
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    for (const [key, value] of Object.entries(settings.Values || {})) {
      if (!process.env[key]) {
        process.env[key] = value as string;
      }
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  loadEnvVars();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@esg.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('SEED_ADMIN_PASSWORD is not set. Add it to local.settings.json or set it as an environment variable.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin user ${adminEmail} already exists. Skipping seed.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
      membershipPaid: true,
    },
  });

  console.log(`Admin user created: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
