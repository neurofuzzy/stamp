import { CodeSpreadsheet, Command, Parameter, STAMP_COMMANDS, AutocompleteContext } from './types.js';
import { CodeGenerator } from './code-generator.js';
import { AutocompleteEngine } from './autocomplete-engine.js';

export class SpreadsheetGrid {
  private container: HTMLElement;
  private data: CodeSpreadsheet = { commands: [] };
  private codeGenerator = new CodeGenerator();
  private autocompleteEngine = new AutocompleteEngine();
  private onCodeChange?: (code: string) => void;
  private currentCell?: HTMLElement;
  private currentSuggestion = '';

  constructor(container: HTMLElement) {
    this.container = container;
    this.ensureEmptyRow();
    this.render();
  }

  setCodeChangeCallback(callback: (code: string) => void) {
    this.onCodeChange = callback;
  }

  private ensureEmptyRow() {
    // Always ensure there's an empty command at the end
    if (this.data.commands.length === 0 || this.data.commands[this.data.commands.length - 1].name !== '') {
      this.data.commands.push({
        id: Date.now().toString(),
        name: '',
        parameters: [],
        isExpanded: true
      });
    }
  }

  private render() {
    this.container.innerHTML = `
      <div class="spreadsheet-wrapper">
        <table class="spreadsheet-table">
          <thead>
            <tr>
              <th style="width: 120px;">Command</th>
              <th>Parameters</th>
            </tr>
          </thead>
          <tbody id="spreadsheet-body">
            ${this.renderRows()}
          </tbody>
        </table>
      </div>
      <style>
        .spreadsheet-wrapper {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          position: relative;
          outline: none;
        }
        
        .spreadsheet-table {
          width: 100%;
          border-collapse: collapse;
          background: #2a2a2a;
        }
        
        .spreadsheet-table th {
          border: 1px solid #555;
          padding: 8px;
          background: #404040;
          color: #e0e0e0;
          font-weight: bold;
          text-align: left;
        }
        
        .spreadsheet-table td {
          border: 1px solid #555;
          padding: 0;
          position: relative;
          background: #333;
          vertical-align: top;
        }
        
        .cell {
          padding: 8px;
          min-height: 20px;
          border: none;
          background: transparent;
          color: #e0e0e0;
          outline: none;
          width: 100%;
          font-family: inherit;
          font-size: 13px;
          position: relative;
        }
        
        .cell:focus {
          background: #404040;
          border: 1px solid #0078d4;
        }
        
        .cell.command-cell {
          color: #4fc3f7;
          font-weight: bold;
        }
        
        .cell::after {
          content: attr(data-suggestion);
          color: #666;
          position: absolute;
          pointer-events: none;
          white-space: nowrap;
        }
        
        .empty-row {
          opacity: 0.5;
        }
        
        .command-cell-container {
          position: relative;
        }
        
        .delete-button {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #dc3545;
          color: white;
          border: none;
          padding: 2px 6px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 10px;
          opacity: 0.8;
        }
        
        .delete-button:hover {
          background: #c82333;
          opacity: 1;
        }
        
        .parameter-spreadsheet {
          background: #282828;
          border: 1px solid #444;
          margin: 4px;
          border-radius: 4px;
        }
        
        .parameter-table {
          width: 100%;
          border-collapse: collapse;
          background: transparent;
        }
        
        .parameter-table th {
          border: 1px solid #444;
          padding: 4px 6px;
          background: #3a3a3a;
          color: #ccc;
          font-weight: normal;
          font-size: 11px;
          text-align: left;
        }
        
        .parameter-table td {
          border: 1px solid #444;
          padding: 0;
          background: transparent;
        }
        
        .parameter-cell {
          padding: 4px 6px;
          min-height: 16px;
          font-size: 12px;
          color: #81c784;
        }
        
        .parameter-cell.key-cell {
          color: #ffb74d;
        }
        
        .parameter-cell.value-cell {
          color: #81c784;
        }
        
        .parameter-empty-state {
          color: #666;
          padding: 8px;
          font-size: 11px;
          text-align: center;
          font-style: italic;
        }
      </style>
    `;

    this.attachEventListeners();
  }

  private renderRows(): string {
    let html = '';

    this.data.commands.forEach((command, commandIndex) => {
      const isEmpty = command.name === '';
      
      html += `
        <tr data-command-id="${command.id}" data-row-type="command" ${isEmpty ? 'class="empty-row"' : ''}>
          <td class="command-cell-container">
            <div class="cell command-cell" 
                 contenteditable="true" 
                 data-context="command"
                 data-command-index="${commandIndex}"
                 data-cell-type="command"
                 data-row="${commandIndex}"
                 data-col="0"
                 tabindex="0"
                 ${isEmpty ? 'placeholder="Type command..."' : ''}>${command.name}</div>
            ${!isEmpty ? `<button class="delete-button" data-command-index="${commandIndex}">×</button>` : ''}
          </td>
          <td>
            ${this.renderParameterSpreadsheet(command, commandIndex)}
          </td>
        </tr>
      `;
    });

    return html;
  }

  private renderParameterSpreadsheet(command: Command, commandIndex: number): string {
    const isEmpty = command.name === '';
    
    if (isEmpty) {
      return `<div class="parameter-empty-state">Available: circle, rectangle, moveTo, repeat</div>`;
    }

    // Always ensure at least one empty parameter row
    const parameters = [...command.parameters];
    if (parameters.length === 0 || parameters[parameters.length - 1].name !== '') {
      parameters.push({ name: '', value: '', type: 'string' });
    }

    return `
      <div class="parameter-spreadsheet">
        <table class="parameter-table">
          <thead>
            <tr>
              <th style="width: 100px;">Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${parameters.map((param, paramIndex) => `
              <tr data-param-row="${paramIndex}" ${param.name === '' ? 'class="empty-param-row"' : ''}>
                <td>
                  <div class="cell parameter-cell key-cell" 
                       contenteditable="true" 
                       data-context="parameter-key"
                       data-command-index="${commandIndex}"
                       data-param-index="${paramIndex}"
                       data-cell-type="parameter-key"
                       data-row="${commandIndex}"
                       data-col="1"
                       data-subcol="0"
                       tabindex="0"
                       ${param.name === '' ? 'placeholder="Parameter name..."' : ''}>${param.name}</div>
                </td>
                <td>
                  <div class="cell parameter-cell value-cell" 
                       contenteditable="true" 
                       data-context="parameter-value"
                       data-command-index="${commandIndex}"
                       data-param-index="${paramIndex}"
                       data-cell-type="parameter-value"
                       data-row="${commandIndex}"
                       data-col="1"
                       data-subcol="1"
                       tabindex="0"
                       ${param.value === '' ? 'placeholder="Value..."' : ''}>${param.value}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private attachEventListeners() {
    // Delete buttons
    this.container.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const commandIndex = parseInt(target.dataset.commandIndex!);
        this.deleteCommand(commandIndex);
      });
    });

    // All contenteditable cells
    this.container.querySelectorAll('.cell[contenteditable]').forEach(cell => {
      cell.addEventListener('input', (e) => this.handleCellInput(e));
      cell.addEventListener('keydown', (e) => this.handleCellKeydown(e as KeyboardEvent));
      cell.addEventListener('focus', (e) => this.handleCellFocus(e));
    });
  }

  private deleteCommand(commandIndex: number) {
    if (commandIndex >= 0 && commandIndex < this.data.commands.length) {
      this.data.commands.splice(commandIndex, 1);
      this.ensureEmptyRow();
      this.render();
      this.updateCode();
    }
  }

  private handleCellInput(e: Event) {
    const cell = e.target as HTMLElement;
    const cellType = cell.dataset.cellType;
    const commandIndex = parseInt(cell.dataset.commandIndex!);
    const content = cell.textContent || '';

    if (cellType === 'command') {
      this.updateCommandName(commandIndex, content, cell);
    } else if (cellType === 'parameter-key' || cellType === 'parameter-value') {
      this.updateParameter(cell);
    }

    this.showInlineAutocomplete(cell, content);
  }

  private handleCellKeydown(e: KeyboardEvent) {
    const cell = e.target as HTMLElement;
    
    if (e.key === 'Tab') {
      e.preventDefault();
      if (this.currentSuggestion) {
        this.acceptInlineAutocomplete(cell);
      } else {
        this.navigateToNextCell(cell);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigateCell(cell, 'up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.navigateCell(cell, 'down');
    } else if (e.key === 'ArrowLeft' && this.isAtStart(cell)) {
      e.preventDefault();
      this.navigateCell(cell, 'left');
    } else if (e.key === 'ArrowRight' && this.isAtEnd(cell)) {
      e.preventDefault();
      this.navigateCell(cell, 'right');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.navigateCell(cell, 'down');
    }
  }

  private handleCellFocus(e: Event) {
    const cell = e.target as HTMLElement;
    this.currentCell = cell;
    const content = cell.textContent || '';
    this.showInlineAutocomplete(cell, content);
  }

  private isAtStart(cell: HTMLElement): boolean {
    const selection = window.getSelection();
    return selection?.anchorOffset === 0;
  }

  private isAtEnd(cell: HTMLElement): boolean {
    const selection = window.getSelection();
    const textLength = cell.textContent?.length || 0;
    return selection?.anchorOffset === textLength;
  }

  private navigateCell(currentCell: HTMLElement, direction: 'up' | 'down' | 'left' | 'right') {
    const row = parseInt(currentCell.dataset.row!);
    const col = parseInt(currentCell.dataset.col!);
    const subcol = currentCell.dataset.subcol ? parseInt(currentCell.dataset.subcol) : undefined;
    
    let nextRow = row;
    let nextCol = col;
    let nextSubcol = subcol;
    
    switch (direction) {
      case 'up':
        nextRow = row - 1;
        break;
      case 'down':
        nextRow = row + 1;
        break;
      case 'left':
        if (subcol !== undefined && subcol > 0) {
          nextSubcol = subcol - 1;
        } else {
          nextCol = col - 1;
          nextSubcol = undefined;
        }
        break;
      case 'right':
        if (col === 1 && (subcol === undefined || subcol === 0)) {
          nextSubcol = 1;
        } else {
          nextCol = col + 1;
          nextSubcol = undefined;
        }
        break;
    }
    
    // Find next cell
    let selector;
    if (nextSubcol !== undefined) {
      selector = `.cell[data-row="${nextRow}"][data-col="${nextCol}"][data-subcol="${nextSubcol}"]`;
    } else {
      selector = `.cell[data-row="${nextRow}"][data-col="${nextCol}"]:not([data-subcol])`;
    }
    
    const nextCell = this.container.querySelector(selector) as HTMLElement;
    
    if (nextCell) {
      nextCell.focus();
    }
  }

  private navigateToNextCell(currentCell: HTMLElement) {
    const row = parseInt(currentCell.dataset.row!);
    const col = parseInt(currentCell.dataset.col!);
    const subcol = currentCell.dataset.subcol ? parseInt(currentCell.dataset.subcol) : undefined;
    
    // Try next subcol first, then next cell
    let nextCell: HTMLElement | null = null;
    
    if (col === 1 && subcol === 0) {
      // From parameter key to parameter value
      nextCell = this.container.querySelector(
        `.cell[data-row="${row}"][data-col="1"][data-subcol="1"]`
      ) as HTMLElement;
    } else if (col === 1 && subcol === 1) {
      // From parameter value to next parameter key
      nextCell = this.container.querySelector(
        `.cell[data-row="${row}"][data-col="1"][data-subcol="0"]`
      ) as HTMLElement;
      
      // Find the next empty parameter row in the same command
      const commandIndex = parseInt(currentCell.dataset.commandIndex!);
      const emptyParamRows = this.container.querySelectorAll(
        `.cell[data-command-index="${commandIndex}"][data-cell-type="parameter-key"]`
      );
      
      for (let i = 0; i < emptyParamRows.length; i++) {
        const cell = emptyParamRows[i] as HTMLElement;
        if (cell.textContent === '') {
          nextCell = cell;
          break;
        }
      }
    } else {
      // From command to first parameter
      nextCell = this.container.querySelector(
        `.cell[data-row="${row}"][data-col="1"][data-subcol="0"]`
      ) as HTMLElement;
    }
    
    if (nextCell) {
      nextCell.focus();
    }
  }

  private updateCommandName(commandIndex: number, name: string, cell: HTMLElement) {
    if (commandIndex >= 0 && commandIndex < this.data.commands.length) {
      this.data.commands[commandIndex].name = name;
      
      // Always re-render when command name changes to show parameter spreadsheet
      setTimeout(() => {
        this.render();
        // Restore focus to the same cell
        const newCell = this.container.querySelector(
          `.cell[data-command-index="${commandIndex}"][data-cell-type="command"]`
        ) as HTMLElement;
        if (newCell) {
          newCell.focus();
          // Restore cursor position to end
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(newCell);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
      
      // Add new empty row if this was the last row and now has content
      if (name && commandIndex === this.data.commands.length - 1) {
        this.ensureEmptyRow();
      }
      
      this.updateCode();
    }
  }

  private updateParameter(cell: HTMLElement) {
    const commandIndex = parseInt(cell.dataset.commandIndex!);
    const paramIndex = parseInt(cell.dataset.paramIndex!);
    const cellType = cell.dataset.cellType!;
    const content = cell.textContent || '';

    if (commandIndex < 0 || commandIndex >= this.data.commands.length) return;
    
    const command = this.data.commands[commandIndex];

    // Ensure parameter exists
    while (command.parameters.length <= paramIndex) {
      command.parameters.push({ name: '', value: '', type: 'string' });
    }

    const param = command.parameters[paramIndex];

    if (cellType === 'parameter-key') {
      param.name = content;
    } else if (cellType === 'parameter-value') {
      param.value = content;
    }

    // If we just filled the last parameter, add a new empty one
    if (param.name !== '' && param.value !== '' && paramIndex === command.parameters.length - 1) {
      setTimeout(() => {
        this.render();
        // Focus on next parameter key cell
        const nextParamCell = this.container.querySelector(
          `.cell[data-command-index="${commandIndex}"][data-param-index="${paramIndex + 1}"][data-cell-type="parameter-key"]`
        ) as HTMLElement;
        if (nextParamCell) {
          nextParamCell.focus();
        }
      }, 0);
    }
    
    this.updateCode();
  }

  private showInlineAutocomplete(cell: HTMLElement, input: string) {
    // Clear previous suggestion
    cell.removeAttribute('data-suggestion');
    this.currentSuggestion = '';
    
    if (!input) return;
    
    const context = this.getAutocompleteContext(cell);
    const suggestions = this.autocompleteEngine.getSuggestions(input, context);
    
    if (suggestions.length > 0 && suggestions[0].text.toLowerCase().startsWith(input.toLowerCase())) {
      const suggestion = suggestions[0].text;
      const completion = suggestion.substring(input.length);
      
      if (completion) {
        this.currentSuggestion = suggestion;
        cell.setAttribute('data-suggestion', completion);
      }
    }
  }

  private acceptInlineAutocomplete(cell: HTMLElement) {
    if (this.currentSuggestion) {
      cell.textContent = this.currentSuggestion;
      cell.removeAttribute('data-suggestion');
      this.currentSuggestion = '';
      
      // Trigger input event to update data
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: cell });
      this.handleCellInput(event);
      
      // Move cursor to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(cell);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  private getAutocompleteContext(cell: HTMLElement): AutocompleteContext {
    const cellType = cell.dataset.cellType!;
    const commandIndex = parseInt(cell.dataset.commandIndex!);
    
    if (cellType === 'command') {
      return { type: 'command' };
    } else if (cellType === 'parameter-key') {
      const commandName = this.data.commands[commandIndex]?.name;
      return { type: 'parameter', commandName };
    } else if (cellType === 'parameter-value') {
      const commandName = this.data.commands[commandIndex]?.name;
      const paramIndex = parseInt(cell.dataset.paramIndex!);
      const parameterName = this.data.commands[commandIndex]?.parameters[paramIndex]?.name;
      return { type: 'value', commandName, parameterName };
    } else {
      return { type: 'value' };
    }
  }

  private updateCode() {
    // Filter out empty commands and empty parameters for code generation
    const validCommands = this.data.commands.filter(cmd => cmd.name).map(cmd => ({
      ...cmd,
      parameters: cmd.parameters.filter(p => p.name && p.value)
    }));
    const filteredData = { commands: validCommands };
    const code = this.codeGenerator.generateCode(filteredData);
    this.onCodeChange?.(code);
  }

  // Public method to get current data for testing
  getData(): CodeSpreadsheet {
    return this.data;
  }
} 