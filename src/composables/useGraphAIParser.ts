import type * as vscode from "vscode";
import { parseObjectWithReferences } from "../lib/objectParser";

/**
 * Parses GraphAI object from cursor position
 */
export async function parseGraphAIObject(
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<string | null> {
  try {
    const sourceCode = document.getText();

    // Parse object with all variable references resolved
    const jsonSafeObject = parseObjectWithReferences(sourceCode, position);

    if (!jsonSafeObject) {
      return null;
    }

    // Check if the object looks like a GraphAI graph
    if (!isGraphAILike(jsonSafeObject)) {
      return null;
    }

    // Convert to JSON string
    return JSON.stringify(jsonSafeObject, null, 2);
  } catch (error) {
    return null;
  }
}

/**
 * Checks if an object looks like a GraphAI graph
 */
type GraphAILike = {
  nodes: Record<string, { agent?: unknown; value?: unknown }>;
  version: string;
  edges: Record<string, string>;
};

function isGraphAILike(obj: GraphAILike): boolean {
  // Check for typical GraphAI properties
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  // Check for nodes, version, edges properties
  const hasTypicalProps = !!(obj.nodes || obj.version || obj.edges);

  // Check nodes object contents
  if (obj.nodes && typeof obj.nodes === "object") {
    // Look for agent or value properties in nodes
    for (const nodeName in obj.nodes) {
      const node = obj.nodes[nodeName];
      if (
        node &&
        typeof node === "object" &&
        (node.agent || node.value !== undefined)
      ) {
        return true;
      }
    }
  }

  return hasTypicalProps;
}
