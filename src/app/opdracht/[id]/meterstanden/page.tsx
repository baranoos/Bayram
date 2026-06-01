import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";

const meterFields = [
  { name: "elektraI", label: "Elektra I" },
  { name: "elektraII", label: "Elektra II" },
  { name: "elektraRetourI", label: "Elektra retour I" },
  { name: "elektraRetourII", label: "Elektra retour II" },
  { name: "water", label: "Water" },
  { name: "warmte", label: "Warmte" },
  { name: "warmwater", label: "Warmwater" },
  { name: "koeling", label: "Koeling" },
  { name: "gas", label: "Gas" },
] as const;

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

  async function saveMeterstanden(formData: FormData) {
    "use server";

    const readValue = (name: string) => {
      const value = String(formData.get(name) ?? "").trim();
      return value || null;
    };

    await prisma.meterstand.upsert({
      where: { opdrachtId },
      create: {
        opdrachtId,
        elektraI: readValue("elektraI"),
        elektraII: readValue("elektraII"),
        elektraRetourI: readValue("elektraRetourI"),
        elektraRetourII: readValue("elektraRetourII"),
        water: readValue("water"),
        warmte: readValue("warmte"),
        warmwater: readValue("warmwater"),
        koeling: readValue("koeling"),
        gas: readValue("gas"),
      },
      update: {
        elektraI: readValue("elektraI"),
        elektraII: readValue("elektraII"),
        elektraRetourI: readValue("elektraRetourI"),
        elektraRetourII: readValue("elektraRetourII"),
        water: readValue("water"),
        warmte: readValue("warmte"),
        warmwater: readValue("warmwater"),
        koeling: readValue("koeling"),
        gas: readValue("gas"),
      },
    });

    revalidatePath(`/opdracht/${opdrachtId}/meterstanden`);
    revalidatePath(`/opdracht/${opdrachtId}/details`);
    revalidatePath("/");
  }

  const meterstanden = opdracht.meterstanden;

  return (
    <form action={saveMeterstanden} className="space-y-6">
      <SectionCard title="Meterstanden" description="Registreer de beginstanden van alle relevante aansluitingen.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meterFields.map((field) => (
            <label key={field.name} className="grid gap-2 text-sm font-medium text-slate-700">
              {field.label}
              <input
                name={field.name}
                defaultValue={meterstanden ? String(meterstanden[field.name as keyof typeof meterstanden] ?? "") : ""}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white"
              />
            </label>
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
          Meterstanden opslaan
        </button>
      </div>
    </form>
  );
}
