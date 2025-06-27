import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KVDataGridController } from './controller';
import { KVDataGridModel } from '@core/model';
import { KVDataGridView } from '@ui/view';
import type { DSLDefinition, CellReference } from '@core/types';

describe('KVDataGridController', () => {
  let controller: KVDataGridController;
  let model: KVDataGridModel;
  let view: KVDataGridView;
  let container: HTMLElement;
  let mockDSL: DSLDefinition;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    mockDSL = {
      commands: ['circle', 'rect', 'line'],
      parameters: {
        'circle': ['radius', 'x', 'y'],
        'rect': ['width', 'height', 'x', 'y'],
        'line': ['x1', 'y1', 'x2', 'y2']
      }
    };
    
    model = new KVDataGridModel(mockDSL);
    view = new KVDataGridView(container);
    controller = new KVDataGridController(model, view, mockDSL);
    
    // Set up test data
    model.addCommand();
    model.updateCommand(0, { name: 'circle' });
    model.addParameter(0);
    model.updateParameter(0, 0, { key: 'radius', value: '10' });
    view.render(model.getCommands());
  });

  describe('initialization', () => {
    it('should start in navigation mode', () => {
      expect(model.getMode()).toBe('navigation');
    });

    it('should set up keyboard event listeners', () => {
      expect(controller.isListening()).toBe(true);
    });
  });

  describe('navigation mode - arrow key handling', () => {
    beforeEach(() => {
      const commandCell: CellReference = { commandIndex: 0, cellType: 'command' };
      controller.focusCell(commandCell);
    });

    it('should navigate right from command to param key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      controller.handleKeydown(event);
      
      const currentCell = model.getCurrentCell();
      expect(currentCell).toEqual({
        commandIndex: 0,
        cellType: 'param-key',
        paramIndex: 0
      });
    });

    it('should navigate right from param key to param value', () => {
      const paramKeyCell: CellReference = { commandIndex: 0, cellType: 'param-key', paramIndex: 0 };
      controller.focusCell(paramKeyCell);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      controller.handleKeydown(event);
      
      const currentCell = model.getCurrentCell();
      expect(currentCell).toEqual({
        commandIndex: 0,
        cellType: 'param-value',
        paramIndex: 0
      });
    });

    it('should navigate left from param value to param key', () => {
      const paramValueCell: CellReference = { commandIndex: 0, cellType: 'param-value', paramIndex: 0 };
      controller.focusCell(paramValueCell);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      controller.handleKeydown(event);
      
      const currentCell = model.getCurrentCell();
      expect(currentCell).toEqual({
        commandIndex: 0,
        cellType: 'param-key',
        paramIndex: 0
      });
    });

    it('should navigate left from param key to command', () => {
      const paramKeyCell: CellReference = { commandIndex: 0, cellType: 'param-key', paramIndex: 0 };
      controller.focusCell(paramKeyCell);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      controller.handleKeydown(event);
      
      const currentCell = model.getCurrentCell();
      expect(currentCell).toEqual({
        commandIndex: 0,
        cellType: 'command'
      });
    });

    it('should navigate down between parameter rows', () => {
      model.addParameter(0);
      model.updateParameter(0, 1, { key: 'x', value: '5' });
      view.render(model.getCommands());
      
      const paramKeyCell: CellReference = { commandIndex: 0, cellType: 'param-key', paramIndex: 0 };
      controller.focusCell(paramKeyCell);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      controller.handleKeydown(event);
      
      const currentCell = model.getCurrentCell();
      expect(currentCell).toEqual({
        commandIndex: 0,
        cellType: 'param-key',
        paramIndex: 1
      });
    });

    it('should navigate up between parameter rows', () => {
      model.addParameter(0);
      model.updateParameter(0, 1, { key: 'x', value: '5' });
      view.render(model.getCommands());
      
      const paramKeyCell: CellReference = { commandIndex: 0, cellType: 'param-key', paramIndex: 1 };
      controller.focusCell(paramKeyCell);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      controller.handleKeydown(event);
      
      const currentCell = model.getCurrentCell();
      expect(currentCell).toEqual({
        commandIndex: 0,
        cellType: 'param-key',
        paramIndex: 0
      });
    });
  });

  describe('mode transitions', () => {
    beforeEach(() => {
      const commandCell: CellReference = { commandIndex: 0, cellType: 'command' };
      controller.focusCell(commandCell);
    });

    it('should enter editing mode on Enter key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      controller.handleKeydown(event);
      
      expect(model.getMode()).toBe('editing');
    });

    it('should store original value when entering edit mode', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      controller.handleKeydown(event);
      
      expect(model.getOriginalValue()).toBe('circle');
    });
  });

  describe('editing mode', () => {
    beforeEach(() => {
      const commandCell: CellReference = { commandIndex: 0, cellType: 'command' };
      controller.focusCell(commandCell);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      controller.handleKeydown(enterEvent);
    });

    it('should exit editing mode on Enter and validate', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      controller.handleKeydown(event);
      
      expect(model.getMode()).toBe('navigation');
    });

    it('should exit editing mode on Tab and validate', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      controller.handleKeydown(event);
      
      expect(model.getMode()).toBe('navigation');
    });

    it('should cancel editing on Escape and restore original value', () => {
      const input = container.querySelector('input') as HTMLInputElement;
      if (input) {
        input.value = 'rect';
      }
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      controller.handleKeydown(event);
      
      expect(model.getMode()).toBe('navigation');
      const commands = model.getCommands();
      expect(commands[0].name).toBe('circle');
    });

    it('should not navigate with arrow keys in editing mode', () => {
      const originalCell = model.getCurrentCell();
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      controller.handleKeydown(event);
      
      expect(model.getCurrentCell()).toEqual(originalCell);
      expect(model.getMode()).toBe('editing');
    });
  });

  describe('DSL validation', () => {
    it('should validate command names against DSL', () => {
      const isValid = controller.validateCell(
        { commandIndex: 0, cellType: 'command' },
        'circle'
      );
      expect(isValid).toBe(true);
      
      const isInvalid = controller.validateCell(
        { commandIndex: 0, cellType: 'command' },
        'invalid'
      );
      expect(isInvalid).toBe(false);
    });

    it('should validate parameter keys against DSL', () => {
      const isValid = controller.validateCell(
        { commandIndex: 0, cellType: 'param-key', paramIndex: 0 },
        'radius'
      );
      expect(isValid).toBe(true);
    });

    it('should always validate parameter values as true', () => {
      const isValid = controller.validateCell(
        { commandIndex: 0, cellType: 'param-value', paramIndex: 0 },
        'any value here'
      );
      expect(isValid).toBe(true);
    });
  });

  describe('event emissions', () => {
    it('should emit cell change events', () => {
      const eventSpy = vi.fn();
      controller.addEventListener('cellChange', eventSpy);
      
      controller.updateCellValue(
        { commandIndex: 0, cellType: 'command' },
        'rect'
      );
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            commandIndex: 0,
            cellType: 'command',
            oldValue: 'circle',
            newValue: 'rect'
          })
        })
      );
    });

    it('should emit mode change events', () => {
      // Set up with a focused cell first
      const commandCell: CellReference = { commandIndex: 0, cellType: 'command' };
      controller.focusCell(commandCell);
      
      const eventSpy = vi.fn();
      controller.addEventListener('modeChange', eventSpy);
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      controller.handleKeydown(event);
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            oldMode: 'navigation',
            newMode: 'editing'
          })
        })
      );
    });
  });
}); 