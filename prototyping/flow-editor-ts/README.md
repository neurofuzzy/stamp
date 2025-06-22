# FlowBuilder TypeScript Port

## Purpose
Direct port of `flowbuilderarea.js` to modern TypeScript with Vite/Vitest, maintaining full functionality of the original flow programming editor.

## Original Features to Port
- **Rich Text Editor**: ContentEditable with colored syntax highlighting
- **Token-based Parsing**: Reserved words, subtypes, and context tracking
- **Smart Autocomplete**: Context-aware suggestions with arrow key navigation
- **Caret Management**: Precise cursor positioning and selection handling
- **Flow Control**: IF/THEN/ELSE/ENDIF statement parsing and validation
- **Real-time Validation**: Error highlighting and smart completion
- **Interactive Hints**: Popup suggestions with keyboard navigation

## Architecture

### Core Components
1. **FlowTokenizer**: Parse flow language into tokens with context
2. **FlowRenderer**: Generate colored HTML spans from tokens  
3. **FlowEditor**: Manage contentEditable with caret positioning
4. **FlowAutocomplete**: Context-aware suggestions and completion
5. **FlowValidator**: Real-time error checking and hints

### Flow Language Syntax
```
ON collision THEN goto player
IF health > 0 THEN changeHealth -10 ELSE destroy
DO create projectile WITH speed 100
WAIT 500 THEN rewind
```

## Implementation Plan
1. **Phase 1**: Core tokenizer with reserved words
2. **Phase 2**: Rich text renderer with syntax highlighting
3. **Phase 3**: ContentEditable editor with caret management
4. **Phase 4**: Context-aware autocomplete system
5. **Phase 5**: Flow control validation and hints

## Testing Strategy
- Unit tests for tokenizer with complex flow statements
- Integration tests for editor functionality
- E2E tests for full editing experience with autocomplete

---
*Following ai_workflow.md: TDD approach with direct port of original functionality* 