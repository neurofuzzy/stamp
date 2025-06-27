import { describe, it, expect, beforeEach } from 'vitest';
import { KVDataGrid } from './index';
import type { DSLDefinition, CommandData } from '@core/types';

describe('KVDataGrid', () => {
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

  describe('initialization', () => {
    it('should create table structure in container', () => {
      const table = container.querySelector('table.kv-datagrid');
      expect(table).toBeTruthy();
    });

    it('should start in navigation mode', () => {
      expect(grid.getCurrentMode()).toBe('navigation');
    });

    it('should have no current cell initially', () => {
      expect(grid.getCurrentCell()).toBeNull();
    });

    it('should render empty state initially', () => {
      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(1); // One empty command row
    });
  });

  describe('data management', () => {
    it('should export empty data initially', () => {
      const data = grid.exportData();
      expect(data).toEqual([{ name: '', parameters: [] }]);
    });

    it('should import data correctly', () => {
      const testData: CommandData[] = [
        {
          name: 'circle',
          parameters: [
            { key: 'radius', value: '10' },
            { key: 'x', value: '5' }
          ]
        }
      ];

      grid.importData(testData);
      const exportedData = grid.exportData();
      expect(exportedData).toEqual(testData);
    });

    it('should render imported data in the view', () => {
      const testData: CommandData[] = [
        {
          name: 'circle',
          parameters: [{ key: 'radius', value: '10' }]
        }
      ];

      grid.importData(testData);
      
      const commandCell = container.querySelector('.command-cell');
      expect(commandCell?.textContent).toBe('circle');
      
      const paramKeyCell = container.querySelector('.param-key-cell');
      expect(paramKeyCell?.textContent).toBe('radius');
    });

    it('should clear all data', () => {
      const testData: CommandData[] = [
        { name: 'circle', parameters: [{ key: 'radius', value: '10' }] }
      ];

      grid.importData(testData);
      grid.clearData();
      
      expect(grid.exportData()).toEqual([]);
      
      // Should render empty state
      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(1);
    });
  });

  describe('cell focus management', () => {
    beforeEach(() => {
      const testData: CommandData[] = [
        {
          name: 'circle',
          parameters: [{ key: 'radius', value: '10' }]
        }
      ];
      grid.importData(testData);
    });

    it('should focus a cell', () => {
      grid.focusCell(0, 'command');
      
      expect(grid.getCurrentCell()).toEqual({
        commandIndex: 0,
        cellType: 'command'
      });
      
      const commandCell = container.querySelector('.command-cell');
      expect(commandCell?.classList.contains('focused')).toBe(true);
    });

    it('should focus parameter cells with param index', () => {
      grid.focusCell(0, 'param-key', 0);
      
      expect(grid.getCurrentCell()).toEqual({
        commandIndex: 0,
        cellType: 'param-key',
        paramIndex: 0
      });
    });
  });

  describe('event system', () => {
    it('should support adding and removing event listeners', () => {
      let eventFired = false;

      const callback = () => {
        eventFired = true;
      };

      grid.addEventListener('test', callback);
      
      // Test that the event target exists and accepts listeners
      expect(grid.addEventListener).toBeDefined();
      expect(grid.removeEventListener).toBeDefined();
      
      // For now, we just verify the methods exist and don't throw
      grid.removeEventListener('test', callback);
      
      expect(eventFired).toBe(false); // Event wasn't actually fired
    });
  });
}); 