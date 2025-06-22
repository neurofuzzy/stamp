import { describe, it, expect, beforeEach } from 'vitest';
import { FlowRenderer, RenderResult } from '../flow-renderer';
import { FlowTokenizer } from '../flow-tokenizer';

describe('FlowRenderer', () => {
  let renderer: FlowRenderer;
  let tokenizer: FlowTokenizer;

  beforeEach(() => {
    tokenizer = new FlowTokenizer();
    renderer = new FlowRenderer(tokenizer);
  });

  describe('basic rendering', () => {
    it('should render simple flow statement with colors', () => {
      const text = 'ON collision THEN do goto player';
      const result = renderer.render(text);
      
      expect(result.html).toContain('<span');
      expect(result.html).toContain('color:');
      expect(result.hasError).toBe(false);
    });

    it('should render trigger words in uppercase', () => {
      const text = 'on collision';
      const result = renderer.render(text);
      
      expect(result.html).toContain('ON');
      expect(result.html).toContain('collision');
    });

    it('should preserve case for subtypes', () => {
      const text = 'do changeHealth';
      const result = renderer.render(text);
      
      expect(result.html).toContain('changeHealth');
      expect(result.html).not.toContain('CHANGEHEALTH');
    });
  });

  describe('color coding', () => {
    it('should apply trigger colors', () => {
      const text = 'ON start';
      const result = renderer.render(text);
      
      expect(result.html).toContain('color:#ff3300'); // trigger color
    });

    it('should apply condition colors', () => {
      const text = 'IF health > 10';
      const result = renderer.render(text);
      
      expect(result.html).toContain('color:#cccc00'); // condition color
    });

    it('should apply action colors', () => {
      const text = 'do goto player';
      const result = renderer.render(text);
      
      expect(result.html).toContain('color:#dd8866'); // action color
    });

    it('should apply connector colors', () => {
      const text = 'ON collision THEN do goto';
      const result = renderer.render(text);
      
      expect(result.html).toContain('color:#0099cc'); // connector color for THEN
    });

    it('should apply number colors', () => {
      const text = 'IF health > 100';
      const result = renderer.render(text);
      
      expect(result.html).toContain('color:#dddddd'); // number color
    });

    it('should apply string colors', () => {
      const text = 'do showText "Hello World"';
      const result = renderer.render(text);
      
      expect(result.html).toContain('color:#dd8866'); // string color
    });
  });

  describe('context tracking', () => {
    it('should add context data attributes', () => {
      const text = 'ON collision THEN do goto';
      const result = renderer.render(text);
      
      expect(result.html).toContain('data-context=');
      expect(result.html).toContain('data-targettype=');
    });

    it('should track context transitions', () => {
      const text = 'ON collision THEN do goto player';
      const result = renderer.render(text);
      
      // Should have different contexts for trigger and action parts
      expect(result.html).toContain('data-context="0"'); // trigger context
      expect(result.html).toContain('data-context="2"'); // action context
    });
  });

  describe('error handling', () => {
    it('should highlight unknown words', () => {
      const text = 'ON invalidword';
      const result = renderer.render(text);
      
      expect(result.hasError).toBe(true);
      expect(result.errorWord).toBe('invalidword');
      expect(result.html).toContain('class="error"');
    });

    it('should handle empty text', () => {
      const text = '';
      const result = renderer.render(text);
      
      expect(result.html).toBe('');
      expect(result.hasError).toBe(false);
    });

    it('should handle whitespace', () => {
      const text = '   ON   collision   ';
      const result = renderer.render(text);
      
      expect(result.html).toContain('ON');
      expect(result.html).toContain('collision');
    });
  });

  describe('special formatting', () => {
    it('should handle non-breaking spaces', () => {
      const text = 'ON collision\xa0THEN';
      const result = renderer.render(text);
      
      expect(result.html).toContain('THEN');
    });

    it('should join spaces with same context', () => {
      const text = 'IF health > 10';
      const result = renderer.render(text);
      
      // Spaces between words in same context should have context data
      expect(result.html).toContain('<span> </span>');
    });

    it('should handle matched word formatting', () => {
      const text = 'on collision then do goto';
      const result = renderer.render(text);
      
      expect(result.html).toContain('ON'); // trigger should be uppercase
      expect(result.html).toContain('THEN'); // connector should be uppercase
      expect(result.html).toContain('collision'); // subtype should preserve case
    });
  });
}); 