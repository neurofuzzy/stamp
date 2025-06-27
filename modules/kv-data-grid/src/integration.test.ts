import { describe, it, expect, beforeEach } from 'vitest';
import { KVDataGrid } from './index';
import type { DSLDefinition } from '@core/types';

describe('KVDataGrid Integration Tests - End-to-End User Interactions', () => {
  let grid: KVDataGrid;
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
    
    grid = new KVDataGrid(container, mockDSL);
  });

  describe('Placeholder Text (Spec Requirement)', () => {
    it('should show placeholder text in empty cells', () => {
      const commandCell = container.querySelector('.command-cell');
      const paramKeyCell = container.querySelector('.param-key-cell');
      const paramValueCell = container.querySelector('.param-value-cell');
      
      // Spec says: "should be full-height of 1 line with placeholder text. 
      // Columns A. "command...", B. "param..." C. "value...""
      expect(commandCell?.textContent || commandCell?.getAttribute('placeholder')).toContain('command');
      expect(paramKeyCell?.textContent || paramKeyCell?.getAttribute('placeholder')).toContain('param');
      expect(paramValueCell?.textContent || paramValueCell?.getAttribute('placeholder')).toContain('value');
    });
  });

  describe('Keyboard Navigation (Primary User Interaction)', () => {
    it('should respond to arrow key navigation from focused container', () => {
      // Focus the first cell
      grid.focusCell(0, 'command');
      
      // Container should be focusable for keyboard events
      expect(container.tabIndex).toBe(0);
      
      // Simulate right arrow key
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      container.dispatchEvent(event);
      
      // Should navigate to param-key cell
      const currentCell = grid.getCurrentCell();
      expect(currentCell?.cellType).toBe('param-key');
    });

    it('should enter editing mode on Enter key', () => {
      grid.focusCell(0, 'command');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(event);
      
      // Should be in editing mode with input field
      expect(grid.getCurrentMode()).toBe('editing');
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
    });
  });

  describe('Cell Click Interaction', () => {
    it('should focus cells when clicked', () => {
      const commandCell = container.querySelector('.command-cell') as HTMLElement;
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      commandCell.dispatchEvent(clickEvent);
      
      // Should focus the cell
      const currentCell = grid.getCurrentCell();
      expect(currentCell?.cellType).toBe('command');
    });
  });
}); 