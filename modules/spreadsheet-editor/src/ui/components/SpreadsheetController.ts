import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetView } from './SpreadsheetView';

export class SpreadsheetController {
    private model: SpreadsheetModel;
    private view: SpreadsheetView;
    private isExpanding: boolean = false;
    private justCleared: boolean = false; // Prevent re-locking after clear

    constructor(model: SpreadsheetModel, view: SpreadsheetView) {
        this.model = model;
        this.view = view;
        
        this.setupEventListeners();
        this.render();
        
        // Initial focus
        setTimeout(() => this.view.focusCell(this.model), 100);
    }

    private setupEventListeners(): void {
        // Input handling
        this.view.container.addEventListener('input', (e) => {
            if ((e.target as Element).classList.contains('cell')) {
                this.handleCellInput(e.target as HTMLElement);
            }
        });

        // Keypress prevention for locked cells
        this.view.container.addEventListener('keypress', (e) => {
            if ((e.target as Element).classList.contains('cell') && this.view.isLockedCell(e.target as HTMLElement, this.model)) {
                if (e.key.length === 1) {
                    e.preventDefault();
                    this.view.blinkCell(e.target as HTMLElement);
                }
            }
        });

        // Navigation and special keys
        this.view.container.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Focus management
        this.view.container.addEventListener('focus', (e) => {
            if ((e.target as Element).classList.contains('cell')) {
                this.handleCellFocus(e.target as HTMLElement);
            }
        }, true);

        // Auto-lock on blur
        this.view.container.addEventListener('blur', (e) => {
            if ((e.target as Element).classList.contains('cell')) {
                this.handleCellBlur(e.target as HTMLElement);
            }
        }, true);
    }

    private handleCellInput(cell: HTMLElement): void {
        if (this.view.isLockedCell(cell, this.model)) {
            this.view.blinkCell(cell);
            return;
        }

        this.saveCursorPosition(cell);
        
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
        const cellType = cell.dataset.cellType!;
        const content = cell.textContent || ''; // Back to simple textContent

        let shouldExpand = false;

        if (cellType === 'command') {
            shouldExpand = this.model.updateCommandName(commandIndex, content);
            // Show autocomplete for commands
            this.showAutocompleteForCommand(cell, content);
        } else if (cellType === 'param-key') {
            shouldExpand = this.model.updateParameterKey(commandIndex, paramIndex, content);
            // Show autocomplete for parameters
            this.showAutocompleteForParameter(cell, commandIndex, content);
        } else if (cellType === 'param-value') {
            this.model.updateParameterValue(commandIndex, paramIndex, content);
            this.view.hideAutocomplete();
        }

        if (shouldExpand) {
            this.expandAndRender(cellType, commandIndex);
        }
    }

    private showAutocompleteForCommand(cell: HTMLElement, input: string): void {
        const autocomplete = this.model.getAutocompleteForCommand(input);
        this.view.showAutocomplete(cell, autocomplete);
    }

    private showAutocompleteForParameter(cell: HTMLElement, commandIndex: number, input: string): void {
        const commandName = this.model.commands[commandIndex].name;
        if (commandName) {
            const autocomplete = this.model.getAutocompleteForParameter(commandName, input);
            this.view.showAutocomplete(cell, autocomplete);
        } else {
            this.view.hideAutocomplete();
        }
    }

    private expandAndRender(cellType: string, commandIndex: number): void {
        this.isExpanding = true;
        
        if (cellType === 'command') {
            this.model.expandCommands();
        } else if (cellType === 'param-key') {
            this.model.expandParameters(commandIndex);
        }
        
        this.render();
        this.view.focusCell(this.model);
        this.isExpanding = false;
    }

    private saveCursorPosition(cell: HTMLElement): void {
        const position = this.view.getCurrentCursorPosition(cell);
        this.model.setCursorPosition(position);
    }

    private handleCellFocus(cell: HTMLElement): void {
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
        const cellType = cell.dataset.cellType! as 'command' | 'param-key' | 'param-value';
        
        this.model.setFocus(commandIndex, paramIndex, cellType);
        
        if (this.view.isLockedCell(cell, this.model)) {
            setTimeout(() => this.view.selectAllText(cell), 0);
        }
    }

    private handleCellBlur(cell: HTMLElement): void {
        if (this.isExpanding || this.justCleared) return;
        
        const cellType = cell.dataset.cellType!;
        const hasContent = (cell.textContent || '').trim() !== '';
        const isLocked = this.view.isLockedCell(cell, this.model);
        
        if (cellType === 'command' || cellType === 'param-key') {
            if (hasContent && !isLocked) {
                // Cell has content and is not locked -> lock it
                this.lockCell(cell);
            } else if (!hasContent && isLocked) {
                // Cell is empty and is locked -> unlock it
                this.unlockCell(cell);
            }
        }

        // Hide autocomplete when losing focus
        this.view.hideAutocomplete();
    }

    private lockCell(cell: HTMLElement): void {
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const cellType = cell.dataset.cellType!;
        
        if (cellType === 'command') {
            this.model.lockCommand(commandIndex);
        } else if (cellType === 'param-key') {
            const paramIndex = parseInt(cell.dataset.paramIndex!);
            this.model.lockParameter(commandIndex, paramIndex);
        }
        
        cell.classList.add('locked');
        (cell.style as any).userSelect = 'all';
    }

    private handleKeydown(e: KeyboardEvent): void {
        const cell = e.target as HTMLElement;
        if (!cell.classList.contains('cell')) return;

        const cells = this.view.getAllCells();
        const currentIndex = cells.indexOf(cell);
        const isLocked = this.view.isLockedCell(cell, this.model);

        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                if (this.handleTabCompletion(cell)) {
                    // Tab completion handled
                    return;
                } else {
                    // Regular tab navigation
                    this.navigateTab(cells, currentIndex, e.shiftKey);
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.view.hideAutocomplete();
                this.navigateUp(cells, currentIndex);
                break;
            
            case 'ArrowDown':
                e.preventDefault();
                this.view.hideAutocomplete();
                this.navigateDown(cells, currentIndex);
                break;
            
            case 'ArrowLeft':
                if (isLocked || this.view.getCurrentCursorPosition(cell) === 0) {
                    e.preventDefault();
                    this.view.hideAutocomplete();
                    this.navigateLeft(cells, currentIndex);
                }
                break;
            
            case 'ArrowRight':
                if (isLocked || this.view.getCurrentCursorPosition(cell) === (cell.textContent || '').length) {
                    e.preventDefault();
                    this.view.hideAutocomplete();
                    this.navigateRight(cells, currentIndex);
                }
                break;
            
            case 'Enter':
                e.preventDefault();
                this.view.hideAutocomplete();
                this.handleEnterKey(cell);
                break;
                
            case 'Backspace':
            case 'Delete':
                if (isLocked) {
                    e.preventDefault();
                    this.clearAndUnlockCell(cell);
                }
                break;

            case 'Escape':
                this.view.hideAutocomplete();
                break;
        }
    }

    private handleTabCompletion(cell: HTMLElement): boolean {
        const cellType = cell.dataset.cellType!;
        const currentText = cell.textContent || ''; // Simple textContent

        if (cellType === 'command') {
            const autocomplete = this.model.getAutocompleteForCommand(currentText);
            if (autocomplete.hasMatches) {
                this.view.hideAutocomplete(); // Clean up ghost text first
                this.model.completeCurrentInput(autocomplete.matches[0]);
                this.render();
                this.view.focusCell(this.model);
                return true;
            }
        } else if (cellType === 'param-key') {
            const commandIndex = parseInt(cell.dataset.commandIndex!);
            const commandName = this.model.commands[commandIndex].name;
            if (commandName) {
                const autocomplete = this.model.getAutocompleteForParameter(commandName, currentText);
                if (autocomplete.hasMatches) {
                    this.view.hideAutocomplete(); // Clean up ghost text first
                    this.model.completeCurrentInput(autocomplete.matches[0]);
                    this.render();
                    this.view.focusCell(this.model);
                    return true;
                }
            }
        }

        return false;
    }

    private navigateUp(_cells: HTMLElement[], _currentIndex: number): void {
        const currentFocus = this.model.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'command') {
            // From command, go to previous command
            if (commandIndex > 0) {
                this.model.setFocus(commandIndex - 1, 0, 'command');
            }
        } else {
            // From param cell, go to previous param in same command OR previous command's last param
            if (paramIndex > 0) {
                // Go to previous parameter in same command
                this.model.setFocus(commandIndex, paramIndex - 1, cellType);
            } else if (commandIndex > 0) {
                // Go to previous command's last parameter (same cell type)
                const prevCommand = this.model.commands[commandIndex - 1];
                const lastParamIndex = prevCommand.parameters.length - 1;
                this.model.setFocus(commandIndex - 1, lastParamIndex, cellType);
            }
        }
        this.view.focusCell(this.model);
    }

    private navigateDown(_cells: HTMLElement[], _currentIndex: number): void {
        const currentFocus = this.model.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'command') {
            // From command, go to next command
            if (commandIndex < this.model.commands.length - 1) {
                this.model.setFocus(commandIndex + 1, 0, 'command');
            }
        } else {
            // From param cell, go to next param in same command OR next command's first param
            const currentCommand = this.model.commands[commandIndex];
            if (paramIndex < currentCommand.parameters.length - 1) {
                // Go to next parameter in same command
                this.model.setFocus(commandIndex, paramIndex + 1, cellType);
            } else if (commandIndex < this.model.commands.length - 1) {
                // Go to next command's first parameter (same cell type)
                this.model.setFocus(commandIndex + 1, 0, cellType);
            }
        }
        this.view.focusCell(this.model);
    }

    private navigateLeft(_cells: HTMLElement[], _currentIndex: number): void {
        const currentFocus = this.model.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'param-value') {
            // From param-value, go to param-key in same row
            this.model.setFocus(commandIndex, paramIndex, 'param-key');
        } else if (cellType === 'param-key') {
            // From any param-key, go to command
            this.model.setFocus(commandIndex, 0, 'command');
        }
        // From command, do nothing (already leftmost)
        this.view.focusCell(this.model);
    }

    private navigateRight(_cells: HTMLElement[], _currentIndex: number): void {
        const currentFocus = this.model.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'command') {
            // From command, go to first param-key
            this.model.setFocus(commandIndex, 0, 'param-key');
        } else if (cellType === 'param-key') {
            // From param-key, go to param-value in same row
            this.model.setFocus(commandIndex, paramIndex, 'param-value');
        }
        // From param-value, do nothing (already rightmost)
        this.view.focusCell(this.model);
    }

    private navigateTab(cells: HTMLElement[], currentIndex: number, reverse: boolean): void {
        const direction = reverse ? -1 : 1;
        this.focusCellAt(cells, Math.max(0, Math.min(cells.length - 1, currentIndex + direction)));
    }

    private focusCellAt(cells: HTMLElement[], index: number): void {
        const cell = cells[index];
        if (cell) {
            const commandIndex = parseInt(cell.dataset.commandIndex!);
            const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
            const cellType = cell.dataset.cellType! as 'command' | 'param-key' | 'param-value';
            
            this.model.setFocus(commandIndex, paramIndex, cellType);
            this.view.focusCell(this.model);
        }
    }

    private handleEnterKey(cell: HTMLElement): void {
        const isLocked = this.view.isLockedCell(cell, this.model);
        const cellType = cell.dataset.cellType!;
        
        if (isLocked) {
            this.unlockCell(cell);
            setTimeout(() => this.view.focusCell(this.model), 0);
        } else if (cellType === 'command' || cellType === 'param-key') {
            if ((cell.textContent || '').trim()) {
                this.lockCell(cell);
                setTimeout(() => this.view.selectAllText(cell), 0);
            }
        }
    }

    private unlockCell(cell: HTMLElement): void {
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const cellType = cell.dataset.cellType!;
        
        if (cellType === 'command') {
            this.model.unlockCommand(commandIndex);
        } else if (cellType === 'param-key') {
            const paramIndex = parseInt(cell.dataset.paramIndex!);
            this.model.unlockParameter(commandIndex, paramIndex);
        }
        
        cell.classList.remove('locked');
        (cell.style as any).userSelect = '';
    }

    private clearAndUnlockCell(cell: HTMLElement): void {
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const cellType = cell.dataset.cellType!;
        
        // Set flag to prevent blur from re-locking
        this.justCleared = true;
        
        if (cellType === 'command') {
            this.model.clearCommand(commandIndex);
            this.model.unlockCommand(commandIndex); // Ensure it's unlocked in model
        } else if (cellType === 'param-key') {
            const paramIndex = parseInt(cell.dataset.paramIndex!);
            this.model.clearParameter(commandIndex, paramIndex);
            this.model.unlockParameter(commandIndex, paramIndex); // Ensure it's unlocked in model
        }
        
        // Render with unlocked state
        this.render();
        
        // Focus the cell and ensure it's ready for editing
        setTimeout(() => {
            this.view.focusCell(this.model);
            const newCell = this.getCurrentCell();
            if (newCell) {
                this.view.setCursorToEnd(newCell);
            }
            // Clear the flag after focus cycle is complete
            setTimeout(() => {
                this.justCleared = false;
            }, 10);
        }, 0);
    }

    private getCurrentCell(): HTMLElement | null {
        const focus = this.model.getFocus();
        const selector = this.buildCellSelector(focus);
        return this.view.container.querySelector(selector) as HTMLElement;
    }

    private buildCellSelector(focus: { commandIndex: number; paramIndex: number; cellType: string }): string {
        const { commandIndex, paramIndex, cellType } = focus;
        
        if (cellType === 'command') {
            return `[data-command-index="${commandIndex}"][data-cell-type="command"]`;
        } else {
            return `[data-command-index="${commandIndex}"][data-param-index="${paramIndex}"][data-cell-type="${cellType}"]`;
        }
    }

    private render(): void {
        this.view.render(this.model);
    }
} 