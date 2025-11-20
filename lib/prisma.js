// lib/prisma.js

import 'dotenv/config';               // make sure .env is loaded
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the environment');
}

// Prisma 7 "client" engine needs an adapter
const adapter = new PrismaPg({
  connectionString,
});

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  // avoid creating many clients in dev (Next hot reload)
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      adapter,
      log: ['warn', 'error'],
    });
  }
  prisma = global.prisma;
}

export { prisma };