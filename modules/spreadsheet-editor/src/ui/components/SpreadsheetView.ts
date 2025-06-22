import type { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import type { FocusPosition } from '@core/types';

export class SpreadsheetView {
  container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(model: SpreadsheetModel): void {
    let html = '';
    
    model.commands.forEach((command, commandIndex) => {
      const paramCount = command.parameters.length;
      
      // First parameter row with command cell
      html += `
        <tr>
          <td class="cell command-cell ${command.nameIsLocked ? 'locked' : ''}" 
              rowspan="${paramCount}"
              contenteditable="true" 
              data-command-index="${commandIndex}"
              data-cell-type="command"
              data-placeholder="${command.name || 'command...'}">${command.name}</td>
          <td class="cell param-key ${command.parameters[0].keyIsLocked ? 'locked' : ''}" 
              contenteditable="true" 
              data-command-index="${commandIndex}"
              data-param-index="0"
              data-cell-type="param-key"
              data-placeholder="${command.parameters[0].key || 'param...'}">${command.parameters[0].key}</td>
          <td class="cell param-value" 
              contenteditable="true" 
              data-command-index="${commandIndex}"
              data-param-index="0"
              data-cell-type="param-value"
              data-placeholder="${command.parameters[0].value || 'value...'}">${command.parameters[0].value}</td>
        </tr>
      `;

      // Additional parameter rows
      for (let paramIndex = 1; paramIndex < paramCount; paramIndex++) {
        const param = command.parameters[paramIndex];
        html += `
          <tr>
            <td class="cell param-key ${param.keyIsLocked ? 'locked' : ''}" 
                contenteditable="true" 
                data-command-index="${commandIndex}"
                data-param-index="${paramIndex}"
                data-cell-type="param-key"
                data-placeholder="${param.key || 'param...'}">${param.key}</td>
            <td class="cell param-value" 
                contenteditable="true" 
                data-command-index="${commandIndex}"
                data-param-index="${paramIndex}"
                data-cell-type="param-value"
                data-placeholder="${param.value || 'value...'}">${param.value}</td>
          </tr>
        `;
      }
    });
    
    this.container.innerHTML = html;
  }

  focusCell(model: SpreadsheetModel): void {
    const focus = model.getFocus();
    const selector = this.buildCellSelector(focus);
    const cell = this.container.querySelector(selector) as HTMLElement;
    
    if (cell) {
      cell.focus();
      this.setCursorPosition(cell, model.getCursorPosition());
      
      // Handle locked cell selection
      if (this.isLockedCell(cell, model)) {
        setTimeout(() => this.selectAllText(cell), 0);
      }
    }
  }

  private buildCellSelector(focus: FocusPosition): string {
    const { commandIndex, paramIndex, cellType } = focus;
    
    if (cellType === 'command') {
      return `[data-command-index="${commandIndex}"][data-cell-type="command"]`;
    } else {
      return `[data-command-index="${commandIndex}"][data-param-index="${paramIndex}"][data-cell-type="${cellType}"]`;
    }
  }

  private setCursorPosition(cell: HTMLElement, position: number): void {
    if (!cell) return;
    
    setTimeout(() => {
      const range = document.createRange();
      const textNode = cell.firstChild;
      
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const pos = Math.min(position, textNode.textContent?.length || 0);
        range.setStart(textNode, pos);
        range.setEnd(textNode, pos);
      } else {
        range.selectNodeContents(cell);
        range.collapse(false);
      }
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  }

  selectAllText(cell: HTMLElement): void {
    const range = document.createRange();
    range.selectNodeContents(cell);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  isLockedCell(cell: HTMLElement, model: SpreadsheetModel): boolean {
    const commandIndex = parseInt(cell.dataset.commandIndex || '0');
    const cellType = cell.dataset.cellType;
    
    if (cellType === 'command') {
      return model.isCommandLocked(commandIndex);
    } else if (cellType === 'param-key') {
      const paramIndex = parseInt(cell.dataset.paramIndex || '0');
      return model.isParameterLocked(commandIndex, paramIndex);
    }
    
    return false;
  }

  blinkCell(cell: HTMLElement): void {
    cell.classList.add('blink');
    setTimeout(() => cell.classList.remove('blink'), 500);
  }

  getAllCells(): HTMLElement[] {
    return Array.from(this.container.querySelectorAll('.cell'));
  }

  getCurrentCursorPosition(cell: HTMLElement): number {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return range.startOffset;
    }
    return 0;
  }
} 