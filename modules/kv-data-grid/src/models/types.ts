export interface DSLDefinition {
  commands: string[];
  parameters: {
    [commandName: string]: string[];
  };
  isValidCommand?(command: string): boolean;
  isValidParameter?(command: string, param: string): boolean;
  getCommandSuggestion?(partial: string): string | null;
  getParameterSuggestion?(command: string, partial: string): string | null;
}

export interface CommandData {
  name: string;
  parameters: ParameterData[];
}

export interface ParameterData {
  key: string;
  value: any;
}

export interface CellReference {
  commandIndex: number;
  cellType: 'command' | 'param-key' | 'param-value';
  paramIndex?: number;
}
