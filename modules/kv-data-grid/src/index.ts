import { KVDataGridController } from './controllers/KVDataGridController';
import { KVDataGridModel } from './models/KVDataGridModel';
import { KVDataGridView } from './views/KVDataGridView';
import { CommandData, DSLDefinition, CellReference } from './models/types';

export class KVDataGrid extends EventTarget {
  private controller: KVDataGridController;
  private model: KVDataGridModel;
  private view: KVDataGridView;

  constructor(containerElement: HTMLElement, dslDefinition: DSLDefinition, options = {}) {
    super();
    this.model = new KVDataGridModel();
    this.view = new KVDataGridView(containerElement);
    this.controller = new KVDataGridController(this.model, this.view, dslDefinition, this.dispatchEvent.bind(this));

    // Temp data for rendering test
    this.importData([
      { name: 'circle', parameters: [{ key: 'r', value: 10 }, { key: 'x', value: 5 }] },
      { name: 'rect', parameters: [{ key: 'w', value: 20 }] }
    ]);
  }

  // Data management
  public exportData(): CommandData[] {
    return this.model.getCommands();
  }
  public importData(data: CommandData[]): void {
    this.model.importData(data);
    this.view.render(this.model.getCommands());
  }
  public clearData(): void {
    this.model.clearData();
    this.view.render(this.model.getCommands());
  }

  // Event management is inherited from EventTarget

  // State management
  public getCurrentMode(): 'navigation' | 'editing' {
    return this.model.getMode();
  }
  public getCurrentCell(): CellReference | null {
    return this.model.getCurrentCell();
  }
  public focusCell(commandIndex: number, cellType: 'command' | 'param-key' | 'param-value', paramIndex?: number): void {
    // to be implemented
  }
}
