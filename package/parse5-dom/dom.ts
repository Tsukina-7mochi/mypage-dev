import type { DefaultTreeAdapterTypes } from "parse5";

type Node = DefaultTreeAdapterTypes.Node;
type ParentNode = Node & { childNodes: Node[] };
type ChildNode = Node & { parentNode: ParentNode | null };

export function appendNodesTo(node: ParentNode, ...newNodes: ChildNode[]) {
  node.childNodes.push(...newNodes);
  for (const n of newNodes) {
    n.parentNode = node;
  }
}

export function replaceNodeWith(node: ChildNode, ...newNodes: ChildNode[]) {
  const parentNode = node.parentNode;
  if (parentNode === null) {
    throw new Error("Element has no parent node");
  }

  const index = parentNode.childNodes.indexOf(node);
  if (index === -1) {
    throw new Error("Element not found in parent's child nodes");
  }
  parentNode.childNodes.splice(index, 1, ...newNodes);

  for (const n of newNodes) {
    n.parentNode = node.parentNode;
  }
}
