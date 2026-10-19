import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const password = process.env.SEED_USER_PASSWORD;

  if (!connectionString || !password) {
    throw new Error(
      'Ustaw DATABASE_URL oraz SEED_USER_PASSWORD w backend/.env',
    );
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.upsert({
      where: {
        email: 'tester@example.com',
      },
      update: {},
      create: {
        email: 'tester@example.com',
        nickname: 'Tester',
        nicknameKey: 'tester',
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
      },
    });

    console.log('Konto testowe jest gotowe:', user);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
