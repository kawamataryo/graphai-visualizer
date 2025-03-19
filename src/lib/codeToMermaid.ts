import { type GraphData, inputs2dataSources } from "graphai";
import YAML from "yaml";

/**
 * Creates an indentation string based on the depth of the node path.
 * The indentation level is determined by counting the number of segments in the path.
 *
 * @param parentNodePath - The dot-separated path to the parent node
 * @returns A string with spaces for indentation
 */
const makeIndent = (parentNodePath: string) =>
  " ".repeat(parentNodePath.split(".").length);

const addConnectionsToGraph = ({
  lines,
  nodeId,
  inputs,
  graphData,
  parentNodePath,
}: {
  lines: string[];
  nodeId: string;
  inputs: any;
  graphData: GraphData;
  parentNodePath: string;
}) => {
  if (graphData) {
    const indent = makeIndent(parentNodePath);
    let sources = inputs2dataSources(inputs);
    if (!Array.isArray(sources)) {
      sources = [sources];
    }
    sources.map((source) => {
      if (source.nodeId) {
        if (source.propIds) {
          lines.push(
            `${indent}${parentNodePath}${source.nodeId} -- ${source.propIds.join(".")} --> ${parentNodePath}${nodeId}`,
          );
        } else {
          lines.push(
            `${indent}${parentNodePath}${source.nodeId} --> ${parentNodePath}${nodeId}`,
          );
        }
      }
    });
  }
};

/**
 * Processes a graph structure and converts it to Mermaid flowchart syntax.
 * This function recursively traverses the graph data structure, generating Mermaid
 *
 * @param graphData - The graph data structure to process
 * @param lines - Array to collect the generated Mermaid syntax lines
 * @param staticNodes - Array to collect static node IDs for styling
 * @param computedNodes - Array to collect computed node IDs for styling
 * @param nestedGraphNodes - Array to collect nested graph node IDs for styling
 * @param parentNodePath - The path to the parent node, used for nesting and indentation
 */
const processGraph = ({
  graphData,
  lines,
  staticNodes,
  computedNodes,
  nestedGraphNodes,
  parentNodePath = "",
}: {
  graphData: GraphData;
  lines: string[];
  staticNodes: string[];
  computedNodes: string[];
  nestedGraphNodes: string[];
  parentNodePath: string;
}) => {
  for (const nodeId of Object.keys(graphData.nodes)) {
    const node = graphData.nodes[nodeId];
    const fullNodeId = `${parentNodePath}${nodeId}`;
    const indent = makeIndent(parentNodePath);
    if ("graph" in node) {
      const inputs = typeof node.graph === "string" ? node.graph : node.inputs;
      if (inputs) {
        addConnectionsToGraph({
          lines,
          nodeId,
          inputs,
          graphData,
          parentNodePath,
        });
      }
      lines.push(
        `${indent}subgraph ${fullNodeId}[${nodeId}: <span class="agent-name">${node.agent}</span>]`,
      );
      if ((node.graph as GraphData).nodes) {
        processGraph({
          graphData: node.graph as GraphData,
          lines,
          staticNodes,
          computedNodes,
          nestedGraphNodes,
          parentNodePath: `${fullNodeId}.`,
        });
      }
      lines.push(`${indent}end`);
      nestedGraphNodes.push(fullNodeId);
    } else if ("agent" in node) {
      lines.push(
        `${indent}${fullNodeId}(${nodeId}<br/><span class="agent-name">${node.agent}</span>)`,
      );
      if (node.inputs) {
        addConnectionsToGraph({
          lines,
          nodeId,
          inputs: node.inputs,
          graphData,
          parentNodePath,
        });
      }
      computedNodes.push(fullNodeId);
    } else {
      lines.push(`${indent}${fullNodeId}(${nodeId})`);
      staticNodes.push(fullNodeId);
      if ("update" in node) {
        addConnectionsToGraph({
          lines,
          nodeId,
          inputs: { update: node.update },
          graphData,
          parentNodePath,
        });
      }
    }
  }
};

export const codeToMermaid = (code: string, fileLanguageId: string) => {
  if (fileLanguageId !== "yaml" && fileLanguageId !== "json") {
    return "";
  }
  const graphData =
    fileLanguageId === "yaml"
      ? (YAML.parse(code) as GraphData)
      : (JSON.parse(code) as GraphData);
  const lines: string[] = ["flowchart TD"];

  const staticNodes: string[] = [];
  const computedNodes: string[] = [];
  const nestedGraphNodes: string[] = [];

  processGraph({
    graphData,
    lines,
    staticNodes,
    computedNodes,
    nestedGraphNodes,
    parentNodePath: "",
  });

  if (staticNodes.length > 0) {
    lines.push(`class ${staticNodes.join(",")} staticNode`);
  }

  if (computedNodes.length > 0) {
    lines.push(`class ${computedNodes.join(",")} computedNode`);
  }

  if (nestedGraphNodes.length > 0) {
    lines.push(`class ${nestedGraphNodes.join(",")} nestedGraph`);
  }

  return lines.join("\n");
};
