"use client";

import { useState } from "react";

type TreeNodeType = {
  id: number;
  omschrijving: string;
  children?: TreeNodeType[];
};

type Props = {
  node: TreeNodeType;
};

export default function TreeNode({ node }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-4">
      <div className="flex items-center gap-2 py-1">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 border rounded"
          >
            {expanded ? "-" : "+"}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className="text-left hover:text-blue-400"
        >
          {node.omschrijving}
        </button>
      </div>

      {expanded && hasChildren && (
        <div className="ml-4 border-l pl-4">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}