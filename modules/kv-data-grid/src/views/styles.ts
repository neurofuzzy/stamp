export const css = `
/* Basic Table Styles */
table {
  border-collapse: collapse;
  width: 100%;
  color: #fff;
  background-color: #1e1e1e;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 14px;
}

th, td {
  border: 1px solid #404040;
  padding: 8px 12px;
  line-height: 24px;
  min-height: 40px;
  vertical-align: top;
}

th {
  background-color: #2a2a2a;
}

/* Column Widths */
td:nth-child(1), th:nth-child(1) { width: 120px; }
td:nth-child(2), th:nth-child(2) { width: 120px; }

/* Cell-specific styling */
td[data-cell-type="command"] {
  background-color: #242424;
  color: #4fc3f7;
  font-weight: bold;
}

td[data-cell-type="param-key"] {
  background-color: #282828;
  color: #ffb74d;
}

td[data-cell-type="param-value"] {
  background-color: #1e1e1e;
  color: #81c784;
}

/* Placeholder text */
td:empty::before {
  content: attr(data-placeholder);
  color: #666666;
  font-style: italic;
}

/* Focus and Selection */
td:focus, .focused {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  background-color: #2d2d2d;
}

/* Warning Flash */
@keyframes blink-warning {
    0% { background-color: inherit; }
    50% { background-color: #ff6b6b; }
    100% { background-color: inherit; }
}

.blink {
  animation: blink-warning 0.5s;
}
`;
