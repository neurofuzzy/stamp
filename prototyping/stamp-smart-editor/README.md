# Stamp Smart Editor Prototype

## Purpose
Create a smart text editor for Stamp's method-chaining API with context-aware autocomplete, inspired by FlowBuilder's approach but adapted for TypeScript method chaining.

## Goal
Transform this editing experience:
```typescript
// Current: No autocomplete, no validation
stamp.circle({radius: 10}).moveTo(50, 50).rectangle({width: 20, height: 30})
```

Into this enhanced experience:
- Context-aware method suggestions after `.`
- Parameter autocomplete inside `{}`
- Real-time syntax validation
- Rich syntax highlighting
- Smart parameter hints

## Architecture

### Core Components
1. **StampTokenizer**: Parse method chains and parameter objects
2. **StampAutocomplete**: Context-aware suggestions engine  
3. **StampEditor**: Rich text editing interface
4. **StampParser**: Validation and error checking

### API Categories
- **Movement**: `moveTo()`, `move()`, `forward()`, `rotate()`, `rotateTo()`
- **Shapes**: `circle()`, `rectangle()`, `ellipse()`, `polygon()`, `arch()`, `leafShape()`, `bone()`, `tangram()`
- **Boolean**: `add()`, `subtract()`, `intersect()`, `boolean()`
- **Control**: `set()`, `reset()`, `crop()`, `breakApart()`

## Implementation Plan
1. **Phase 1**: Basic tokenization and method detection
2. **Phase 2**: Context-aware autocomplete engine
3. **Phase 3**: Parameter object parsing and suggestions
4. **Phase 4**: Real-time validation and error highlighting
5. **Phase 5**: Rich syntax highlighting

## Testing Strategy
- Unit tests for tokenizer with various method chains
- Integration tests for autocomplete suggestions
- E2E tests for full editing experience

---
*Follows ai_workflow.md: TDD approach with minimal viable implementation* 