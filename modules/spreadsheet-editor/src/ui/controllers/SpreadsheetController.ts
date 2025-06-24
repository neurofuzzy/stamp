import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetEditorState } from '@core/state/SpreadsheetState';
import { SpreadsheetView } from '../views/SpreadsheetView';

export class SpreadsheetController {
    private model: SpreadsheetModel;
    private state: SpreadsheetEditorState;
    private view: SpreadsheetView;
    private isExpanding: boolean = false;
    private justCleared: boolean = false; // Prevent re-locking after clear

    constructor(model: SpreadsheetModel, view: SpreadsheetView, state?: SpreadsheetEditorState) {
        this.model = model;
        this.state = state || new SpreadsheetEditorState();
        this.view = view;
        
        this.setupEventListeners();
        this.render();
        
        // Initial focus
        setTimeout(() => this.view.focusCell(this.createLegacyModelProxy()), 100);
    }

    // Create a proxy object that combines model and state for legacy view compatibility
    private createLegacyModelProxy(): any {
        return {
            ...this.model,
            getFocus: () => this.state.getFocus(),
            getCursorPosition: () => this.state.getCursorPosition(),
            setFocus: (commandIndex: number, paramIndex: number, cellType: any) => 
                this.state.setFocus(commandIndex, paramIndex, cellType),
            setCursorPosition: (position: number) => this.state.setCursorPosition(position),
            completeCurrentInput: (completion: string) => this.completeCurrentInput(completion),
            isCommandLocked: (commandIndex: number) => this.model.isCommandLocked(commandIndex),
            isParameterLocked: (commandIndex: number, paramIndex: number) => this.model.isParameterLocked(commandIndex, paramIndex)
        };
    }

    // Handle autocomplete completion using both state and model
    private completeCurrentInput(completion: string): void {
        const { commandIndex, paramIndex, cellType } = this.state.getFocus();
        
        if (cellType === 'command') {
            this.model.updateCommandName(commandIndex, completion);
        } else if (cellType === 'param-key') {
            this.model.updateParameterKey(commandIndex, paramIndex, completion);
        }
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
            if ((e.target as Element).classList.contains('cell') && this.view.isLockedCell(e.target as HTMLElement, this.createLegacyModelProxy())) {
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
        if (this.view.isLockedCell(cell, this.createLegacyModelProxy())) {
            this.view.blinkCell(cell);
            return;
        }

        // Update state and save to model for real-time feedback
        this.saveCursorPosition(cell);
        
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
        const cellType = cell.dataset.cellType!;
        const content = cell.textContent || '';

        // Update focus state to track current editing position
        this.state.setFocus(commandIndex, paramIndex, cellType as any);

        // Update model immediately for validation and autocomplete
        let shouldExpand = false;
        if (cellType === 'command') {
            shouldExpand = this.model.updateCommandName(commandIndex, content);
            this.showAutocompleteForCommand(cell, content);
        } else if (cellType === 'param-key') {
            shouldExpand = this.model.updateParameterKey(commandIndex, paramIndex, content);
            this.showAutocompleteForParameter(cell, commandIndex, content);
        } else if (cellType === 'param-value') {
            this.model.updateParameterValue(commandIndex, paramIndex, content);
            this.view.hideAutocomplete();
        }

        // Handle expansion based on model's return value
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
        this.view.focusCell(this.createLegacyModelProxy());
        this.isExpanding = false;
    }

    private saveCursorPosition(cell: HTMLElement): void {
        const position = this.view.getCurrentCursorPosition(cell);
        this.state.setCursorPosition(position);
    }

    private handleCellFocus(cell: HTMLElement): void {
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
        const cellType = cell.dataset.cellType! as 'command' | 'param-key' | 'param-value';
        
        this.state.setFocus(commandIndex, paramIndex, cellType);
        
        if (this.view.isLockedCell(cell, this.createLegacyModelProxy())) {
            setTimeout(() => this.view.selectAllText(cell), 0);
        }
    }

    private handleCellBlur(cell: HTMLElement): void {
        if (this.isExpanding || this.justCleared) return;
        
        const cellType = cell.dataset.cellType!;
        
        // Save content and validate, but only clear if truly invalid
        const { commandIndex, paramIndex } = this.state.getFocus();
        const { isValid } = this.validateAndSaveCell(commandIndex, paramIndex, cellType);
        
        // Clear invalid content for commands and parameters
        if (!isValid && (cellType === 'command' || cellType === 'param-key')) {
            const content = cell.textContent || '';
            if (content.trim() !== '') {
                if (cellType === 'command') {
                    this.model.clearCommand(commandIndex);
                } else if (cellType === 'param-key') {
                    this.model.clearParameter(commandIndex, paramIndex);
                }
                // Clear just this cell's display, don't rebuild entire DOM
                cell.textContent = '';
            }
        }
        
        const isLocked = this.view.isLockedCell(cell, this.createLegacyModelProxy());
        const hasValidContent = (cell.textContent || '').trim() !== '';
        
        // Handle locking based on content validity after save
        if (cellType === 'command' || cellType === 'param-key') {
            if (hasValidContent && !isLocked) {
                this.lockCell(cell);
            } else if (!hasValidContent && isLocked) {
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
        const isLocked = this.view.isLockedCell(cell, this.createLegacyModelProxy());

        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                if (this.handleTabCompletion(cell)) {
                    // Tab completion handled and moved right
                    return;
                } else {
                    // No match - just navigate, let blur handle invalid content clearing
                    this.navigateTab(cells, currentIndex, e.shiftKey);
                }
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.handleEnterCompletion(cell)) {
                    // Enter completion handled and moved right
                    return;
                } else {
                    // No match - validate/save current cell and stay
                    this.handleCellExit();
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
                e.preventDefault();
                this.view.hideAutocomplete();
                this.navigateLeft(cells, currentIndex);
                break;
            
            case 'ArrowRight':
                e.preventDefault();
                this.view.hideAutocomplete();
                this.clearCellIfInvalid(cell);
                this.navigateRight(cells, currentIndex);
                break;
                
            case 'Backspace':
            case 'Delete':
                if (isLocked) {
                    // If cell is locked, clear it and unlock it
                    e.preventDefault();
                    this.clearAndUnlockCell(cell);
                }
                // If not locked, let default behavior handle it
                break;
                
            case 'Escape':
                if (isLocked) {
                    this.unlockCell(cell);
                    setTimeout(() => this.view.focusCell(this.createLegacyModelProxy()), 0);
                } else {
                    this.clearAndUnlockCell(cell);
                }
                break;
        }
    }

    private handleTabCompletion(cell: HTMLElement): boolean {
        const cellType = cell.dataset.cellType!;
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const currentText = cell.textContent || '';

        // Check if there's a valid autocomplete match
        if (this.model.hasValidAutocompleteMatch(cellType, commandIndex, currentText)) {
            // Get autocomplete result and complete uniformly
            let autocomplete: any;
            if (cellType === 'command') {
                autocomplete = this.model.getAutocompleteForCommand(currentText);
            } else if (cellType === 'param-key') {
                const commandName = this.model.commands[commandIndex].name;
                autocomplete = this.model.getAutocompleteForParameter(commandName, currentText);
            }
            
            if (autocomplete && autocomplete.hasMatches) {
                this.view.hideAutocomplete();
                
                // Complete the text in the current cell
                cell.textContent = autocomplete.matches[0];
                
                // Save to model
                const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
                let shouldExpand = false;
                
                if (cellType === 'command') {
                    shouldExpand = this.model.updateCommandName(commandIndex, autocomplete.matches[0]);
                } else if (cellType === 'param-key') {
                    shouldExpand = this.model.updateParameterKey(commandIndex, paramIndex, autocomplete.matches[0]);
                }
                
                // Only render if we need to expand, otherwise just move
                if (shouldExpand) {
                    this.expandAndRender(cellType, commandIndex);
                }
                
                // Move to next cell after completion
                this.moveToNextCell();
                return true;
            }
        }

        return false;
    }

    private handleEnterCompletion(cell: HTMLElement): boolean {
        const cellType = cell.dataset.cellType!;
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const currentText = cell.textContent || '';

        // Check if there's a valid autocomplete match
        if (this.model.hasValidAutocompleteMatch(cellType, commandIndex, currentText)) {
            // Get autocomplete result and complete uniformly
            let autocomplete: any;
            if (cellType === 'command') {
                autocomplete = this.model.getAutocompleteForCommand(currentText);
            } else if (cellType === 'param-key') {
                const commandName = this.model.commands[commandIndex].name;
                autocomplete = this.model.getAutocompleteForParameter(commandName, currentText);
            }
            
            if (autocomplete && autocomplete.hasMatches) {
                this.view.hideAutocomplete();
                
                // Complete the text in the current cell
                cell.textContent = autocomplete.matches[0];
                
                // Save to model
                const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
                let shouldExpand = false;
                
                if (cellType === 'command') {
                    shouldExpand = this.model.updateCommandName(commandIndex, autocomplete.matches[0]);
                } else if (cellType === 'param-key') {
                    shouldExpand = this.model.updateParameterKey(commandIndex, paramIndex, autocomplete.matches[0]);
                }
                
                // Only render if we need to expand, otherwise just move
                if (shouldExpand) {
                    this.expandAndRender(cellType, commandIndex);
                }
                
                // Move to next cell after completion
                this.moveToNextCell();
                return true;
            }
        }

        return false;
    }

    private clearCellIfInvalid(cell: HTMLElement): void {
        const cellType = cell.dataset.cellType!;
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        
        // Read current content from model (more reliable than DOM content)
        let currentText = '';
        if (cellType === 'command') {
            currentText = this.model.commands[commandIndex].name;
        } else if (cellType === 'param-key') {
            const paramIndex = parseInt(cell.dataset.paramIndex!);
            currentText = this.model.commands[commandIndex].parameters[paramIndex].key;
        }

        // Only check commands and param-keys for DSL validity
        if (cellType === 'command' || cellType === 'param-key') {
            let isValid = false;

            if (cellType === 'command') {
                isValid = this.model.isValidCommand(currentText);
            } else if (cellType === 'param-key') {
                const commandName = this.model.commands[commandIndex].name;
                isValid = this.model.isValidParameter(commandName, currentText);
            }

            if (!isValid && currentText.trim() !== '') {
                // Update model state first
                if (cellType === 'command') {
                    this.model.clearCommand(commandIndex);
                } else if (cellType === 'param-key') {
                    const paramIndex = parseInt(cell.dataset.paramIndex!);
                    this.model.clearParameter(commandIndex, paramIndex);
                }
                
                // Re-render to sync the UI with the cleared model state
                this.render();
                
                // Re-focus the current cell after clearing
                this.view.focusCell(this.createLegacyModelProxy());
            }
        }
    }

    private moveToNextCell(): void {
        const currentFocus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'command') {
            // From command, go to first param-key
            this.state.setFocus(commandIndex, 0, 'param-key');
        } else if (cellType === 'param-key') {
            // From param-key, go to param-value in same row
            this.state.setFocus(commandIndex, paramIndex, 'param-value');
        } else if (cellType === 'param-value') {
            // From param-value, go to next param-key or next command
            const currentCommand = this.model.commands[commandIndex];
            if (paramIndex < currentCommand.parameters.length - 1) {
                // Go to next parameter key in same command
                this.state.setFocus(commandIndex, paramIndex + 1, 'param-key');
            } else if (commandIndex < this.model.commands.length - 1) {
                // Go to next command
                this.state.setFocus(commandIndex + 1, 0, 'command');
            }
            // If at the last param-value of the last command, stay put
        }
        
        this.view.focusCell(this.createLegacyModelProxy());
    }

    private navigateUp(cells: HTMLElement[], currentIndex: number): void {
        const currentFocus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'command') {
            // From command, go to previous command
            if (commandIndex > 0) {
                this.state.setFocus(commandIndex - 1, 0, 'command');
            }
        } else {
            // From param cell, go to previous param in same command OR previous command's last param
            if (paramIndex > 0) {
                // Go to previous parameter in same command
                this.state.setFocus(commandIndex, paramIndex - 1, cellType);
            } else if (commandIndex > 0) {
                // Go to previous command's last parameter (same cell type)
                const prevCommand = this.model.commands[commandIndex - 1];
                const lastParamIndex = prevCommand.parameters.length - 1;
                this.state.setFocus(commandIndex - 1, lastParamIndex, cellType);
            }
        }
        this.view.focusCell(this.createLegacyModelProxy());
    }

    private navigateDown(cells: HTMLElement[], currentIndex: number): void {
        const currentFocus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'command') {
            // From command, go to next command
            if (commandIndex < this.model.commands.length - 1) {
                this.state.setFocus(commandIndex + 1, 0, 'command');
            }
        } else {
            // From param cell, go to next param in same command OR next command's first param
            const currentCommand = this.model.commands[commandIndex];
            if (paramIndex < currentCommand.parameters.length - 1) {
                // Go to next parameter in same command
                this.state.setFocus(commandIndex, paramIndex + 1, cellType);
            } else if (commandIndex < this.model.commands.length - 1) {
                // Go to next command's first parameter (same cell type)
                this.state.setFocus(commandIndex + 1, 0, cellType);
            }
        }
        this.view.focusCell(this.createLegacyModelProxy());
    }

    private navigateLeft(cells: HTMLElement[], currentIndex: number): void {
        const currentFocus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'param-value') {
            // From param-value, go to param-key in same row
            this.state.setFocus(commandIndex, paramIndex, 'param-key');
        } else if (cellType === 'param-key') {
            // From any param-key, go to command
            this.state.setFocus(commandIndex, 0, 'command');
        }
        // From command, do nothing (already leftmost)
        this.view.focusCell(this.createLegacyModelProxy());
    }

    private navigateRight(cells: HTMLElement[], currentIndex: number): void {
        const currentFocus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = currentFocus;

        if (cellType === 'command') {
            // From command, go to first param-key
            this.state.setFocus(commandIndex, 0, 'param-key');
        } else if (cellType === 'param-key') {
            // From param-key, go to param-value in same row
            this.state.setFocus(commandIndex, paramIndex, 'param-value');
        }
        // From param-value, do nothing (already rightmost)
        this.view.focusCell(this.createLegacyModelProxy());
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
            
            this.state.setFocus(commandIndex, paramIndex, cellType);
            this.view.focusCell(this.createLegacyModelProxy());
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
            this.view.focusCell(this.createLegacyModelProxy());
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
        const focus = this.state.getFocus();
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

    // Phase 2: New validation and save methods for better event timing
    private validateAndSaveCell(commandIndex: number, paramIndex: number, cellType: string): { isValid: boolean, shouldExpand: boolean } {
        const cell = this.getCurrentCellForPosition(commandIndex, paramIndex, cellType);
        if (!cell) return { isValid: false, shouldExpand: false };

        const content = cell.textContent || '';
        let isValid = true;
        let shouldExpand = false;

        // Validate without saving first
        if (cellType === 'command') {
            isValid = content.trim() === '' || this.model.isValidCommand(content);
            if (isValid) {
                shouldExpand = this.model.updateCommandName(commandIndex, content);
            }
        } else if (cellType === 'param-key') {
            const commandName = this.model.commands[commandIndex]?.name;
            isValid = content.trim() === '' || this.model.isValidParameter(commandName, content);
            if (isValid) {
                shouldExpand = this.model.updateParameterKey(commandIndex, paramIndex, content);
            }
        } else if (cellType === 'param-value') {
            this.model.updateParameterValue(commandIndex, paramIndex, content);
            isValid = true; // Values are always valid
        }

        return { isValid, shouldExpand };
    }

    private handleCellExit(): void {
        const { commandIndex, paramIndex, cellType } = this.state.getFocus();
        const { isValid, shouldExpand } = this.validateAndSaveCell(commandIndex, paramIndex, cellType);

        let needsRender = false;

        if (!isValid) {
            // Clear invalid content
            if (cellType === 'command') {
                this.model.clearCommand(commandIndex);
            } else if (cellType === 'param-key') {
                this.model.clearParameter(commandIndex, paramIndex);
            }
            needsRender = true;
        }

        if (shouldExpand) {
            if (cellType === 'command') {
                this.model.expandCommands();
            } else if (cellType === 'param-key') {
                this.model.expandParameters(commandIndex);
            }
            needsRender = true;
        }

        if (needsRender) {
            this.render();
            this.view.focusCell(this.createLegacyModelProxy());
        }
    }

    private handleCellComplete(): boolean {
        const { commandIndex, paramIndex, cellType } = this.state.getFocus();
        const { isValid, shouldExpand } = this.validateAndSaveCell(commandIndex, paramIndex, cellType);

        if (isValid && shouldExpand) {
            if (cellType === 'command') {
                this.model.expandCommands();
            } else if (cellType === 'param-key') {
                this.model.expandParameters(commandIndex);
            }
            this.render();
            this.moveToNextCell();
            return true;
        }

        return isValid;
    }

    private getCurrentCellForPosition(commandIndex: number, paramIndex: number, cellType: string): HTMLElement | null {
        const selector = this.buildCellSelector({ commandIndex, paramIndex, cellType });
        return this.view.container.querySelector(selector) as HTMLElement;
    }
} 