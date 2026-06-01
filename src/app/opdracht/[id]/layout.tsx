import { notFound } from "next/navigation";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";

export default async function OpdrachtLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);

  if (Number.isNaN(opdrachtId)) {
    notFound();
  }

  const opdracht = await getWorkspaceOpdracht(opdrachtId);

  if (!opdracht) {
    notFound();
  }

  return (
    <WorkspaceShell
      opdrachtId={opdracht.id}
      title={opdracht.opdrachtgeverNaam}
      address={`${opdracht.adresStraat}, ${opdracht.adresPostcode} ${opdracht.adresPlaats}`}
      status={opdracht.status}
    >
      {children}
    </WorkspaceShell>
  );
}
