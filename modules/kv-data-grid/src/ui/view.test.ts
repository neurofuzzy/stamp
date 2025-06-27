import { describe, it, expect, beforeEach } from 'vitest';
import { KVDataGridView } from './view';
import type { CommandData, CellReference } from '@core/types';

describe('KVDataGridView', () => {
  let view: KVDataGridView;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    view = new KVDataGridView(container);
  });

  describe('initialization', () => {
    it('should create table structure in container', () => {
      const table = container.querySelector('table');
      expect(table).toBeTruthy();
      expect(table?.classList.contains('kv-datagrid')).toBe(true);
    });

    it('should create thead with correct column headers', () => {
      const headers = container.querySelectorAll('thead th');
      expect(headers).toHaveLength(3);
      expect(headers[0].textContent).toBe('Command');
      expect(headers[1].textContent).toBe('Parameter');
      expect(headers[2].textContent).toBe('Value');
    });
  });

  describe('rendering commands', () => {
    it('should render empty state with one empty command row', () => {
      view.render([]);
      
      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(1);
      
      // Should have empty command cell
      const commandCell = rows?.[0].querySelector('.command-cell');
      expect(commandCell?.textContent).toBe('');
    });

    it('should render single command without parameters', () => {
      const commands: CommandData[] = [
        { name: 'circle', parameters: [] }
      ];
      
      view.render(commands);
      
      const commandCell = container.querySelector('.command-cell');
      expect(commandCell?.textContent).toBe('circle');
    });

    it('should render command with parameters using rowspan', () => {
      const commands: CommandData[] = [
        { 
          name: 'circle', 
          parameters: [
            { key: 'radius', value: '10' },
            { key: 'x', value: '5' }
          ] 
        }
      ];
      
      view.render(commands);
      
      const commandCell = container.querySelector('.command-cell') as HTMLTableCellElement;
      expect(commandCell.rowSpan).toBe(3); // Command + 2 params + 1 empty
      
      const paramCells = container.querySelectorAll('.param-key-cell');
      expect(paramCells).toHaveLength(3); // 2 params + 1 empty
      expect(paramCells[0].textContent).toBe('radius');
      expect(paramCells[1].textContent).toBe('x');
      expect(paramCells[2].textContent).toBe(''); // Empty parameter row
    });

    it('should always include empty parameter row for each command', () => {
      const commands: CommandData[] = [
        { 
          name: 'circle', 
          parameters: [{ key: 'radius', value: '10' }] 
        }
      ];
      
      view.render(commands);
      
      const rows = container.querySelectorAll('tbody tr');
      // Should have: param row + empty param row
      expect(rows).toHaveLength(2);
      
      const lastRow = rows[rows.length - 1];
      const emptyParamKey = lastRow.querySelector('.param-key-cell');
      expect(emptyParamKey?.textContent).toBe('');
    });
  });

  describe('cell focus and editing', () => {
    beforeEach(() => {
      const commands: CommandData[] = [
        { 
          name: 'circle', 
          parameters: [{ key: 'radius', value: '10' }] 
        }
      ];
      view.render(commands);
    });

    it('should focus a cell', () => {
      const cellRef: CellReference = {
        commandIndex: 0,
        cellType: 'command'
      };
      
      view.setFocus(cellRef);
      
      const commandCell = container.querySelector('.command-cell');
      expect(commandCell?.classList.contains('focused')).toBe(true);
    });

    it('should enter editing mode for a cell', () => {
      const cellRef: CellReference = {
        commandIndex: 0,
        cellType: 'param-value',
        paramIndex: 0
      };
      
      view.enterEditingMode(cellRef);
      
      const valueCell = container.querySelector('.param-value-cell');
      expect(valueCell?.classList.contains('editing')).toBe(true);
      
      const input = valueCell?.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.value).toBe('10');
    });

    it('should exit editing mode and update cell value', () => {
      const cellRef: CellReference = {
        commandIndex: 0,
        cellType: 'param-value',
        paramIndex: 0
      };
      
      view.enterEditingMode(cellRef);
      
      // Simulate user typing
      const input = container.querySelector('.param-value-cell input') as HTMLInputElement;
      input.value = '20';
      
      view.exitEditingMode(cellRef, '20');
      
      const valueCell = container.querySelector('.param-value-cell');
      expect(valueCell?.classList.contains('editing')).toBe(false);
      expect(valueCell?.textContent).toBe('20');
    });
  });

  describe('styling and appearance', () => {
    it('should apply appropriate CSS classes', () => {
      const commands: CommandData[] = [
        { 
          name: 'circle', 
          parameters: [{ key: 'radius', value: '10' }] 
        }
      ];
      
      view.render(commands);
      
      const commandCell = container.querySelector('.command-cell');
      const paramKeyCell = container.querySelector('.param-key-cell');
      const paramValueCell = container.querySelector('.param-value-cell');
      
      expect(commandCell?.classList.contains('command-cell')).toBe(true);
      expect(paramKeyCell?.classList.contains('param-key-cell')).toBe(true);
      expect(paramValueCell?.classList.contains('param-value-cell')).toBe(true);
    });
  });
}); 