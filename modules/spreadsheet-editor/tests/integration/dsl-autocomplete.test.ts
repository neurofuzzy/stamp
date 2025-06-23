import { describe, it, expect, beforeEach } from 'vitest';
import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { StampDSL } from '@core/services/StampDSL';

describe('DSL Autocomplete Integration', () => {
  let model: SpreadsheetModel;
  let dsl: StampDSL;

  beforeEach(() => {
    dsl = new StampDSL();
    model = new SpreadsheetModel({ dsl });
  });

  describe('Command Autocomplete', () => {
    it('should return matches for partial command input', () => {
      const result = model.getAutocompleteForCommand('cir');
      
      expect(result.hasMatches).toBe(true);
      expect(result.matches).toContain('circle');
      expect(result.prefix).toBe('cir');
    });

    it('should return empty matches for invalid input', () => {
      const result = model.getAutocompleteForCommand('invalid');
      
      expect(result.hasMatches).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it('should handle empty input', () => {
      const result = model.getAutocompleteForCommand('');
      
      expect(result.hasMatches).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('Parameter Autocomplete', () => {
    it('should return matches for circle parameters', () => {
      const result = model.getAutocompleteForParameter('circle', 'rad');
      
      expect(result.hasMatches).toBe(true);
      expect(result.matches).toContain('radius');
      expect(result.prefix).toBe('rad');
    });

    it('should return matches for rectangle parameters', () => {
      const result = model.getAutocompleteForParameter('rectangle', 'w');
      
      expect(result.hasMatches).toBe(true);
      expect(result.matches).toContain('width');
    });

    it('should return empty matches for invalid command', () => {
      const result = model.getAutocompleteForParameter('invalidCommand', 'param');
      
      expect(result.hasMatches).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('Tab Completion', () => {
    it('should complete command input', () => {
      // Set up a command with partial input
      model.updateCommandName(0, 'cir');
      
      // Test completion
      model.completeCurrentInput('circle');
      
      expect(model.commands[0].name).toBe('circle');
    });

    it('should complete parameter input', () => {
      // Set up a command and parameter
      model.updateCommandName(0, 'circle');
      model.setFocus(0, 0, 'param-key');
      model.updateParameterKey(0, 0, 'rad');
      
      // Test completion  
      model.completeCurrentInput('radius');
      
      expect(model.commands[0].parameters[0].key).toBe('radius');
    });
  });

  describe('DSL Provider', () => {
    it('should provide all valid commands', () => {
      const commands = dsl.getValidCommands();
      
      expect(commands).toContain('circle');
      expect(commands).toContain('rectangle');
      expect(commands).toContain('ellipse');
      expect(commands.length).toBeGreaterThan(5);
    });

    it('should provide parameters for specific commands', () => {
      const circleParams = dsl.getValidParameters('circle');
      const rectParams = dsl.getValidParameters('rectangle');
      
      expect(circleParams).toContain('radius');
      expect(circleParams).toContain('innerRadius');
      expect(rectParams).toContain('width');
      expect(rectParams).toContain('height');
    });
  });
}); 