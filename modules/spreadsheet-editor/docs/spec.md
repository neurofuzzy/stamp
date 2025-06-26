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

## Autocomplete hints

For autocomplete hinting, we want inline ghost text that will show the completed value, in the same diminished color as the placeholder text. 

We can align this using an overlay trick to add an overlay container that has the same exact size and border as the cell, but the border is transparent. It should also have the same padding and text styles as the cell, so that the text lines up perfectly. The contents should be two spans. The first will have visibility none but contain the text the user has typed. The second will have the ghost text style and contain the remainder of the autocomplete text.

We only need have one overlay for the component because a user can only edit one cell at a time.

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
