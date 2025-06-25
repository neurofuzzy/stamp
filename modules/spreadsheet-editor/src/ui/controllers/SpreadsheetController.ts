import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetEditorState } from '@core/state/SpreadsheetState';
import { SpreadsheetView } from '../views/SpreadsheetView';

export class SpreadsheetController {
    private model: SpreadsheetModel;
    private state: SpreadsheetEditorState;
    private view: SpreadsheetView;

    constructor(model: SpreadsheetModel, view: SpreadsheetView, state?: SpreadsheetEditorState) {
        this.model = model;
        this.state = state || new SpreadsheetEditorState();
        this.view = view;
        
        this.setupEventListeners();
        this.render();
        
        // Initial focus
        setTimeout(() => this.focusCurrentCell(), 100);
    }

    private setupEventListeners(): void {
        const container = this.view.container;
        
        container.addEventListener('input', this.handleInput.bind(this));
        container.addEventListener('keydown', this.handleKeydown.bind(this));
        container.addEventListener('focus', this.handleFocus.bind(this), true);
        container.addEventListener('blur', this.handleBlur.bind(this), true);
    }

    private handleInput(e: Event): void {
        const cell = e.target as HTMLElement;
        if (!cell.classList.contains('cell')) return;

        const content = cell.textContent || '';
        const [commandIndex, paramIndex, cellType] = this.getCellInfo(cell);

        // Update model
        if (cellType === 'command') {
            this.model.updateCommandName(commandIndex, content);
        } else if (cellType === 'param-key') {
            this.model.updateParameterKey(commandIndex, paramIndex, content);
        } else if (cellType === 'param-value') {
            this.model.updateParameterValue(commandIndex, paramIndex, content);
        }

        // Update state
        this.state.setFocus(commandIndex, paramIndex, cellType as any);
        this.state.setCursorPosition(this.getCursorPosition(cell));

        // Show autocomplete for commands and param-keys
        if (cellType === 'command') {
            const autocomplete = this.model.getAutocompleteForCommand(content);
            this.view.showAutocomplete(cell, autocomplete);
        } else if (cellType === 'param-key') {
            const commandName = this.model.commands[commandIndex].name;
            const autocomplete = this.model.getAutocompleteForParameter(commandName, content);
            this.view.showAutocomplete(cell, autocomplete);
        } else {
            this.view.hideAutocomplete();
        }

        this.render();
    }

    private handleKeydown(e: KeyboardEvent): void {
        const cell = e.target as HTMLElement;
        if (!cell.classList.contains('cell')) return;

        const [commandIndex, paramIndex, cellType] = this.getCellInfo(cell);
        const isLocked = this.isLocked(commandIndex, paramIndex, cellType);

        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                if (this.tryAutoComplete(cell)) return;
                this.navigateNext(!e.shiftKey);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (isLocked) {
                    this.unlock(commandIndex, paramIndex, cellType);
                } else if (this.tryAutoComplete(cell)) {
                    return;
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateUp();
                break;
            
            case 'ArrowDown':
                e.preventDefault();
                this.navigateDown();
                break;
            
            case 'ArrowLeft':
                if (isLocked || this.getCursorPosition(cell) === 0) {
                    e.preventDefault();
                    this.navigateLeft();
                }
                break;
            
            case 'ArrowRight':
                if (isLocked || this.getCursorPosition(cell) === (cell.textContent || '').length) {
                    e.preventDefault();
                    this.navigateRight();
                }
                break;
                
            case 'Escape':
            case 'Backspace':
            case 'Delete':
                if (isLocked) {
                    e.preventDefault();
                    this.clearAndUnlock(commandIndex, paramIndex, cellType);
                }
                break;
        }
    }

    private handleFocus(e: Event): void {
        const cell = e.target as HTMLElement;
        if (!cell.classList.contains('cell')) return;

        const [commandIndex, paramIndex, cellType] = this.getCellInfo(cell);
        this.state.setFocus(commandIndex, paramIndex, cellType as any);

        if (this.isLocked(commandIndex, paramIndex, cellType)) {
            setTimeout(() => this.selectAllText(cell), 0);
        }
    }

    private handleBlur(e: Event): void {
        const cell = e.target as HTMLElement;
        if (!cell.classList.contains('cell')) return;

        const [commandIndex, paramIndex, cellType] = this.getCellInfo(cell);
        const content = cell.textContent || '';

        // Clear invalid content for commands and param-keys - but only non-empty invalid content
        if ((cellType === 'command' || cellType === 'param-key') && content.trim() !== '') {
            if (!this.model.isValidCommand(content) && cellType === 'command') {
                this.model.clearCommand(commandIndex);
                this.render();
                return;
            }
            if (!this.model.isValidParameter(this.model.commands[commandIndex].name, content) && cellType === 'param-key') {
                this.model.clearParameter(commandIndex, paramIndex);
                this.render();
                return;
            }
        }

        // Lock cell if it has valid content
        if (content.trim() && this.isValidContent(commandIndex, paramIndex, cellType, content)) {
            this.lock(commandIndex, paramIndex, cellType);
        }

        this.view.hideAutocomplete();
    }

    private tryAutoComplete(cell: HTMLElement): boolean {
        const [commandIndex, paramIndex, cellType] = this.getCellInfo(cell);
        const content = cell.textContent || '';

        let autocomplete: any;
        if (cellType === 'command') {
            autocomplete = this.model.getAutocompleteForCommand(content);
        } else if (cellType === 'param-key') {
            const commandName = this.model.commands[commandIndex].name;
            autocomplete = this.model.getAutocompleteForParameter(commandName, content);
        }

        if (autocomplete?.hasMatches && autocomplete.matches[0] !== content) {
            const completion = autocomplete.matches[0];
            cell.textContent = completion;
            
            if (cellType === 'command') {
                this.model.updateCommandName(commandIndex, completion);
            } else if (cellType === 'param-key') {
                this.model.updateParameterKey(commandIndex, paramIndex, completion);
            }
            
            this.render();
            this.navigateNext(true);
            return true;
        }

        return false;
    }

    private navigateNext(forward: boolean): void {
        const focus = this.state.getFocus();
        let { commandIndex, paramIndex, cellType } = focus;

        if (forward) {
            if (cellType === 'command') {
                cellType = 'param-key';
                paramIndex = 0;
            } else if (cellType === 'param-key') {
                cellType = 'param-value';
            } else if (cellType === 'param-value') {
                paramIndex++;
                cellType = 'param-key';
                if (paramIndex >= this.model.commands[commandIndex].parameters.length) {
                    commandIndex++;
                    paramIndex = 0;
                    cellType = 'command';
                }
            }
        } else {
            if (cellType === 'param-value') {
                cellType = 'param-key';
            } else if (cellType === 'param-key') {
                if (paramIndex > 0) {
                    paramIndex--;
                    cellType = 'param-value';
                } else {
                    cellType = 'command';
                }
            } else if (cellType === 'command') {
                if (commandIndex > 0) {
                    commandIndex--;
                    const cmd = this.model.commands[commandIndex];
                    paramIndex = cmd.parameters.length - 1;
                    cellType = 'param-value';
                }
            }
        }

        this.state.setFocus(commandIndex, paramIndex, cellType as any);
        this.focusCurrentCell();
    }

    private navigateUp(): void {
        const focus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = focus;

        if (cellType === 'command' && commandIndex > 0) {
            this.state.setFocus(commandIndex - 1, 0, 'command');
        } else if ((cellType === 'param-key' || cellType === 'param-value') && paramIndex > 0) {
            this.state.setFocus(commandIndex, paramIndex - 1, cellType as any);
        }

        this.focusCurrentCell();
    }

    private navigateDown(): void {
        const focus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = focus;

        if (cellType === 'command' && commandIndex < this.model.commands.length - 1) {
            this.state.setFocus(commandIndex + 1, 0, 'command');
        } else if ((cellType === 'param-key' || cellType === 'param-value')) {
            const cmd = this.model.commands[commandIndex];
            if (paramIndex < cmd.parameters.length - 1) {
                this.state.setFocus(commandIndex, paramIndex + 1, cellType as any);
            }
        }

        this.focusCurrentCell();
    }

    private navigateLeft(): void {
        const focus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = focus;

        if (cellType === 'param-value') {
            this.state.setFocus(commandIndex, paramIndex, 'param-key');
        } else if (cellType === 'param-key') {
            this.state.setFocus(commandIndex, 0, 'command');
        }

        this.focusCurrentCell();
    }

    private navigateRight(): void {
        const focus = this.state.getFocus();
        const { commandIndex, paramIndex, cellType } = focus;

        if (cellType === 'command') {
            this.state.setFocus(commandIndex, 0, 'param-key');
        } else if (cellType === 'param-key') {
            this.state.setFocus(commandIndex, paramIndex, 'param-value');
        }

        this.focusCurrentCell();
    }

    // Utility methods
    private getCellInfo(cell: HTMLElement): [number, number, string] {
        const commandIndex = parseInt(cell.dataset.commandIndex!);
        const paramIndex = parseInt(cell.dataset.paramIndex!) || 0;
        const cellType = cell.dataset.cellType!;
        return [commandIndex, paramIndex, cellType];
    }

    private getCursorPosition(cell: HTMLElement): number {
        const selection = window.getSelection();
        return selection?.rangeCount ? selection.getRangeAt(0).startOffset : 0;
    }

    private isLocked(commandIndex: number, paramIndex: number, cellType: string): boolean {
        if (cellType === 'command') {
            return this.model.isCommandLocked(commandIndex);
        } else if (cellType === 'param-key') {
            return this.model.isParameterLocked(commandIndex, paramIndex);
        }
        return false;
    }

    private lock(commandIndex: number, paramIndex: number, cellType: string): void {
        if (cellType === 'command') {
            this.model.lockCommand(commandIndex);
        } else if (cellType === 'param-key') {
            this.model.lockParameter(commandIndex, paramIndex);
        }
        this.render();
    }

    private unlock(commandIndex: number, paramIndex: number, cellType: string): void {
        if (cellType === 'command') {
            this.model.unlockCommand(commandIndex);
        } else if (cellType === 'param-key') {
            this.model.unlockParameter(commandIndex, paramIndex);
        }
        this.render();
        this.focusCurrentCell();
    }

    private clearAndUnlock(commandIndex: number, paramIndex: number, cellType: string): void {
        if (cellType === 'command') {
            this.model.clearCommand(commandIndex);
        } else if (cellType === 'param-key') {
            this.model.clearParameter(commandIndex, paramIndex);
        }
        this.render();
        this.focusCurrentCell();
    }

    private isValidContent(commandIndex: number, paramIndex: number, cellType: string, content: string): boolean {
        if (cellType === 'command') {
            return this.model.isValidCommand(content);
        } else if (cellType === 'param-key') {
            const commandName = this.model.commands[commandIndex].name;
            return this.model.isValidParameter(commandName, content);
        }
        return true;
    }

    private selectAllText(cell: HTMLElement): void {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(cell);
        selection?.removeAllRanges();
        selection?.addRange(range);
    }

    private focusCurrentCell(): void {
        this.view.focusCell(this.createLegacyProxy());
    }

    private createLegacyProxy(): any {
        return {
            ...this.model,
            getFocus: () => this.state.getFocus(),
            getCursorPosition: () => this.state.getCursorPosition(),
            setFocus: (commandIndex: number, paramIndex: number, cellType: any) => 
                this.state.setFocus(commandIndex, paramIndex, cellType),
            setCursorPosition: (position: number) => this.state.setCursorPosition(position),
            isCommandLocked: (commandIndex: number) => this.model.isCommandLocked(commandIndex),
            isParameterLocked: (commandIndex: number, paramIndex: number) => this.model.isParameterLocked(commandIndex, paramIndex)
        };
    }

    private render(): void {
        this.view.render(this.model);
    }
} 