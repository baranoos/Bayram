import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";

export default async function OpdrachtPage({
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

  async function saveOpdracht(formData: FormData) {
    "use server";

    const intent = String(formData.get("intent") ?? "save");
    const statusValue = String(formData.get("opdrachtStatus") ?? "nieuw");
    const opdrachtgeverNaam = String(formData.get("opdrachtgeverNaam") ?? "").trim();
    const opdrachtgeverEmail = String(formData.get("opdrachtgeverEmail") ?? "").trim() || null;
    const opdrachtgeverTelefoon = String(formData.get("opdrachtgeverTelefoon") ?? "").trim() || null;
    const typeWoning = String(formData.get("typeWoning") ?? "").trim() || null;
    const adresStraat = String(formData.get("adresStraat") ?? "").trim();
    const adresPostcode = String(formData.get("adresPostcode") ?? "").trim();
    const adresPlaats = String(formData.get("adresPlaats") ?? "").trim();
    const betalingswijze = String(formData.get("betalingswijze") ?? "").trim() || null;
    const extraUren = Number(formData.get("extraUren") ?? 0) || 0;
    const correcties = String(formData.get("correcties") ?? "").trim() || null;

    if (!opdrachtgeverNaam || !adresStraat || !adresPostcode || !adresPlaats) {
      return;
    }

    await prisma.opdracht.update({
      where: { id: opdrachtId },
      data: {
        status: intent === "finish" ? "afgerond" : statusValue,
        opdrachtgeverNaam,
        opdrachtgeverEmail,
        opdrachtgeverTelefoon,
        typeWoning,
        adresStraat,
        adresPostcode,
        adresPlaats,
        betalingswijze,
        extraUren,
        correcties,
      },
    });

    revalidatePath(`/opdracht/${opdrachtId}/opdracht`);
    revalidatePath(`/opdracht/${opdrachtId}/details`);
    revalidatePath("/");
  }

  return (
    <form action={saveOpdracht} className="space-y-6">
      <SectionCard title="Opdracht" description="Administratieve en financiële gegevens voor het dossier.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Woning adres
            <input defaultValue={opdracht.adresStraat} name="adresStraat" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Postcode
            <input defaultValue={opdracht.adresPostcode} name="adresPostcode" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Plaats
            <input defaultValue={opdracht.adresPlaats} name="adresPlaats" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Status
            <select defaultValue={opdracht.status} name="opdrachtStatus" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
              <option value="nieuw">Nieuw</option>
              <option value="in behandeling">In behandeling</option>
              <option value="afgerond">Afgerond</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Opdrachtgever
            <input defaultValue={opdracht.opdrachtgeverNaam} name="opdrachtgeverNaam" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" readOnly />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            E-mail
            <input defaultValue={opdracht.opdrachtgeverEmail ?? ""} name="opdrachtgeverEmail" type="email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" readOnly />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Telefoon
            <input defaultValue={opdracht.opdrachtgeverTelefoon ?? ""} name="opdrachtgeverTelefoon" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" readOnly />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Type woning
            <input defaultValue={opdracht.typeWoning ?? ""} name="typeWoning" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Betalingswijze
            <input defaultValue={opdracht.betalingswijze ?? ""} name="betalingswijze" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Extra uren
            <input defaultValue={opdracht.extraUren} name="extraUren" type="number" min="0" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Correcties
            <textarea defaultValue={opdracht.correcties ?? ""} name="correcties" rows={4} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
        </div>
      </SectionCard>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="submit" name="intent" value="save" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
          Opslaan
        </button>
        <button
          type="submit"
          name="intent"
          value="finish"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Afronden
        </button>
      </div>
    </form>
  );
}
