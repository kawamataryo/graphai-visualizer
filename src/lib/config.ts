import { defineConfigs } from "reactive-vscode";
import type { AgentClickAction } from "../types/config";

/**
 * Configuration for GraphAI Visualizer
 * Defines settings for agent click behavior
 */
export const config = defineConfigs("graphai-visualizer", {
  agentClickAction: String as unknown as AgentClickAction,
});
