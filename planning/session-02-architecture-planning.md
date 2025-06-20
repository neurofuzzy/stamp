# Session 2: Architecture Planning

## FlowBuilder Analysis

### Key FlowBuilder Concepts
1. **Smart Text Editor**: Rich decoration and context-aware editing, not visual nodes
2. **Natural Language Feel**: Code reads like instructions: "on collision then do goto player"
3. **Token-based Parsing**: Simple tokenization with reserved words and subtypes
4. **Context-aware Autocomplete**: Suggests valid next words based on current parsing state
5. **Rich Text Decoration**: Keywords highlighted, context spans, visual caret hints

### FlowBuilder Tokenization Strategy

#### Reserved Word System
```javascript
reservedWords = {
    triggers: ['on'],           // Entry points
    conditions: ['if'],         // Decision logic  
    actions: ['do'],           // Operations
    contexts: ['with'],        // Scope/targets
    delays: ['wait'],          // Timing
    flowcontrol: ['rewind']    // Control flow
}

subtypeWords = {
    triggers: ['collision', 'start', 'frame', ...],
    actions: ['goto', 'changeHealth', 'create', ...],
    // etc.
}
```

#### Smart Parsing Process
1. **Tokenize**: Split text on spaces, handle quoted strings
2. **Context Tracking**: Know what type of word should come next
3. **State Machine**: Parse through triggers → conditions → actions → contexts
4. **Auto-completion**: Suggest valid subtypes based on current context

## StampBuilder Vision

### Adapting FlowBuilder for Generative Art

#### Natural Language Stamp DSL
Instead of current Stamp fluent API:
```typescript
stamp.moveTo("BW/2", "BH/2").lineTo("BW", "BH").stroke("#000")
```

We could have natural language style:
```
draw from BW/2, BH/2 to BW, BH with stroke #000
repeat 10 times with BWIDTH from 50 to 200
  if BW < 100 then draw circle at center
  else draw rectangle from 0,0 to BW,BH
```

#### Stamp DSL Token Categories

```javascript
StampBuilder.reservedWords = {
    drawing: ['draw', 'move', 'line', 'curve'],
    shapes: ['circle', 'rectangle', 'path'],  
    positioning: ['from', 'to', 'at', 'center'],
    styling: ['with', 'stroke', 'fill', 'width'],
    control: ['repeat', 'if', 'else', 'while'],
    sequences: ['times', 'from', 'to', 'step']
}

StampBuilder.subtypeWords = {
    drawing: ['moveTo', 'lineTo', 'curveTo', 'closePath'],
    shapes: ['circle', 'rect', 'ellipse', 'polygon'],
    positioning: ['x', 'y', 'center', 'corner', 'edge'],
    styling: ['color', 'width', 'dash', 'cap', 'join'],
    expressions: ['BW', 'BH', 'WW', 'WH', 'BWIDTH', 'BHEIGHT']
}
```

### Architecture Design

#### Core Components
```
StampTokenizer: Parse natural language DSL
├── tokenize(): Split text preserving quotes and expressions
├── parseContext(): Track current parsing state  
├── getValidNext(): Return valid continuations
└── handleExpressions(): Parse "BW/2 + 10" style expressions

StampTranspiler: Convert DSL ↔ Stamp API
├── toStampCode(): Natural DSL → stamp.moveTo().lineTo() calls
├── fromStampCode(): Existing Stamp code → Natural DSL
├── preserveExpressions(): Keep "BW/2" expressions intact
└── handleSequences(): Convert Sequence.fromStatement() calls

StampEditor: Rich text editing interface
├── Monaco Integration: TypeScript-aware editor
├── Syntax Highlighting: Color coding for different token types
├── Auto-completion: Context-aware suggestions
├── Live Validation: Real-time error checking
├── Expression Helpers: Smart editing for "BW < 100" conditions
└── Sequence Integration: Visual editing for repeat statements

StampRenderer: Live execution with debugging
├── Expression Compilation: Cache parsed expressions
├── Source Mapping: Track code → shape relationships
├── Incremental Updates: Re-render only changed parts
├── Interactive Canvas: Click shapes → highlight code
└── Parameter Controls: Auto-generate sliders for sequences
```

### Smart Text Features for Stamp

#### Context-Aware Autocomplete
- After "draw": suggest "from", "circle", "rectangle", "line"
- After "from": suggest expressions like "BW/2", "center", coordinates
- After "with": suggest "stroke", "fill", "width", colors
- After "repeat": suggest numbers, "times", sequence statements

#### Rich Syntax Highlighting
- **Blue**: Drawing operations (`draw`, `move`, `line`)
- **Green**: Expressions (`BW/2`, `BH + 10`)  
- **Purple**: Sequences (`repeat 10 times`, `from 50 to 200`)
- **Orange**: Conditions (`if BW < 100`)
- **Red**: Styling (`stroke #000`, `fill red`)

#### Expression Smart Editing
- Type "BW" → autocomplete with `/`, `+`, `-`, `*`, `<`, `>`, `&`, `|`
- Type "center" → expand to "BW/2, BH/2"
- Validate expressions in real-time
- Show computed values in tooltips

#### Sequence Integration
- Parse `repeat 10 times` into sequence generation
- Convert `from 50 to 200` into `Sequence.fromStatement()`
- Auto-generate parameter sliders
- Show sequence preview values

### Implementation Strategy

#### Phase 1: Basic DSL & Editor
- [ ] Design Stamp natural language syntax
- [ ] Implement basic tokenizer for reserved words
- [ ] Set up Monaco editor with custom language
- [ ] Basic syntax highlighting

#### Phase 2: Smart Editing
- [ ] Context-aware autocomplete engine
- [ ] Expression parsing and validation  
- [ ] Real-time transpilation DSL ↔ Stamp API
- [ ] Live error checking and hints

#### Phase 3: Live Execution
- [ ] Integrate with existing Stamp renderer
- [ ] Source mapping for click-to-debug
- [ ] Incremental updates on text changes
- [ ] Basic parameter extraction

#### Phase 4: Advanced Features
- [ ] Sequence visualization and editing
- [ ] Auto-generated parameter controls
- [ ] Performance optimization
- [ ] Advanced debugging tools

## Key Questions

1. **DSL Design**: Should we create a completely new natural language syntax, or enhance the existing Stamp API with smarter editing?

2. **Migration Path**: How do we handle existing Stamp code? Auto-convert or support both syntaxes?

3. **Expression Handling**: Keep string expressions like "BW/2" or parse into structured format?

4. **Monaco vs Custom**: Use Monaco Editor or build custom contentEditable like FlowBuilder?

## Next Steps
1. **Prototype DSL syntax**: Design the natural language grammar
2. **Build minimal tokenizer**: Start with basic reserved word recognition  
3. **Monaco integration**: Set up custom language support
4. **Simple transpiler**: Convert basic DSL to Stamp API calls 