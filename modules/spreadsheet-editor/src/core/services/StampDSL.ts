import type { DSLProvider, DSLCommand } from '@core/types';

export class StampDSL implements DSLProvider {
  private commands: DSLCommand[] = [
    {
      name: 'circle',
      parameters: ['radius', 'innerRadius', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'arch',
      parameters: ['width', 'sweepAngle', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'ellipse',
      parameters: ['radiusX', 'radiusY', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'leafShape',
      parameters: ['radius', 'splitAngle', 'splitAngle2', 'serration', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'rectangle',
      parameters: ['width', 'height', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'roundedRectangle',
      parameters: ['width', 'height', 'cornerRadius', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'polygon',
      parameters: ['rays', 'rayStrings', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'stamp',
      parameters: ['subStamp', 'subStampString', 'providerIndex', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'tangram',
      parameters: ['width', 'height', 'type', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'trapezoid',
      parameters: ['width', 'height', 'taper', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    },
    {
      name: 'bone',
      parameters: ['length', 'bottomRadius', 'topRadius', 'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'tag']
    }
  ];

  getValidCommands(): string[] {
    return this.commands.map(cmd => cmd.name);
  }

  getValidParameters(commandName: string): string[] {
    const command = this.commands.find(cmd => cmd.name === commandName);
    return command ? command.parameters : [];
  }

  getAllCommands(): DSLCommand[] {
    return [...this.commands];
  }

  // Autocomplete helpers
  findCommandMatches(input: string): string[] {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return this.getValidCommands().filter(cmd => 
      cmd.toLowerCase().startsWith(lower)
    );
  }

  findParameterMatches(commandName: string, input: string): string[] {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return this.getValidParameters(commandName).filter(param => 
      param.toLowerCase().startsWith(lower)
    );
  }
} 