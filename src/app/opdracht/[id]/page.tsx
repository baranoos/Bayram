import { redirect } from "next/navigation";

export default async function OpdrachtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/opdracht/${id}/details`);
}
