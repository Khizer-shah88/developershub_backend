function buildRailwayDatabaseUrl() {
  const host =
    process.env.RAILWAY_PRIVATE_DOMAIN ||
    process.env.POSTGRES_HOST ||
    process.env.PGHOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER || process.env.PGUSER;
  const password =
    process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.PGPASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.PGDATABASE;

  if (!host || !user || !password || !database) {
    return null;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const encodedDatabase = encodeURIComponent(database);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:5432/${encodedDatabase}`;
}

function isStaleSupabaseUrl(url) {
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

module.exports = {
  buildRailwayDatabaseUrl,
  isStaleSupabaseUrl,
  getDatabaseUrl,
};