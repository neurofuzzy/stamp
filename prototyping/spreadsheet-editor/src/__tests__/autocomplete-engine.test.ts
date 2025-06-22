import { describe, it, expect } from 'vitest';
import { AutocompleteEngine } from '../autocomplete-engine.js';
import { AutocompleteContext } from '../types.js';

describe('AutocompleteEngine', () => {
  const engine = new AutocompleteEngine();

  describe('command suggestions', () => {
    it('should return all commands for empty input', () => {
      const context: AutocompleteContext = { type: 'command' };
      const suggestions = engine.getSuggestions('', context);
      
      expect(suggestions).toHaveLength(4); // circle, rectangle, moveTo, repeat
      expect(suggestions.map(s => s.text)).toContain('circle');
      expect(suggestions.map(s => s.text)).toContain('rectangle');
    });

    it('should filter commands by input', () => {
      const context: AutocompleteContext = { type: 'command' };
      const suggestions = engine.getSuggestions('ci', context);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].text).toBe('circle');
    });
  });

  describe('parameter suggestions', () => {
    it('should return parameters for specific command', () => {
      const context: AutocompleteContext = { 
        type: 'parameter', 
        commandName: 'circle' 
      };
      const suggestions = engine.getSuggestions('', context);
      
      expect(suggestions.map(s => s.text)).toContain('radius');
      expect(suggestions.map(s => s.text)).toContain('divisions');
    });

    it('should filter parameters by input', () => {
      const context: AutocompleteContext = { 
        type: 'parameter', 
        commandName: 'moveTo' 
      };
      const suggestions = engine.getSuggestions('x', context);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].text).toBe('x');
    });

    it('should return empty array for unknown command', () => {
      const context: AutocompleteContext = { 
        type: 'parameter', 
        commandName: 'unknown' 
      };
      const suggestions = engine.getSuggestions('', context);
      
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('value suggestions', () => {
    it('should return number suggestions for number parameters', () => {
      const context: AutocompleteContext = { 
        type: 'value', 
        commandName: 'circle',
        parameterName: 'radius'
      };
      const suggestions = engine.getSuggestions('', context);
      
      expect(suggestions.map(s => s.text)).toContain('0');
      expect(suggestions.map(s => s.text)).toContain('10');
      expect(suggestions.map(s => s.text)).toContain('100');
    });

    it('should return empty array for unknown parameter', () => {
      const context: AutocompleteContext = { 
        type: 'value', 
        commandName: 'circle',
        parameterName: 'unknown'
      };
      const suggestions = engine.getSuggestions('', context);
      
      expect(suggestions).toHaveLength(0);
    });
  });
}); 