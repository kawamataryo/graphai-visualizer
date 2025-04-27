# graphai-visualizer

[![Version](https://img.shields.io/visual-studio-marketplace/v/kawamataryo.graphai-visualizer)](https://marketplace.visualstudio.com/items?itemName=kawamataryo.graphai-visualizer) [![Installs](https://img.shields.io/visual-studio-marketplace/i/kawamataryo.graphai-visualizer)](https://marketplace.visualstudio.com/items?itemName=kawamataryo.graphai-visualizer) [![Reactive VSCode](https://img.shields.io/badge/Reactive-VSCode-%23007ACC?style=flat&labelColor=%23229863)](https://kermanx.github.io/reactive-vscode/)

GraphAI Visualizer is a VS Code extension for visualizing JSON and YAML graphs defined with [GraphAI](https://github.com/receptron/graphai), as well as GraphAI objects in TypeScript files. Built using [Reactive VS Code](https://kermanx.github.io/reactive-vscode/).

<img src="https://github.com/user-attachments/assets/d83aae3f-786e-4f3d-bd29-f3687d23b7a8" width="700">

## Features

- Automatically parses GraphAI JSON and YAML files
- Extracts and visualizes GraphAI objects from TypeScript files
- Visualizes graphs using Mermaid
- Intuitive zoom, pan, and reset functionality
- Auto-updates when files are saved
- Supports both dark and light modes
- Provides hover information for graph nodes
- Enables quick navigation between connected nodes
- Auto-activates for JSON, YAML, and TypeScript files

## Usage

### For JSON or YAML files
1. Open a JSON or YAML file containing GraphAI graph definition
2. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and search for "GraphAI: Show Graph Visualization"
3. The graph will appear in a separate window
4. Drag within the graph to pan, use buttons to zoom in/out or reset
5. Edit and save your file to automatically update the graph

### For TypeScript files
1. Open a TypeScript file containing GraphAI object definitions
2. Place your cursor inside a GraphAI object
3. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and search for "GraphAI: Show Graph Visualization"
4. The extension will extract the object at the cursor position and visualize it
5. Hover over nodes to see detailed information
6. Click on node references to navigate to their definitions

## Directory Structure

* `package.json` - the manifest file in which you declare your extension and command
* `src/extension.ts` - the main file for the extension
* `src/lib/codeToMermaid.ts` - logic to convert GraphAI JSON or YAML to Mermaid format
* `src/lib/objectParser.ts` - extracts GraphAI objects from TypeScript files
* `src/composables/useGraphAIParser.ts` - handles parsing GraphAI objects from cursor position
* `src/composables/useAgentProvider.ts` - provides hover information and navigation for graph nodes
* `src/agentIndex.json` - configuration for node hover information and navigation

## Get started

* Open this repository in VS Code
* Run `pnpm install` to install the dependencies
* Run `pnpm dev` to compile the extension and watch for changes
* Press `F5` to open a new window with your extension loaded
* Run your command from the command palette
* Set breakpoints in your code inside `src/extension.ts` to debug your extension
* Find output from your extension in the debug console

## Make changes

* You can relaunch the extension from the debug toolbar after changing code in `src/extension.ts`
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes
