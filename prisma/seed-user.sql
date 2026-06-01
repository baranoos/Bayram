-- Run in Supabase SQL Editor if `npm run db:seed-user` cannot connect.
-- Requires the "User" table (run `npm run db:push` first when possible).

INSERT INTO "User" (username, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  'hillfiger03',
  'hillfiger03@gmail.com',
  '$2a$10$hqy1.7L67YsKlwbybvBvCOxJ.5zK8Jpyscw1JXK9Mw9nQ8YSZhoqK',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  "passwordHash" = EXCLUDED."passwordHash",
  role = 'admin',
  username = EXCLUDED.username,
  "updatedAt" = NOW();
