import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetView } from '@ui/components/SpreadsheetView';
import { SpreadsheetController } from '@ui/components/SpreadsheetController';
import { StampDSL } from '@core/services/StampDSL';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Stamp Spreadsheet Editor - TypeScript Module with DSL');
  
  const gridElement = document.getElementById('grid');
  if (!gridElement) {
    console.error('Grid element not found');
    return;
  }
  
  // Create DSL provider
  const dsl = new StampDSL();
  
  // Create model with DSL configuration
  const model = new SpreadsheetModel({
    autoExpand: true,
    lockOnBlur: true,
    dsl: dsl
  });
  
  // Create view
  const view = new SpreadsheetView(gridElement);
  
  // Create controller (handles all events and coordination)
  const controller = new SpreadsheetController(model, view);
  
  console.log('✅ Spreadsheet Editor initialized with MVC pattern and DSL autocomplete');
  console.log('💡 Available commands:', dsl.getValidCommands());
  
  // Expose for debugging
  (window as any).stampEditor = { model, view, controller, dsl };
}); 