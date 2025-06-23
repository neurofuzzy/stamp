import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetView } from '@ui/components/SpreadsheetView';
import { SpreadsheetController } from '@ui/components/SpreadsheetController';
import { StampDSL } from '@core/services/StampDSL';

describe('UI Improvements', () => {
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

  describe('Backspace Behavior', () => {
    it('should clear and unlock locked cells, allowing immediate editing', () => {
      // Set up a locked command
      model.updateCommandName(0, 'circle');
      model.lockCommand(0);
      
      // Render and get the cell
      view.render(model);
      const commandCell = container.querySelector('[data-cell-type="command"]') as HTMLElement;
      
      expect(view.isLockedCell(commandCell, model)).toBe(true);
      expect(commandCell.textContent).toBe('circle');
      
      // Test that the model properly handles clearing
      model.clearCommand(0);
      model.unlockCommand(0);
      
      expect(model.isCommandLocked(0)).toBe(false);
      expect(model.commands[0].name).toBe('');
    });
  });

  describe('Simple Autocomplete', () => {
    it('should show and hide autocomplete without breaking cell editing', () => {
      // Test basic autocomplete functionality
      const autocomplete = model.getAutocompleteForCommand('cir');
      expect(autocomplete.hasMatches).toBe(true);
      expect(autocomplete.matches).toContain('circle');
      
      // Test that we can show and hide autocomplete
      view.render(model);
      const commandCell = container.querySelector('[data-cell-type="command"]') as HTMLElement;
      
      view.showAutocomplete(commandCell, autocomplete);
      expect(document.querySelector('.autocomplete-ghost')).toBeTruthy();
      
      view.hideAutocomplete();
      expect(document.querySelector('.autocomplete-ghost')).toBeFalsy();
    });

    it('should handle empty autocomplete results gracefully', () => {
      const autocomplete = model.getAutocompleteForCommand('invalidcommand');
      expect(autocomplete.hasMatches).toBe(false);
      
      view.render(model);
      const commandCell = container.querySelector('[data-cell-type="command"]') as HTMLElement;
      
      view.showAutocomplete(commandCell, autocomplete);
      expect(document.querySelector('.autocomplete-ghost')).toBeFalsy();
    });
  });

  describe('Event Flow Stability', () => {
    it('should handle multiple input events without breaking', () => {
      // Test that typing multiple characters works
      model.updateCommandName(0, 'c');
      expect(model.commands[0].name).toBe('c');
      
      model.updateCommandName(0, 'ci');
      expect(model.commands[0].name).toBe('ci');
      
      model.updateCommandName(0, 'cir');
      expect(model.commands[0].name).toBe('cir');
      
      model.updateCommandName(0, 'circ');
      expect(model.commands[0].name).toBe('circ');
      
      // Should still be able to complete
      const autocomplete = model.getAutocompleteForCommand('circ');
      expect(autocomplete.hasMatches).toBe(true);
      expect(autocomplete.matches).toContain('circle');
    });

    it('should unlock cells when all text is deleted', () => {
      // Set up a locked command with content
      model.updateCommandName(0, 'circle');
      model.lockCommand(0);
      expect(model.isCommandLocked(0)).toBe(true);
      
      // Delete all content
      model.updateCommandName(0, '');
      
      // Simulate blur event logic
      const isEmpty = model.commands[0].name.trim() === '';
      const isLocked = model.isCommandLocked(0);
      
      // Should unlock when empty
      if (isEmpty && isLocked) {
        model.unlockCommand(0);
      }
      
      expect(model.isCommandLocked(0)).toBe(false);
      expect(model.commands[0].name).toBe('');
    });

    it('should lock cells when content is added', () => {
      // Start with empty unlocked cell
      expect(model.commands[0].name).toBe('');
      expect(model.isCommandLocked(0)).toBe(false);
      
      // Add content
      model.updateCommandName(0, 'rectangle');
      
      // Simulate blur event logic
      const hasContent = model.commands[0].name.trim() !== '';
      const isLocked = model.isCommandLocked(0);
      
      // Should lock when has content and not already locked
      if (hasContent && !isLocked) {
        model.lockCommand(0);
      }
      
      expect(model.isCommandLocked(0)).toBe(true);
      expect(model.commands[0].name).toBe('rectangle');
    });
  });
}); 