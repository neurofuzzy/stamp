# Spreadsheet-Based Code Editor Specification

## Vision Statement

Transform traditional programming into intuitive spreadsheet interactions where complexity emerges from simple repetitive, recursive operations with sequencing - not from complex UI. The interface should get out of the way and let mathematical recursion create the beauty.

## Core Philosophy

- **Visual discovery over memorization**: Make functionality geography visible rather than requiring command memorization
- **Progressive disclosure over overwhelming options**: Show complexity only when needed
- **2D workspace model**: Horizontal = workflow silos, Vertical = construction steps
- **Simple operations → Complex results**: Interface supports simple actions that compound into sophisticated programs

## 1. Overall Architecture

### 1.1 Two-Column Master Layout
```
+----------+--------------------------------+
| Command  | Parameters                     |
| (120px)  | (Expandable)                   |
+----------+--------------------------------+
| circle   | [Parameter Spreadsheet]        |
| moveTo   | [Parameter Spreadsheet]        |
| repeat   | [Parameter Spreadsheet]        |
| [empty]  | Available: circle, rectangle.. |
+----------+--------------------------------+
```

### 1.2 Design Principles
- **No UI chrome**: No buttons, dropdowns, or modal dialogs
- **Keyboard-first**: Complete workflow achievable without mouse
- **Auto-expanding**: Interface grows organically as user types
- **Focus preservation**: Never lose cursor position during operations
- **Immediate feedback**: Real-time code generation and validation

## 2. Command Column (Column A)

### 2.1 Behavior
- **Single contenteditable cell per row**
- **Auto-complete with gray suggestion text**
- **Tab key accepts suggestion**
- **Enter/Down arrow moves to next command**
- **Auto-adds empty row when typing in last row**

### 2.2 Visual Design
- **Bold blue text** (#4fc3f7)
- **Monaco/Menlo font** for code aesthetics
- **Placeholder text**: "Type command..." for empty rows
- **Small delete button** (×) appears on hover for non-empty commands

### 2.3 Supported Commands
- `circle` - Create circular shape
- `rectangle` - Create rectangular shape  
- `moveTo` - Move cursor position
- `repeat` - Repeat previous operations
- `polygon` - Create polygon shape
- `line` - Draw line
- (Extensible via command registry)

## 3. Parameter Column (Column B) - Nested Spreadsheet

### 3.1 Architecture
Each command row contains a **nested spreadsheet** with its own headers and cells:

```
+--------------------------------+
| Parameter Spreadsheet          |
+----------------+---------------+
| Parameter      | Value         |
+----------------+---------------+
| radius         | 10            |
| divisions      | 6             |
| [empty]        | [empty]       |
+----------------+---------------+
```

### 3.2 Nested Spreadsheet Structure
- **Column BA**: Parameter names (radius, width, x, y, times, etc.)
- **Column BB**: Parameter values (10, 100, 50, 3, etc.)
- **Headers**: "Parameter" and "Value" 
- **Auto-expanding**: Always maintains one empty row at bottom

### 3.3 Visual Design
- **Darker background** (#282828) to show nesting
- **Rounded border** with subtle outline
- **Color coding**:
  - Parameter names (BA): Orange (#ffb74d)
  - Parameter values (BB): Green (#81c784)
- **11px font size** (smaller than main commands)

### 3.4 Empty State
For commands with no name, show:
```
Available: circle, rectangle, moveTo, repeat
```
Center-aligned, italic, gray text.

## 4. Navigation System

### 4.1 Keyboard Navigation
- **Arrow Keys**: Navigate between all cells including nested ones
- **Tab**: Accept autocomplete OR move to next logical cell
- **Enter**: Move down to next row (or create new row)
- **Escape**: Cancel current edit, clear suggestions

### 4.2 Navigation Logic
```
Command → Tab → Parameter Name → Tab → Parameter Value → Tab → Next Parameter Name
                                           ↓ Enter
                                     Next Command
```

### 4.3 Focus Management
- **Never lose focus** during re-renders
- **Cursor position preserved** at character level
- **Visual focus indicators** with blue border

## 5. Auto-Complete System

### 5.1 Inline Gray Text Suggestions
- **No dropdowns or popups**
- **Gray continuation text** appears after typed characters
- **Tab accepts**, **any other key dismisses**

### 5.2 Context-Aware Suggestions
- **Command context**: circle, rectangle, moveTo, repeat
- **Parameter context**: Based on current command (radius for circle, width/height for rectangle)
- **Value context**: Smart suggestions based on parameter type (numbers for dimensions, coordinates for positions)

### 5.3 Example Flow
```
User types: "ci"
Display: "ci" + gray "rcle"
Tab press: "circle"
Tab again: Navigate to parameter name
User types: "ra"
Display: "ra" + gray "dius"
```

## 6. Code Generation

### 6.1 Real-Time Generation
- **Immediate feedback** as user types
- **Valid TypeScript syntax** output
- **Method chaining**: `new Stamp().circle({radius: 10}).moveTo({x: 100, y: 50})`

### 6.2 Type Safety
- **Parameter validation** based on command definitions
- **Type coercion**: "10" → 10 for numeric parameters
- **Error handling**: Invalid parameters marked but don't break flow

## 7. Data Model

### 7.1 Command Structure
```typescript
interface Command {
  id: string;           // Unique identifier
  name: string;         // circle, rectangle, etc.
  parameters: Parameter[];
}

interface Parameter {
  name: string;         // radius, width, x, y, etc.
  value: string | number;
  type: 'string' | 'number' | 'boolean';
}

interface CodeSpreadsheet {
  commands: Command[];
}
```

### 7.2 State Management
- **Immutable updates** for predictable rendering
- **Optimistic updates** for responsive feel
- **Undo/redo support** via command history

## 8. Performance Requirements

### 8.1 Responsiveness
- **<16ms render time** for smooth 60fps experience
- **Debounced code generation** (50ms delay)
- **Virtual scrolling** for 1000+ commands

### 8.2 Memory Efficiency
- **Minimal DOM manipulation** during typing
- **Efficient re-rendering** with change detection
- **Cleanup of event listeners** on component unmount

## 9. Implementation Constraints

### 9.1 No Framework Dependencies
- **Vanilla TypeScript** for maximum control
- **Custom event system** for component communication
- **Manual DOM manipulation** for precision

### 9.2 Browser Support
- **Modern browsers only** (ES2020+)
- **No polyfills** for legacy support
- **Progressive enhancement** where possible

## 10. Future Enhancements

### 10.1 Advanced Features
- **Visual preview pane** showing generated shapes
- **Export to SVG/DXF** for fabrication
- **Import existing code** to spreadsheet format
- **Collaborative editing** with operational transforms

### 10.2 Extensibility
- **Plugin system** for custom commands
- **Theme system** for visual customization
- **Macro recording** for repetitive operations

## 11. Success Metrics

### 11.1 User Experience
- **Zero learning curve** for spreadsheet users
- **Faster than traditional coding** for simple programs
- **Discoverable functionality** without documentation

### 11.2 Technical Metrics
- **100% test coverage** for core functionality
- **Zero runtime errors** in normal usage
- **Consistent 60fps** performance during interaction

## 12. Key Learnings from Prototyping

### 12.1 What Worked
- **Nested spreadsheet concept** feels natural
- **Separate key/value columns** are intuitive
- **Auto-expanding rows** eliminate UI chrome
- **Real-time code generation** provides immediate feedback

### 12.2 What Didn't Work
- **Complex state synchronization** between main and nested grids
- **Focus management** during async re-renders
- **Event bubbling** conflicts between nested contenteditable elements
- **Performance issues** with full re-renders on every keystroke

### 12.3 Critical Requirements for Success
- **Absolute simplicity** in implementation
- **Zero framework overhead** for maximum control
- **Careful separation** of concerns between layout and data
- **Progressive complexity** - start simple, add features incrementally

---

*This specification represents the distilled wisdom from extensive prototyping and user feedback. The goal is to create a revolutionary programming interface that feels as natural as using Excel, but generates sophisticated code.* 