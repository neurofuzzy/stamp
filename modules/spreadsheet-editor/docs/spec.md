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

coming soon

## Portability

This component should be able to support multiple independend instances on the page at once. This component should ship with minimal dependencies, have clear simple methods for import and export of data and event subscriptions. This componend should be composable within a larger application, no globals.
