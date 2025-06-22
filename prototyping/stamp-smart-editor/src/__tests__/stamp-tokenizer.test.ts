import { describe, it, expect, beforeEach } from 'vitest';
import { StampTokenizer, TokenType } from '../stamp-tokenizer';

describe('StampTokenizer', () => {
  let tokenizer: StampTokenizer;

  beforeEach(() => {
    tokenizer = new StampTokenizer();
  });

  describe('basic tokenization', () => {
    it('should tokenize simple method call', () => {
      const code = 'stamp.circle';
      const tokens = tokenizer.tokenize(code);
      
      expect(tokens).toEqual([
        { type: TokenType.IDENTIFIER, value: 'stamp', start: 0, end: 5 },
        { type: TokenType.DOT, value: '.', start: 5, end: 6 },
        { type: TokenType.METHOD, value: 'circle', start: 6, end: 12 }
      ]);
    });

    it('should tokenize method call with parentheses', () => {
      const code = 'stamp.circle()';
      const tokens = tokenizer.tokenize(code);
      
      expect(tokens).toEqual([
        { type: TokenType.IDENTIFIER, value: 'stamp', start: 0, end: 5 },
        { type: TokenType.DOT, value: '.', start: 5, end: 6 },
        { type: TokenType.METHOD, value: 'circle', start: 6, end: 12 },
        { type: TokenType.PAREN_OPEN, value: '(', start: 12, end: 13 },
        { type: TokenType.PAREN_CLOSE, value: ')', start: 13, end: 14 }
      ]);
    });

    it('should tokenize method chaining', () => {
      const code = 'stamp.circle().moveTo';
      const tokens = tokenizer.tokenize(code);
      
      expect(tokens.length).toBe(7);
      expect(tokens[5]).toEqual({ type: TokenType.DOT, value: '.', start: 14, end: 15 });
      expect(tokens[6]).toEqual({ type: TokenType.METHOD, value: 'moveTo', start: 15, end: 21 });
    });
  });

  describe('parameter object tokenization', () => {
    it('should tokenize method with parameter object', () => {
      const code = 'stamp.circle({radius: 10})';
      const tokens = tokenizer.tokenize(code);
      
      const paramTokens = tokens.slice(4, -1); // Extract parameter tokens
      expect(paramTokens).toEqual([
        { type: TokenType.BRACE_OPEN, value: '{', start: 13, end: 14 },
        { type: TokenType.PROPERTY, value: 'radius', start: 14, end: 20 },
        { type: TokenType.COLON, value: ':', start: 20, end: 21 },
        { type: TokenType.WHITESPACE, value: ' ', start: 21, end: 22 },
        { type: TokenType.NUMBER, value: '10', start: 22, end: 24 },
        { type: TokenType.BRACE_CLOSE, value: '}', start: 24, end: 25 }
      ]);
    });
  });

  describe('cursor position analysis', () => {
    it('should identify cursor context after dot', () => {
      const code = 'stamp.';
      const context = tokenizer.getCursorContext(code, code.length);
      
      expect(context.type).toBe('method-suggestion');
      expect(context.position).toBe(code.length);
    });

    it('should identify cursor context inside parameter object', () => {
      const code = 'stamp.circle({';
      const context = tokenizer.getCursorContext(code, code.length);
      
      expect(context.type).toBe('parameter-suggestion');
      expect(context.methodName).toBe('circle');
    });
  });
}); 