import { describe, it, expect, beforeEach } from 'vitest';
import { SpreadsheetGrid } from '../spreadsheet-grid.js';

describe('True Spreadsheet Layout with Nested Parameters', () => {
  let container: HTMLElement;
  let grid: SpreadsheetGrid;

  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;
    grid = new SpreadsheetGrid(container);
  });

  it('should maintain focus when typing first letter', () => {
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    commandCell.focus();
    
    // Type first letter
    commandCell.textContent = 'c';
    commandCell.dispatchEvent(new Event('input'));
    
    // Focus should remain on the cell
    expect(document.activeElement).toBe(commandCell);
  });

  it('should show nested parameter spreadsheet with key/value columns', async () => {
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    commandCell.textContent = 'circle';
    commandCell.dispatchEvent(new Event('input'));
    
    // Wait for async re-render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should have a nested parameter spreadsheet
    const parameterSpreadsheet = container.querySelector('.parameter-spreadsheet');
    expect(parameterSpreadsheet).toBeTruthy();
    
    // Should have parameter table with headers
    const parameterTable = container.querySelector('.parameter-table');
    expect(parameterTable).toBeTruthy();
    
    // Should have Parameter and Value column headers
    const headers = container.querySelectorAll('.parameter-table th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toContain('Parameter');
    expect(headers[1].textContent).toContain('Value');
    
    // Should have parameter key and value cells
    const keyCells = container.querySelectorAll('.parameter-cell.key-cell');
    const valueCells = container.querySelectorAll('.parameter-cell.value-cell');
    expect(keyCells.length).toBeGreaterThan(0);
    expect(valueCells.length).toBeGreaterThan(0);
  });

  it('should allow separate editing of parameter names and values', async () => {
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    commandCell.textContent = 'circle';
    commandCell.dispatchEvent(new Event('input'));
    
    // Wait for async re-render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Add parameter name
    const keyCell = container.querySelector('.parameter-cell.key-cell') as HTMLElement;
    keyCell.textContent = 'radius';
    keyCell.dispatchEvent(new Event('input'));
    
    // Add parameter value
    const valueCell = container.querySelector('.parameter-cell.value-cell') as HTMLElement;
    valueCell.textContent = '10';
    valueCell.dispatchEvent(new Event('input'));
    
    // Wait for parameter processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Verify data structure
    const data = grid.getData();
    expect(data.commands[0].parameters.length).toBeGreaterThan(0);
    expect(data.commands[0].parameters[0].name).toBe('radius');
    expect(data.commands[0].parameters[0].value).toBe('10');
  });

  it('should generate correct code from separate key/value cells', async () => {
    let generatedCode = '';
    grid.setCodeChangeCallback((code) => {
      generatedCode = code;
    });
    
    const commandCell = container.querySelector('.cell.command-cell') as HTMLElement;
    commandCell.textContent = 'circle';
    commandCell.dispatchEvent(new Event('input'));
    
    // Wait for async re-render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Add parameter name and value separately
    const keyCell = container.querySelector('.parameter-cell.key-cell') as HTMLElement;
    keyCell.textContent = 'radius';
    keyCell.dispatchEvent(new Event('input'));
    
    const valueCell = container.querySelector('.parameter-cell.value-cell') as HTMLElement;
    valueCell.textContent = '10';
    valueCell.dispatchEvent(new Event('input'));
    
    // Wait for parameter processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should contain the circle command with radius parameter
    expect(generatedCode).toContain('circle({ radius:');
    expect(generatedCode).toContain('10');
  });
}); 