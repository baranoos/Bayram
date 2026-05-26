import Link from "next/link";
import TreeNode from "@/components/keuring/TreeNode";
import { buildTree } from "@/lib/buildTree";

export default async function KeuringNodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tree = await buildTree(Number(id), 2);

  if (!tree) {
    return (
      <div className="p-8">
        Node niet gevonden
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/keuring"
        className="text-blue-500"
      >
        ← Terug
      </Link>

      <div className="mt-6 border rounded-lg p-4">
        <TreeNode node={tree} />
      </div>
    </div>
  );
}