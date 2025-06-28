# KVDataGrid Component

A lightweight, dependency-free, framework-agnostic spreadsheet component for interactive, DSL-based data entry.

## Usage

To use the `KVDataGrid` component, you need a container element in your HTML and a DSL (Domain-Specific Language) definition object in your JavaScript.

### 1. HTML Setup
```html
<div id="grid-container"></div>
```

### 2. JavaScript Initialization
```javascript
import { KVDataGrid } from './src/index.ts'; // Or from 'dist/kv-datagrid.esm.js' after building

// Define your Domain-Specific Language
const myDSL = {
  commands: ['circle', 'rect', 'line'],
  parameters: {
    'circle': ['radius', 'x', 'y'],
    'rect': ['width', 'height', 'x', 'y'],
    'line': ['x1', 'y1', 'x2', 'y2'],
  }
};

const container = document.getElementById('grid-container');
const grid = new KVDataGrid(container, myDSL);
```

---

## API

### Methods

- `exportData(): CommandData[]`
  Exports the current grid data as an array of command objects.

- `importData(data: CommandData[]): void`
  Imports an array of command objects into the grid, replacing the current data.

- `clearData(): void`
  Clears all data from the grid.

### Events

The component uses the standard `EventTarget` interface for dispatching events.

- **`cellChange`**
  Fired when a cell's value is changed and locked. The `event.detail` object contains: `{ commandIndex, cellType, paramIndex, oldValue, newValue }`.

- **`modeChange`**
  Fired when the grid switches between interaction modes. The `event.detail` object contains: `{ oldMode, newMode }`.

#### Example: Listening to Events
```javascript
grid.addEventListener('cellChange', (event) => {
  console.log('Cell changed:', event.detail);
});

grid.addEventListener('modeChange', (event) => {
  console.log(`Mode changed from ${event.detail.oldMode} to ${event.detail.newMode}`);
});
```

---

## Building from Source

This project uses `TypeScript` for development and `Rollup` for bundling.

### 1. Install Dependencies
Navigate to the component directory and run:
```bash
npm install
```

### 2. Build for Production
To compile the TypeScript and bundle it for distribution, run:
```bash
npm run build
```

This command will generate two files in the `dist/` directory:
- `dist/kv-datagrid.js`: A UMD bundle that can be included directly in a `<script>` tag. The component will be available as the global variable `KVDataGrid`.
- `dist/kv-datagrid.esm.js`: An ES Module bundle for use with modern bundlers like Vite or Webpack. 