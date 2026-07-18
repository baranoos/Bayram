import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sanitizeUser } from "@/lib/users";
import UsersManager from "./UsersManager";

export default async function GebruikersPage() {
  const me = await getCurrentUser();
  if (!me || !me.active || me.role !== "OWNER") {
    redirect("/settings");
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const initialUsers = users.map(sanitizeUser).map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }));

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <UsersManager initialUsers={initialUsers} currentUserId={me.id} />
    </main>
  );
}
