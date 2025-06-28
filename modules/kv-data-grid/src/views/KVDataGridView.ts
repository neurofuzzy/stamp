import { CommandData, CellReference } from '../models/types';
import { css } from './styles';

// EventHandlers will be defined in the controller, so I'll just put a placeholder here
export type EventHandlers = {
  onCellClick: (cellRef: CellReference) => void;
  onCellFocus: (cellRef: CellReference) => void;
  onCellDoubleClick: (cellRef: CellReference) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onInputBlur: () => void;
}

export class KVDataGridView {
  private container: HTMLElement;
  private table: HTMLTableElement;
  private suggestionOverlay: HTMLElement | null = null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.table = document.createElement('table');
    this.container.appendChild(this.table);
    this.createHeader();
    this.injectStyles();
    this.container.style.position = 'relative';
  }

  private injectStyles(): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }

  private createHeader(): void {
    const thead = this.table.createTHead();
    const headerRow = thead.insertRow();
    
    const commandHeader = document.createElement('th');
    commandHeader.textContent = 'Command';
    headerRow.appendChild(commandHeader);

    const paramKeyHeader = document.createElement('th');
    paramKeyHeader.textContent = 'Param Key';
    headerRow.appendChild(paramKeyHeader);

    const paramValueHeader = document.createElement('th');
    paramValueHeader.textContent = 'Param Value';
    headerRow.appendChild(paramValueHeader);
  }

  // Rendering
  public render(commands: CommandData[]): void {
    const tbody = this.table.tBodies[0] || this.table.createTBody();
    tbody.innerHTML = '';

    commands.forEach((command, commandIndex) => {
      const paramCount = command.parameters.length;

      command.parameters.forEach((param, paramIndex) => {
        const row = tbody.insertRow();
        
        if (paramIndex === 0) {
          const commandCell = row.insertCell();
          commandCell.rowSpan = paramCount > 0 ? paramCount : 1;
          commandCell.textContent = command.name;
          commandCell.dataset.commandIndex = String(commandIndex);
          commandCell.dataset.cellType = 'command';
          commandCell.tabIndex = 0;
          if (!command.name) {
            commandCell.dataset.placeholder = 'command...';
          }
        }

        const paramKeyCell = row.insertCell();
        paramKeyCell.textContent = param.key;
        paramKeyCell.dataset.commandIndex = String(commandIndex);
        paramKeyCell.dataset.cellType = 'param-key';
        paramKeyCell.dataset.paramIndex = String(paramIndex);
        paramKeyCell.tabIndex = 0;
        if (!param.key) {
          paramKeyCell.dataset.placeholder = 'param...';
        }

        const paramValueCell = row.insertCell();
        paramValueCell.textContent = String(param.value);
        paramValueCell.dataset.commandIndex = String(commandIndex);
        paramValueCell.dataset.cellType = 'param-value';
        paramValueCell.dataset.paramIndex = String(paramIndex);
        paramValueCell.tabIndex = 0;
        if (param.value === '' || param.value === null || param.value === undefined) {
            paramValueCell.dataset.placeholder = 'value...';
        }
      });
    });
  }

  public updateCell(cellRef: CellReference, value: string): void {
    // to be implemented
  }
  public setNavigationFocus(cellRef: CellReference | null): void {
    // Clear previous focus
    const focused = this.table.querySelector('.nav-focus');
    if (focused) {
      focused.classList.remove('nav-focus');
    }

    // Set new focus
    if (!cellRef) return;
    const cell = this.getCell(cellRef);
    
    if (cell) {
      cell.classList.add('nav-focus');
      (cell as HTMLElement).focus(); // for keyboard nav
    }
  }
  public showValidationError(cellRef: CellReference): void {
    const cell = this.getCell(cellRef);
    if (cell) {
      cell.classList.add('blink');
      setTimeout(() => {
        if (cell) {
            cell.classList.remove('blink')
        }
      }, 500);
    }
  }
  
  // Mode-specific rendering
  public enterNavigationMode(cellRef: CellReference | null): void {
    this.clearSuggestion();
    if (!cellRef) return;

    const cell = this.getCell(cellRef);
    if(cell) {
        cell.classList.remove('edit-focus');
    }

    this.setNavigationFocus(cellRef);
  }
  public enterEditingMode(cellRef: CellReference): void {
    const cell = this.getCell(cellRef);

    if (!cell) return;
    
    // Remove nav focus, add edit focus
    cell.classList.remove('nav-focus');
    cell.classList.add('edit-focus');

    const value = cell.textContent || '';
    cell.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.boxSizing = 'border-box';
    input.style.backgroundColor = 'inherit';
    input.style.color = 'inherit';
    input.style.fontFamily = 'inherit';
    input.style.fontSize = 'inherit';
    input.style.border = 'none';
    input.style.outline = 'none';
    
    cell.appendChild(input);
    input.focus();
    input.select();
  }
  
  public getCell(cellRef: CellReference): HTMLElement | null {
    const { commandIndex, cellType, paramIndex } = cellRef;
    let selector = `td[data-command-index="${commandIndex}"][data-cell-type="${cellType}"]`;
    if (paramIndex !== undefined) {
      selector += `[data-param-index="${paramIndex}"]`;
    }
    return this.table.querySelector(selector);
  }

  // Event binding (delegates to controller)
  public bindEvents(eventHandlers: EventHandlers): void {
    this.table.addEventListener('click', (event) => {
      const cell = (event.target as HTMLElement).closest('td');
      if (!cell) return;

      const { commandIndex, cellType, paramIndex } = cell.dataset;
      
      const cellRef: CellReference = {
        commandIndex: Number(commandIndex),
        cellType: cellType as CellReference['cellType'],
        paramIndex: paramIndex !== undefined ? Number(paramIndex) : undefined
      };
      eventHandlers.onCellClick(cellRef);
    });

    this.table.addEventListener('focusin', (event) => {
        const cell = (event.target as HTMLElement).closest('td');
        if (!cell) return;
  
        const { commandIndex, cellType, paramIndex } = cell.dataset;
        
        const cellRef: CellReference = {
          commandIndex: Number(commandIndex),
          cellType: cellType as CellReference['cellType'],
          paramIndex: paramIndex !== undefined ? Number(paramIndex) : undefined
        };
        eventHandlers.onCellFocus(cellRef);
      });

    this.table.addEventListener('focusout', (event) => {
        if ((event.target as HTMLElement).tagName === 'INPUT') {
            eventHandlers.onInputBlur();
        }
    });

    this.table.addEventListener('dblclick', (event) => {
        const cell = (event.target as HTMLElement).closest('td');
        if (!cell) return;
  
        const { commandIndex, cellType, paramIndex } = cell.dataset;
        
        const cellRef: CellReference = {
          commandIndex: Number(commandIndex),
          cellType: cellType as CellReference['cellType'],
          paramIndex: paramIndex !== undefined ? Number(paramIndex) : undefined
        };
        eventHandlers.onCellDoubleClick(cellRef);
    });

    this.table.addEventListener('keydown', (event) => {
        eventHandlers.onKeyDown(event);
    });
  }

  public showSuggestion(cellRef: CellReference, suggestion: string | null) {
    this.clearSuggestion();

    if (!suggestion) return;

    const cell = this.getCell(cellRef);
    if (!cell) return;
    const input = cell.querySelector('input');
    if (!input) return;

    const overlay = document.createElement('div');
    this.suggestionOverlay = overlay;

    const cellStyle = getComputedStyle(cell);

    overlay.style.position = 'absolute';
    overlay.style.top = `${cell.offsetTop + parseInt(cellStyle.borderTopWidth)}px`;
    overlay.style.left = `${cell.offsetLeft + parseInt(cellStyle.borderLeftWidth)}px`;
    overlay.style.width = `${cell.clientWidth}px`;
    overlay.style.height = `${cell.clientHeight}px`;
    overlay.style.padding = cellStyle.padding;
    overlay.style.fontFamily = cellStyle.fontFamily;
    overlay.style.fontSize = cellStyle.fontSize;
    overlay.style.lineHeight = cellStyle.lineHeight;
    overlay.style.color = '#666'; // ghost text color
    overlay.style.pointerEvents = 'none';
    overlay.style.whiteSpace = 'pre';

    const userText = input.value;
    
    const suggestionText = document.createElement('span');
    suggestionText.textContent = suggestion.substring(userText.length);
    
    const hiddenText = document.createElement('span');
    hiddenText.textContent = userText;
    hiddenText.style.visibility = 'hidden';

    overlay.appendChild(hiddenText);
    overlay.appendChild(suggestionText);
    
    this.table.parentElement?.appendChild(overlay);
  }

  public clearSuggestion() {
    if (this.suggestionOverlay) {
      this.suggestionOverlay.remove();
      this.suggestionOverlay = null;
    }
  }
}
