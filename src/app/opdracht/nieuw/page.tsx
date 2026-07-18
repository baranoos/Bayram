import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";

async function createOpdracht(formData: FormData) {
  "use server";

  const opdrachtgeverNaam = String(formData.get("opdrachtgeverNaam") ?? "").trim();
  const adresStraat = String(formData.get("adresStraat") ?? "").trim();
  const adresPostcode = String(formData.get("adresPostcode") ?? "").trim();
  const adresPlaats = String(formData.get("adresPlaats") ?? "").trim();

  if (!opdrachtgeverNaam || !adresStraat || !adresPostcode || !adresPlaats) {
    return;
  }

  const status = String(formData.get("status") ?? "nieuw");
  const opdrachtgeverEmail = String(formData.get("opdrachtgeverEmail") ?? "").trim() || null;
  const opdrachtgeverTelefoon = String(formData.get("opdrachtgeverTelefoon") ?? "").trim() || null;
  const typeWoning = String(formData.get("typeWoning") ?? "").trim() || null;
  const betalingswijze = String(formData.get("betalingswijze") ?? "").trim() || null;
  const extraUren = Number(formData.get("extraUren") ?? 0) || 0;
  const createdByUserId = await getCurrentUserId();

  const opdracht = await prisma.opdracht.create({
    data: {
      status,
      opdrachtgeverNaam,
      opdrachtgeverEmail,
      opdrachtgeverTelefoon,
      typeWoning,
      adresStraat,
      adresPostcode,
      adresPlaats,
      betalingswijze,
      extraUren,
      createdByUserId,
      woning: {
        create: {},
      },
      meterstanden: {
        create: {},
      },
    },
  });

  revalidatePath("/");
  redirect(`/opdracht/${opdracht.id}/details`);
}

export default function NieuweOpdrachtPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 lg:px-6">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Nieuwe opdracht
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Dossier aanmaken</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Leg een nieuwe opdracht vast met basisgegevens, waarna de werkruimte direct beschikbaar is.
        </p>
      </div>

      <SectionCard title="Opdrachtgegevens" description="Vul de kerngegevens voor het nieuwe dossier in.">
        <form action={createOpdracht} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Opdrachtgever
              <input name="opdrachtgeverNaam" required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              E-mail
              <input name="opdrachtgeverEmail" type="email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Telefoon
              <input name="opdrachtgeverTelefoon" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Type woning
              <input name="typeWoning" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Straat en huisnummer
              <input name="adresStraat" required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Postcode
              <input name="adresPostcode" required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Plaats
              <input name="adresPlaats" required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Status
              <select name="status" defaultValue="nieuw" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
                <option value="nieuw">Nieuw</option>
                <option value="in behandeling">In behandeling</option>
                <option value="afgerond">Afgerond</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Betalingswijze
              <input name="betalingswijze" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Extra uren
              <input name="extraUren" type="number" min="0" defaultValue="0" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Opdracht aanmaken
            </button>
          </div>
        </form>
      </SectionCard>
    </main>
  );
}
