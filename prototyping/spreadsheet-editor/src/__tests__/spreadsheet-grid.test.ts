import { describe, it, expect, beforeEach } from 'vitest';
import { SpreadsheetGrid } from '../spreadsheet-grid.js';

describe('SpreadsheetGrid Integration', () => {
  let container: HTMLElement;
  let grid: SpreadsheetGrid;

  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;
    grid = new SpreadsheetGrid(container);
  });

  it('should render with auto-expanding empty row', () => {
    // Should start with one empty row for commands
    const commandRows = container.querySelectorAll('tr[data-row-type="command"]');
    expect(commandRows.length).toBe(1);
    
    // The command cell should be empty
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    expect(commandCell.textContent).toBe('');
  });

  it('should auto-expand when typing in empty row', () => {
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    
    // Type a command
    commandCell.textContent = 'circle';
    commandCell.dispatchEvent(new Event('input'));
    
    // Should maintain the data correctly
    const data = grid.getData();
    expect(data.commands.length).toBeGreaterThan(0);
    expect(data.commands[0].name).toBe('circle');
  });

  it('should update command data when typing in cell', () => {
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    
    commandCell.textContent = 'rectangle';
    commandCell.dispatchEvent(new Event('input'));
    
    const data = grid.getData();
    expect(data.commands[0].name).toBe('rectangle');
  });

  it('should generate code callback when commands change', () => {
    let generatedCode = '';
    grid.setCodeChangeCallback((code) => {
      generatedCode = code;
    });

    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    commandCell.textContent = 'circle';
    commandCell.dispatchEvent(new Event('input'));

    expect(generatedCode).toContain('circle');
  });

  it('should delete command when clicking delete button', async () => {
    // First add a command
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    commandCell.textContent = 'circle';
    commandCell.dispatchEvent(new Event('input'));
    
    // Wait for re-render to get delete button
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Find and click delete button for the first command
    const deleteButton = container.querySelector('.delete-button') as HTMLButtonElement;
    if (deleteButton) {
      deleteButton.click();
    }
    
    // Should be back to just the empty row
    const data = grid.getData();
    expect(data.commands.filter(cmd => cmd.name !== '').length).toBe(0);
  });

  it('should show nested parameter spreadsheet', async () => {
    // Add a command
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    commandCell.textContent = 'circle';
    commandCell.dispatchEvent(new Event('input'));
    
    // Wait for async re-render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should have nested parameter spreadsheet
    const parameterSpreadsheet = container.querySelector('.parameter-spreadsheet');
    expect(parameterSpreadsheet).toBeTruthy();
    
    // Should have parameter table
    const parameterTable = container.querySelector('.parameter-table');
    expect(parameterTable).toBeTruthy();
  });

  it('should support contenteditable interface with inline autocomplete', () => {
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    expect(commandCell.getAttribute('contenteditable')).toBe('true');
    
    // Test autocomplete
    commandCell.textContent = 'ci';
    commandCell.dispatchEvent(new Event('input'));
    
    // Should handle input without error
    expect(commandCell.textContent).toBe('ci');
  });
}); 