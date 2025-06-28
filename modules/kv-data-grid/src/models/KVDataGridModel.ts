import { CommandData, CellReference, ParameterData } from './types';

export class KVDataGridModel {
  private commands: CommandData[] = [];
  private history: CommandData[][] = [];
  private historyIndex = -1;
  private currentCell: CellReference | null = null;
  private interactionMode: 'navigation' | 'editing' = 'navigation';
  private originalValues: Map<string, string> = new Map();

  constructor() {
    this.ensureEmptyRows();
    this.saveState();
  }
  
  private saveState() {
    this.history.splice(this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(this.commands)));
    this.historyIndex++;
  }

  public undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.commands = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    }
  }

  public redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.commands = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    }
  }

  // Data operations
  public getCommands(): CommandData[] {
    return this.commands;
  }

  public importData(data: CommandData[]): void {
    this.commands = data;
    this.ensureEmptyRows();
    this.saveState();
  }

  public updateCommand(index: number, data: Partial<CommandData>): void {
    // to be implemented
    this.ensureEmptyRows();
  }
  public addCommand(): void {
    // to be implemented
    this.ensureEmptyRows();
  }
  public removeCommand(index: number): void {
    // to be implemented
    this.ensureEmptyRows();
  }

  public clearData(): void {
    this.commands = [];
    this.ensureEmptyRows();
    this.saveState();
  }

  public ensureEmptyRows() {
    // Ensure every command that has a name has an empty parameter row at the end
    this.commands.forEach(command => {
      if (command.name) {
        if (command.parameters.length === 0) {
          command.parameters.push({ key: '', value: '' });
        } else {
          const lastParam = command.parameters[command.parameters.length - 1];
          if (lastParam.key !== '' || lastParam.value !== '') {
            command.parameters.push({ key: '', value: '' });
          }
        }
      }
    });

    // Add an empty command row at the end if the last one is not empty
    const lastCommand = this.commands[this.commands.length - 1];
    if (!lastCommand || lastCommand.name !== '') {
      this.commands.push({ name: '', parameters: [{ key: '', value: '' }] });
    }
  }

  public updateCell(cellRef: CellReference, value: any) {
    const { commandIndex, cellType, paramIndex } = cellRef;
    const command = this.commands[commandIndex];
    if (!command) return;

    if (cellType === 'command') {
      command.name = value;
    } else if (paramIndex !== undefined) {
      const param = command.parameters[paramIndex];
      if (!param) {
          command.parameters[paramIndex] = { key: '', value: ''};
      }
      if (cellType === 'param-key') {
        command.parameters[paramIndex].key = value;
      } else if (cellType === 'param-value') {
        command.parameters[paramIndex].value = value;
      }
    }
    this.ensureEmptyRows();
    this.saveState();
  }
  
  // State operations  
  public setMode(mode: 'navigation' | 'editing'): void {
    this.interactionMode = mode;
  }
  public getMode(): 'navigation' | 'editing' {
    return this.interactionMode;
  }
  public setCurrentCell(cell: CellReference | null): void {
    this.currentCell = cell;
  }
  public getCurrentCell(): CellReference | null {
    return this.currentCell;
  }

  public getCell(cellRef: CellReference): { value: any } | null {
    const { commandIndex, cellType, paramIndex } = cellRef;
    const command = this.commands[commandIndex];
    if (!command) return null;

    if (cellType === 'command') {
      return { value: command.name };
    }
    if (paramIndex !== undefined) {
      const param = command.parameters[paramIndex];
      if (param) {
          if (cellType === 'param-key') return { value: param.key };
          if (cellType === 'param-value') return { value: param.value };
      }
    }
    return null;
  }
}
