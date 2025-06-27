import { KVDataGrid } from './index';
import type { DSLDefinition } from '@core/types';

// Demo DSL definition
const DEMO_DSL: DSLDefinition = {
  commands: ['circle', 'rect', 'line', 'arc', 'text'],
  parameters: {
    'circle': ['radius', 'x', 'y', 'fill', 'stroke'],
    'rect': ['width', 'height', 'x', 'y', 'fill', 'stroke'],
    'line': ['x1', 'y1', 'x2', 'y2', 'stroke'],
    'arc': ['radius', 'startAngle', 'endAngle', 'x', 'y', 'fill', 'stroke'],
    'text': ['content', 'x', 'y', 'fontSize', 'fill']
  }
};

// Sample data for demo
const sampleData = [
  {
    name: 'circle',
    parameters: [
      { key: 'radius', value: '50' },
      { key: 'x', value: '100' },
      { key: 'y', value: '100' }
    ]
  },
  {
    name: 'rect',
    parameters: [
      { key: 'width', value: '80' },
      { key: 'height', value: '60' },
      { key: 'x', value: '200' },
      { key: 'y', value: '150' }
    ]
  }
];

// Initialize the grid
let grid: KVDataGrid;

document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('grid-container');
  if (!gridContainer) return;

  // Create the actual KVDataGrid instance
  grid = new KVDataGrid(gridContainer, DEMO_DSL);

  // Set up event listeners for status updates
  grid.addEventListener('cellChange', (event) => {
    updateStatus(`Cell changed: ${event.detail.cellType} = "${event.detail.newValue}"`);
  });

  grid.addEventListener('modeChange', (event) => {
    updateStatus(`Mode changed: ${event.detail.oldMode} → ${event.detail.newMode}`);
  });

  // Set up demo buttons
  setupDemoControls();
  
  // Focus the first cell so user can immediately start using keyboard
  setTimeout(() => {
    grid.focusCell(0, 'command');
  }, 100);
  
  // Initial status
  updateStatus('Ready - Try clicking cells and using arrow keys to navigate! Press Enter to edit.');
});

function setupDemoControls(): void {
  // Make functions available globally for button onclick handlers
  (window as any).loadSampleData = () => {
    grid.importData(sampleData);
    updateStatus('Sample data loaded - Try navigating with arrow keys and editing with Enter!');
  };

  (window as any).clearData = () => {
    grid.clearData();
    updateStatus('Data cleared - Click cells or use arrow keys to navigate');
  };

  (window as any).exportData = () => {
    const data = grid.exportData();
    updateStatus(`Data exported:\n${JSON.stringify(data, null, 2)}`);
  };

  (window as any).focusCommand = () => {
    grid.focusCell(0, 'command');
    updateStatus('Command cell focused - Use Enter to edit, arrow keys to navigate');
  };

  (window as any).focusParam = () => {
    grid.focusCell(0, 'param-key', 0);
    updateStatus('Parameter cell focused - Try typing to see autocomplete suggestions');
  };
}

function updateStatus(message: string): void {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
  }
} 