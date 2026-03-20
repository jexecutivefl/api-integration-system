import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getLibSQLUrl(): string {
  const url = process.env.DATABASE_URL!;
  // Prisma CLI resolves file: paths relative to prisma/ dir,
  // but libSQL resolves relative to CWD. Adjust for local dev.
  if (url.startsWith('file:./')) {
    return url.replace('file:./', 'file:./prisma/');
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaLibSQL({
    url: getLibSQLUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
