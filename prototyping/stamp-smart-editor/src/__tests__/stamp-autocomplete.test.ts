import { describe, it, expect, beforeEach } from 'vitest';
import { StampAutocomplete, Suggestion, SuggestionType } from '../stamp-autocomplete';

describe('StampAutocomplete', () => {
  let autocomplete: StampAutocomplete;

  beforeEach(() => {
    autocomplete = new StampAutocomplete();
  });

  describe('method suggestions', () => {
    it('should suggest all methods after stamp.', () => {
      const code = 'stamp.';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions.length).toBeGreaterThan(10);
      expect(suggestions).toContainEqual({
        type: SuggestionType.METHOD,
        text: 'circle',
        displayText: 'circle()',
        detail: 'Create a circle shape',
        insertText: 'circle()'
      });
      expect(suggestions).toContainEqual({
        type: SuggestionType.METHOD,
        text: 'moveTo',
        displayText: 'moveTo(x, y)',
        detail: 'Move cursor to absolute position',
        insertText: 'moveTo(${1:x}, ${2:y})'
      });
    });

    it('should filter method suggestions by partial text', () => {
      const code = 'stamp.cir';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions.length).toBe(1);
      expect(suggestions[0]).toEqual({
        type: SuggestionType.METHOD,
        text: 'circle',
        displayText: 'circle()',
        detail: 'Create a circle shape',
        insertText: 'circle()'
      });
    });

    it('should suggest methods after method chaining', () => {
      const code = 'stamp.circle().';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions.length).toBeGreaterThan(5);
      expect(suggestions.some(s => s.text === 'moveTo')).toBeTruthy();
      expect(suggestions.some(s => s.text === 'rectangle')).toBeTruthy();
    });
  });

  describe('parameter suggestions', () => {
    it('should suggest circle parameters', () => {
      const code = 'stamp.circle({';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions).toContainEqual({
        type: SuggestionType.PARAMETER,
        text: 'radius',
        displayText: 'radius: number',
        detail: 'Circle radius',
        insertText: 'radius: ${1:10}'
      });
      expect(suggestions).toContainEqual({
        type: SuggestionType.PARAMETER,
        text: 'numX',
        displayText: 'numX?: number',
        detail: 'Number of copies in X direction',
        insertText: 'numX: ${1:1}'
      });
    });

    it('should suggest rectangle parameters', () => {
      const code = 'stamp.rectangle({';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions).toContainEqual({
        type: SuggestionType.PARAMETER,
        text: 'width',
        displayText: 'width: number',
        detail: 'Rectangle width',
        insertText: 'width: ${1:100}'
      });
      expect(suggestions).toContainEqual({
        type: SuggestionType.PARAMETER,
        text: 'height',
        displayText: 'height: number',
        detail: 'Rectangle height',
        insertText: 'height: ${1:100}'
      });
    });

    it('should filter parameter suggestions by partial text', () => {
      const code = 'stamp.circle({rad';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].text).toBe('radius');
    });
  });

  describe('no suggestions', () => {
    it('should return empty array when no context available', () => {
      const code = 'const x = 10';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions).toEqual([]);
    });

    it('should return empty array inside string literals', () => {
      const code = 'stamp.set("BW")';
      const suggestions = autocomplete.getSuggestions(code, code.length);
      
      expect(suggestions).toEqual([]);
    });
  });
}); 