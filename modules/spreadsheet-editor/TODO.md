# Spreadsheet Editor Refactor TODO

## Overview
The current implementation has architectural issues that are causing complex event flows and making the codebase hard to maintain. This refactor will address three main problems:

1. **State/Model coupling**: Editor state mixed with data model
2. **Event flow chaos**: Multiple competing event handlers and timing issues
3. **File organization**: Unclear separation of concerns

## Phase 1: Separate State from Model

### 1.1 Extract SpreadsheetState
- [x] Create `src/core/state/SpreadsheetState.ts` (separate from existing file)
- [x] Move editor-specific state from SpreadsheetModel:
  - [x] `focusPosition: FocusPosition` (editor state)
  - [x] `cursorPosition: number` (within cell)
  - [ ] `autocompleteState: { visible: boolean, suggestion: string }` (will add)

### 1.2 Refactor SpreadsheetModel
- [x] Keep only data-related functionality:
  - [x] `commands: Command[]` (data structure)
  - [x] Data operations: `updateCommandName()`, `updateParameterValue()`, etc.
  - [x] Lock operations: `lockCommand()`, `unlockCommand()`, etc.
  - [x] DSL validation methods: `isValidCommand()`, `isValidParameter()`
  - [x] Autocomplete logic: `getAutocompleteForCommand()`, `getAutocompleteForParameter()`
  - [x] Removed editor state: `focusPosition`, `cursorPosition`, `completeCurrentInput()`

### 1.3 Update Dependencies
- [x] Update SpreadsheetController to use both State and Model
- [x] Created legacy proxy for backwards compatibility with View
- [x] Updated tests to work with separated concerns
- [x] All 13 core tests passing

## Phase 2: Simplify Event Flow

### 2.1 Event Handler Restructure  
**Current problem identified:** `handleCellInput()` calls `model.updateCommandName()` etc. on every keystroke, creating timing conflicts with blur/tab/navigation events.

**New approach:**
- [x] **Input events** → Only update DOM and State (no model saves)
- [x] **Blur/Enter/Tab events** → Validate, save to model, handle navigation  
- [x] **Arrow keys** → Validate current cell, save if valid, then navigate

### 2.2 Specific Event Changes
- [x] Remove model updates from `handleInput()` (now only handles autocomplete)
- [x] Move validation and saving to dedicated methods:
  - [x] `validateAndSaveCell()` - handles model updates with validation
  - [x] `handleCellExit()` - called on blur/navigation
  - [x] `handleCellComplete()` - called on enter/tab with valid content

### 2.3 Timing Fixes
- [x] DOM updates happen before state changes (cleaner event flow)
- [x] Removed competing `clearCellIfInvalid()` calls
- [x] **LESSON LEARNED**: Tests revealed input events MUST save to model for real-time validation/autocomplete
- [x] **CORRECTED APPROACH**: Restored model updates to input events, kept new validation methods for navigation
- [x] **TAB/ENTER COMPLETION FIX**: Fixed `hasValidAutocompleteMatch()` to exclude exact matches (e.g., "circle" exact match shouldn't trigger TAB completion)
- [x] **DOUBLE EXPANSION FIX**: Prevented duplicate row generation by limiting input expansion to exact matches only  
- [x] **CRITICAL DOM SYNC FIX**: Resolved race condition where input events triggered rendering, making DOM cell references stale and breaking navigation
- [x] **NAVIGATION TIMING FIX**: Fixed TAB keydown handler to recapture DOM cells after `handleCellExit()` to handle potential re-rendering
- [x] **END-TO-END TAB COMPLETION**: Verified full workflow with comprehensive tests covering partial completion, exact match navigation, and parameter completion
- [x] **FUNDAMENTAL TAB BUG FIX**: Resolved critical issue where TAB navigation on invalid content would clear ALL cells  
- [x] **TAB BEHAVIOR CORRECTED**: TAB now properly navigates without validation - only blur/escape clear invalid content
- [x] **ALL 27 TESTS PASSING**: Successfully completed Phase 2 with fully functional event flow, TAB completion, and navigation

## Phase 3: File Organization

### 3.1 Controller Placement
- [ ] Ensure SpreadsheetController is in `src/ui/controllers/`
- [ ] Verify clear separation from view logic

### 3.2 View Structure
- [ ] Keep SpreadsheetView in `src/ui/views/`
- [ ] Move any component-like code to `src/ui/components/` if needed
- [ ] Ensure view only handles DOM manipulation and rendering

### 3.3 Import Cleanup
- [ ] Update all import paths after file moves
- [ ] Ensure proper dependency flow: Controllers → Models/State, Views → State
- [ ] Remove circular dependencies

## Testing Strategy

### 3.4 Test Updates
- [ ] Update existing tests for new architecture
- [ ] Add tests for SpreadsheetState separately from SpreadsheetModel
- [ ] Add integration tests for the new event flow
- [ ] Ensure all 27 current tests still pass

### 3.5 Regression Prevention
- [ ] Add tests for the architectural boundaries:
  - [ ] State vs Model separation
  - [ ] Event flow timing
  - [ ] Cell locking/unlocking edge cases

## Success Criteria

- [ ] All existing functionality works (27 tests passing)
- [ ] No more complex event timing issues
- [ ] Clear separation of concerns
- [ ] Editor state changes don't trigger unnecessary model updates
- [ ] Code is easier to understand and maintain
- [ ] Future features can be added without regression risk

## Notes

- **Priority**: Phase 1 first (state separation), as it will make Phase 2 much cleaner
- **Testing**: Run tests after each major change to catch regressions early
- **Incremental**: Each phase should leave the system in a working state
- **Documentation**: Update any inline documentation to reflect new architecture

## Current Architecture Issues (Reference)

1. **State/Model coupling**: `currentFocus`, `editingMode`, `lockedCells` mixed with data
2. **Event chaos**: `handleInput()` saves on every keystroke, competing with blur/tab handlers
3. **Timing issues**: DOM updates vs model updates happening out of order
4. **File organization**: Controller was in wrong directory, unclear separation 