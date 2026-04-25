import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function buildRailwayDatabaseUrl() {
  const host =
    process.env.RAILWAY_PRIVATE_DOMAIN ||
    process.env.POSTGRES_HOST ||
    process.env.PGHOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB;

  if (!host || !user || !password || !database) {
    return null;
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:5432/${encodeURIComponent(database)}`;
}

function isStaleSupabaseUrl(url: string | undefined) {
  return typeof url === 'string' && url.includes('supabase.co');
}

function getDatabaseUrl() {
  const railwayUrl = buildRailwayDatabaseUrl();
  if (railwayUrl) {
    return railwayUrl;
  }

  const directUrl = process.env.DIRECT_URL;
  if (directUrl && !isStaleSupabaseUrl(directUrl)) {
    return directUrl;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !isStaleSupabaseUrl(databaseUrl)) {
    return databaseUrl;
  }

  return null;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error('Database connection URL is not set');
    }

    const pool = new Pool({
      connectionString,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}