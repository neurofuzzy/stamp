import { AutocompleteContext, AutocompleteSuggestion, STAMP_COMMANDS } from './types.js';

export class AutocompleteEngine {
  
  getSuggestions(input: string, context: AutocompleteContext): AutocompleteSuggestion[] {
    const normalizedInput = input.toLowerCase().trim();
    
    switch (context.type) {
      case 'command':
        return this.getCommandSuggestions(normalizedInput);
      case 'parameter':
        return this.getParameterSuggestions(normalizedInput, context.commandName);
      case 'value':
        return this.getValueSuggestions(normalizedInput, context.commandName, context.parameterName);
      default:
        return [];
    }
  }

  private getCommandSuggestions(input: string): AutocompleteSuggestion[] {
    return Object.values(STAMP_COMMANDS)
      .filter(cmd => cmd.name.toLowerCase().includes(input))
      .map(cmd => ({
        text: cmd.name,
        description: `Create a ${cmd.name}`,
        type: 'command' as const
      }));
  }

  private getParameterSuggestions(input: string, commandName?: string): AutocompleteSuggestion[] {
    if (!commandName || !STAMP_COMMANDS[commandName]) {
      return [];
    }

    const command = STAMP_COMMANDS[commandName];
    return Object.entries(command.parameters)
      .filter(([paramName]) => paramName.toLowerCase().includes(input))
      .map(([paramName, paramDef]) => ({
        text: paramName,
        description: paramDef.description || `${paramName} parameter`,
        type: 'parameter' as const
      }));
  }

  private getValueSuggestions(input: string, commandName?: string, parameterName?: string): AutocompleteSuggestion[] {
    if (!commandName || !parameterName || !STAMP_COMMANDS[commandName]) {
      return [];
    }

    const paramDef = STAMP_COMMANDS[commandName].parameters[parameterName];
    if (!paramDef) return [];

    const suggestions: AutocompleteSuggestion[] = [];

    // Type-specific suggestions
    switch (paramDef.type) {
      case 'number':
        if (input === '' || /^\d*\.?\d*$/.test(input)) {
          suggestions.push(
            { text: '0', description: 'Zero', type: 'value' },
            { text: '10', description: 'Ten', type: 'value' },
            { text: '100', description: 'One hundred', type: 'value' }
          );
        }
        break;
      case 'boolean':
        suggestions.push(
          { text: 'true', description: 'True value', type: 'value' },
          { text: 'false', description: 'False value', type: 'value' }
        );
        break;
      case 'string':
        suggestions.push(
          { text: '""', description: 'Empty string', type: 'value' }
        );
        break;
    }

    return suggestions.filter(s => s.text.toLowerCase().includes(input));
  }
} 