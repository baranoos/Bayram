import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { normalizeEmail, usernameFromEmail } from "../src/lib/users";

const prisma = new PrismaClient();

const SEED_EMAIL = "hillfiger03@gmail.com";
const SEED_PASSWORD = "EigenHuisBayram12";

async function main() {
  const email = normalizeEmail(SEED_EMAIL);
  const username = usernameFromEmail(email);
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "OWNER", username },
    create: {
      username,
      email,
      passwordHash,
      role: "OWNER",
    },
  });

  console.log(`User ready: ${user.email} (id ${user.id}, role ${user.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
