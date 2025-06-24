import { describe, it, expect, beforeEach } from 'vitest';
import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetEditorState } from '@core/state/SpreadsheetState';
import { StampDSL } from '@core/services/StampDSL';

describe('End-to-End DSL Workflow', () => {
  let model: SpreadsheetModel;
  let state: SpreadsheetEditorState;
  let dsl: StampDSL;

  beforeEach(() => {
    dsl = new StampDSL();
    model = new SpreadsheetModel({ dsl });
    state = new SpreadsheetEditorState();
  });

  // Helper function to simulate completion like the controller does
  const completeCurrentInput = (completion: string) => {
    const { commandIndex, paramIndex, cellType } = state.getFocus();
    
    if (cellType === 'command') {
      model.updateCommandName(commandIndex, completion);
    } else if (cellType === 'param-key') {
      model.updateParameterKey(commandIndex, paramIndex, completion);
    }
  };

  it('should support complete DSL workflow: type, autocomplete, tab-complete, navigate', () => {
    // Start with empty spreadsheet
    expect(model.commands).toHaveLength(1);
    expect(model.commands[0].name).toBe('');

    // 1. Type partial command
    model.updateCommandName(0, 'cir');
    
    // 2. Get autocomplete suggestions
    const commandAutocomplete = model.getAutocompleteForCommand('cir');
    expect(commandAutocomplete.hasMatches).toBe(true);
    expect(commandAutocomplete.matches).toContain('circle');

    // 3. Tab-complete the command
    state.setFocus(0, 0, 'command');
    completeCurrentInput('circle');
    expect(model.commands[0].name).toBe('circle');
    expect(model.commands[0].nameIsLocked).toBe(false);

    // 4. Lock the command
    model.lockCommand(0);
    expect(model.commands[0].nameIsLocked).toBe(true);

    // 5. Navigate to parameter and type partial
    state.setFocus(0, 0, 'param-key');
    model.updateParameterKey(0, 0, 'rad');

    // 6. Get parameter autocomplete
    const paramAutocomplete = model.getAutocompleteForParameter('circle', 'rad');
    expect(paramAutocomplete.hasMatches).toBe(true);
    expect(paramAutocomplete.matches).toContain('radius');

    // 7. Tab-complete the parameter
    completeCurrentInput('radius');
    expect(model.commands[0].parameters[0].key).toBe('radius');

    // 8. Lock parameter and add value
    model.lockParameter(0, 0);
    state.setFocus(0, 0, 'param-value');
    model.updateParameterValue(0, 0, '10');
    expect(model.commands[0].parameters[0].value).toBe('10');

    // 9. Add second parameter (expand first)
    model.expandParameters(0);  // Ensure second parameter exists
    state.setFocus(0, 1, 'param-key');
    model.updateParameterKey(0, 1, 'inner');
    
    const innerAutocomplete = model.getAutocompleteForParameter('circle', 'inner');
    expect(innerAutocomplete.matches).toContain('innerRadius');
    
    completeCurrentInput('innerRadius');
    expect(model.commands[0].parameters[1].key).toBe('innerRadius');

    // 10. Verify final state
    expect(model.commands[0].name).toBe('circle');
    expect(model.commands[0].nameIsLocked).toBe(true);
    expect(model.commands[0].parameters[0].key).toBe('radius');
    expect(model.commands[0].parameters[0].value).toBe('10');
    expect(model.commands[0].parameters[1].key).toBe('innerRadius');
  });

  it('should validate DSL completeness for all shape types', () => {
    const allCommands = dsl.getAllCommands();
    
    // Verify we have all the expected shape commands
    const expectedCommands = [
      'circle', 'arch', 'ellipse', 'leafShape', 'rectangle', 
      'roundedRectangle', 'polygon', 'stamp', 'tangram', 'trapezoid', 'bone'
    ];
    
    expectedCommands.forEach(cmd => {
      expect(allCommands.find(c => c.name === cmd)).toBeDefined();
    });

    // Verify each command has the expected base parameters
    allCommands.forEach(cmd => {
      expect(cmd.parameters).toContain('angle');
      expect(cmd.parameters).toContain('scale');
      expect(cmd.parameters).toContain('offsetX');
      expect(cmd.parameters).toContain('offsetY');
    });

    // Verify specific shape parameters
    const circle = allCommands.find(c => c.name === 'circle')!;
    expect(circle.parameters).toContain('radius');
    expect(circle.parameters).toContain('innerRadius');

    const rectangle = allCommands.find(c => c.name === 'rectangle')!;
    expect(rectangle.parameters).toContain('width');
    expect(rectangle.parameters).toContain('height');
  });

  it('should handle edge cases gracefully', () => {
    // Empty input autocomplete
    expect(model.getAutocompleteForCommand('').hasMatches).toBe(false);
    expect(model.getAutocompleteForParameter('circle', '').hasMatches).toBe(false);

    // Invalid command autocomplete
    expect(model.getAutocompleteForCommand('zzzinvalid').hasMatches).toBe(false);
    expect(model.getAutocompleteForParameter('invalidcommand', 'param').hasMatches).toBe(false);

    // Case sensitivity
    expect(model.getAutocompleteForCommand('CIR').hasMatches).toBe(true);
    expect(model.getAutocompleteForParameter('circle', 'RAD').hasMatches).toBe(true);
  });
}); 