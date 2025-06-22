import { SpreadsheetGrid } from './spreadsheet-grid.js';

document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('spreadsheet-grid');
  const codeDisplay = document.getElementById('generated-code');
  
  if (!gridContainer || !codeDisplay) {
    console.error('Required DOM elements not found');
    return;
  }

  // Initialize the spreadsheet grid
  const spreadsheet = new SpreadsheetGrid(gridContainer);
  
  // Set up code generation callback
  spreadsheet.setCodeChangeCallback((code) => {
    codeDisplay.textContent = code;
  });

  // Initialize with empty code
  codeDisplay.textContent = 'new Stamp()  // Add commands to generate code';
  
  console.log('Spreadsheet Code Editor initialized successfully');
}); 