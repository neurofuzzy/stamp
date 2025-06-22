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
  initialCommands?: Command[];
  autoExpand?: boolean;
  lockOnBlur?: boolean;
} 