export interface Parameter {
  key: string;
  value: string;
  keyIsLocked: boolean;
}

export interface Command {
  name: string;
  nameIsLocked: boolean;
  parameters: Parameter[];
}

export interface FocusPosition {
  commandIndex: number;
  paramIndex: number;
  cellType: 'command' | 'param-key' | 'param-value';
}

export interface SpreadsheetState {
  commands: Command[];
  focusPosition: FocusPosition;
  cursorPosition: number;
}

export interface SpreadsheetConfig {
  autoExpand?: boolean;
  lockOnBlur?: boolean;
  initialCommands?: Command[];
  dsl?: DSLProvider;
}

// DSL Support
export interface DSLCommand {
  name: string;
  parameters: string[];
}

export interface DSLProvider {
  getValidCommands(): string[];
  getValidParameters(commandName: string): string[];
  getAllCommands(): DSLCommand[];
}

export interface AutocompleteResult {
  matches: string[];
  prefix: string;
  hasMatches: boolean;
} 