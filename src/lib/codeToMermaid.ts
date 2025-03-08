import YAML from "yaml";
import { GraphData, inputs2dataSources } from "graphai";

const addConnectionsToGraph = ({
  lines,
  nodeId,
  inputs,
  graphData
}: {
  lines: string[],
  nodeId: string,
  inputs: any,
  graphData: GraphData
}) => {
  if (graphData) {
    inputs2dataSources(inputs).map((source) => {
      if (source.nodeId) {
        const sourceNode = graphData.nodes[source.nodeId];
        const sourceAgentName = sourceNode && "agent" in sourceNode ? `<br/><span class="agent-name">${sourceNode.agent}</span>` : '';

        if (source.propIds) {
          lines.push(` ${source.nodeId}(${source.nodeId}${sourceAgentName}) -- ${source.propIds.join(".")} --> ${nodeId}`);
        } else {
          lines.push(` ${source.nodeId}(${source.nodeId}${sourceAgentName}) --> ${nodeId}`);
        }
      }
    });
  }
};

export const codeToMermaid = (code: string, fileLanguageId: string) => {
  if (fileLanguageId !== 'yaml' && fileLanguageId !== 'json') {
    return ''
  }
  const graphData = fileLanguageId === 'yaml' ? YAML.parse(code) as GraphData : JSON.parse(code) as GraphData;
  const lines: string[] = ["flowchart TD"];

  const staticNodes: string[] = [];
  const dynamicNodes: string[] = [];

  Object.keys(graphData.nodes).forEach((nodeId) => {
    const node = graphData.nodes[nodeId];
    if ("agent" in node) {
      lines.push(` ${nodeId}(${nodeId}<br/><span class="agent-name">${node.agent}</span>)`);
      if (node.inputs) {
        addConnectionsToGraph({ lines, nodeId, inputs: node.inputs, graphData });
      }
      dynamicNodes.push(nodeId);
    } else {
      lines.push(` ${nodeId}(${nodeId})`);
      staticNodes.push(nodeId);

      if ("update" in node) {
        addConnectionsToGraph({ lines, nodeId, inputs: { update: node.update }, graphData });
      }
    }
  });

  if (staticNodes.length > 0) {
    lines.push(`class ${staticNodes.join(',')} staticNode`);
  }

  if (dynamicNodes.length > 0) {
    lines.push(`class ${dynamicNodes.join(',')} computedNode`);
  }

  return lines.join("\n");
};
