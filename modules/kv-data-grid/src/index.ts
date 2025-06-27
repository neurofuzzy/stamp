import { KVDataGridModel } from '@core/model';
import { KVDataGridView } from '@ui/view';
import { KVDataGridController } from './controllers/controller';
import type { 
  DSLDefinition, 
  CommandData, 
  CellReference, 
  InteractionMode,
  KVDataGridOptions 
} from '@core/types';

export class KVDataGrid {
  private model: KVDataGridModel;
  private view: KVDataGridView;
  private controller: KVDataGridController;

  constructor(
    container: HTMLElement, 
    dsl: DSLDefinition, 
    options: KVDataGridOptions = {}
  ) {
    this.model = new KVDataGridModel(dsl);
    this.view = new KVDataGridView(container);
    this.controller = new KVDataGridController(this.model, this.view, dsl);
    
    // Ensure we always have at least one empty command to match the view
    this.model.addCommand();
    
    // Initial render
    this.syncViewWithModel();
  }

  // Data management methods
  public exportData(): CommandData[] {
    return this.model.getCommands();
  }

  public importData(data: CommandData[]): void {
    // Clear existing data
    this.model = new KVDataGridModel(this.model.getDSL());
    
    // Import new data
    data.forEach(command => {
      this.model.addCommand();
      const commandIndex = this.model.getCommands().length - 1;
      this.model.updateCommand(commandIndex, { name: command.name });
      
      command.parameters.forEach(param => {
        this.model.addParameter(commandIndex);
        const paramIndex = this.model.getCommands()[commandIndex].parameters.length - 1;
        this.model.updateParameter(commandIndex, paramIndex, param);
      });
    });
    
    this.syncViewWithModel();
    
    // Re-create controller with new model instance
    this.controller = new KVDataGridController(this.model, this.view, this.model.getDSL());
  }

  public clearData(): void {
    // Reset model to empty state
    this.model = new KVDataGridModel(this.model.getDSL());
    this.syncViewWithModel();
    
    // Re-create controller with new model instance
    this.controller = new KVDataGridController(this.model, this.view, this.model.getDSL());
  }

  // State management methods
  public getCurrentMode(): InteractionMode {
    return this.model.getMode();
  }

  public getCurrentCell(): CellReference | null {
    return this.model.getCurrentCell();
  }

  public focusCell(commandIndex: number, cellType: 'command' | 'param-key' | 'param-value', paramIndex?: number): void {
    const cellRef: CellReference = {
      commandIndex,
      cellType,
      paramIndex
    };
    
    this.controller.focusCell(cellRef);
  }

  // Event management - delegate to controller
  public addEventListener(eventType: string, callback: (event: CustomEvent) => void): void {
    this.controller.addEventListener(eventType, callback);
  }

  public removeEventListener(eventType: string, callback: (event: CustomEvent) => void): void {
    this.controller.removeEventListener(eventType, callback);
  }

  private syncViewWithModel(): void {
    const commands = this.model.getCommands();
    this.view.render(commands);
  }
}

// Export types for external usage
export type {
  DSLDefinition,
  CommandData,
  ParameterData,
  CellReference,
  InteractionMode,
  KVDataGridOptions
} from '@core/types'; 