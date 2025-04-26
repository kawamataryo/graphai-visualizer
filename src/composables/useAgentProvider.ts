import * as vscode from "vscode";
import agentIndex from "../agentIndex.json";

// Types
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

// Constants
const SUPPORTED_LANGUAGES: vscode.DocumentFilter[] = [
  { scheme: "file", language: "yaml" },
  { scheme: "file", language: "json" },
  { scheme: "file", language: "typescript" },
];

const AGENT_NAMES = agentIndex.agents.map((agent) => agent.name).join("|");

const REGEX_PATTERNS: Record<string, string> = {
  json: `"agent"\\s*:\\s*"(${AGENT_NAMES})"`,
  yaml: `agent:\\s*(?:["'](${AGENT_NAMES})["']|(${AGENT_NAMES}))(?:\\s|,|\\]|\\}|$)`,
  typescript: `agent:\\s*["'](${AGENT_NAMES})["']`,
  default: `agent:\\s*["'](${AGENT_NAMES})["']`,
};

// Helper functions
export const getAgentRegex = (languageId: string): RegExp => {
  const pattern = REGEX_PATTERNS[languageId] || REGEX_PATTERNS.default;
  return new RegExp(pattern, "g");
};

export const getAgentInfo = (agentName: string): AgentInfo | undefined => {
  return agentIndex.agents.find((agent) => agent.name === agentName);
};

// Provider implementations
const createHoverProvider = (): vscode.HoverProvider => ({
  provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const line = document.lineAt(position.line).text;
    const agentRegex = getAgentRegex(document.languageId);
    const wordRange = document.getWordRangeAtPosition(position, agentRegex);

    if (!wordRange) return null;

    const match = agentRegex.exec(
      line.substring(wordRange.start.character, wordRange.end.character),
    );
    if (!match) return null;

    const agentName = match[1] || match[2];
    const agentInfo = getAgentInfo(agentName);
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
});

const createLinkProvider = (): vscode.DocumentLinkProvider => ({
  provideDocumentLinks(document: vscode.TextDocument) {
    const links: vscode.DocumentLink[] = [];
    const agentRegex = getAgentRegex(document.languageId);

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text;
      agentRegex.lastIndex = 0;

      let match: RegExpExecArray | null = agentRegex.exec(line);
      while (match !== null) {
        const agentName = match[1] || match[2];
        const agentInfo = getAgentInfo(agentName);
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
          vscode.Uri.parse(agentInfo.docs),
        );
        link.tooltip = `Click to open documentation for ${agentName}`;
        links.push(link);

        match = agentRegex.exec(line);
      }
    }

    return links;
  },
});

// Main provider
export const useAgentProvider = (): AgentProvider => {
  const hoverProvider = vscode.languages.registerHoverProvider(
    SUPPORTED_LANGUAGES,
    createHoverProvider(),
  );

  const linkProvider = vscode.languages.registerDocumentLinkProvider(
    SUPPORTED_LANGUAGES,
    createLinkProvider(),
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
