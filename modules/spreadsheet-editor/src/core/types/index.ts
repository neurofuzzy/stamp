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

// Editor state - UI concerns only
export interface EditorState {
  focusPosition: FocusPosition;
  cursorPosition: number;
  autocompleteState: {
    visible: boolean;
    suggestion: string;
  };
}

// Data model state - business data only
export interface SpreadsheetData {
  commands: Command[];
}

// Legacy interface for backwards compatibility during refactor
export interface SpreadsheetState extends SpreadsheetData, EditorState {}

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