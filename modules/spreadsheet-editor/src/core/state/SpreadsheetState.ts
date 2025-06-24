import type { EditorState, FocusPosition } from '@core/types';

export class SpreadsheetEditorState implements EditorState {
  focusPosition: FocusPosition;
  cursorPosition: number;
  autocompleteState: {
    visible: boolean;
    suggestion: string;
  };

  constructor() {
    this.focusPosition = { commandIndex: 0, paramIndex: 0, cellType: 'command' };
    this.cursorPosition = 0;
    this.autocompleteState = { visible: false, suggestion: '' };
  }

  // Focus management
  setFocus(commandIndex: number, paramIndex: number, cellType: FocusPosition['cellType']): void {
    this.focusPosition = { commandIndex, paramIndex, cellType };
  }

  getFocus(): FocusPosition {
    return { ...this.focusPosition };
  }

  // Cursor position
  setCursorPosition(position: number): void {
    this.cursorPosition = position;
  }

  getCursorPosition(): number {
    return this.cursorPosition;
  }

  // Autocomplete state
  setAutocompleteVisible(visible: boolean): void {
    this.autocompleteState.visible = visible;
  }

  setAutocompleteSuggestion(suggestion: string): void {
    this.autocompleteState.suggestion = suggestion;
  }

  hideAutocomplete(): void {
    this.autocompleteState.visible = false;
    this.autocompleteState.suggestion = '';
  }

  isAutocompleteVisible(): boolean {
    return this.autocompleteState.visible;
  }

  getAutocompleteSuggestion(): string {
    return this.autocompleteState.suggestion;
  }
}
