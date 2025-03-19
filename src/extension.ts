import { defineExtension, useActiveTextEditor, useCommand, useDocumentText, useEvent } from 'reactive-vscode'
import { logger } from './utils'
import { useMermaidWebview } from './composables/useMermaidWebview'
import { workspace, window } from 'vscode'
import { parseGraphAIObject } from './composables/useGraphAIParser'

export = defineExtension(() => {
  logger.info('Extension Activated')
  const onDidSaveTextDocument = useEvent(workspace.onDidSaveTextDocument)

  /**
   * Show graph from JSON, YAML file or TypeScript selection
   */
  useCommand('graphai-visualizer.showGraph', async () => {
    const editor = useActiveTextEditor()
    if (!editor.value) {
      window.showInformationMessage('Editor is not opened.')
      return
    }

    const document = editor.value.document
    const fileLanguageId = document.languageId
    const fileName = document.fileName?.split('/').pop() || document.fileName?.split('\\').pop() || ''
    const openFileUri = document.uri.toString()
    const position = editor.value.selection.active

    // JSONまたはYAMLファイルの場合
    if (fileLanguageId === 'json' || fileLanguageId === 'yaml') {
      const text = useDocumentText(() => editor.value?.document)

      const { panel, updateGraph } = useMermaidWebview(fileName)
      panel.reveal()

      updateGraph(text.value ?? '', fileLanguageId)
      onDidSaveTextDocument((document) => {
        if (openFileUri === document.uri.toString()) {
          // 保存時にフォーマットをチェック
          if (document.languageId === 'json' || document.languageId === 'yaml') {
            updateGraph(document.getText(), document.languageId)
          }
        }
      })
      return
    }

    // TypeScriptファイルの場合
    if (fileLanguageId === 'typescript') {
      // GraphAIオブジェクトをパース
      const jsonData = await parseGraphAIObject(document, position)
      logger.info(jsonData)

      if (jsonData) {
        const { panel, updateGraph } = useMermaidWebview(fileName)
        panel.reveal()
        updateGraph(jsonData, 'json')
        return
      } else {
        window.showInformationMessage('No GraphAI object found at the selection position.')
        return
      }
    }

    // サポートされていないファイル形式
    window.showInformationMessage('Unsupported file format. Only JSON, YAML, or TypeScript files are supported.')
  })
})
