import { KVDataGridModel } from '../models/KVDataGridModel';
import { KVDataGridView } from '../views/KVDataGridView';
import { DSLDefinition, CellReference } from '../models/types';

export class KVDataGridController {
  private model: KVDataGridModel;
  private view: KVDataGridView;
  private dsl: DSLDefinition;
  private dispatchEvent: (event: Event) => void;
  
  constructor(model: KVDataGridModel, view: KVDataGridView, dsl: DSLDefinition, dispatchEvent: (event: Event) => void) {
    this.model = model;
    this.view = view;
    this.dsl = dsl;
    this.dispatchEvent = dispatchEvent;
    this.init();
  }

  private init() {
    this.view.bindEvents({
      onCellClick: this.handleCellClick.bind(this),
      onCellFocus: this.handleCellFocus.bind(this),
      onCellDoubleClick: this.handleCellDoubleClick.bind(this),
      onKeyDown: this.handleKeyDown.bind(this)
    });
    // Set initial focus
    const initialCell = { commandIndex: 0, cellType: 'command' as const };
    this.model.setCurrentCell(initialCell);
    this.view.setNavigationFocus(initialCell);
  }

  private handleCellClick(cellRef: CellReference) {
    this.handleCellFocus(cellRef);
  }

  private handleCellFocus(cellRef: CellReference) {
    if (this.model.getMode() === 'editing') {
      return;
    }
    this.model.setCurrentCell(cellRef);
    this.view.setNavigationFocus(cellRef);
  }

  private handleCellDoubleClick(cellRef: CellReference) {
    this.switchToEditing(cellRef);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      return;
    }
    if (this.model.getMode() === 'navigation') {
      this.handleNavigationMode(event);
    } else {
      this.handleEditingMode(event);
    }
  }

  private handleNavigationMode(event: KeyboardEvent): void {
    const currentCell = this.model.getCurrentCell();
    if (!currentCell) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.switchToEditing(currentCell);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft': 
      case 'ArrowRight':
        event.preventDefault();
        this.navigate(event.key);
        break;
    }
  }

  private navigate(key: string) {
    const currentCell = this.model.getCurrentCell();
    if (!currentCell) return;

    const commands = this.model.getCommands();
    let { commandIndex, cellType, paramIndex } = currentCell;

    switch (key) {
      case 'ArrowUp':
        if (paramIndex !== undefined && paramIndex > 0) {
          paramIndex--;
        } else if (commandIndex > 0) {
          commandIndex--;
          if (cellType !== 'command') {
            paramIndex = commands[commandIndex].parameters.length - 1;
          }
        }
        break;
      case 'ArrowDown':
        const command = commands[commandIndex];
        if (paramIndex !== undefined && paramIndex < command.parameters.length - 1) {
          paramIndex++;
        } else if (commandIndex < commands.length - 1) {
          commandIndex++;
          if (cellType !== 'command') {
            paramIndex = 0;
          }
        }
        break;
      case 'ArrowLeft':
        if (cellType === 'param-value') {
          cellType = 'param-key';
        } else if (cellType === 'param-key') {
          cellType = 'command';
          paramIndex = undefined;
        }
        break;
      case 'ArrowRight':
        if (cellType === 'command') {
          cellType = 'param-key';
          paramIndex = 0;
        } else if (cellType === 'param-key') {
          cellType = 'param-value';
        }
        break;
    }
    
    const newCommand = commands[commandIndex];
    if (!newCommand) return;
    if (paramIndex !== undefined && !newCommand.parameters[paramIndex]) {
        return;
    }

    const newCell: CellReference = { commandIndex, cellType, paramIndex };
    this.model.setCurrentCell(newCell);
    this.view.setNavigationFocus(newCell);
  }

  private handleEditingMode(event: KeyboardEvent): void {
    const currentCellRef = this.model.getCurrentCell();
    if (!currentCellRef) return;
    
    const cell = this.view.getCell(currentCellRef);
    if (!cell) return;
    const input = cell.querySelector('input');
    if (!input) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        this.attemptLockAndExit(false); // Lock cell, but don't navigate yet.
        this.navigate(event.key);      // Now navigate in the arrow's direction.
        break;
      case 'Tab':
        const suggestion = this.getSuggestion(currentCellRef, input.value);
        if (suggestion) {
          event.preventDefault();
          this.autoComplete(currentCellRef, suggestion)
          this.view.clearSuggestion();
        } else {
          event.preventDefault();
          this.attemptLockAndExit(true);
        }
        break;
      case 'Enter':
        event.preventDefault();
        this.attemptLockAndExit(false);
        break;
      case 'Escape':
        event.preventDefault();
        this.restoreAndExit();
        break;
      default:
        // Handle regular key presses for autocomplete
        setTimeout(() => {
            const suggestion = this.getSuggestion(currentCellRef, input.value);
            this.view.showSuggestion(currentCellRef, suggestion);
        }, 0);
    }
  }

  private attemptLockAndExit(navigateToNext = false) {
    const currentCellRef = this.model.getCurrentCell();
    if (!currentCellRef) return;
    
    const cell = this.view.getCell(currentCellRef);
    if (!cell) return;
    const input = cell.querySelector('input');
    if (!input) return;

    const newValue = input.value;
    const oldValue = this.model.getCell(currentCellRef)?.value;
    
    if (this.validateCell(currentCellRef, newValue)) {
      this.model.updateCell(currentCellRef, newValue);
      if (oldValue !== newValue) {
        this.dispatchEvent(new CustomEvent('cellChange', { detail: { ...currentCellRef, oldValue, newValue } }));
      }
    } else {
      // if validation fails, clear the cell
      this.model.updateCell(currentCellRef, '');
      if (oldValue !== '') {
        this.dispatchEvent(new CustomEvent('cellChange', { detail: { ...currentCellRef, oldValue, newValue: '' } }));
      }
      this.view.showValidationError(currentCellRef);
    }

    this.switchToNavigation();
    this.view.render(this.model.getCommands()); // Re-render to show new value
    
    if (navigateToNext) {
      this.navigateToNextCell();
    } else {
      this.view.setNavigationFocus(currentCellRef);
    }
  }

  private navigateToNextCell() {
    const currentCellRef = this.model.getCurrentCell();
    if (!currentCellRef) return;

    const commands = this.model.getCommands();
    let { commandIndex, cellType, paramIndex } = currentCellRef;

    if (cellType === 'command') {
        cellType = 'param-key';
        paramIndex = 0;
    } else if (cellType === 'param-key') {
        cellType = 'param-value';
    } else if (cellType === 'param-value') {
        const command = commands[commandIndex];
        if (paramIndex !== undefined && paramIndex < command.parameters.length - 1) {
            paramIndex++;
            cellType = 'param-key';
        } else if (commandIndex < commands.length - 1) {
            commandIndex++;
            cellType = 'command';
            paramIndex = undefined;
        } else {
            // Loop back to the start
            commandIndex = 0;
            cellType = 'command';
            paramIndex = undefined;
        }
    }

    const newCell: CellReference = { commandIndex, cellType, paramIndex };
    this.model.setCurrentCell(newCell);
    this.view.setNavigationFocus(newCell);
  }

  private restoreAndExit() {
    // TODO: restore original value
    this.switchToNavigation();
    this.view.render(this.model.getCommands());
    this.view.setNavigationFocus(this.model.getCurrentCell());
  }

  private switchToEditing(cellRef: CellReference): void {
    const oldMode = this.model.getMode();
    this.model.setMode('editing');
    this.dispatchEvent(new CustomEvent('modeChange', { detail: { oldMode, newMode: 'editing' } }));
    this.view.enterEditingMode(cellRef);
  }

  private switchToNavigation(): void {
    const oldMode = this.model.getMode();
    this.model.setMode('navigation');
    this.dispatchEvent(new CustomEvent('modeChange', { detail: { oldMode, newMode: 'navigation' } }));
    const currentCell = this.model.getCurrentCell();
    this.view.enterNavigationMode(currentCell);
  }
  
  // DSL integration
  private validateCell(cellRef: CellReference, value: string): boolean {
    const { cellType, commandIndex } = cellRef;
    if (cellType === 'command') {
      return this.dsl.commands.includes(value) || value === '';
    }
    if (cellType === 'param-key') {
        if (value === '') return true;
        const command = this.model.getCommands()[commandIndex];
        if (!command || !command.name) return false;
        const commandParams = this.dsl.parameters[command.name];
        return commandParams ? commandParams.includes(value) : false;
    }
    return true; // Param value is always valid for now
  }
  private getSuggestion(cellRef: CellReference, partial: string): string | null {
    const { cellType, commandIndex } = cellRef;
    if (partial === '') return null;

    if (cellType === 'command') {
        const match = this.dsl.commands.find(c => c.startsWith(partial));
        return match && match !== partial ? match : null;
    }
    if (cellType === 'param-key') {
      const command = this.model.getCommands()[commandIndex];
      if (!command || !command.name) return null;
      const commandParams = this.dsl.parameters[command.name];
      if (!commandParams) return null;
      const match = commandParams.find(p => p.startsWith(partial));
      return match && match !== partial ? match : null;
    }
    return null;
  }
  private autoComplete(cellRef: CellReference, completion: string): boolean {
    const cell = this.view.getCell(cellRef)
    if (!cell) return false
    const input = cell.querySelector('input');
    if (!input) return false
    input.value = completion;
    return true
  }

  private undo() {
    this.model.undo();
    this.view.render(this.model.getCommands());
    this.view.setNavigationFocus(this.model.getCurrentCell());
  }

  private redo() {
    this.model.redo();
    this.view.render(this.model.getCommands());
    this.view.setNavigationFocus(this.model.getCurrentCell());
  }
}
