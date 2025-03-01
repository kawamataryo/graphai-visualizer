import { computed, ref, useWebviewPanel, useIsDarkTheme } from 'reactive-vscode'
import { ViewColumn } from 'vscode'
import { codeToMermaid } from '../lib/codeToMermaid'

export const useMermaidWebview = (fileName: string) => {
  const mermaidGraph = ref('')
  const isDarkTheme = useIsDarkTheme()

  const html = computed(() => `
  <html>
  <head>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        margin: 0;
        padding: 20px;
        background-color: ${isDarkTheme.value ? '#1e1e1e' : '#f5f5f5'};
        color: ${isDarkTheme.value ? '#e0e0e0' : '#333333'};
      }
      .container {
        max-width: 100%;
        margin: 0 auto;
        background-color: ${isDarkTheme.value ? '#252526' : '#ffffff'};
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, ${isDarkTheme.value ? '0.5' : '0.1'});
        position: relative;
      }
      .mermaid {
        font-size: 16px;
        display: flex;
        justify-content: center;
        overflow: hidden;
      }

      /* Control panel styles */
      .control-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        gap: 8px;
        background-color: ${isDarkTheme.value ? '#333333' : '#f0f0f0'};
        border-radius: 4px;
        padding: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 100;
      }

      .control-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${isDarkTheme.value ? '#444444' : '#e0e0e0'};
        color: ${isDarkTheme.value ? '#e0e0e0' : '#333333'};
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .control-btn:hover {
        background-color: ${isDarkTheme.value ? '#555555' : '#d0d0d0'};
      }

      /* Graph container */
      .graph-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        touch-action: none;
      }

      .agent-name {
        margin-top: -5px;
        font-size: 11px;
        font-weight: normal;
      }

      /* Transition for zoom */
      svg {
        transition: transform 0.2s ease;
        user-select: none;
        touch-action: none;
      }

      /* Disable selection for all SVG elements */
      svg * {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      /* GraphAI Visualizer title */
      .graph-title {
        position: absolute;
        top: 15px;
        left: 15px;
        font-size: 14px;
        font-weight: 500;
        opacity: 0.7;
        color: ${isDarkTheme.value ? '#a0a0a0' : '#666666'};
        z-index: 50;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body>
    <div class="control-panel">
      <button class="control-btn zoom-in" title="Zoom In"><i class="fas fa-plus"></i></button>
      <button class="control-btn zoom-out" title="Zoom Out"><i class="fas fa-minus"></i></button>
      <button class="control-btn reset" title="Reset View"><i class="fas fa-home"></i></button>
    </div>
    <div class="container">
      <div class="graph-title">GraphAI Visualizer</div>
      <div class="graph-container">
        <div class="mermaid">
          ${mermaidGraph.value}
        </div>
      </div>
    </div>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

      // Mermaid configuration
      mermaid.initialize({
        startOnLoad: true,
        theme: '${isDarkTheme.value ? 'dark' : 'default'}',
        securityLevel: 'loose',
        flowchart: {
          curve: 'basis',
          htmlLabels: true,
          useMaxWidth: false,
          padding: 20,
          nodeSpacing: 60,
          rankSpacing: 80,
        },
        themeVariables: {
          primaryColor: '${isDarkTheme.value ? '#6272a4' : '#4682b4'}',
          primaryTextColor: '${isDarkTheme.value ? '#f8f8f2' : '#333333'}',
          primaryBorderColor: '${isDarkTheme.value ? '#4682b4' : '#0077cc'}',
          lineColor: '${isDarkTheme.value ? '#4682b4' : '#0077cc'}',
          secondaryColor: '${isDarkTheme.value ? '#44475a' : '#e6e6fa'}',
          tertiaryColor: '${isDarkTheme.value ? '#2f3240' : '#ffffff'}',
          edgeLabelBackground: '${isDarkTheme.value ? '#555555' : '#dddddd'}',
          fontSize: '14px',
          edgeLabel: {
            fontSize: '11px',
            color: '${isDarkTheme.value ? '#e0e0e0' : '#333333'}',
          }
        }
      });

      // Initialize Mermaid rendering and zoom/pan functionality
      mermaid.run().then(() => {
        // Get SVG element
        const svgElement = document.querySelector('.mermaid svg');
        if (!svgElement) return;

        // Get graph container for capturing events over a wider area
        const graphContainer = document.querySelector('.graph-container');

        // Manage zoom and pan state
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        // Function to apply transformation
        const applyTransform = () => {
          // Apply movement range limitations
          const svgRect = svgElement.getBoundingClientRect();
          const containerRect = graphContainer.getBoundingClientRect();

          // Calculate restriction range (ensure at least 20% of graph remains visible)
          const minVisiblePortion = 0.2;

          // Horizontal constraints
          const maxTranslateX = containerRect.width - svgRect.width * scale * minVisiblePortion;
          const minTranslateX = svgRect.width * scale * minVisiblePortion - svgRect.width * scale;

          // Vertical constraints
          const maxTranslateY = containerRect.height - svgRect.height * scale * minVisiblePortion;
          const minTranslateY = svgRect.height * scale * minVisiblePortion - svgRect.height * scale;

          // Constrain within range
          translateX = Math.min(Math.max(translateX, minTranslateX), maxTranslateX);
          translateY = Math.min(Math.max(translateY, minTranslateY), maxTranslateY);

          // Apply transformation
          svgElement.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
        };

        // Zoom in functionality
        document.querySelector('.zoom-in').addEventListener('click', () => {
          scale = Math.min(scale * 1.2, 3); // Maximum 3x zoom
          applyTransform();
        });

        // Zoom out functionality
        document.querySelector('.zoom-out').addEventListener('click', () => {
          scale = Math.max(scale / 1.2, 0.5); // Minimum 0.5x zoom
          applyTransform();
        });

        // Reset functionality
        document.querySelector('.reset').addEventListener('click', () => {
          scale = 1;
          translateX = 0;
          translateY = 0;
          applyTransform();
        });

        // Detect drag on the entire container, not just the SVG
        graphContainer.addEventListener('mousedown', (e) => {
          isDragging = true;
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;
          svgElement.style.cursor = 'grabbing';
          graphContainer.style.cursor = 'grabbing';
          e.preventDefault(); // Prevent selection
        });

        // Detect mouse movement across the entire document
        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;

          const deltaX = e.clientX - lastMouseX;
          const deltaY = e.clientY - lastMouseY;

          translateX += deltaX;
          translateY += deltaY;

          lastMouseX = e.clientX;
          lastMouseY = e.clientY;

          applyTransform();
        });

        // Detect drag end across the entire document
        document.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            svgElement.style.cursor = 'grab';
            graphContainer.style.cursor = 'default';
          }
        });

        // Detect wheel events across the entire container, not just the SVG
        graphContainer.addEventListener('wheel', (e) => {
          e.preventDefault();

          if (e.ctrlKey) {
            // Ctrl + wheel for zooming
            const zoomFactor = e.deltaY > 0 ? 0.98 : 1.02;
            const oldScale = scale;
            const newScale = Math.min(Math.max(scale * zoomFactor, 0.5), 5);

            // Skip if scale doesn't change
            if (newScale === scale) return;

            scale = newScale;

            // Zoom centered on mouse pointer
            const rect = graphContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Adjust zoom center point
            translateX = translateX + mouseX * (1 - scale / oldScale);
            translateY = translateY + mouseY * (1 - scale / oldScale);
          } else {
            // Normal wheel for panning
            translateX -= e.deltaX * 0.8;
            translateY -= e.deltaY * 0.8;
          }

          applyTransform();
        }, { passive: false });

        // Set initial cursor state
        svgElement.style.cursor = 'grab';

        // Handle continued operation even when mouse leaves the area
        document.addEventListener('mouseleave', (e) => {
          // End dragging if mouse leaves the area while dragging
          if (isDragging) {
            isDragging = false;
            svgElement.style.cursor = 'grab';
            graphContainer.style.cursor = 'default';
          }
        });

        // Additional measure to prevent text selection
        document.addEventListener('selectstart', (e) => {
          if (isDragging) {
            e.preventDefault();
          }
        });
      });
    </script>
  </body>
  </html>
  `)

  const { postMessage, panel } = useWebviewPanel(
    'graphai-visualizer-webview',
    `Graph - ${fileName}`,
    html,
    { viewColumn: ViewColumn.Beside },
    {
      webviewOptions: {
        enableScripts: true,
        enableCommandUris: true,
      },
    }
  )

  const updateGraph = (code: string, fileLanguageId: string) => {
    const mermaid = codeToMermaid(code, fileLanguageId)
    mermaidGraph.value = mermaid
  }

  return { postMessage, panel, updateGraph }
}
