require('dotenv/config');

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const password = args.password;
  const name = args.name || 'DevelopersHub Admin';
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

  if (!email || !password) {
    throw new Error(
      'Usage: npm run setup-admin -- --email admin@developershub.com --password "StrongPassword" [--name "Admin Name"]',
    );
  }

  const response = await fetch(`${baseUrl}/auth/setup-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  console.log('Admin setup completed:', {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
  });
}

main().catch((error) => {
  console.error('setup-admin failed:', error.message);
  process.exit(1);
});
