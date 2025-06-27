import { describe, it, expect, beforeEach } from 'vitest';
import { KVDataGridModel } from './model';
import type { CommandData, CellReference, DSLDefinition } from './types';

describe('KVDataGridModel', () => {
  let model: KVDataGridModel;
  let mockDSL: DSLDefinition;

  beforeEach(() => {
    mockDSL = {
      commands: ['circle', 'rect', 'line'],
      parameters: {
        'circle': ['radius', 'x', 'y'],
        'rect': ['width', 'height', 'x', 'y'],
        'line': ['x1', 'y1', 'x2', 'y2']
      }
    };
    model = new KVDataGridModel(mockDSL);
  });

  describe('initialization', () => {
    it('should start with empty commands array', () => {
      expect(model.getCommands()).toEqual([]);
    });

    it('should start in navigation mode', () => {
      expect(model.getMode()).toBe('navigation');
    });

    it('should have no current cell initially', () => {
      expect(model.getCurrentCell()).toBeNull();
    });
  });

  describe('command management', () => {
    it('should add a new empty command', () => {
      model.addCommand();
      const commands = model.getCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual({
        name: '',
        parameters: []
      });
    });

    it('should update command name', () => {
      model.addCommand();
      model.updateCommand(0, { name: 'circle' });
      
      const commands = model.getCommands();
      expect(commands[0].name).toBe('circle');
    });

    it('should add parameter to command', () => {
      model.addCommand();
      model.updateCommand(0, { name: 'circle' });
      model.addParameter(0);
      
      const commands = model.getCommands();
      expect(commands[0].parameters).toHaveLength(1);
      expect(commands[0].parameters[0]).toEqual({
        key: '',
        value: ''
      });
    });

    it('should update parameter', () => {
      model.addCommand();
      model.addParameter(0);
      model.updateParameter(0, 0, { key: 'radius', value: '10' });
      
      const commands = model.getCommands();
      expect(commands[0].parameters[0]).toEqual({
        key: 'radius',
        value: '10'
      });
    });
  });

  describe('cell reference and navigation', () => {
    beforeEach(() => {
      // Set up a command with parameters for navigation tests
      model.addCommand();
      model.updateCommand(0, { name: 'circle' });
      model.addParameter(0);
      model.addParameter(0);
    });

    it('should set current cell', () => {
      const cellRef: CellReference = {
        commandIndex: 0,
        cellType: 'command'
      };
      
      model.setCurrentCell(cellRef);
      expect(model.getCurrentCell()).toEqual(cellRef);
    });

    it('should validate cell references', () => {
      const validRef: CellReference = {
        commandIndex: 0,
        cellType: 'param-key',
        paramIndex: 0
      };
      
      expect(model.isValidCellReference(validRef)).toBe(true);
      
      const invalidRef: CellReference = {
        commandIndex: 1, // Command doesn't exist
        cellType: 'command'
      };
      
      expect(model.isValidCellReference(invalidRef)).toBe(false);
    });
  });

  describe('mode management', () => {
    it('should switch to editing mode', () => {
      model.setMode('editing');
      expect(model.getMode()).toBe('editing');
    });

    it('should remember original value when entering edit mode', () => {
      model.addCommand();
      model.updateCommand(0, { name: 'circle' });
      
      const cellRef: CellReference = {
        commandIndex: 0,
        cellType: 'command'
      };
      
      model.setCurrentCell(cellRef);
      model.setMode('editing');
      
      expect(model.getOriginalValue()).toBe('circle');
    });
  });
}); 