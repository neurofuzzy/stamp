import { KVDataGridModel } from '@core/model';
import { KVDataGridView } from '@ui/view';
import type { 
  DSLDefinition, 
  CellReference, 
  InteractionMode,
  CellChangeEvent,
  ModeChangeEvent 
} from '@core/types';

export class KVDataGridController {
  private eventTarget: EventTarget;
  private isKeyboardListening: boolean = false;

  constructor(
    private model: KVDataGridModel,
    private view: KVDataGridView,
    private dsl: DSLDefinition
  ) {
    this.eventTarget = new EventTarget();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const container = this.view.getContainer();
    container.addEventListener('keydown', this.handleKeydown.bind(this));
    container.tabIndex = 0;
    this.isKeyboardListening = true;
  }

  public isListening(): boolean {
    return this.isKeyboardListening;
  }

  public handleKeydown(event: KeyboardEvent): void {
    const currentMode = this.model.getMode();

    if (currentMode === 'navigation') {
      this.handleNavigationMode(event);
    } else if (currentMode === 'editing') {
      this.handleEditingMode(event);
    }
  }

  private handleNavigationMode(event: KeyboardEvent): void {
    const currentCell = this.model.getCurrentCell();
    if (!currentCell) return;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.navigateRight(currentCell);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigateLeft(currentCell);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDown(currentCell);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateUp(currentCell);
        break;
      case 'Enter':
        event.preventDefault();
        this.enterEditingMode(currentCell);
        break;
    }
  }

  private handleEditingMode(event: KeyboardEvent): void {
    const currentCell = this.model.getCurrentCell();
    if (!currentCell) return;

    switch (event.key) {
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        this.exitEditingMode(true);
        break;
      case 'Escape':
        event.preventDefault();
        this.exitEditingMode(false);
        break;
    }
  }

  private navigateRight(currentCell: CellReference): void {
    let nextCell: CellReference;

    switch (currentCell.cellType) {
      case 'command':
        nextCell = {
          commandIndex: currentCell.commandIndex,
          cellType: 'param-key',
          paramIndex: 0
        };
        break;
      case 'param-key':
        nextCell = {
          commandIndex: currentCell.commandIndex,
          cellType: 'param-value',
          paramIndex: currentCell.paramIndex
        };
        break;
      case 'param-value':
        return;
      default:
        return;
    }

    if (this.model.isValidCellReference(nextCell) || this.isEmptyParameterCell(nextCell)) {
      this.focusCell(nextCell);
    }
  }

  private navigateLeft(currentCell: CellReference): void {
    let nextCell: CellReference;

    switch (currentCell.cellType) {
      case 'param-value':
        nextCell = {
          commandIndex: currentCell.commandIndex,
          cellType: 'param-key',
          paramIndex: currentCell.paramIndex
        };
        break;
      case 'param-key':
        nextCell = {
          commandIndex: currentCell.commandIndex,
          cellType: 'command'
        };
        break;
      case 'command':
        return;
      default:
        return;
    }

    if (this.model.isValidCellReference(nextCell) || nextCell.cellType === 'command') {
      this.focusCell(nextCell);
    }
  }

  private navigateDown(currentCell: CellReference): void {
    if (currentCell.cellType === 'command') return;

    const nextCell: CellReference = {
      commandIndex: currentCell.commandIndex,
      cellType: currentCell.cellType,
      paramIndex: (currentCell.paramIndex || 0) + 1
    };

    if (this.model.isValidCellReference(nextCell) || this.isEmptyParameterCell(nextCell)) {
      this.focusCell(nextCell);
    }
  }

  private navigateUp(currentCell: CellReference): void {
    if (currentCell.cellType === 'command') return;
    if ((currentCell.paramIndex || 0) === 0) return;

    const nextCell: CellReference = {
      commandIndex: currentCell.commandIndex,
      cellType: currentCell.cellType,
      paramIndex: (currentCell.paramIndex || 0) - 1
    };

    if (this.model.isValidCellReference(nextCell)) {
      this.focusCell(nextCell);
    }
  }

  private isEmptyParameterCell(cellRef: CellReference): boolean {
    if (cellRef.cellType === 'command') return false;
    if (cellRef.paramIndex === undefined) return false;

    const commands = this.model.getCommands();
    const command = commands[cellRef.commandIndex];
    if (!command) return false;

    return cellRef.paramIndex === command.parameters.length;
  }

  private enterEditingMode(cellRef: CellReference): void {
    const oldMode = this.model.getMode();
    this.model.setMode('editing');
    this.view.enterEditingMode(cellRef);

    this.emitModeChangeEvent(oldMode, 'editing');
  }

  private exitEditingMode(saveChanges: boolean): void {
    const currentCell = this.model.getCurrentCell();
    if (!currentCell) return;

    const oldMode = this.model.getMode();

    if (saveChanges) {
      const input = this.view.getContainer().querySelector('input') as HTMLInputElement;
      const newValue = input?.value || '';
      
      if (this.validateCell(currentCell, newValue)) {
        this.updateCellValue(currentCell, newValue);
        this.view.exitEditingMode(currentCell, newValue);
      } else {
        const originalValue = this.model.getOriginalValue();
        this.view.exitEditingMode(currentCell, originalValue);
      }
    } else {
      const originalValue = this.model.getOriginalValue();
      this.view.exitEditingMode(currentCell, originalValue);
    }

    this.model.setMode('navigation');
    this.emitModeChangeEvent(oldMode, 'navigation');
  }

  public focusCell(cellRef: CellReference): void {
    this.model.setCurrentCell(cellRef);
    this.view.setFocus(cellRef);
  }

  public validateCell(cellRef: CellReference, value: string): boolean {
    switch (cellRef.cellType) {
      case 'command':
        return this.dsl.commands.includes(value);
      case 'param-key':
        const commands = this.model.getCommands();
        const command = commands[cellRef.commandIndex];
        if (!command || !command.name) return false;
        
        const validParams = this.dsl.parameters[command.name] || [];
        return validParams.includes(value);
      case 'param-value':
        return true;
      default:
        return false;
    }
  }

  public updateCellValue(cellRef: CellReference, newValue: string): void {
    const commands = this.model.getCommands();
    const command = commands[cellRef.commandIndex];
    if (!command) return;

    let oldValue = '';

    switch (cellRef.cellType) {
      case 'command':
        oldValue = command.name;
        this.model.updateCommand(cellRef.commandIndex, { name: newValue });
        break;
      case 'param-key':
        if (cellRef.paramIndex !== undefined) {
          oldValue = command.parameters[cellRef.paramIndex]?.key || '';
          
          if (cellRef.paramIndex >= command.parameters.length) {
            this.model.addParameter(cellRef.commandIndex);
          }
          
          this.model.updateParameter(cellRef.commandIndex, cellRef.paramIndex, { key: newValue });
        }
        break;
      case 'param-value':
        if (cellRef.paramIndex !== undefined) {
          oldValue = command.parameters[cellRef.paramIndex]?.value || '';
          
          if (cellRef.paramIndex >= command.parameters.length) {
            this.model.addParameter(cellRef.commandIndex);
          }
          
          this.model.updateParameter(cellRef.commandIndex, cellRef.paramIndex, { value: newValue });
        }
        break;
    }

    this.view.render(this.model.getCommands());
    this.emitCellChangeEvent(cellRef, oldValue, newValue);
  }

  public addEventListener(eventType: string, callback: (event: CustomEvent) => void): void {
    this.eventTarget.addEventListener(eventType, callback as EventListener);
  }

  public removeEventListener(eventType: string, callback: (event: CustomEvent) => void): void {
    this.eventTarget.removeEventListener(eventType, callback as EventListener);
  }

  private emitCellChangeEvent(cellRef: CellReference, oldValue: string, newValue: string): void {
    const detail: CellChangeEvent = {
      commandIndex: cellRef.commandIndex,
      cellType: cellRef.cellType,
      paramIndex: cellRef.paramIndex,
      oldValue,
      newValue
    };

    const event = new CustomEvent('cellChange', { detail });
    this.eventTarget.dispatchEvent(event);
  }

  private emitModeChangeEvent(oldMode: InteractionMode, newMode: InteractionMode): void {
    const detail: ModeChangeEvent = { oldMode, newMode };
    const event = new CustomEvent('modeChange', { detail });
    this.eventTarget.dispatchEvent(event);
  }
} 