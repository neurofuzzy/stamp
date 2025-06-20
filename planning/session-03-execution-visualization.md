# Session 3: Execution Visualization & Step-Through Debugging

## The Expansion Concept

### Source Code (Parametric)
```
sequence 1,2,3 AS R
stamp.circle("R()").move(10,0).repeatLast(2,3)
```

### Expanded Instructions (Resolved)
```
CIRCLE 1 
MOVE 10,0
CIRCLE 2 
MOVE 10,0 
CIRCLE 3
MOVE 10,0
```

### Step-Through Execution
User clicks through each instruction and watches the canvas build up incrementally:
- Step 1: Circle appears at radius 1
- Step 2: Cursor moves right 10 pixels  
- Step 3: Circle appears at radius 2
- Step 4: Cursor moves right 10 pixels
- Step 5: Circle appears at radius 3
- Step 6: Cursor moves right 10 pixels

## Why This Is Revolutionary

### For Learning
- **Demystifies Generative Art**: See exactly how complex patterns emerge from simple rules
- **Sequence Understanding**: Watch how `1,2,3 AS R` flows through multiple operations
- **Parameter Flow Visualization**: See how `R()` gets replaced with actual values
- **Debugging Aid**: Find exactly where things go wrong in complex patterns

### For Creative Process
- **Fine-tune Timing**: Adjust sequences by seeing their actual effect
- **Understand Emergent Patterns**: See why certain parameter combinations create interesting effects
- **Educational Tool**: Perfect for teaching generative art concepts
- **Performance Analysis**: See which operations are expensive

## Architecture for Expansion System

### Core Components

#### Instruction Expander
```typescript
class InstructionExpander {
    expand(stampCode: string): ExpandedInstruction[] {
        // 1. Parse sequences (e.g., "1,2,3 AS R") 
        // 2. Resolve all sequence calls (e.g., "R()")
        // 3. Expand loops (e.g., "repeatLast(2,3)")
        // 4. Generate flat list of drawing commands
    }
}

interface ExpandedInstruction {
    id: string;
    type: 'MOVE' | 'CIRCLE' | 'LINE' | 'STROKE' | etc.;
    parameters: { [key: string]: any };
    sourceLocation: { line: number, char: number };
    sequenceContext?: { name: string, value: any, iteration: number };
}
```

#### Step-Through Executor
```typescript
class StepThroughExecutor {
    instructions: ExpandedInstruction[];
    currentStep: number = 0;
    
    executeStep(): void {
        // Execute one instruction and update canvas
    }
    
    executeToStep(stepIndex: number): void {
        // Execute all instructions up to specified step
    }
    
    playback(speed: number): void {
        // Auto-advance through steps at specified speed
    }
}
```

#### Visualization Interface
```typescript
interface StepThroughUI {
    instructionList: InstructionListPanel;    // Show all expanded instructions
    executionControls: PlaybackControls;     // Play/pause/step/speed controls
    sourceHighlighter: SourceCodeHighlighter; // Highlight current source location
    canvasRenderer: IncrementalCanvas;       // Show progressive drawing
    sequenceTracker: SequenceValueTracker;   // Show current sequence values
}
```

## UI Design Concept

### Layout
```
┌─────────────────┬──────────────────────┬─────────────────┐
│                 │                      │                 │
│   Source Code   │    Live Canvas       │  Expanded       │
│   Editor        │    (Progressive)     │  Instructions   │
│                 │                      │                 │
│                 │                      │  ► CIRCLE 1     │
│ sequence 1,2,3  │     ○               │    MOVE 10,0    │
│ AS R            │                      │  ► CIRCLE 2     │
│                 │                      │    MOVE 10,0    │
│ stamp.circle(   │          ○          │  ► CIRCLE 3     │
│   "R()"         │                      │    MOVE 10,0    │
│ ).move(10,0)    │                ○    │                 │
│ .repeatLast(2,3)│                      │                 │
│                 │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
┌─────────────────────────────────────────────────────────┐
│  ⏮ ⏪ ⏸ ▶️ ⏩ ⏭   Speed: ━━●━━━━━   Step: 3/6           │
└─────────────────────────────────────────────────────────┘
```

### Key Features

#### Expanded Instructions Panel
- **Flat list** of all drawing commands after expansion
- **Current step highlighted** with visual indicator
- **Source mapping**: Click instruction → highlight source code
- **Sequence context**: Show which sequence value generated each instruction
- **Grouping**: Collapse/expand groups from same source line

#### Playback Controls
- **Step forward/backward**: Manual stepping through instructions
- **Play/pause**: Auto-advance at configurable speed
- **Jump to step**: Click instruction to jump to that point
- **Speed control**: From slow-motion to rapid preview
- **Reset**: Jump back to beginning

#### Source Code Integration
- **Live highlighting**: Current instruction's source location highlighted
- **Click to jump**: Click source code to jump to corresponding instructions
- **Sequence value display**: Show current values of R, BWIDTH, etc. in margins

#### Progressive Canvas
- **Incremental drawing**: Each step adds to the canvas
- **Ghost preview**: Optionally show faded preview of final result
- **Zoom/pan**: Navigate around large drawings
- **Clear on reset**: Start fresh when jumping to beginning

## Advanced Features

### Conditional Expansion
```
if BW < 100 then circle else rectangle
repeat 5 times with BWIDTH from 50 to 150
```

Expands to show which branch was taken at each iteration:
```
BWIDTH=50:  IF 50<100 → TRUE  → CIRCLE
BWIDTH=75:  IF 75<100 → TRUE  → CIRCLE  
BWIDTH=100: IF 100<100 → FALSE → RECTANGLE
BWIDTH=125: IF 125<100 → FALSE → RECTANGLE
BWIDTH=150: IF 150<100 → FALSE → RECTANGLE
```

### Nested Sequence Tracking
```
sequence 1,2,3 AS R
sequence red,blue,green AS COLOR  
repeat 3 times
  circle R() with fill COLOR()
```

Show how both sequences advance together:
```
R=1, COLOR=red    → CIRCLE 1 FILL red
R=2, COLOR=blue   → CIRCLE 2 FILL blue  
R=3, COLOR=green  → CIRCLE 3 FILL green
```

### Performance Visualization
- **Timing info**: Show how long each instruction takes
- **Memory usage**: Track canvas state size
- **Bottleneck detection**: Highlight slow operations

## Implementation Plan

### Phase 1: Basic Expansion
- [ ] Parse simple sequences (`1,2,3 AS R`)
- [ ] Expand basic operations (`circle("R()")`)
- [ ] Generate flat instruction list
- [ ] Basic step-through execution

### Phase 2: UI Integration  
- [ ] Instruction list panel
- [ ] Playback controls
- [ ] Progressive canvas rendering
- [ ] Source code highlighting

### Phase 3: Advanced Features
- [ ] Conditional expansion
- [ ] Nested sequence tracking
- [ ] Performance visualization
- [ ] Export expanded instructions

### Phase 4: Polish
- [ ] Speed optimization
- [ ] Better UI/UX
- [ ] Educational features
- [ ] Integration with sequence editor

## Revolutionary Impact

This would make StampBuilder not just a better editor, but a **completely new way to understand generative art**. Users could:

1. **Learn by watching**: See exactly how their code creates patterns
2. **Debug visually**: Find problems by seeing where drawing goes wrong  
3. **Optimize performance**: Identify bottlenecks in complex patterns
4. **Create educational content**: Perfect for tutorials and workshops
5. **Experiment confidently**: Understand the effect of parameter changes

This is like having a **time-travel debugger for generative art**!

## Bidirectional Debugging: Click-to-Source

### The Magic Moment
User clicks on **any shape** in the rendered canvas → instantly:
- **Highlights the exact instruction** in the expanded list that created it
- **Jumps to the source code line** that generated that instruction  
- **Shows the sequence context** (which values of R, BWIDTH, etc. were active)
- **Displays the execution state** at that moment

### Shape Metadata System
Each rendered shape gets tagged with rich debugging metadata:

```typescript
interface ShapeMetadata {
    instructionId: string;           // Links to ExpandedInstruction
    sourceLocation: CodeLocation;    // Original source code position
    sequenceContext: {               // Active sequence values
        R: 5,
        COLOR: "blue", 
        BWIDTH: 75,
        iteration: 3
    };
    executionStep: number;           // Step number in expanded instructions
    timestamp: number;               // When it was drawn
    canvasState: CanvasState;        // Transform matrix, style state, etc.
}
```

### Interactive Canvas Implementation
```typescript
class InteractiveDebugCanvas {
    shapes: Map<string, { shape: CanvasShape, metadata: ShapeMetadata }>;
    
    onClick(x: number, y: number): void {
        const clickedShape = this.hitTest(x, y);
        if (clickedShape) {
            // Jump to instruction in expanded list
            instructionPanel.highlightInstruction(clickedShape.metadata.instructionId);
            
            // Highlight source code
            codeEditor.highlightLine(clickedShape.metadata.sourceLocation);
            
            // Show context panel
            contextPanel.show(clickedShape.metadata.sequenceContext);
            
            // Jump step-through to that moment
            executor.jumpToStep(clickedShape.metadata.executionStep);
        }
    }
    
    hitTest(x: number, y: number): ShapeMetadata | null {
        // Precise hit testing for circles, rectangles, paths, etc.
    }
}
```

### Enhanced UI with Click-to-Source

#### Updated Layout
```
┌─────────────────┬──────────────────────┬─────────────────┐
│                 │   🎯 CLICK ANY       │                 │
│   Source Code   │      SHAPE!          │  Expanded       │
│   Editor        │    (Interactive)     │  Instructions   │
│                 │                      │                 │
│ sequence 1,2,3  │     ○ ← clicked!     │  ► CIRCLE 1     │
│ AS R         👈 │                      │    MOVE 10,0    │
│ 👈 HIGHLIGHTED  │          ○           │ 🔸 CIRCLE 2     │
│                 │                      │    MOVE 10,0    │
│ stamp.circle(   │                ○     │    CIRCLE 3     │
│   "R()"         │                      │    MOVE 10,0    │
│ ).move(10,0)    │                      │                 │
│                 │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
┌─────────────────────────────────────────────────────────┐
│ 🔍 Clicked Shape: CIRCLE at step 3 | R=2, iteration=2   │
│  ⏮ ⏪ ⏸ ▶️ ⏩ ⏭   Speed: ━━●━━━━━   Step: 3/6           │
└─────────────────────────────────────────────────────────┘
```

#### Context Information Panel
When user clicks a shape, show detailed context:
```
┌─────────────────────────────────────┐
│ 🔍 Shape Debug Info                 │
├─────────────────────────────────────┤
│ Type: CIRCLE                        │
│ Generated by: line 3, stamp.circle  │
│ Step: 3 of 6                        │
│ Sequence Context:                   │
│   R = 2 (iteration 2 of 3)         │
│   BWIDTH = 75                       │
│   BHEIGHT = 50                      │
│ Canvas State:                       │
│   Position: (10, 0)                 │
│   Transform: translate(20,0)        │
│   Style: fill=blue, stroke=none     │
└─────────────────────────────────────┘
```

### Advanced Click-to-Source Features

#### Visual Connection Lines
When user clicks a shape, draw **visual connection lines** showing:
- **Sequence flow**: How this shape relates to others from same sequence
- **Transformation chain**: Previous moves/rotates that affected position
- **Style inheritance**: Where fill/stroke styles came from

#### Multi-shape Selection
- **Shift+click**: Select multiple shapes to compare their contexts
- **Ctrl+click**: Select all shapes from same source line
- **Alt+click**: Select all shapes from same sequence iteration

#### Time Travel Debugging
- Click shape → "Rewind to here" button appears
- Canvas clears and redraws up to that exact moment
- Show the "delta" - what changed from previous step

### Implementation Considerations

#### Performance
- **Efficient hit testing**: Spatial indexing for fast shape lookup
- **Lazy metadata**: Only compute expensive metadata when clicked
- **Canvas optimization**: Use OffscreenCanvas for hit testing

#### Memory Management  
- **Bounded history**: Limit number of steps stored in memory
- **Compression**: Store deltas instead of full canvas states
- **Cleanup**: Remove metadata for shapes that get cleared

#### Complex Shapes
- **Path segments**: Each bezier curve segment gets its own metadata
- **Composite shapes**: Handle shapes built from multiple primitives
- **Clipped regions**: Deal with shapes partially outside viewport

### Educational Impact

This click-to-source feature transforms generative art education:

1. **"How was this made?"** - Click any part of a complex pattern and see exactly how
2. **Pattern analysis** - Click multiple elements to understand parameter relationships  
3. **Debugging workflows** - "This circle is wrong" → click → see R=7 instead of expected R=5
4. **Reverse engineering** - Study others' work by clicking through their patterns

### Real-World Debugging Scenarios

#### Scenario 1: Misaligned Pattern
```
Problem: "My spiral is off-center"
Solution: 
1. Click the misaligned shapes
2. See they were drawn with incorrect center calculation
3. Trace back to source: "BW/2 + offset" 
4. Realize offset should be negative
```

#### Scenario 2: Wrong Colors
```
Problem: "Some circles are the wrong color"  
Solution:
1. Click a wrong-colored circle
2. See it was drawn when COLOR="red" but should be "blue"
3. Trace back to sequence definition
4. Find off-by-one error in color sequence
```

#### Scenario 3: Performance Bottleneck
```
Problem: "Drawing is too slow"
Solution:
1. Click shapes that render slowly (timing visualization)
2. See they're using expensive gradient fills
3. Trace back to conditional: "if R > 50 then complexGradient else simpleColor"
4. Optimize the gradient computation
```

This is like having **Chrome DevTools for generative art** - you can inspect any element and see exactly how it was created! 