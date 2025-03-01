import { defineExtension, useActiveTextEditor, useCommand, useDocumentText, useEvent, useIsDarkTheme, watchEffect } from 'reactive-vscode'
import { logger } from './utils'
import { useMermaidWebview } from './composables/useMermaidWebview'
import { workspace } from 'vscode'

export = defineExtension(() => {
  logger.info('Extension Activated')
  const onDidSaveTextDocument = useEvent(workspace.onDidSaveTextDocument)


  useCommand('graphai-visualizer.showGraph', () => {
    const editor = useActiveTextEditor()
    const text = useDocumentText(() => editor.value?.document)
    const fileLanguageId = editor.value?.document.languageId
    const fileName = editor.value?.document.fileName?.split('/').pop() || editor.value?.document.fileName?.split('\\').pop() || ''
    const openFileUri = editor.value?.document.uri.toString()

    // Check if the file is JSON or YAML
    if (fileLanguageId !== 'json' && fileLanguageId !== 'yaml') {
      // Display error message
      const vscode = require('vscode');
      vscode.window.showInformationMessage('Invalid file format. Only JSON or YAML files are supported.');
      return;
    }

    const { panel, updateGraph } = useMermaidWebview(fileName ?? '')
    panel.reveal()

    updateGraph(text.value ?? '', fileLanguageId ?? '')
    onDidSaveTextDocument((document) => {
      if (openFileUri === document.uri.toString()) {
        // Check format when saving
        if (document.languageId === 'json' || document.languageId === 'yaml') {
          updateGraph(document.getText(), document.languageId)
        }
      }
    })
  })
})
