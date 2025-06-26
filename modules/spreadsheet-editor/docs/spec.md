# Key-Value DataGrid Behavioral Specification

## KVDataGrid Component
A spreadsheet for interactive data entry and editing of data for scripting purposes. It can be instantiated multiple times on a page with completely independent functionality and data for each.

## KVDataGrid Compatible DSL 
Domain-specific languages that provide API methods (commands) and arguments (parameter keys) that facilitates marshaling rules and autocomplete values, as well as acting as a lookup matrix for transforming the current data model into code.

### DSL Interface Contract
Any DSL used with KVDataGrid must implement this interface:

```typescript
interface DSLDefinition {
  commands: string[];                    // Array of valid command names
  parameters: {                         // Map of command to its valid parameters
    [commandName: string]: string[];
  };
  
  // Optional methods for advanced functionality
  isValidCommand?(command: string): boolean;
  isValidParameter?(command: string, param: string): boolean;
  getCommandSuggestion?(partial: string): string | null;
  getParameterSuggestion?(command: string, partial: string): string | null;
}
```

### Example DSL Implementation:
```javascript
const STAMP_DSL = {
  commands: ['circle', 'rect', 'line', 'arc', 'text', 'group', 'repeat'],
  parameters: {
    'circle': ['radius', 'x', 'y', 'fill', 'stroke'],
    'rect': ['width', 'height', 'x', 'y', 'fill', 'stroke'],
    'line': ['x1', 'y1', 'x2', 'y2', 'stroke'],
    'arc': ['radius', 'startAngle', 'endAngle', 'x', 'y', 'fill', 'stroke'],
    'text': ['content', 'x', 'y', 'fontSize', 'fill'],
    'group': ['name'],
    'repeat': ['count', 'dx', 'dy', 'rotate']
  }
};
```

## KVDataGrid Data Model
A store of the VALIDATED data in the grid. Data can be imported into and exported from the grid.

## KVDataGrid State
An in-memory store of the current state of the data grid

## Grid Structure
A 3-column spreadsheet. Columns defined as such:

A. Command (method name)
B. Param Key (argument name)
C. Param Value (argument value)

There can be multiple B and C columns associated with a single A column - commands can span rows to facilitate multiple parameters. The command row will appear to be 1 cell which is exactly as tall as the number of parameter rows. We should be able to use standard table cell rowspan for this.

The grid will always have 1 and only 1 empty command row at the bottom. Once a new command is added, a new empty row will be inserted at the bottom.

Parameter key and value rows will also always have 1 and only 1 empty row at the bottom of each command. So, for instance, if a command has two parameters, there will be 3 rows total and the command cell will span 3 rows.

## DSL-Marshalled Cells:
These cells can only have valid values saved in them
1. Command
2. Param Key

## Free Cells:
These cells can have any value (for now)
2 Param Value

## States and Actions

1. Possible Interaction Modes
  A. *Navigation Mode*: This is the default mode when the component is mounted. User can navigate between cells but not edit their values
  B. *Editing Mode*: User can edit the current cell but not navigate between cells. When leaving editing mode, the current cell must be locked (see below)

2. Possible Cell States:
  A. Empty
  B. Unlocke for editing
    - only one cell can be unlocked at a time
  C. Locked (must have valid values for DSL Cells)

3a. Actions: Navigation Mode;
  
2a. Navigation mode:
  A. *Arrow-navigation*: Shall always navigate visually in the direction of the arrow. Special cases are navigating left from column B (param key) which, since the command has rowspan, should go both left and possibly up to the command row.

  B. *Tab Navigation*: TAB navigation works just like regular tabindex navigation.

  C. *Unlock Cell*: [ENTER KEY OR DOUBLE-CLICK] If the current cell is locked, it will unlock the cell, and interaction mode will change to Editing Mode

  D. *Other Keypresses*: Typing in a locked cell will not change its value. A flashing indicator should be shown in the cell.

3b. Actions: Editing Mode

  A. *Arrow-navigation*: Using the left and right arrows will simply move the cursor within the text as normal.

  B. *Lock a cell*: [TAB OR ENTER] Locking an unlocked cell involves a careful multi-step process: 
    1. IF A CELL IS DSL-MARSHALLED:
      a. read the current value and attempt to match the DSL in that context.
      b. If match, autocomplete the cell, save and lock the cell.
      c. If no match, it will clear the cell and it will return to Empty state.
    2. IF A CELL IS FREE:
      a. simply lock the cell regardless of the value

  C. *Editing cells*: Typing in an unlocked cell will act like a regular input field.

  D. *Abort editing*: [ESCAPE KEY] will return the cell's value to what it was before it was unlocked, then go through the locking steps.

  E. *Exiting a cell*: Exiting a cell may happen on a blur event if a user clicks outside the cell. At that time, we should go through the locking steps.

## Autocomplete hints

For autocomplete hinting, we want inline ghost text that will show the completed value, in the same diminished color as the placeholder text. 

- We only need have one overlay for the component because a user can only edit one cell at a time.
- Autocomplete hints only appear in editing mode.
- In navigation mode, autocomplete should remain idle and hints should not be visible
- When entering edit mode, autocomplete should reset
- When a cell becomes empty, autocomplete should also clear and reset
- In parameter values (Column C) autocomplete should instead use values from other cells in column C.

*Technical note*: We can align this using an overlay trick to add an overlay container that has the same exact size and border as the cell, but the border is transparent. It should also have the same padding and text styles as the cell, so that the text lines up perfectly. The contents should be two spans. The first will have visibility none but contain the text the user has typed. The second will have the ghost text style and contain the remainder of the autocomplete text.



## Change Events

The component should emit change events when a value in a cell is both changed from the previous value and is locked. No events should be emitted when a user is typing.

## Undo and Redo

The component should have undo and redo history supporting CMD-Z undo and SHIFT-CMD-Z redo

## Styling

### Color Palette
- **Background**: Dark theme with `#1e1e1e` primary background
- **Command cells**: Blue (`#4fc3f7`) text on `#242424` background
- **Param Key cells**: Orange (`#ffb74d`) text on `#282828` background  
- **Param Value cells**: Green (`#81c784`) text on `#1e1e1e` background
- **Focus border**: `#4fc3f7` (2px solid)
- **Placeholder text**: `#666666` italic
- **Warning flash**: `#ff6b6b` background for blink animation

### Typography
- **Font family**: `'Monaco', 'Menlo', 'Consolas', monospace`
- **Font size**: 14px
- **Line height**: 24px
- **Command cells**: Bold weight

### Layout
- **Cell padding**: 8px 12px
- **Minimum height**: 40px
- **Border**: 1px solid `#404040`
- **Command column width**: 120px
- **Param key column width**: 120px
- **Param value column**: Flexible width

### Container Layout
- **Two-panel layout**: 400px left panel + flexible right panel
- **Left panel**: `#1a1a1a` background with `#404040` border
- **Right panel**: `#2a2a2a` background for generated code display
- **Grid container**: 8px padding with auto-scroll

### Focus and Selection States
- **Focused cells**: `#2d2d2d` background with blue border
- **Locked cell selection**: `#006699` background for selected text
- **Locked cell focus**: Inherit background (no edit state)
- **Navigation mode**: Distinct visual cursor/border treatment
- **Editing mode**: Standard text input cursor behavior

### Animations
```css
@keyframes blink-warning {
    0% { background-color: inherit; }
    50% { background-color: #ff6b6b; }
    100% { background-color: inherit; }
}
```

## Component API

### Constructor
```javascript
const grid = new KVDataGrid(containerElement, dslDefinition, options = {});
```

### Parameters
- **containerElement**: DOM element that will contain the grid
- **dslDefinition**: Object implementing the DSL interface contract
- **options**: Optional configuration object

### Methods
```javascript
// Data management
grid.exportData(): CommandData[]
grid.importData(data: CommandData[]): void
grid.clearData(): void

// Event management  
grid.addEventListener(eventType: string, callback: Function): void
grid.removeEventListener(eventType: string, callback: Function): void

// State management
grid.getCurrentMode(): 'navigation' | 'editing'
grid.getCurrentCell(): CellReference | null
grid.focusCell(commandIndex: number, cellType: 'command' | 'param-key' | 'param-value', paramIndex?: number): void
```

### Events
```javascript
// Emitted when cell value changes and is locked
grid.addEventListener('cellChange', (event) => {
  // event.detail contains: commandIndex, cellType, paramIndex, oldValue, newValue
});

// Emitted when interaction mode changes
grid.addEventListener('modeChange', (event) => {
  // event.detail contains: oldMode, newMode
});
```

### Data Model
```typescript
interface CommandData {
  name: string;
  parameters: ParameterData[];
}

interface ParameterData {
  key: string;
  value: string;
}
```

## Portability

This component should be able to support multiple independent instances on the page at once. This component should ship with minimal dependencies, have clear simple methods for import and export of data and event subscriptions. This component should be composable within a larger application, no globals.

### Requirements
- **Multi-instance**: Each instance maintains independent state and data
- **No globals**: All state encapsulated within class instances  
- **Framework agnostic**: Works in vanilla JS, React, Vue, etc.
- **Minimal dependencies**: Only DOM APIs, no external libraries
- **Event-driven**: Communicates via standard DOM events
- **Theme-able**: CSS custom properties for styling customization


# Recommended Architecture

TypeScript compiled to a script-tag-ready library with MVC is perfect for this.

## 🏗️ **Lightweight MVC Architecture**

### **Model** - Data & State Management
```typescript
// KVDataGridModel.ts
class KVDataGridModel {
  private commands: CommandData[] = [];
  private currentCell: CellReference | null = null;
  private interactionMode: 'navigation' | 'editing' = 'navigation';
  private originalValues: Map<string, string> = new Map();
  
  // Data operations
  public getCommands(): CommandData[]
  public updateCommand(index: number, data: Partial<CommandData>): void
  public addCommand(): void
  public removeCommand(index: number): void
  
  // State operations  
  public setMode(mode: 'navigation' | 'editing'): void
  public getMode(): 'navigation' | 'editing'
  public setCurrentCell(cell: CellReference): void
  public getCurrentCell(): CellReference | null
}
```

### **View** - DOM Rendering & Updates
```typescript
// KVDataGridView.ts  
class KVDataGridView {
  private container: HTMLElement;
  private table: HTMLTableElement;
  
  // Rendering
  public render(commands: CommandData[]): void
  public updateCell(cellRef: CellReference, value: string): void
  public setFocus(cellRef: CellReference): void
  public showValidationError(cellRef: CellReference): void
  
  // Mode-specific rendering
  public enterNavigationMode(cellRef: CellReference): void
  public enterEditingMode(cellRef: CellReference): void
  
  // Event binding (delegates to controller)
  public bindEvents(eventHandlers: EventHandlers): void
}
```

### **Controller** - Orchestration & Business Logic
```typescript
// KVDataGridController.ts
class KVDataGridController {
  private model: KVDataGridModel;
  private view: KVDataGridView;
  private dsl: DSLDefinition;
  
  // Mode management (your key insight!)
  private handleNavigationMode(event: KeyboardEvent): void
  private handleEditingMode(event: KeyboardEvent): void
  private switchToEditing(cellRef: CellReference): void
  private switchToNavigation(): void
  
  // DSL integration
  private validateCell(cellRef: CellReference, value: string): boolean
  private getSuggestion(cellRef: CellReference, partial: string): string | null
  private autoComplete(cellRef: CellReference): boolean
}
```

## 📦 **Build Configuration for Script Tag Distribution**

### **TypeScript Config** (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "UMD",           // Universal Module Definition
    "lib": ["DOM", "ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,        // Generate .d.ts files
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### **Rollup Build** (for clean single-file output)
```javascript
// rollup.config.js
export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/kv-datagrid.js',
      format: 'umd',
      name: 'KVDataGrid',      // Global variable name
      sourcemap: true
    },
    {
      file: 'dist/kv-datagrid.esm.js', 
      format: 'es',            // For modern bundlers
      sourcemap: true
    }
  ],
  plugins: [
    typescript(),
    terser()                   // Minification
  ]
};
```

## 🎯 **Why MVC Works Perfectly Here**

### **Mode State Machine in Controller**
```typescript
class KVDataGridController {
  private handleKeydown(event: KeyboardEvent): void {
    if (this.model.getMode() === 'navigation') {
      this.handleNavigationMode(event);
    } else {
      this.handleEditingMode(event);
    }
  }
  
  private handleNavigationMode(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        this.switchToEditing(this.model.getCurrentCell());
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft': 
      case 'ArrowRight':
        this.navigateInDirection(event.key);
        break;
    }
  }
  
  private handleEditingMode(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        this.attemptLockAndExit();
        break;
      case 'Escape':
        this.restoreAndExit();
        break;
    }
  }
}
```

### **Clean DSL Integration**
```typescript
// The controller mediates between DSL and Model/View
private validateAndSuggest(cellRef: CellReference, value: string): ValidationResult {
  const cellType = this.getCellType(cellRef);
  
  if (cellType === 'command') {
    return {
      isValid: this.dsl.isValidCommand?.(value) ?? false,
      suggestion: this.dsl.getCommandSuggestion?.(value) ?? null
    };
  }
  // ... similar for param-key
}
```

## 📋 **Project Structure**
```
src/
├── index.ts              // Main export + UMD wrapper
├── models/
│   ├── KVDataGridModel.ts
│   └── types.ts          // Interfaces
├── views/
│   ├── KVDataGridView.ts  
│   └── styles.ts         // CSS-in-JS or constants
├── controllers/
│   └── KVDataGridController.ts
└── utils/
    ├── dsl-helpers.ts
    └── dom-utils.ts
```

## 🚀 **Usage After Build**
```html
<!-- Script tag usage -->
<script src="dist/kv-datagrid.js"></script>
<script>
  const grid = new KVDataGrid(document.getElementById('container'), STAMP_DSL);
</script>
```

```javascript
// ES Module usage
import { KVDataGrid } from 'kv-datagrid';
const grid = new KVDataGrid(container, dsl);
```

## Bite-Sized Design Philosophy

This component embodies a "bite-sized design philosophy" - creating small, focused modules that are feature-complete yet deliberately constrained in scope. In an AI-powered development world, we need to build solid, comprehensible components that are designed from the ground up to be part of a larger whole.

Each bite-sized component should be:
- **Cognitively digestible**: Small enough for humans and AI to fully understand and modify
- **Feature-complete**: Solves its specific problem entirely, with no missing pieces
- **Composable by design**: Built with clear interfaces that anticipate integration with other components
- **Independently testable**: Can be validated in isolation before becoming part of larger systems
- **Self-documenting**: Clear enough that its purpose and capabilities are obvious from usage

The KVDataGrid exemplifies this philosophy - it's a complete spreadsheet editor for DSL-based data entry, nothing more, nothing less. It doesn't try to be a full application framework or solve problems outside its domain. Instead, it provides a robust, well-defined interface that allows it to be seamlessly integrated into larger applications where spreadsheet-style data editing is needed.

This approach enables rapid development and iteration, where complex applications can be built by composing many small, reliable components rather than creating monolithic solutions. In an AI-assisted development environment, this modularity allows both humans and AI tools to reason about, modify, and extend functionality at the appropriate level of granularity.

