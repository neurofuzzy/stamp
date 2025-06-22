export interface Parameter {
  name: string;
  value: any;
  type: 'number' | 'string' | 'boolean' | 'color' | 'object';
}

export interface Command {
  id: string;
  name: string;
  parameters: Parameter[];
  isExpanded?: boolean; // For nested parameter editing
}

export interface CodeSpreadsheet {
  commands: Command[];
}

export interface StampCommand {
  name: string;
  parameters: Record<string, {
    type: Parameter['type'];
    required: boolean;
    description?: string;
    defaultValue?: any;
  }>;
}

// Autocomplete context types
export interface AutocompleteContext {
  type: 'command' | 'parameter' | 'value';
  commandName?: string;
  parameterName?: string;
}

export interface AutocompleteSuggestion {
  text: string;
  description?: string;
  type: 'command' | 'parameter' | 'value';
}

// Stamp API command definitions
export const STAMP_COMMANDS: Record<string, StampCommand> = {
  circle: {
    name: 'circle',
    parameters: {
      radius: { type: 'number', required: true, description: 'Circle radius' },
      divisions: { type: 'number', required: false, description: 'Number of divisions' },
    }
  },
  rectangle: {
    name: 'rectangle',
    parameters: {
      width: { type: 'number', required: true, description: 'Rectangle width' },
      height: { type: 'number', required: true, description: 'Rectangle height' },
    }
  },
  moveTo: {
    name: 'moveTo',
    parameters: {
      x: { type: 'number', required: true, description: 'X coordinate' },
      y: { type: 'number', required: true, description: 'Y coordinate' },
    }
  },
  repeat: {
    name: 'repeat',
    parameters: {
      count: { type: 'number', required: true, description: 'Number of repetitions' },
    }
  }
}; 