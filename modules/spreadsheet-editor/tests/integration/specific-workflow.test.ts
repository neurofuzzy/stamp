import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetView } from '@ui/components/SpreadsheetView';
import { SpreadsheetController } from '@ui/components/SpreadsheetController';
import { StampDSL } from '@core/services/StampDSL';

describe('Specific Workflow: Type, Enter, Backspace', () => {
  let model: SpreadsheetModel;
  let view: SpreadsheetView;
  let controller: SpreadsheetController;
  let container: HTMLElement;

  beforeEach(() => {
    // Set up DOM
    container = document.createElement('table');
    container.className = 'grid';
    document.body.appendChild(container);

    // Initialize MVC
    const dsl = new StampDSL();
    model = new SpreadsheetModel({ dsl });
    view = new SpreadsheetView(container);
    controller = new SpreadsheetController(model, view);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle sequence: type "cir", Enter, backspace', () => {
    // Step 1: Type "cir"
    model.updateCommandName(0, 'cir');
    expect(model.commands[0].name).toBe('cir');
    expect(model.isCommandLocked(0)).toBe(false);

    // Step 2: Hit Enter (this should lock the cell)
    // Simulate Enter key behavior
    if (model.commands[0].name.trim()) {
      model.lockCommand(0);
    }
    expect(model.commands[0].name).toBe('cir');
    expect(model.isCommandLocked(0)).toBe(true);

    // Step 3: Press backspace (this should clear and unlock)
    // Simulate backspace in locked cell behavior
    model.clearCommand(0);
    model.unlockCommand(0);
    
    expect(model.commands[0].name).toBe('');
    expect(model.isCommandLocked(0)).toBe(false);
  });

  it('should allow immediate typing after backspace sequence', () => {
    // Complete the sequence: type, enter, backspace
    model.updateCommandName(0, 'cir');
    model.lockCommand(0);
    model.clearCommand(0);
    model.unlockCommand(0);
    
    // Should be able to type immediately
    model.updateCommandName(0, 'r');
    expect(model.commands[0].name).toBe('r');
    expect(model.isCommandLocked(0)).toBe(false);
    
    model.updateCommandName(0, 're');
    expect(model.commands[0].name).toBe('re');
    
    model.updateCommandName(0, 'rec');
    expect(model.commands[0].name).toBe('rec');
  });

  it('should maintain proper model state throughout the sequence', () => {
    // Initial state
    expect(model.commands[0].name).toBe('');
    expect(model.isCommandLocked(0)).toBe(false);
    
    // After typing
    model.updateCommandName(0, 'cir');
    expect(model.commands[0].name).toBe('cir');
    expect(model.isCommandLocked(0)).toBe(false);
    
    // After Enter (lock)
    model.lockCommand(0);
    expect(model.commands[0].name).toBe('cir');
    expect(model.isCommandLocked(0)).toBe(true);
    
    // After backspace (clear and unlock)
    model.clearCommand(0);
    model.unlockCommand(0);
    expect(model.commands[0].name).toBe('');
    expect(model.isCommandLocked(0)).toBe(false);
    
    // Should be ready for new input
    model.updateCommandName(0, 'new');
    expect(model.commands[0].name).toBe('new');
    expect(model.isCommandLocked(0)).toBe(false);
  });
}); 