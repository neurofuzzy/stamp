// Core interfaces and types for KV Data Grid

export interface DSLDefinition {
  commands: string[];
  parameters: {
    [commandName: string]: string[];
  };
  
  // Optional methods for advanced functionality
  isValidCommand?(command: string): boolean;
  isValidParameter?(command: string, param: string): boolean;
  getCommandSuggestion?(partial: string): string | null;
  getParameterSuggestion?(command: string, partial: string): string | null;
}

export interface ParameterData {
  key: string;
  value: string;
}

export interface CommandData {
  name: string;
  parameters: ParameterData[];
}

export interface CellReference {
  commandIndex: number;
  cellType: 'command' | 'param-key' | 'param-value';
  paramIndex?: number; // Only used for param-key and param-value cells
}

export type InteractionMode = 'navigation' | 'editing';

export interface ValidationResult {
  isValid: boolean;
  suggestion: string | null;
}

export interface KVDataGridOptions {
  autoFocus?: boolean;
  enableUndo?: boolean;
}

export interface CellChangeEvent {
  commandIndex: number;
  cellType: 'command' | 'param-key' | 'param-value';
  paramIndex?: number;
  oldValue: string;
  newValue: string;
}

export interface ModeChangeEvent {
  oldMode: InteractionMode;
  newMode: InteractionMode;
} 