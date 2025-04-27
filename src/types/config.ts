import type { ConfigRef } from 'reactive-vscode';

/**
 * Type for agent click action configuration
 * 'docs' - Opens documentation
 * 'source' - Opens source code
 */
export type AgentClickAction = 'docs' | 'source';

/**
 * Configuration interface for GraphAI Visualizer
 */
export interface GraphAIVisualizerConfig {
  /**
   * Configuration for agent click action
   */
  agentClickAction: ConfigRef<AgentClickAction>;
}
