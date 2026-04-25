function buildRailwayDatabaseUrl() {
  const host = process.env.RAILWAY_PRIVATE_DOMAIN;
  const user = process.env.PGUSER;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  if (!host || !user || !password || !database) {
    return null;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const encodedDatabase = encodeURIComponent(database);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:5432/${encodedDatabase}`;
}

function getDatabaseUrl() {
  return buildRailwayDatabaseUrl() || process.env.DIRECT_URL || process.env.DATABASE_URL || null;
}

module.exports = {
  buildRailwayDatabaseUrl,
  getDatabaseUrl,
};