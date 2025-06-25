import type { Command, Parameter, SpreadsheetData, SpreadsheetConfig, DSLProvider, AutocompleteResult } from '@core/types';

export class SpreadsheetModel implements SpreadsheetData {
  commands: Command[];
  private config: SpreadsheetConfig;
  private dsl?: DSLProvider;

  constructor(config: SpreadsheetConfig = {}) {
    this.config = { autoExpand: true, lockOnBlur: true, ...config };
    this.dsl = config.dsl;
    this.commands = config.initialCommands || [this.createEmptyCommand()];
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
      
      if (this.config.autoExpand) {
        this.ensureEmptyRows();
        return true; // Always re-render to maintain empty rows
      }
    }
    return false;
  }

  // Ensure there's EXACTLY ONE empty row in each context  
  ensureEmptyRows(): void {
    // Remove any trailing empty commands (keep only ONE)
    while (this.commands.length > 1) {
      const lastCommand = this.commands[this.commands.length - 1];
      if (lastCommand.name.trim() === '' && lastCommand.parameters.every(p => p.key.trim() === '' && p.value.trim() === '')) {
        this.commands.pop();
      } else {
        break;
      }
    }
    
    // Ensure there's EXACTLY ONE empty command at the end
    const lastCommand = this.commands[this.commands.length - 1];
    if (lastCommand.name.trim() !== '' || lastCommand.parameters.some(p => p.key.trim() !== '' || p.value.trim() !== '')) {
      this.commands.push(this.createEmptyCommand());
    }
    
    // Ensure each command has EXACTLY ONE empty parameter at the end
    this.commands.forEach(command => {
      // Remove any trailing empty parameters (keep only ONE) - but only if we have more than 2 empty ones
      while (command.parameters.length > 2) {
        const lastParam = command.parameters[command.parameters.length - 1];
        const secondLastParam = command.parameters[command.parameters.length - 2];
        if (lastParam.key.trim() === '' && lastParam.value.trim() === '' &&
            secondLastParam.key.trim() === '' && secondLastParam.value.trim() === '') {
          command.parameters.pop();
        } else {
          break;
        }
      }
      
      // Ensure there's EXACTLY ONE empty parameter at the end
      const lastParam = command.parameters[command.parameters.length - 1];
      if (lastParam.key.trim() !== '' || lastParam.value.trim() !== '') {
        command.parameters.push(this.createEmptyParameter());
      }
    });
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
      
      if (this.config.autoExpand) {
        this.ensureEmptyRows();
        return true; // Always re-render to maintain empty rows
      }
    }
    return false;
  }

  updateParameterValue(commandIndex: number, paramIndex: number, value: string): boolean {
    const command = this.commands[commandIndex];
    if (command && paramIndex >= 0 && paramIndex < command.parameters.length) {
      command.parameters[paramIndex].value = value;
      
      if (this.config.autoExpand) {
        this.ensureEmptyRows();
        return true; // Always re-render to maintain empty rows
      }
    }
    return false;
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

  // Clean up empty trailing parameters
  cleanupEmptyParameters(commandIndex: number): void {
    const command = this.commands[commandIndex];
    if (!command) return;

    // Keep at least one parameter
    while (command.parameters.length > 1) {
      const lastParam = command.parameters[command.parameters.length - 1];
      if (lastParam.key.trim() === '' && lastParam.value.trim() === '') {
        command.parameters.pop();
      } else {
        break;
      }
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

  // DSL-related methods
  getAutocompleteForCommand(input: string): AutocompleteResult {
    if (!this.dsl) {
      return { matches: [], prefix: input, hasMatches: false };
    }

    const matches = (this.dsl as any).findCommandMatches ? 
      (this.dsl as any).findCommandMatches(input) : 
      this.dsl.getValidCommands().filter(cmd => 
        cmd.toLowerCase().startsWith(input.toLowerCase())
      );

    return {
      matches,
      prefix: input,
      hasMatches: matches.length > 0
    };
  }

  getAutocompleteForParameter(commandName: string, input: string): AutocompleteResult {
    if (!this.dsl) {
      return { matches: [], prefix: input, hasMatches: false };
    }

    const matches = (this.dsl as any).findParameterMatches ? 
      (this.dsl as any).findParameterMatches(commandName, input) : 
      this.dsl.getValidParameters(commandName).filter(param => 
        param.toLowerCase().startsWith(input.toLowerCase())
      );

    return {
      matches,
      prefix: input,
      hasMatches: matches.length > 0
    };
  }

  // New methods to check exact matches
  isValidCommand(input: string): boolean {
    if (!input.trim()) return true; // Empty strings are valid (don't clear them)
    if (!this.dsl) return false;
    return this.dsl.getValidCommands().includes(input);
  }

  isValidParameter(commandName: string, input: string): boolean {
    if (!input.trim()) return true; // Empty strings are valid (don't clear them)
    if (!this.dsl || !commandName) return false;
    return this.dsl.getValidParameters(commandName).includes(input);
  }

  hasValidAutocompleteMatch(cellType: string, commandIndex: number, input: string): boolean {
    if (cellType === 'command') {
      const autocomplete = this.getAutocompleteForCommand(input);
      // Only return true if we have matches AND the input is not an exact match
      return autocomplete.hasMatches && autocomplete.matches.some(match => match !== input);
    } else if (cellType === 'param-key') {
      const commandName = this.commands[commandIndex].name;
      if (commandName) {
        const autocomplete = this.getAutocompleteForParameter(commandName, input);
        // Only return true if we have matches AND the input is not an exact match
        return autocomplete.hasMatches && autocomplete.matches.some(match => match !== input);
      }
    }
    return false;
  }

  // Serialization
  toJSON(): SpreadsheetData {
    return {
      commands: this.commands
    };
  }
} 