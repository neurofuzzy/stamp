# Technical Implementation Guide

## Lessons Learned from Prototyping

Based on extensive prototyping, we discovered several critical technical challenges that must be addressed for a successful implementation.

## 1. Architecture Decisions

### 1.1 Single vs Multiple Components

**❌ DON'T**: Create separate components for main grid and nested parameter grids
- Leads to complex state synchronization
- Event bubbling conflicts
- Focus management nightmare

**✅ DO**: Single unified component that renders everything
- One source of truth for all data
- Unified event handling
- Simpler focus management

### 1.2 Rendering Strategy

**❌ DON'T**: Full re-render on every keystroke
- Causes performance issues
- Breaks focus and cursor position
- Triggers layout thrashing

**✅ DO**: Selective updates with change detection
- Only update changed cells
- Preserve DOM elements where possible
- Use requestAnimationFrame for batching

## 2. Focus Management

### 2.1 The Critical Challenge
- Browser contenteditable focus is fragile
- Re-rendering destroys focus state
- Async operations complicate timing

### 2.2 Solution Strategy
```typescript
class FocusManager {
  private currentFocus: {
    cellId: string;
    cursorPosition: number;
  } | null = null;

  saveFocus() {
    const activeElement = document.activeElement;
    if (activeElement?.classList.contains('cell')) {
      const selection = window.getSelection();
      this.currentFocus = {
        cellId: activeElement.dataset.cellId,
        cursorPosition: selection.anchorOffset
      };
    }
  }

  restoreFocus() {
    if (!this.currentFocus) return;
    
    const cell = document.querySelector(`[data-cell-id="${this.currentFocus.cellId}"]`);
    if (cell) {
      cell.focus();
      const range = document.createRange();
      range.setStart(cell.firstChild, this.currentFocus.cursorPosition);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
```

## 3. Event Handling Architecture

### 3.1 Event Delegation Pattern
**Use single event listener on container, not individual cells**

```typescript
class SpreadsheetEditor {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupEventDelegation();
  }

  private setupEventDelegation() {
    // Single listener handles all cell events
    this.container.addEventListener('input', this.handleInput.bind(this));
    this.container.addEventListener('keydown', this.handleKeydown.bind(this));
    this.container.addEventListener('focus', this.handleFocus.bind(this), true);
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('cell')) return;
    
    const cellType = target.dataset.cellType;
    const commandIndex = parseInt(target.dataset.commandIndex);
    
    // Route to appropriate handler based on cell type
    switch (cellType) {
      case 'command':
        this.handleCommandInput(target, commandIndex);
        break;
      case 'parameter-key':
        this.handleParameterKeyInput(target, commandIndex);
        break;
      case 'parameter-value':
        this.handleParameterValueInput(target, commandIndex);
        break;
    }
  }
}
```

### 3.2 Debounced Updates
**Prevent excessive re-renders during typing**

```typescript
class UpdateManager {
  private updateQueue = new Set<string>();
  private updateTimeout: number | null = null;

  queueUpdate(cellId: string) {
    this.updateQueue.add(cellId);
    
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      this.flushUpdates();
    }, 16); // One frame at 60fps
  }

  private flushUpdates() {
    // Batch all queued updates
    this.updateQueue.forEach(cellId => {
      this.updateCell(cellId);
    });
    this.updateQueue.clear();
    this.updateTimeout = null;
  }
}
```

## 4. Data Model Design

### 4.1 Immutable State with Patches
**Track changes without full object cloning**

```typescript
interface StateChange {
  type: 'command' | 'parameter-key' | 'parameter-value';
  commandIndex: number;
  parameterIndex?: number;
  value: string;
}

class DataStore {
  private data: CodeSpreadsheet;
  private changeListeners: ((changes: StateChange[]) => void)[] = [];

  applyChange(change: StateChange) {
    // Apply change directly to data structure
    switch (change.type) {
      case 'command':
        this.data.commands[change.commandIndex].name = change.value;
        break;
      case 'parameter-key':
        this.ensureParameter(change.commandIndex, change.parameterIndex!);
        this.data.commands[change.commandIndex].parameters[change.parameterIndex!].name = change.value;
        break;
      case 'parameter-value':
        this.ensureParameter(change.commandIndex, change.parameterIndex!);
        this.data.commands[change.commandIndex].parameters[change.parameterIndex!].value = change.value;
        break;
    }

    // Notify listeners with minimal change information
    this.changeListeners.forEach(listener => listener([change]));
  }
}
```

## 5. HTML Generation Strategy

### 5.1 Template-Based Rendering
**Use template literals for predictable HTML structure**

```typescript
class TemplateRenderer {
  renderCommand(command: Command, commandIndex: number): string {
    return `
      <tr class="command-row" data-command-index="${commandIndex}">
        <td class="command-cell-container">
          ${this.renderCommandCell(command, commandIndex)}
        </td>
        <td class="parameter-cell-container">
          ${this.renderParameterGrid(command, commandIndex)}
        </td>
      </tr>
    `;
  }

  renderParameterGrid(command: Command, commandIndex: number): string {
    if (!command.name) {
      return `<div class="empty-state">Available: circle, rectangle, moveTo, repeat</div>`;
    }

    const parameters = [...command.parameters];
    // Always ensure empty row for new parameters
    if (parameters.length === 0 || parameters[parameters.length - 1].name !== '') {
      parameters.push({ name: '', value: '', type: 'string' });
    }

    return `
      <div class="parameter-grid">
        <table class="parameter-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${parameters.map((param, index) => this.renderParameterRow(param, commandIndex, index)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}
```

## 6. Performance Optimizations

### 6.1 Virtual Scrolling for Large Datasets
```typescript
class VirtualScrollManager {
  private visibleRange = { start: 0, end: 20 };
  private itemHeight = 40;
  
  updateVisibleRange(scrollTop: number, containerHeight: number) {
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = start + Math.ceil(containerHeight / this.itemHeight) + 2;
    
    if (start !== this.visibleRange.start || end !== this.visibleRange.end) {
      this.visibleRange = { start, end };
      this.onRangeChange(this.visibleRange);
    }
  }
}
```

### 6.2 Efficient DOM Updates
```typescript
class DOMUpdater {
  updateCell(cellElement: HTMLElement, newContent: string) {
    // Only update if content actually changed
    if (cellElement.textContent !== newContent) {
      const selection = this.saveSelection(cellElement);
      cellElement.textContent = newContent;
      this.restoreSelection(cellElement, selection);
    }
  }

  private saveSelection(element: HTMLElement) {
    if (document.activeElement === element) {
      const selection = window.getSelection();
      return {
        start: selection.anchorOffset,
        end: selection.focusOffset
      };
    }
    return null;
  }
}
```

## 7. Testing Strategy

### 7.1 Component Testing
```typescript
describe('SpreadsheetEditor', () => {
  it('should preserve focus during updates', async () => {
    const editor = new SpreadsheetEditor(container);
    const commandCell = container.querySelector('.command-cell');
    
    commandCell.focus();
    commandCell.textContent = 'circle';
    
    // Trigger update
    commandCell.dispatchEvent(new Event('input'));
    
    // Wait for async update
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Focus should be preserved
    expect(document.activeElement).toBe(commandCell);
  });
});
```

### 7.2 Performance Testing
```typescript
describe('Performance', () => {
  it('should handle 1000 commands without lag', () => {
    const startTime = performance.now();
    
    const editor = new SpreadsheetEditor(container);
    
    // Add 1000 commands
    for (let i = 0; i < 1000; i++) {
      editor.addCommand({ name: 'circle', parameters: [] });
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // 100ms max
  });
});
```

## 8. Critical Implementation Guidelines

### 8.1 Start Simple
1. **Phase 1**: Basic two-column layout with contenteditable cells
2. **Phase 2**: Add parameter grids (static initially)  
3. **Phase 3**: Add navigation and autocomplete
4. **Phase 4**: Optimize performance and add advanced features

### 8.2 Avoid Common Pitfalls
- **Don't** use React/Vue/Angular - they add complexity for this use case
- **Don't** over-engineer the state management - simple object mutation is fine
- **Don't** try to make it perfect immediately - iterate based on user feedback
- **Don't** add features until the core editing experience is rock solid

### 8.3 Focus on Core Experience
The editor should feel **instant and predictable**:
- Typing should never lag
- Focus should never jump unexpectedly  
- Navigation should be intuitive for spreadsheet users
- Code generation should happen transparently

---

*This implementation guide distills critical lessons from extensive prototyping. Follow these patterns to avoid the pitfalls we discovered and create a truly intuitive spreadsheet-based code editor.* 