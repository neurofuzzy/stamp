import { describe, it, expect, beforeEach } from 'vitest';
import { AutocompleteManager } from './autocomplete';
import type { DSLDefinition, CellReference } from '@core/types';

describe('AutocompleteManager', () => {
  let autocomplete: AutocompleteManager;
  let container: HTMLElement;
  let mockDSL: DSLDefinition;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    mockDSL = {
      commands: ['circle', 'rect', 'line', 'arc'],
      parameters: {
        'circle': ['radius', 'x', 'y', 'fill', 'stroke'],
        'rect': ['width', 'height', 'x', 'y', 'fill', 'stroke'],
        'line': ['x1', 'y1', 'x2', 'y2', 'stroke'],
        'arc': ['radius', 'startAngle', 'endAngle', 'x', 'y']
      }
    };
    
    autocomplete = new AutocompleteManager(container, mockDSL);
  });

  describe('command suggestions', () => {
    it('should suggest matching commands', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      const suggestions = autocomplete.getSuggestions(cellRef, 'ci');
      
      expect(suggestions).toEqual(['circle']);
    });

    it('should suggest all commands for empty input', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      const suggestions = autocomplete.getSuggestions(cellRef, '');
      
      expect(suggestions).toEqual(['circle', 'rect', 'line', 'arc']);
    });

    it('should return empty array for no matches', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      const suggestions = autocomplete.getSuggestions(cellRef, 'xyz');
      
      expect(suggestions).toEqual([]);
    });

    it('should suggest multiple matching commands', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      const suggestions = autocomplete.getSuggestions(cellRef, 'r');
      
      expect(suggestions).toEqual(['rect']);
    });
  });

  describe('parameter key suggestions', () => {
    it('should suggest parameters for known command', () => {
      autocomplete.setCurrentCommandData([
        { name: 'circle', parameters: [] }
      ]);
      
      const cellRef: CellReference = { commandIndex: 0, cellType: 'param-key', paramIndex: 0 };
      const suggestions = autocomplete.getSuggestions(cellRef, 'r');
      
      expect(suggestions).toEqual(['radius']);
    });

    it('should suggest all parameters for empty input', () => {
      autocomplete.setCurrentCommandData([
        { name: 'circle', parameters: [] }
      ]);
      
      const cellRef: CellReference = { commandIndex: 0, cellType: 'param-key', paramIndex: 0 };
      const suggestions = autocomplete.getSuggestions(cellRef, '');
      
      expect(suggestions).toEqual(['radius', 'x', 'y', 'fill', 'stroke']);
    });

    it('should return empty array for unknown command', () => {
      autocomplete.setCurrentCommandData([
        { name: 'unknown', parameters: [] }
      ]);
      
      const cellRef: CellReference = { commandIndex: 0, cellType: 'param-key', paramIndex: 0 };
      const suggestions = autocomplete.getSuggestions(cellRef, 'x');
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('parameter value suggestions', () => {
    it('should suggest values from other cells in same column', () => {
      autocomplete.setCurrentCommandData([
        { 
          name: 'circle', 
          parameters: [
            { key: 'radius', value: '10' },
            { key: 'x', value: '100' }
          ] 
        },
        { 
          name: 'rect', 
          parameters: [
            { key: 'width', value: '10' },
            { key: 'height', value: '50' }
          ] 
        }
      ]);
      
      const cellRef: CellReference = { commandIndex: 1, cellType: 'param-value', paramIndex: 0 };
      const suggestions = autocomplete.getSuggestions(cellRef, '1');
      
      expect(suggestions).toEqual(['10', '100']);
    });

    it('should return unique values only', () => {
      autocomplete.setCurrentCommandData([
        { 
          name: 'circle', 
          parameters: [
            { key: 'radius', value: '10' }
          ] 
        },
        { 
          name: 'rect', 
          parameters: [
            { key: 'width', value: '10' }
          ] 
        }
      ]);
      
      const cellRef: CellReference = { commandIndex: 1, cellType: 'param-value', paramIndex: 0 };
      const suggestions = autocomplete.getSuggestions(cellRef, '1');
      
      expect(suggestions).toEqual(['10']);
    });
  });

  describe('ghost text display', () => {
    it('should show ghost text for suggestion', () => {
      // Create a mock cell element first
      const mockCell = document.createElement('div');
      mockCell.className = 'command-cell';
      mockCell.dataset.commandIndex = '0';
      mockCell.dataset.cellType = 'command';
      container.appendChild(mockCell);
      
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      
      autocomplete.showGhostText(cellRef, 'ci', 'circle');
      
      const ghostOverlay = container.querySelector('.autocomplete-ghost');
      expect(ghostOverlay).toBeTruthy();
      expect(ghostOverlay?.textContent).toContain('rcle');
    });

    it('should hide ghost text', () => {
      // Create a mock cell element first
      const mockCell = document.createElement('div');
      mockCell.className = 'command-cell';
      mockCell.dataset.commandIndex = '0';
      mockCell.dataset.cellType = 'command';
      container.appendChild(mockCell);
      
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      autocomplete.showGhostText(cellRef, 'ci', 'circle');
      
      autocomplete.hideGhostText();
      
      const ghostOverlay = container.querySelector('.autocomplete-ghost');
      expect(ghostOverlay).toBeNull();
    });

    it('should create positioned ghost overlay', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      
      // Create a mock cell element
      const mockCell = document.createElement('div');
      mockCell.className = 'command-cell';
      mockCell.dataset.commandIndex = '0';
      mockCell.dataset.cellType = 'command';
      container.appendChild(mockCell);
      
      autocomplete.showGhostText(cellRef, 'ci', 'circle');
      
      const ghostOverlay = container.querySelector('.autocomplete-ghost') as HTMLElement;
      expect(ghostOverlay).toBeTruthy();
      expect(ghostOverlay.style.position).toBe('absolute');
      expect(ghostOverlay.style.pointerEvents).toBe('none');
      expect(ghostOverlay.style.color).toBe('rgb(102, 102, 102)');
    });
  });

  describe('best suggestion', () => {
    it('should return best matching suggestion', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      const bestSuggestion = autocomplete.getBestSuggestion(cellRef, 'cir');
      
      expect(bestSuggestion).toBe('circle');
    });

    it('should return null for no suggestions', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      const bestSuggestion = autocomplete.getBestSuggestion(cellRef, 'xyz');
      
      expect(bestSuggestion).toBeNull();
    });

    it('should return exact match when available', () => {
      const cellRef: CellReference = { commandIndex: 0, cellType: 'command' };
      const bestSuggestion = autocomplete.getBestSuggestion(cellRef, 'rect');
      
      expect(bestSuggestion).toBe('rect');
    });
  });
}); 