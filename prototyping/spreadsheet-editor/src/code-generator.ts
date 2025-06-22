import { CodeSpreadsheet, Command, Parameter } from './types.js';

export class CodeGenerator {
  
  generateCode(spreadsheet: CodeSpreadsheet): string {
    if (spreadsheet.commands.length === 0) {
      return 'new Stamp()  // Add commands to generate code';
    }

    const commandStrings = spreadsheet.commands.map(command => 
      this.generateCommandCode(command)
    );

    return `new Stamp()\n  .${commandStrings.join('\n  .')}`;
  }

  private generateCommandCode(command: Command): string {
    const params = this.generateParametersCode(command.parameters);
    return params.length > 0 ? `${command.name}(${params})` : `${command.name}()`;
  }

  private generateParametersCode(parameters: Parameter[]): string {
    if (parameters.length === 0) return '';
    
    const paramStrings = parameters.map(param => {
      const value = this.formatParameterValue(param);
      return `${param.name}: ${value}`;
    });

    return `{ ${paramStrings.join(', ')} }`;
  }

  private formatParameterValue(param: Parameter): string {
    switch (param.type) {
      case 'string':
        return `"${param.value}"`;
      case 'number':
        return String(param.value);
      case 'boolean':
        return String(param.value);
      default:
        return String(param.value);
    }
  }
} 