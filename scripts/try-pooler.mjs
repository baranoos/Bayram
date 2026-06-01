import "dotenv/config";
import pg from "pg";

const ref = process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const passwordMatch = process.env.DATABASE_URL?.match(/postgres(?:\.[^:]+)?:([^@]+)@/);
const password = passwordMatch?.[1];

if (!ref || !password) {
  console.error("Set SUPABASE_URL and DATABASE_URL in .env first.");
  process.exit(1);
}

const regions = [
  "eu-central-1",
  "eu-central-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "sa-east-1",
];

for (const region of regions) {
  for (const prefix of ["aws-0", "aws-1"]) {
    const host = `${prefix}-${region}.pooler.supabase.com`;
    const url = `postgresql://postgres.${ref}:${password}@${host}:6543/postgres?pgbouncer=true&sslmode=require`;
    const client = new pg.Client({
      connectionString: url,
      connectionTimeoutMillis: 10000,
    });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      console.log("\n✓ Working connection (copy to .env as DATABASE_URL):");
      console.log(url);
      process.exit(0);
    } catch (e) {
      const msg = (e.message ?? "").slice(0, 70);
      if (!msg.includes("certificate")) {
        console.log(`  ${prefix}-${region}:6543 → ${msg}`);
      }
    }
  }
}

console.error("\nNo region matched. Open Supabase → Connect → ORM → Prisma and copy DATABASE_URL exactly.");
