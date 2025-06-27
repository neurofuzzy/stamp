import type { CommandData, CellReference } from '@core/types';

export class KVDataGridView {
  private table!: HTMLTableElement;
  private tbody!: HTMLTableSectionElement;

  constructor(private container: HTMLElement) {
    this.setupTable();
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  private setupTable(): void {
    this.table = document.createElement('table');
    this.table.className = 'kv-datagrid';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Command', 'Parameter', 'Value'];
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    this.table.appendChild(thead);
    
    // Create tbody
    this.tbody = document.createElement('tbody');
    this.table.appendChild(this.tbody);
    
    this.container.appendChild(this.table);
  }

  public render(commands: CommandData[]): void {
    this.tbody.innerHTML = '';
    
    if (commands.length === 0) {
      // Render empty state with one empty command row
      this.renderEmptyCommand();
      return;
    }

    commands.forEach((command, commandIndex) => {
      this.renderCommand(command, commandIndex);
    });
  }

  private renderCommand(command: CommandData, commandIndex: number): void {
    const parameters = command.parameters;
    const totalRows = Math.max(1, parameters.length + 1); // +1 for empty param row
    
    // First row contains command cell and first parameter (if any)
    const firstRow = document.createElement('tr');
    
    // Command cell with rowspan
    const commandCell = document.createElement('td');
    commandCell.className = 'command-cell';
    commandCell.textContent = command.name;
    commandCell.rowSpan = totalRows;
    commandCell.dataset.commandIndex = commandIndex.toString();
    commandCell.dataset.cellType = 'command';
    firstRow.appendChild(commandCell);
    
    // If there are parameters, add first parameter to first row
    if (parameters.length > 0) {
      this.addParameterCells(firstRow, parameters[0], commandIndex, 0);
    } else {
      // Add empty parameter cells
      this.addEmptyParameterCells(firstRow, commandIndex, 0);
    }
    
    this.tbody.appendChild(firstRow);
    
    // Add remaining parameter rows
    for (let i = 1; i < parameters.length; i++) {
      const paramRow = document.createElement('tr');
      this.addParameterCells(paramRow, parameters[i], commandIndex, i);
      this.tbody.appendChild(paramRow);
    }
    
    // Add empty parameter row if we have existing parameters
    if (parameters.length > 0) {
      const emptyParamRow = document.createElement('tr');
      this.addEmptyParameterCells(emptyParamRow, commandIndex, parameters.length);
      this.tbody.appendChild(emptyParamRow);
    }
  }

  private renderEmptyCommand(): void {
    const row = document.createElement('tr');
    
    const commandCell = document.createElement('td');
    commandCell.className = 'command-cell';
    commandCell.textContent = '';
    commandCell.dataset.cellType = 'command';
    row.appendChild(commandCell);
    
    this.addEmptyParameterCells(row, -1, 0);
    this.tbody.appendChild(row);
  }

  private addParameterCells(row: HTMLTableRowElement, param: { key: string; value: string }, commandIndex: number, paramIndex: number): void {
    const keyCell = document.createElement('td');
    keyCell.className = 'param-key-cell';
    keyCell.textContent = param.key;
    keyCell.dataset.commandIndex = commandIndex.toString();
    keyCell.dataset.cellType = 'param-key';
    keyCell.dataset.paramIndex = paramIndex.toString();
    row.appendChild(keyCell);
    
    const valueCell = document.createElement('td');
    valueCell.className = 'param-value-cell';
    valueCell.textContent = param.value;
    valueCell.dataset.commandIndex = commandIndex.toString();
    valueCell.dataset.cellType = 'param-value';
    valueCell.dataset.paramIndex = paramIndex.toString();
    row.appendChild(valueCell);
  }

  private addEmptyParameterCells(row: HTMLTableRowElement, commandIndex: number, paramIndex: number): void {
    const keyCell = document.createElement('td');
    keyCell.className = 'param-key-cell';
    keyCell.textContent = '';
    keyCell.dataset.commandIndex = commandIndex.toString();
    keyCell.dataset.cellType = 'param-key';
    keyCell.dataset.paramIndex = paramIndex.toString();
    row.appendChild(keyCell);
    
    const valueCell = document.createElement('td');
    valueCell.className = 'param-value-cell';
    valueCell.textContent = '';
    valueCell.dataset.commandIndex = commandIndex.toString();
    valueCell.dataset.cellType = 'param-value';
    valueCell.dataset.paramIndex = paramIndex.toString();
    row.appendChild(valueCell);
  }

  public setFocus(cellRef: CellReference): void {
    // Remove focus from all cells
    this.table.querySelectorAll('.focused').forEach(cell => {
      cell.classList.remove('focused');
    });
    
    // Add focus to target cell
    const cell = this.findCell(cellRef);
    if (cell) {
      cell.classList.add('focused');
    }
  }

  public enterEditingMode(cellRef: CellReference): void {
    const cell = this.findCell(cellRef);
    if (!cell) return;
    
    cell.classList.add('editing');
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = cell.textContent || '';
    
    // Replace cell content with input
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
  }

  public exitEditingMode(cellRef: CellReference, newValue: string): void {
    const cell = this.findCell(cellRef);
    if (!cell) return;
    
    cell.classList.remove('editing');
    cell.innerHTML = '';
    cell.textContent = newValue;
  }

  private findCell(cellRef: CellReference): HTMLElement | null {
    const selector = `[data-command-index="${cellRef.commandIndex}"][data-cell-type="${cellRef.cellType}"]` +
      (cellRef.paramIndex !== undefined ? `[data-param-index="${cellRef.paramIndex}"]` : '');
    
    return this.table.querySelector(selector);
  }
} 