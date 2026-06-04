import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";
import { getWorkspaceOptions } from "@/lib/dynamicOptions";
import FotoVoorbladUpload from "@/components/woning/FotoVoorbladUpload";

export default async function WoningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);
  const opdracht = await getWorkspaceOpdracht(opdrachtId);
  const options = await getWorkspaceOptions();

  if (!opdracht) {
    notFound();
  }

  const woning = opdracht.woning;

  async function saveWoning(formData: FormData) {
    "use server";

    const objectNaam = String(formData.get("objectNaam") ?? "").trim() || null;
    const projectNaam = String(formData.get("projectNaam") ?? "").trim() || null;
    const typeWoning = String(formData.get("typeWoning") ?? "").trim() || null;
    const woningGrootte = String(formData.get("woningGrootte") ?? "").trim() || null;
    const bouwwijze = String(formData.get("bouwwijze") ?? "").trim() || null;
    const bouwjaarRaw = String(formData.get("bouwjaar") ?? "").trim();
    const bouwjaar = bouwjaarRaw ? Number(bouwjaarRaw) : null;
    const omstandigheden = String(formData.get("omstandigheden") ?? "").trim() || null;
    const opmerking = String(formData.get("opmerking") ?? "").trim() || null;
    const fotoUrls = (formData.getAll("fotoVoorblad") as string[]).filter(Boolean);
    const fotoVoorbladPad = fotoUrls.length > 0 ? JSON.stringify(fotoUrls) : null;
    const garantieRegeling = String(formData.get("garantieRegeling") ?? "").trim() || null;
    const omschrijving = String(formData.get("omschrijving") ?? "").trim() || null;
    const bouwer = String(formData.get("bouwer") ?? "").trim() || null;
    const vestigingsplaatsBouwer = String(formData.get("vestigingsplaatsBouwer") ?? "").trim() || null;
    const contractpartij = String(formData.get("contractpartij") ?? "").trim() || null;
    const vestigingsplaatsContractpartij = String(formData.get("vestigingsplaatsContractpartij") ?? "").trim() || null;
    const vertegenwoordiger = String(formData.get("vertegenwoordiger") ?? "").trim() || null;
    const weersomstandigheden = String(formData.get("weersomstandigheden") ?? "").trim() || null;
    const inregelrapport = String(formData.get("inregelrapport") ?? "").trim() || null;
    const energielabel = String(formData.get("energielabel") ?? "").trim() || null;
    const beglazing = String(formData.get("beglazing") ?? "").trim() || null;

    await prisma.woning.upsert({
      where: { opdrachtId },
      create: {
        opdrachtId,
        objectNaam,
        projectNaam,
        typeWoning,
        woningGrootte,
        bouwwijze,
        bouwjaar,
        omstandigheden,
        opmerking,
        fotoVoorbladPad,
        garantieRegeling,
        omschrijving,
        bouwer,
        vestigingsplaatsBouwer,
        contractpartij,
        vestigingsplaatsContractpartij,
        vertegenwoordiger,
        weersomstandigheden,
        inregelrapportMvwtw: inregelrapport,
        energielabel,
        beglazing,
      },
      update: {
        objectNaam,
        projectNaam,
        typeWoning,
        woningGrootte,
        bouwwijze,
        bouwjaar,
        omstandigheden,
        opmerking,
        fotoVoorbladPad,
        garantieRegeling,
        omschrijving,
        bouwer,
        vestigingsplaatsBouwer,
        contractpartij,
        vestigingsplaatsContractpartij,
        vertegenwoordiger,
        weersomstandigheden,
        inregelrapportMvwtw: inregelrapport,
        energielabel,
        beglazing,
      },
    });

    revalidatePath(`/opdracht/${opdrachtId}/woning`);
    revalidatePath(`/opdracht/${opdrachtId}/details`);
    revalidatePath("/");
  }

  return (
    <form action={saveWoning} className="space-y-6">
      <SectionCard title="Object" description="Objectgegevens van het inspectiedossier.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 text-sm font-medium text-slate-700">
            Foto voorblad
            <FotoVoorbladUpload defaultValue={woning?.fotoVoorbladPad} opdrachtId={opdrachtId} />
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Type woning*
            <select defaultValue={woning?.typeWoning ?? opdracht.typeWoning ?? ""} name="typeWoning" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
              <option value="">Maak een keuze</option>
              {options.woningType.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Woninggrootte
            <select defaultValue={woning?.woningGrootte ?? ""} name="woningGrootte" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
              <option value="">Maak een keuze</option>
              {options.woningGrootte.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Bouwwijze*
            <select defaultValue={woning?.bouwwijze ?? ""} name="bouwwijze" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
              <option value="">Maak een keuze</option>
              {options.bouwwijze.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Garantie regeling
            <select defaultValue={woning?.garantieRegeling ?? ""} name="garantieRegeling" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
              <option value="">Maak een keuze</option>
              {options.garantieRegeling.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Projectgegevens" description="Context van het project en het bouwwerk.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Omschrijving
            <input defaultValue={woning?.omschrijving ?? ""} name="omschrijving" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Bouwer
            <input defaultValue={woning?.bouwer ?? ""} name="bouwer" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Vestigingsplaats bouwer
            <input defaultValue={woning?.vestigingsplaatsBouwer ?? ""} name="vestigingsplaatsBouwer" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Contractpartij*
            <input defaultValue={woning?.contractpartij ?? ""} name="contractpartij" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Vestigingsplaats contractpartij*
            <input defaultValue={woning?.vestigingsplaatsContractpartij ?? ""} name="vestigingsplaatsContractpartij" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Vertegenwoordiger*
            <input defaultValue={woning?.vertegenwoordiger ?? ""} name="vertegenwoordiger" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Omstandigheden" description="Inspectieomstandigheden en aanvullende aandachtspunten.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Weersomstandigheden
              <select defaultValue={woning?.weersomstandigheden ?? ""} name="weersomstandigheden" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
                <option value="">Maak een keuze</option>
                {options.weather.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Inregelrapport MV/WTW *
              <select defaultValue={woning?.inregelrapportMvwtw ?? ""} name="inregelrapport" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
                <option value="">Maak een keuze</option>
                {options.inregelrapport.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Energielabel *
              <select defaultValue={woning?.energielabel ?? ""} name="energielabel" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
                <option value="">Maak een keuze</option>
                {options.energielabel.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Beglazing
              <select defaultValue={woning?.beglazing ?? ""} name="beglazing" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
                <option value="">Maak een keuze</option>
                {options.beglazing.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Opmerkingen / bijzonderheden
              <textarea defaultValue={woning?.opmerkingen ?? ""} name="opmerkingen" rows={4} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
            </label>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Geregistreerde omstandigheden</p>
            <div className="mt-4 space-y-3">
              {(woning?.omstandigheidItems ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Nog geen afzonderlijke omstandigheden geregistreerd.</p>
              ) : (
                woning?.omstandigheidItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.waarde}</p>
                    </div>
                    {item.toelichting ? <p className="mt-2 text-sm text-slate-500">{item.toelichting}</p> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
          Woninggegevens opslaan
        </button>
      </div>
    </form>
  );
}
