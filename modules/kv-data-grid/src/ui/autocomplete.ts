import type { DSLDefinition, CellReference, CommandData } from '@core/types';

export class AutocompleteManager {
  private currentData: CommandData[] = [];
  private ghostOverlay: HTMLElement | null = null;

  constructor(
    private container: HTMLElement,
    private dsl: DSLDefinition
  ) {}

  public setCurrentCommandData(data: CommandData[]): void {
    this.currentData = data;
  }

  public getSuggestions(cellRef: CellReference, input: string): string[] {
    switch (cellRef.cellType) {
      case 'command':
        return this.getCommandSuggestions(input);
      case 'param-key':
        return this.getParameterKeySuggestions(cellRef, input);
      case 'param-value':
        return this.getParameterValueSuggestions(input);
      default:
        return [];
    }
  }

  private getCommandSuggestions(input: string): string[] {
    if (!input) return this.dsl.commands;
    
    return this.dsl.commands.filter(command => 
      command.toLowerCase().startsWith(input.toLowerCase())
    );
  }

  private getParameterKeySuggestions(cellRef: CellReference, input: string): string[] {
    const command = this.currentData[cellRef.commandIndex];
    if (!command || !command.name) return [];
    
    const validParams = this.dsl.parameters[command.name] || [];
    
    if (!input) return validParams;
    
    return validParams.filter(param => 
      param.toLowerCase().startsWith(input.toLowerCase())
    );
  }

  private getParameterValueSuggestions(input: string): string[] {
    // Get all parameter values from existing data
    const allValues = new Set<string>();
    
    this.currentData.forEach(command => {
      command.parameters.forEach(param => {
        if (param.value && param.value.trim()) {
          allValues.add(param.value);
        }
      });
    });
    
    const values = Array.from(allValues);
    
    if (!input) return values;
    
    return values.filter(value => 
      value.toLowerCase().startsWith(input.toLowerCase())
    );
  }

  public getBestSuggestion(cellRef: CellReference, input: string): string | null {
    const suggestions = this.getSuggestions(cellRef, input);
    
    if (suggestions.length === 0) return null;
    
    // Return exact match if found
    const exactMatch = suggestions.find(s => s.toLowerCase() === input.toLowerCase());
    if (exactMatch) return exactMatch;
    
    // Return first suggestion
    return suggestions[0];
  }

  public showGhostText(cellRef: CellReference, input: string, suggestion: string): void {
    this.hideGhostText();
    
    if (!suggestion || suggestion.length <= input.length) return;
    
    // Find the target cell
    const targetCell = this.findCell(cellRef);
    if (!targetCell) return;
    
    // Create ghost overlay
    this.ghostOverlay = document.createElement('div');
    this.ghostOverlay.className = 'autocomplete-ghost';
    this.ghostOverlay.style.position = 'absolute';
    this.ghostOverlay.style.pointerEvents = 'none';
    this.ghostOverlay.style.color = '#666666';
    this.ghostOverlay.style.fontFamily = 'inherit';
    this.ghostOverlay.style.fontSize = 'inherit';
    this.ghostOverlay.style.fontStyle = 'italic';
    this.ghostOverlay.style.zIndex = '1000';
    
    // Position overlay to match cell
    const cellRect = targetCell.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    this.ghostOverlay.style.left = (cellRect.left - containerRect.left) + 'px';
    this.ghostOverlay.style.top = (cellRect.top - containerRect.top) + 'px';
    this.ghostOverlay.style.width = cellRect.width + 'px';
    this.ghostOverlay.style.height = cellRect.height + 'px';
    this.ghostOverlay.style.padding = getComputedStyle(targetCell).padding;
    
    // Create the ghost text content
    const typedPart = document.createElement('span');
    typedPart.style.visibility = 'hidden';
    typedPart.textContent = input;
    
    const ghostPart = document.createElement('span');
    ghostPart.textContent = suggestion.substring(input.length);
    
    this.ghostOverlay.appendChild(typedPart);
    this.ghostOverlay.appendChild(ghostPart);
    
    this.container.appendChild(this.ghostOverlay);
  }

  public hideGhostText(): void {
    if (this.ghostOverlay) {
      this.ghostOverlay.remove();
      this.ghostOverlay = null;
    }
  }

  private findCell(cellRef: CellReference): HTMLElement | null {
    const selector = `[data-command-index="${cellRef.commandIndex}"][data-cell-type="${cellRef.cellType}"]` +
      (cellRef.paramIndex !== undefined ? `[data-param-index="${cellRef.paramIndex}"]` : '');
    
    return this.container.querySelector(selector);
  }
}
