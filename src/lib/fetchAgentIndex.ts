import type { AgentIndex } from "../composables/useAgentProvider";
import { logger } from "../utils";

/**
 * Fetch agentIndex from GitHub
 */
export const fetchAgentIndex = async (): Promise<AgentIndex> => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/kawamataryo/graphai-visualizer/main/src/agentIndex.json",
    );
    if (!response.ok) {
      throw new Error("Failed to fetch agentIndex.json");
    }
    return (await response.json()) as AgentIndex;
  } catch (error) {
    logger.error("Error fetching agentIndex:", error);
    // Fallback to local agentIndex
    const localAgentIndex = await import("../agentIndex.json");
    return localAgentIndex as AgentIndex;
  }
};
