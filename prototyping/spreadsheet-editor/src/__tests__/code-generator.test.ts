import { describe, it, expect } from 'vitest';
import { CodeGenerator } from '../code-generator.js';
import { CodeSpreadsheet } from '../types.js';

describe('CodeGenerator', () => {
  const generator = new CodeGenerator();

  it('should generate empty Stamp for no commands', () => {
    const spreadsheet: CodeSpreadsheet = { commands: [] };
    const result = generator.generateCode(spreadsheet);
    expect(result).toBe('new Stamp()  // Add commands to generate code');
  });

  it('should generate simple command without parameters', () => {
    const spreadsheet: CodeSpreadsheet = {
      commands: [{
        id: '1',
        name: 'circle',
        parameters: []
      }]
    };
    const result = generator.generateCode(spreadsheet);
    expect(result).toBe('new Stamp()\n  .circle()');
  });

  it('should generate command with single parameter', () => {
    const spreadsheet: CodeSpreadsheet = {
      commands: [{
        id: '1',
        name: 'circle',
        parameters: [{
          name: 'radius',
          value: 10,
          type: 'number'
        }]
      }]
    };
    const result = generator.generateCode(spreadsheet);
    expect(result).toBe('new Stamp()\n  .circle({ radius: 10 })');
  });

  it('should generate command with multiple parameters', () => {
    const spreadsheet: CodeSpreadsheet = {
      commands: [{
        id: '1',
        name: 'moveTo',
        parameters: [
          { name: 'x', value: 100, type: 'number' },
          { name: 'y', value: 50, type: 'number' }
        ]
      }]
    };
    const result = generator.generateCode(spreadsheet);
    expect(result).toBe('new Stamp()\n  .moveTo({ x: 100, y: 50 })');
  });

  it('should chain multiple commands', () => {
    const spreadsheet: CodeSpreadsheet = {
      commands: [
        {
          id: '1',
          name: 'circle',
          parameters: [{ name: 'radius', value: 10, type: 'number' }]
        },
        {
          id: '2',
          name: 'moveTo',
          parameters: [
            { name: 'x', value: 100, type: 'number' },
            { name: 'y', value: 50, type: 'number' }
          ]
        }
      ]
    };
    const result = generator.generateCode(spreadsheet);
    expect(result).toBe('new Stamp()\n  .circle({ radius: 10 })\n  .moveTo({ x: 100, y: 50 })');
  });

  it('should handle string parameters', () => {
    const spreadsheet: CodeSpreadsheet = {
      commands: [{
        id: '1',
        name: 'text',
        parameters: [{
          name: 'content',
          value: 'Hello World',
          type: 'string'
        }]
      }]
    };
    const result = generator.generateCode(spreadsheet);
    expect(result).toBe('new Stamp()\n  .text({ content: "Hello World" })');
  });

  it('should handle boolean parameters', () => {
    const spreadsheet: CodeSpreadsheet = {
      commands: [{
        id: '1',
        name: 'circle',
        parameters: [{
          name: 'filled',
          value: true,
          type: 'boolean'
        }]
      }]
    };
    const result = generator.generateCode(spreadsheet);
    expect(result).toBe('new Stamp()\n  .circle({ filled: true })');
  });
}); 