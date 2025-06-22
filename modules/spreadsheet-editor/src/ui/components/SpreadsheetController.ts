import { SpreadsheetModel } from '@core/models/SpreadsheetModel';
import { SpreadsheetView } from './SpreadsheetView';

export class SpreadsheetController {
    private model: SpreadsheetModel;
    private view: SpreadsheetView;
    private isExpanding: boolean = false;

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
        const content = cell.textContent || '';

        let shouldExpand = false;

        if (cellType === 'command') {
            shouldExpand = this.model.updateCommandName(commandIndex, content);
        } else if (cellType === 'param-key') {
            shouldExpand = this.model.updateParameterKey(commandIndex, paramIndex, content);
        } else if (cellType === 'param-value') {
            this.model.updateParameterValue(commandIndex, paramIndex, content);
        }

        if (shouldExpand) {
            this.expandAndRender(cellType, commandIndex);
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
        const cellType = cell.dataset.cellType!;
        
        this.model.setFocus(commandIndex, paramIndex, cellType);
        
        if (this.view.isLockedCell(cell, this.model)) {
            setTimeout(() => this.view.selectAllText(cell), 0);
        }
    }

    private handleCellBlur(cell: HTMLElement): void {
        if (this.isExpanding) return;
        
        const cellType = cell.dataset.cellType!;
        const hasContent = (cell.textContent || '').trim() !== '';
        const isLocked = this.view.isLockedCell(cell, this.model);
        
        if ((cellType === 'command' || cellType === 'param-key') && hasContent && !isLocked) {
            this.lockCell(cell);
        }
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
            case 'ArrowUp':
                e.preventDefault();
                this.navigateUp(cells, currentIndex);
                break;
            
            case 'ArrowDown':
                e.preventDefault();
                this.navigateDown(cells, currentIndex);
                break;
            
            case 'ArrowLeft':
                if (isLocked || this.view.getCurrentCursorPosition(cell) === 0) {
                    e.preventDefault();
                    this.navigateLeft(cells, currentIndex);
                }
                break;
            
            case 'ArrowRight':
                if (isLocked || this.view.getCurrentCursorPosition(cell) === (cell.textContent || '').length) {
                    e.preventDefault();
                    this.navigateRight(cells, currentIndex);
                }
                break;
            
            case 'Tab':
                e.preventDefault();
                this.navigateTab(cells, currentIndex, e.shiftKey);
                break;
            
            case 'Enter':
                e.preventDefault();
                this.handleEnterKey(cell);
                break;
                
            case 'Backspace':
            case 'Delete':
                if (isLocked) {
                    e.preventDefault();
                    this.clearAndUnlockCell(cell);
                }
                break;
        }
    }

    private navigateUp(cells: HTMLElement[], currentIndex: number): void {
        this.focusCellAt(cells, Math.max(0, currentIndex - 3));
    }

    private navigateDown(cells: HTMLElement[], currentIndex: number): void {
        this.focusCellAt(cells, Math.min(cells.length - 1, currentIndex + 3));
    }

    private navigateLeft(cells: HTMLElement[], currentIndex: number): void {
        this.focusCellAt(cells, Math.max(0, currentIndex - 1));
    }

    private navigateRight(cells: HTMLElement[], currentIndex: number): void {
        this.focusCellAt(cells, Math.min(cells.length - 1, currentIndex + 1));
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
            const cellType = cell.dataset.cellType!;
            
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
        
        if (cellType === 'command') {
            this.model.clearCommand(commandIndex);
        } else if (cellType === 'param-key') {
            const paramIndex = parseInt(cell.dataset.paramIndex!);
            this.model.clearParameter(commandIndex, paramIndex);
        }
        
        this.render();
        this.view.focusCell(this.model);
    }

    private render(): void {
        this.view.render(this.model);
    }
} 