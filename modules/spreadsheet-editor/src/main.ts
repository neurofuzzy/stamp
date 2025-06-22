import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetView } from '@ui/components/SpreadsheetView';
import { SpreadsheetController } from '@ui/components/SpreadsheetController';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Stamp Spreadsheet Editor - TypeScript Module');
  
  const gridElement = document.getElementById('grid');
  if (!gridElement) {
    console.error('Grid element not found');
    return;
  }
  
  // Create model with configuration
  const model = new SpreadsheetModel({
    autoExpand: true,
    lockOnBlur: true
  });
  
  // Create view
  const view = new SpreadsheetView(gridElement);
  
  // Create controller (handles all events and coordination)
  const controller = new SpreadsheetController(model, view);
  
  console.log('✅ Spreadsheet Editor initialized with MVC pattern');
  
  // Expose for debugging
  (window as any).stampEditor = { model, view, controller };
}); 