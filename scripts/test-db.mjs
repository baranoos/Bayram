import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("Database connection OK");
  console.log("Host:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
} catch (error) {
  console.error("Database connection failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
