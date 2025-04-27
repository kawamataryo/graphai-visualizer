import * as vscode from "vscode";
import { config } from "../lib/config";

/**
 * Types for agent information and provider
 */
interface AgentInfo {
  name: string;
  docs: string;
  source: string;
}

interface AgentProvider {
  hoverProvider: vscode.Disposable;
  linkProvider: vscode.Disposable;
  dispose: () => void;
}

export interface AgentIndex {
  agents: AgentInfo[];
}

/**
 * Constants for supported languages
 */
const SUPPORTED_LANGUAGES: vscode.DocumentFilter[] = [
  { scheme: "file", language: "yaml" },
  { scheme: "file", language: "json" },
  { scheme: "file", language: "typescript" },
];

/**
 * Helper functions for agent handling
 */

/**
 * Creates a regex pattern for finding agent names in different file types
 */
export const getAgentRegex = (languageId: string, agentNames: string): RegExp => {
  const REGEX_PATTERNS: Record<string, string> = {
    json: `"agent"\\s*:\\s*"(${agentNames})"`,
    yaml: `agent:\\s*(?:["'](${agentNames})["']|(${agentNames}))(?:\\s|,|\\]|\\}|$)`,
    typescript: `agent:\\s*["'](${agentNames})["']`,
    default: `agent:\\s*["'](${agentNames})["']`,
  };
  const pattern = REGEX_PATTERNS[languageId] || REGEX_PATTERNS.default;
  return new RegExp(pattern, "g");
};

/**
 * Retrieves agent information from the agent index
 */
export const getAgentInfo = (agentName: string, agentIndex: AgentIndex): AgentInfo | undefined => {
  return agentIndex.agents.find((agent) => agent.name === agentName);
};

/**
 * Provider implementations
 */

/**
 * Creates a hover provider for agent information
 */
const createHoverProvider = (agentIndex: AgentIndex): vscode.HoverProvider => {
  const agentNames = agentIndex.agents.map((agent) => agent.name).join("|");
  return {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
      const line = document.lineAt(position.line).text;
      const agentRegex = getAgentRegex(document.languageId, agentNames);
      const wordRange = document.getWordRangeAtPosition(position, agentRegex);

      if (!wordRange) return null;

      const match = agentRegex.exec(
        line.substring(wordRange.start.character, wordRange.end.character),
      );
      if (!match) return null;

      const agentName = match[1] || match[2];
      const agentInfo = getAgentInfo(agentName, agentIndex);
      if (!agentInfo) return null;

      const md = new vscode.MarkdownString();
      md.isTrusted = true;
      md.supportHtml = true;
      md.appendMarkdown(`**${agentName}**\n\n`);
      md.appendMarkdown(
        `[Docs](${agentInfo.docs}) | [Source](${agentInfo.source})\n\n`,
      );

      return new vscode.Hover(md, wordRange);
    },
  };
};

/**
 * Creates a link provider for agent navigation
 * Uses configuration to determine click behavior (docs or source)
 */
const createLinkProvider = (agentIndex: AgentIndex): vscode.DocumentLinkProvider => {
  const agentNames = agentIndex.agents.map((agent) => agent.name).join("|");
  return {
    provideDocumentLinks(document: vscode.TextDocument) {
      const links: vscode.DocumentLink[] = [];
      const agentRegex = getAgentRegex(document.languageId, agentNames);

      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        agentRegex.lastIndex = 0;

        let match: RegExpExecArray | null = agentRegex.exec(line);
        while (match !== null) {
          const agentName = match[1] || match[2];
          const agentInfo = getAgentInfo(agentName, agentIndex);
          if (!agentInfo) {
            match = agentRegex.exec(line);
            continue;
          }

          const startPos = match.index + match[0].indexOf(agentName);
          const endPos = startPos + agentName.length;
          const range = new vscode.Range(
            new vscode.Position(i, startPos),
            new vscode.Position(i, endPos),
          );

          const link = new vscode.DocumentLink(
            range,
            vscode.Uri.parse(config.agentClickAction.value === "docs" ? agentInfo.docs : agentInfo.source),
          );
          link.tooltip = `Click to open ${config.agentClickAction.value === "docs" ? "documentation" : "source code"} for ${agentName}`;
          links.push(link);

          match = agentRegex.exec(line);
        }
      }

      return links;
    },
  };
};

/**
 * Main provider function that registers hover and link providers
 */
export const useAgentProvider = (agentIndex: AgentIndex): AgentProvider => {
  const hoverProvider = vscode.languages.registerHoverProvider(
    SUPPORTED_LANGUAGES,
    createHoverProvider(agentIndex),
  );

  const linkProvider = vscode.languages.registerDocumentLinkProvider(
    SUPPORTED_LANGUAGES,
    createLinkProvider(agentIndex),
  );

  return {
    hoverProvider,
    linkProvider,
    dispose: () => {
      hoverProvider.dispose();
      linkProvider.dispose();
    },
  };
};
