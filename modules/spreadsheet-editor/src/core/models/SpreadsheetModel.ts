import type { Command, Parameter, FocusPosition, SpreadsheetState, SpreadsheetConfig } from '@core/types';

export class SpreadsheetModel implements SpreadsheetState {
  commands: Command[];
  focusPosition: FocusPosition;
  cursorPosition: number;
  private config: SpreadsheetConfig;

  constructor(config: SpreadsheetConfig = {}) {
    this.config = { autoExpand: true, lockOnBlur: true, ...config };
    this.commands = config.initialCommands || [this.createEmptyCommand()];
    this.focusPosition = { commandIndex: 0, paramIndex: 0, cellType: 'command' };
    this.cursorPosition = 0;
  }

  createEmptyCommand(): Command {
    return {
      name: '',
      nameIsLocked: false,
      parameters: [this.createEmptyParameter()]
    };
  }

  createEmptyParameter(): Parameter {
    return { key: '', value: '', keyIsLocked: false };
  }

  // Command operations
  updateCommandName(commandIndex: number, name: string): boolean {
    if (commandIndex >= 0 && commandIndex < this.commands.length) {
      this.commands[commandIndex].name = name;
      return this.config.autoExpand ? this.shouldExpandCommands(commandIndex, name) : false;
    }
    return false;
  }

  shouldExpandCommands(commandIndex: number, name: string): boolean {
    return commandIndex === this.commands.length - 1 && name.trim() !== '';
  }

  expandCommands(): void {
    this.commands.push(this.createEmptyCommand());
  }

  // Parameter operations
  updateParameterKey(commandIndex: number, paramIndex: number, key: string): boolean {
    const command = this.commands[commandIndex];
    if (command && paramIndex >= 0 && paramIndex < command.parameters.length) {
      command.parameters[paramIndex].key = key;
      return this.config.autoExpand ? this.shouldExpandParameters(command, paramIndex, key) : false;
    }
    return false;
  }

  updateParameterValue(commandIndex: number, paramIndex: number, value: string): void {
    const command = this.commands[commandIndex];
    if (command && paramIndex >= 0 && paramIndex < command.parameters.length) {
      command.parameters[paramIndex].value = value;
    }
  }

  shouldExpandParameters(command: Command, paramIndex: number, key: string): boolean {
    return paramIndex === command.parameters.length - 1 && key.trim() !== '';
  }

  expandParameters(commandIndex: number): void {
    const command = this.commands[commandIndex];
    if (command) {
      command.parameters.push(this.createEmptyParameter());
    }
  }

  // Lock operations
  lockCommand(commandIndex: number): void {
    if (this.commands[commandIndex]) {
      this.commands[commandIndex].nameIsLocked = true;
    }
  }

  unlockCommand(commandIndex: number): void {
    if (this.commands[commandIndex]) {
      this.commands[commandIndex].nameIsLocked = false;
    }
  }

  lockParameter(commandIndex: number, paramIndex: number): void {
    const command = this.commands[commandIndex];
    if (command && command.parameters[paramIndex]) {
      command.parameters[paramIndex].keyIsLocked = true;
    }
  }

  unlockParameter(commandIndex: number, paramIndex: number): void {
    const command = this.commands[commandIndex];
    if (command && command.parameters[paramIndex]) {
      command.parameters[paramIndex].keyIsLocked = false;
    }
  }

  clearCommand(commandIndex: number): void {
    if (this.commands[commandIndex]) {
      this.commands[commandIndex].name = '';
      this.commands[commandIndex].nameIsLocked = false;
    }
  }

  clearParameter(commandIndex: number, paramIndex: number): void {
    const command = this.commands[commandIndex];
    if (command && command.parameters[paramIndex]) {
      command.parameters[paramIndex].key = '';
      command.parameters[paramIndex].keyIsLocked = false;
    }
  }

  // State queries
  isCommandLocked(commandIndex: number): boolean {
    return this.commands[commandIndex]?.nameIsLocked || false;
  }

  isParameterLocked(commandIndex: number, paramIndex: number): boolean {
    return this.commands[commandIndex]?.parameters[paramIndex]?.keyIsLocked || false;
  }

  // Focus management
  setFocus(commandIndex: number, paramIndex: number, cellType: FocusPosition['cellType']): void {
    this.focusPosition = { commandIndex, paramIndex, cellType };
  }

  getFocus(): FocusPosition {
    return { ...this.focusPosition };
  }

  setCursorPosition(position: number): void {
    this.cursorPosition = position;
  }

  getCursorPosition(): number {
    return this.cursorPosition;
  }

  // Serialization
  toJSON(): SpreadsheetState {
    return {
      commands: this.commands,
      focusPosition: this.focusPosition,
      cursorPosition: this.cursorPosition
    };
  }
} 