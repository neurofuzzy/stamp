# Key-Value DataGrid Behavioral Specification

## KVDataGrid Component
A spreadsheet for interactive data entry and editing of data for scripting purposes. It can be instantiated multiple times on a page with completely independent functionality and data for each.

## KVDataGrid Compatible DSL 
Domain-specific languages that provide API methods (commands) and arguments (parameter keys) that facilitates marshaling rules and autocomplete values, as well as acting as a lookup matrix for transforming the current data model into code.

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

1. Possible Cell States (for DSL cells):
  A. Empty
  B. Unlocked and Editing
    - only one cell can be unlocked at a time
  C. Locked and Matched

2. Actions
  A. *Arrow-navigation*: Shall always navigate visually in the direction of the arrow. Special cases are navigating left from column B (param key) which, since the command has rowspan, should go both left and possibly up to the command row.
    1. While editing: Using the left and right arrows while editing a cell will simply move the cursor.
    2. Otherwise navigation will move between cells.
  B. *Tab Navigation*: When not editing an inlocked cell, TAB navigation works just like regular tabindex navigation.
  B. *Unlock Cell*: If the current cell is locked, it will unlock the cell, and the user can then edit it. 
  C. *Lock a cell*: Locking an unlocked cell involves a careful multi-step process: 
    1. IF A CELL IS DSL-MARSHALLED:
      a. read the current value and attempt to match the DSL in that context.
      b. If match, autocomplete the cell, save and lock the cell.
      c. If no match, it will clear the cell and it will return to Empty state.
    2. IF A CELL IS FREE:
      a. simply lock the cell regardless of the value
  D. *Abort editing*: If in an unlocked cell, it will return the cell's value to what it was before it was unlocked, then go through the locking steps,
  E. *Typing text*: 
    1. Typing in a locked cell will not change its value. A flashing indicator should be shown in the cell
    2. Typing in an unlocked cell will act like a regular input field.

