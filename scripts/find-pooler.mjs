import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const ref = refMatch?.[1];
const password = process.env.DATABASE_URL?.match(/postgres(?:\.[^:]*)?:([^@]+)@/)?.[1];

if (!ref) {
  console.error("Set SUPABASE_URL in .env (https://YOUR_REF.supabase.co)");
  process.exit(1);
}
if (!password) {
  console.error("Set DATABASE_URL in .env first");
  process.exit(1);
}

const regions = [
  "eu-west-1",
  "eu-central-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "us-east-1",
  "us-west-1",
];

for (const region of regions) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const url = `postgresql://postgres.${ref}:${password}@${host}:5432/postgres?sslmode=require`;
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 8000 });
    await client.connect();
    await client.end();
    console.log("Working pooler URL:");
    console.log(url);
    process.exit(0);
  } catch {
    console.log(`no: ${region}`);
  }
}

console.error("No pooler region matched. Copy Session pooler URL from Supabase dashboard.");
