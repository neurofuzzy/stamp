# Session 6: Workspace Navigation & 2D Interface Model

## The Core Breakthrough: 2D Navigation Space

Today we evolved from sequence visualization challenges to a comprehensive **spatial workspace model**:

- **Horizontal** = workflow contexts/silos (left ↔ right)
- **Vertical** = construction progression/timeline (up ↔ down)

This creates a **fluid, spatial working environment** where you navigate through both context and time naturally.

## The Navigation Model

### **Horizontal Workflow Silos**
```
[Sequences] ←→ [Code+Canvas] ←→ [Debug/Output]
   Setup         Creative        Analysis
```

- **Left Panel**: Sequence workspace (setup, state, controls)
- **Center**: Code editor + live canvas (creative nucleus) 
- **Right Panel**: Debug workspace (analysis, inspection, export)

### **Vertical Construction Steps**
Within each silo, up-down steps through the process:

**Left Panel (Sequences):**
```
↑ Sequence Definitions     (setup)
│ Current State            (now)  
│ Controls/Adjustments     (tweaks)
↓ Dependencies/References  (relationships)
```

**Center (Code+Canvas):**
```
↑ Code Editor             (input)
│ Live Canvas             (output)
↓ Quick Controls          (actions)
```

**Right Panel (Debug):**
```
↑ Shape Selection         (what)
│ Command Expansion       (how)
│ Execution Timeline      (when)
↓ Export/Output           (result)
```

## Visual Language Design

### **Subtle Iconography for Sequences**
```typescript
RANGLE  🔄  // Blue - REPEAT (cycling)
COLORS  🎲  // Orange - RANDOM (unpredictable)  
SWING   ↕️  // Green - YOYO (back-and-forth)
CARDS   🔀  // Purple - SHUFFLE (mixed up)
ONCE    →   // Gray - ONCE (linear, finite)
```

### **Color Coding System**
- **Brightness** = activity level (dim = static, bright = advancing)
- **Pulse** = just advanced
- **Underlines** in code editor match sequence panel colors
- **Consistent visual language** across all panels

### **State Indicators**
```
🔄 RANGLE    [137.5]     ●●●●○○○  
🎲 COLORS    [#4ecdc4]   ●○●○●○○
```
- Icon shows sequence type
- Current value in brackets
- Dots show position/progress

## Interaction Design

### **Smooth Panel Transitions**
- **Swipe/drag left** → Sequence workspace slides in
- **Swipe/drag right** → Debug workspace slides in
- **Double-tap center** → Hide panels, focus on code+canvas
- **Arrow keys** for precise stepping
- **Scroll wheel** for timeline control

### **Panel States**
```
[Collapsed] ←→ [Focused] ←→ [Expanded]
```
- **Collapsed**: Icons/hints only
- **Focused**: Active working area  
- **Expanded**: Full detail view

### **Context Awareness**
- Panels show relevant info based on cursor position in code
- **Synchronized stepping** - movement in one panel influences others
- **Progressive disclosure** - expand only what you need

## Example Workflow

1. **Start center**: Writing code, seeing live canvas
2. **Swipe left**: Check sequence definitions, adjust parameters
3. **Step down**: See current sequence state, make tweaks
4. **Swipe right**: Analyze generated shapes
5. **Step up**: Select specific shape
6. **Step down**: See its command history and parameter resolution
7. **Swipe center**: Return to code, make adjustments

## Key Advantages

### **Eliminates Context Switching**
- No jarring modal windows or separate tabs
- Everything stays visually connected
- Mental model remains intact throughout workflow

### **Spatial Memory**
- Sequences are "over there" (left)
- Debug info is "over there" (right)  
- Code+canvas is "home" (center)
- Up/down = stepping through construction process

### **Creative Tool Focus**
- Feels like an artist's workspace, not an IDE
- Fluid navigation supports creative flow
- Progressive disclosure prevents cognitive overload

## Connection to Previous Sessions

This builds on **Session 5**'s insight that the Stamp/Sequence architecture is elegant but needs better observability. The 2D navigation model provides:

- **Sequence state visibility** (left panel, vertical progression)
- **Step-through debugging** (right panel, construction timeline)
- **Fluid context access** (horizontal navigation between silos)

The workspace approach addresses **Session 4**'s UI constraints by creating a spatial solution rather than cramming everything into fixed panels.

## Implementation Priorities

### **Phase 1: Core Navigation**
- Horizontal panel sliding (left ↔ center ↔ right)
- Basic sequence state display with iconography
- Shape selection → command list expansion

### **Phase 2: Vertical Timeline**
- Construction step progression within panels
- Synchronized timeline across all panels
- Sequence state scrubbing

### **Phase 3: Advanced Features**
- Panel detaching/repositioning
- Custom workspace layouts
- Animation/transition refinements

---

*Key insight: The 2D navigation model mirrors how generative art actually gets built - spatially organized workflow silos with temporal progression through the construction process.* 