import { describe, it, expect, beforeEach } from 'vitest';
import { FlowTokenizer, FlowToken, TokenType } from '../flow-tokenizer';

describe('FlowTokenizer', () => {
  let tokenizer: FlowTokenizer;

  beforeEach(() => {
    tokenizer = new FlowTokenizer();
  });

  describe('basic tokenization', () => {
    it('should tokenize simple flow statement', () => {
      const text = 'ON collision THEN do goto player';
      const tokens = tokenizer.getTokens(text);
      
      expect(tokens).toEqual([
        'ON', 'collision', 'THEN', 'do', 'goto', 'player'
      ]);
    });

    it('should handle quoted strings correctly', () => {
      const text = 'do showText "Hello World"';
      const tokens = tokenizer.getTokens(text);
      
      expect(tokens).toEqual([
        'do', 'showText', '"Hello World"'
      ]);
    });

    it('should handle quoted strings with spaces', () => {
      const text = 'do showText "Hello Player Name"';
      const tokens = tokenizer.getTokens(text);
      
      expect(tokens).toEqual([
        'do', 'showText', '"Hello Player Name"'
      ]);
    });
  });

  describe('context analysis', () => {
    it('should identify trigger context', () => {
      const text = 'ON collision';
      const context = tokenizer.analyzeContext(text, text.length);
      
      expect(context.type).toBe('trigger');
      expect(context.expectingSubtype).toBe(true);
      expect(context.category).toBe('triggers');
    });

    it('should identify condition context', () => {
      const text = 'IF health > 10';
      const context = tokenizer.analyzeContext(text, text.length);
      
      expect(context.type).toBe('condition');
      expect(context.expectingOperator).toBe(false);
      expect(context.expectingValue).toBe(false);
    });

    it('should identify action context', () => {
      const text = 'do goto';
      const context = tokenizer.analyzeContext(text, text.length);
      
      expect(context.type).toBe('action');
      expect(context.expectingSubtype).toBe(false);
      expect(context.expectingTarget).toBe(true);
    });

    it('should handle context transitions', () => {
      const text = 'ON collision THEN do';
      const context = tokenizer.analyzeContext(text, text.length);
      
      expect(context.type).toBe('action');
      expect(context.expectingSubtype).toBe(true);
    });
  });

  describe('word classification', () => {
    it('should classify reserved words correctly', () => {
      expect(tokenizer.getWordType('ON')).toBe(TokenType.TRIGGER);
      expect(tokenizer.getWordType('IF')).toBe(TokenType.CONDITION);
      expect(tokenizer.getWordType('do')).toBe(TokenType.ACTION);
      expect(tokenizer.getWordType('with')).toBe(TokenType.CONTEXT);
      expect(tokenizer.getWordType('wait')).toBe(TokenType.DELAY);
      expect(tokenizer.getWordType('rewind')).toBe(TokenType.FLOW_CONTROL);
    });

    it('should classify connector words', () => {
      expect(tokenizer.getWordType('then')).toBe(TokenType.CONNECTOR);
      expect(tokenizer.getWordType('else')).toBe(TokenType.CONNECTOR);
      expect(tokenizer.getWordType('endif')).toBe(TokenType.CONNECTOR);
      expect(tokenizer.getWordType('endelse')).toBe(TokenType.CONNECTOR);
    });

    it('should classify subtypes correctly', () => {
      expect(tokenizer.getWordType('collision', 'triggers')).toBe(TokenType.SUBTYPE);
      expect(tokenizer.getWordType('health', 'conditions')).toBe(TokenType.SUBTYPE);
      expect(tokenizer.getWordType('goto', 'actions')).toBe(TokenType.SUBTYPE);
    });

    it('should classify operators and values', () => {
      expect(tokenizer.getWordType('>')).toBe(TokenType.OPERATOR);
      expect(tokenizer.getWordType('==')).toBe(TokenType.OPERATOR);
      expect(tokenizer.getWordType('10')).toBe(TokenType.NUMBER);
      expect(tokenizer.getWordType('"hello"')).toBe(TokenType.STRING);
    });
  });

  describe('autocomplete suggestions', () => {
    it('should suggest subtypes after trigger', () => {
      const text = 'ON ';
      const suggestions = tokenizer.getSuggestions(text, text.length);
      
      expect(suggestions).toContain('collision');
      expect(suggestions).toContain('start');
      expect(suggestions).toContain('frame');
      expect(suggestions.length).toBeGreaterThan(5);
    });

    it('should suggest connectors after complete trigger', () => {
      const text = 'ON collision ';
      const suggestions = tokenizer.getSuggestions(text, text.length);
      
      expect(suggestions).toContain('then');
      expect(suggestions.length).toBe(1);
    });

    it('should suggest action subtypes after do', () => {
      const text = 'ON collision THEN do ';
      const suggestions = tokenizer.getSuggestions(text, text.length);
      
      expect(suggestions).toContain('goto');
      expect(suggestions).toContain('changeHealth');
      expect(suggestions).toContain('create');
    });

    it('should filter suggestions by partial text', () => {
      const text = 'ON col';
      const suggestions = tokenizer.getSuggestions(text, text.length);
      
      expect(suggestions).toContain('collision');
      expect(suggestions).not.toContain('start');
    });
  });

  describe('validation', () => {
    it('should validate complete statements', () => {
      const text = 'ON collision THEN do goto player';
      const isValid = tokenizer.validate(text);
      
      expect(isValid.isValid).toBe(true);
      expect(isValid.errors).toEqual([]);
    });

    it('should detect incomplete statements', () => {
      const text = 'ON collision';
      const isValid = tokenizer.validate(text);
      
      expect(isValid.isValid).toBe(false);
      expect(isValid.errors).toContain('Expected connector word after trigger');
    });

    it('should detect invalid words', () => {
      const text = 'ON invalidword';
      const isValid = tokenizer.validate(text);
      
      expect(isValid.isValid).toBe(false);
      expect(isValid.errors).toContain('Unknown word: invalidword');
    });
  });
}); 