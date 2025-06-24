import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetView } from '@ui/views/SpreadsheetView';
import { SpreadsheetController } from '@ui/controllers/SpreadsheetController';
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
      expect(document.querySelector('.autocomplete-overlay')).toBeTruthy();
      
      view.hideAutocomplete();
      expect(document.querySelector('.autocomplete-overlay')).toBeFalsy();
    });

    it('should handle empty autocomplete results gracefully', () => {
      const autocomplete = model.getAutocompleteForCommand('invalidcommand');
      expect(autocomplete.hasMatches).toBe(false);
      
      view.render(model);
      const commandCell = container.querySelector('[data-cell-type="command"]') as HTMLElement;
      
      view.showAutocomplete(commandCell, autocomplete);
      expect(document.querySelector('.autocomplete-overlay')).toBeFalsy();
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

    it('should clear invalid content on blur but not during TAB navigation', () => {
      // This test verifies that invalid content is cleared on blur (navigation) but TAB still works
      
      // 1. Set up cells with invalid content (like user typing partial commands)
      view.render(model);
      let commandCell = container.querySelector('[data-command-index="0"][data-cell-type="command"]') as HTMLElement;
      
      // 2. Type invalid/partial content "ra" (not a valid command)
      commandCell.focus();
      commandCell.textContent = 'ra';
      commandCell.dispatchEvent(new Event('input', { bubbles: true }));
      expect(model.commands[0].name).toBe('ra');
      expect(model.isValidCommand('ra')).toBe(false);
      
      // 3. Press TAB - this should clear invalid content and navigate
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      commandCell.dispatchEvent(tabEvent);
      
      // 4. CRITICAL: Verify invalid content WAS cleared by blur during navigation
      expect(model.commands[0].name).toBe('');
      
      // 5. Verify focus moved to parameter cell (navigation worked)
      const paramCell = container.querySelector('[data-command-index="0"][data-param-index="0"][data-cell-type="param-key"]') as HTMLElement;
      expect(paramCell).toBeTruthy();
      
      // 6. Type valid parameter content directly
      paramCell.focus();
      paramCell.textContent = 'radius';
      paramCell.dispatchEvent(new Event('input', { bubbles: true }));
      expect(model.commands[0].parameters[0].key).toBe('radius');
      
      // 7. This test confirms that TAB navigation clears invalid content appropriately
    });

    it('REGRESSION 1: typing in parameter should not clear other cells', () => {
      // Regression: entering "circle" in command + TAB, then typing in parameter clears command
      
      // 1. Set up valid command
      view.render(model);
      let commandCell = container.querySelector('[data-command-index="0"][data-cell-type="command"]') as HTMLElement;
      
      // 2. Type "circle" and complete with TAB
      commandCell.focus();
      commandCell.textContent = 'circle';
      commandCell.dispatchEvent(new Event('input', { bubbles: true }));
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      commandCell.dispatchEvent(tabEvent);
      
      // 3. Verify command is completed and we moved to parameter
      expect(model.commands[0].name).toBe('circle');
      
      // 4. Type in parameter cell
      let paramCell = container.querySelector('[data-command-index="0"][data-param-index="0"][data-cell-type="param-key"]') as HTMLElement;
      paramCell.focus();
      paramCell.textContent = 'radius';
      paramCell.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 5. CRITICAL: Command cell should still contain "circle"
      expect(model.commands[0].name).toBe('circle');
      expect(model.commands[0].parameters[0].key).toBe('radius');
    });

    it('REGRESSION 2: arrow right after invalid text should not lock parameter cell', () => {
      // Regression: entering random text + arrow right clears command (good) but locks parameter (bad)
      
      // 1. Start fresh
      view.render(model);
      let commandCell = container.querySelector('[data-command-index="0"][data-cell-type="command"]') as HTMLElement;
      
      // 2. Directly set invalid text in model (like what input event does)
      model.updateCommandName(0, 'randomtext');
      expect(model.commands[0].name).toBe('randomtext');
      expect(model.isValidCommand('randomtext')).toBe(false);
      
      // 3. Focus the cell that has invalid content
      commandCell.focus();
      
      // 4. Arrow right (should clear invalid command and move to parameter)
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      commandCell.dispatchEvent(rightEvent);
      
      // 5. Verify command was cleared
      expect(model.commands[0].name).toBe('');
      
      // 6. CRITICAL: Parameter cell should NOT be locked
      let paramCell = container.querySelector('[data-command-index="0"][data-param-index="0"][data-cell-type="param-key"]') as HTMLElement;
      expect(model.isParameterLocked(0, 0)).toBe(false);
      expect(view.isLockedCell(paramCell, model)).toBe(false);
    });

    it('REGRESSION 3: invalid text + arrow right + arrow left should not result in locked empty cell', () => {
      // Regression: entering "fff" + arrow right + arrow left = empty but locked command cell
      
      // 1. Start fresh  
      view.render(model);
      let commandCell = container.querySelector('[data-command-index="0"][data-cell-type="command"]') as HTMLElement;
      
      // 2. Type invalid text "fff"
      commandCell.focus();
      commandCell.textContent = 'fff';
      commandCell.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 3. Arrow right (should clear and move to parameter)
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      commandCell.dispatchEvent(rightEvent);
      
      // 4. Arrow left (should move back to command)
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      const activeElement = document.activeElement as HTMLElement;
      activeElement.dispatchEvent(leftEvent);
      
      // 5. CRITICAL: Command cell should be empty AND unlocked
      commandCell = container.querySelector('[data-command-index="0"][data-cell-type="command"]') as HTMLElement;
      expect(model.commands[0].name).toBe('');
      expect(model.isCommandLocked(0)).toBe(false);
      expect(view.isLockedCell(commandCell, model)).toBe(false);
    });

    it('REGRESSION 4: backspace on locked cell should clear but not lock', () => {
      // Regression: backspace on locked cell should clear content but leave cell unlocked for editing
      
      // 1. Set up locked cell with content (simulating completed entry)
      model.updateCommandName(0, 'circle');
      model.lockCommand(0);
      expect(model.commands[0].name).toBe('circle');
      expect(model.isCommandLocked(0)).toBe(true);
      
      // 2. Render and get the locked cell
      view.render(model);
      const commandCell = container.querySelector('[data-command-index="0"][data-cell-type="command"]') as HTMLElement;
      expect(view.isLockedCell(commandCell, model)).toBe(true);
      
      // 3. Focus and press backspace (this should trigger clearAndUnlockCell)
      commandCell.focus();
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
      commandCell.dispatchEvent(backspaceEvent);
      
      // 4. CRITICAL: Cell should be cleared AND unlocked (ready for new input)
      expect(model.commands[0].name).toBe('');
      expect(model.isCommandLocked(0)).toBe(false);
      
      // 5. Re-check view state (should reflect model changes)
      view.render(model);
      const updatedCell = container.querySelector('[data-command-index="0"][data-cell-type="command"]') as HTMLElement;
      expect(view.isLockedCell(updatedCell, model)).toBe(false);
    });
  });
}); 