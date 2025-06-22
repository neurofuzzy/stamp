import { StampTokenizer, StampAutocomplete, Suggestion, SuggestionType } from './index';

class SmartEditorDemo {
  private editor: HTMLTextAreaElement;
  private suggestionsContainer: HTMLElement;
  private tokenizer: StampTokenizer;
  private autocomplete: StampAutocomplete;
  private currentSuggestions: Suggestion[] = [];
  private selectedIndex: number = 0;

  constructor() {
    this.editor = document.getElementById('editor') as HTMLTextAreaElement;
    this.suggestionsContainer = document.getElementById('suggestions') as HTMLElement;
    this.tokenizer = new StampTokenizer();
    this.autocomplete = new StampAutocomplete();
    
    this.setupEventListeners();
    this.updateSuggestions(); // Show initial suggestions for "stamp."
  }

  private setupEventListeners() {
    this.editor.addEventListener('input', () => this.updateSuggestions());
    this.editor.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.editor.addEventListener('click', () => this.updateSuggestions());
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.editor.contains(e.target as Node) && !this.suggestionsContainer.contains(e.target as Node)) {
        this.hideSuggestions();
      }
    });
  }

  private updateSuggestions() {
    const code = this.editor.value;
    const cursorPosition = this.editor.selectionStart;
    
    this.currentSuggestions = this.autocomplete.getSuggestions(code, cursorPosition);
    this.selectedIndex = 0;
    
    if (this.currentSuggestions.length > 0) {
      this.showSuggestions();
    } else {
      this.hideSuggestions();
    }
  }

  private showSuggestions() {
    this.suggestionsContainer.innerHTML = '';
    this.suggestionsContainer.classList.remove('hidden');
    
    this.currentSuggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = `suggestion-item ${index === this.selectedIndex ? 'selected' : ''}`;
      
      const textSpan = document.createElement('div');
      textSpan.className = 'suggestion-text';
      textSpan.textContent = suggestion.displayText;
      
      const detailSpan = document.createElement('div');
      detailSpan.className = 'suggestion-detail';
      detailSpan.textContent = suggestion.detail;
      
      item.appendChild(textSpan);
      item.appendChild(detailSpan);
      
      item.addEventListener('click', () => this.acceptSuggestion(suggestion));
      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
      
      this.suggestionsContainer.appendChild(item);
    });
  }

  private hideSuggestions() {
    this.suggestionsContainer.classList.add('hidden');
    this.currentSuggestions = [];
  }

  private updateSelection() {
    const items = this.suggestionsContainer.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.currentSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentSuggestions.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection();
        break;
        
      case 'Enter':
        if (this.currentSuggestions.length > 0) {
          e.preventDefault();
          this.acceptSuggestion(this.currentSuggestions[this.selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this.hideSuggestions();
        break;
    }
  }

  private acceptSuggestion(suggestion: Suggestion) {
    const code = this.editor.value;
    const cursorPosition = this.editor.selectionStart;
    
    // Find the text to replace
    let replaceStart = cursorPosition;
    let replaceEnd = cursorPosition;
    
    if (suggestion.type === SuggestionType.METHOD) {
      // Replace partial method name
      while (replaceStart > 0 && /[a-zA-Z]/.test(code[replaceStart - 1])) {
        replaceStart--;
      }
    } else if (suggestion.type === SuggestionType.PARAMETER) {
      // Replace partial parameter name
      while (replaceStart > 0 && /[a-zA-Z]/.test(code[replaceStart - 1])) {
        replaceStart--;
      }
    }
    
    // Build new code with suggestion inserted
    const before = code.substring(0, replaceStart);
    const after = code.substring(replaceEnd);
    const insertText = this.processInsertText(suggestion.insertText);
    
    this.editor.value = before + insertText + after;
    
    // Position cursor after insertion
    const newCursorPos = replaceStart + insertText.length;
    this.editor.setSelectionRange(newCursorPos, newCursorPos);
    
    this.hideSuggestions();
    this.editor.focus();
  }

  private processInsertText(insertText: string): string {
    // Remove placeholder syntax for demo (would be handled by real editor)
    return insertText
      .replace(/\$\{\d+:([^}]+)\}/g, '$1') // ${1:value} -> value
      .replace(/\$\{\d+\}/g, ''); // ${1} -> ''
  }
}

// Initialize the demo when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SmartEditorDemo());
} else {
  new SmartEditorDemo();
} 