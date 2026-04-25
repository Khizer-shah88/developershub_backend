require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDatabaseUrl } = require('../database-connection.js');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = value;
    i += 1;
  }
  return out;
}

function generateTemporaryPassword() {
  return crypto.randomBytes(12).toString('base64url');
}

async function main() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error('Database connection URL is not set');
  }

  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const name = args.name;
  const temporaryPassword = args.password || generateTemporaryPassword();

  if (!email) {
    throw new Error(
      'Usage: npm run recover-admin -- --email admin@developershub.com [--name "Admin Name"] [--password "TempPassword"]',
    );
  }

  const pool = new Pool({
    connectionString,
    family: 4,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const existing = await prisma.user.findUnique({ where: { email } });

    let adminUser;
    if (existing) {
      adminUser = await prisma.user.update({
        where: { email },
        data: {
          name: name || existing.name,
          password: hashedPassword,
          role: 'ADMIN',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      console.log('Recovered existing user as ADMIN.');
    } else {
      adminUser = await prisma.user.create({
        data: {
          email,
          name: name || 'Recovered Admin',
          password: hashedPassword,
          role: 'ADMIN',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      console.log('Created new ADMIN user for recovery.');
    }

    console.log('Recovery result:', adminUser);
    console.log('Temporary password:', temporaryPassword);
    console.log('Next step: log in immediately and change the password.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('recover-admin failed:', error.message);
  process.exit(1);
});
