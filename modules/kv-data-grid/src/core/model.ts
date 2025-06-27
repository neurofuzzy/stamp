import type { 
  CommandData, 
  ParameterData, 
  CellReference, 
  InteractionMode, 
  DSLDefinition 
} from './types';

export class KVDataGridModel {
  private commands: CommandData[] = [];
  private currentCell: CellReference | null = null;
  private interactionMode: InteractionMode = 'navigation';
  private originalValues: Map<string, string> = new Map();

  constructor(private dsl: DSLDefinition) {}

  public getDSL(): DSLDefinition {
    return this.dsl;
  }

  // Data operations
  public getCommands(): CommandData[] {
    return [...this.commands]; // Return copy to prevent external mutation
  }

  public addCommand(): void {
    this.commands.push({
      name: '',
      parameters: []
    });
  }

  public updateCommand(index: number, data: Partial<CommandData>): void {
    if (index >= 0 && index < this.commands.length) {
      this.commands[index] = { ...this.commands[index], ...data };
    }
  }

  public addParameter(commandIndex: number): void {
    if (commandIndex >= 0 && commandIndex < this.commands.length) {
      this.commands[commandIndex].parameters.push({
        key: '',
        value: ''
      });
    }
  }

  public updateParameter(commandIndex: number, paramIndex: number, data: Partial<ParameterData>): void {
    if (commandIndex >= 0 && commandIndex < this.commands.length) {
      const params = this.commands[commandIndex].parameters;
      if (paramIndex >= 0 && paramIndex < params.length) {
        params[paramIndex] = { ...params[paramIndex], ...data };
      }
    }
  }

  // State operations
  public setMode(mode: InteractionMode): void {
    this.interactionMode = mode;
    
    // When entering editing mode, store the original value
    if (mode === 'editing' && this.currentCell) {
      const value = this.getCellValue(this.currentCell);
      const key = this.getCellKey(this.currentCell);
      this.originalValues.set(key, value);
    }
  }

  public getMode(): InteractionMode {
    return this.interactionMode;
  }

  public setCurrentCell(cell: CellReference): void {
    this.currentCell = cell;
  }

  public getCurrentCell(): CellReference | null {
    return this.currentCell;
  }

  public getOriginalValue(): string {
    if (!this.currentCell) return '';
    const key = this.getCellKey(this.currentCell);
    return this.originalValues.get(key) || '';
  }

  public isValidCellReference(cellRef: CellReference): boolean {
    // Check if command exists
    if (cellRef.commandIndex < 0 || cellRef.commandIndex >= this.commands.length) {
      return false;
    }

    // For param cells, check if parameter exists
    if ((cellRef.cellType === 'param-key' || cellRef.cellType === 'param-value')) {
      if (cellRef.paramIndex === undefined) return false;
      const params = this.commands[cellRef.commandIndex].parameters;
      return cellRef.paramIndex >= 0 && cellRef.paramIndex < params.length;
    }

    return true;
  }

  private getCellValue(cellRef: CellReference): string {
    const command = this.commands[cellRef.commandIndex];
    if (!command) return '';

    switch (cellRef.cellType) {
      case 'command':
        return command.name;
      case 'param-key':
        return cellRef.paramIndex !== undefined 
          ? (command.parameters[cellRef.paramIndex]?.key || '')
          : '';
      case 'param-value':
        return cellRef.paramIndex !== undefined 
          ? (command.parameters[cellRef.paramIndex]?.value || '')
          : '';
      default:
        return '';
    }
  }

  private getCellKey(cellRef: CellReference): string {
    return `${cellRef.commandIndex}-${cellRef.cellType}-${cellRef.paramIndex || 0}`;
  }
} 