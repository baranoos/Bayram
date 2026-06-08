import { notFound } from "next/navigation";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";
import MeterstandenForm from "./MeterstandenForm";

export default async function MeterstandenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);
  const opdracht = await getWorkspaceOpdracht(opdrachtId);

  if (!opdracht) {
    notFound();
  }

  const m = opdracht.meterstanden;
  const initialValues = {
    elektraI:       m?.elektraI        ?? null,
    elektraII:      m?.elektraII       ?? null,
    elektraRetourI: m?.elektraRetourI  ?? null,
    elektraRetourII:m?.elektraRetourII ?? null,
    water:          m?.water           ?? null,
    warmte:         m?.warmte          ?? null,
    warmwater:      m?.warmwater       ?? null,
    koeling:        m?.koeling         ?? null,
    gas:            m?.gas             ?? null,
  };

  return (
    <MeterstandenForm
      opdrachtId={opdrachtId}
      initialValues={initialValues}
    />
  );
}
