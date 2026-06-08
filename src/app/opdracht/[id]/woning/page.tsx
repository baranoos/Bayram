import { notFound } from "next/navigation";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";
import { getWorkspaceOptions } from "@/lib/dynamicOptions";
import WoningForm from "./WoningForm";

export default async function WoningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);

  const [opdracht, options] = await Promise.all([
    getWorkspaceOpdracht(opdrachtId),
    getWorkspaceOptions(),
  ]);

  if (!opdracht) {
    notFound();
  }

  const w = opdracht.woning;

  const initialValues = {
    objectNaam:                    w?.objectNaam                    ?? null,
    projectNaam:                   w?.projectNaam                   ?? null,
    typeWoning:                    w?.typeWoning                    ?? null,
    woningGrootte:                 w?.woningGrootte                 ?? null,
    bouwwijze:                     w?.bouwwijze                     ?? null,
    bouwjaar:                      w?.bouwjaar                      ?? null,
    omschrijving:                  w?.omschrijving                  ?? null,
    bouwer:                        w?.bouwer                        ?? null,
    vestigingsplaatsBouwer:        w?.vestigingsplaatsBouwer        ?? null,
    contractpartij:                w?.contractpartij                ?? null,
    vestigingsplaatsContractpartij: w?.vestigingsplaatsContractpartij ?? null,
    vertegenwoordiger:             w?.vertegenwoordiger             ?? null,
    weersomstandigheden:           w?.weersomstandigheden           ?? null,
    inregelrapportMvwtw:           w?.inregelrapportMvwtw           ?? null,
    energielabel:                  w?.energielabel                  ?? null,
    beglazing:                     w?.beglazing                     ?? null,
    opmerkingen:                   w?.opmerkingen                   ?? null,
    garantieRegeling:              w?.garantieRegeling              ?? null,
    omstandigheidItems:            w?.omstandigheidItems            ?? [],
    fotoVoorbladPad:               w?.fotoVoorbladPad               ?? null,
    opdrachtTypeWoning:            opdracht.typeWoning              ?? null,
  };

  return (
    <WoningForm
      opdrachtId={opdrachtId}
      initialValues={initialValues}
      options={options}
    />
  );
}
