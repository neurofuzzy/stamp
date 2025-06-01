# Generative Art IDE: Complete Software Blueprint

## Executive Summary

A visual programming environment that transforms the neurofuzzy/stamp library into an intuitive, bidirectional design tool. This IDE provides **complete sequence integration**, **bidirectional selection**, and **direct manipulation** while maintaining 100% feature parity with the underlying stamp library.

## Core Architecture Principles

### 1. **Universal Sequence Integration**
```typescript
// EVERY parameter can accept sequences or expressions
interface UniversalParameter {
  type: 'static' | 'sequence' | 'expression';
  staticValue?: any;
  sequenceRef?: string;           // "MYSEQ()" or "MYSEQ"  
  expression?: string;            // "WIDTH() * 0.5 + OFFSET()"
  bindingMode: 'current' | 'next'; // sequence() vs sequence
}

// Examples of universal sequence binding:
circle({ 
  radius: "RADIUS_SEQ()",           // Sequence
  numX: "GRID_SIZE",                // Sequence reference
  offsetX: "BASE() + VARIATION()",  // Expression
  skip: "depth > 3 ? 1 : 0"        // Conditional expression
})
```

### 2. **Bidirectional Selection System**
```typescript
interface SelectionManager {
  // Node → Canvas selection
  selectNode(nodeId: string): void;
  highlightShapes(nodeId: string): ShapeInstance[];
  
  // Canvas → Node selection  
  selectShape(shapeId: string): void;
  highlightNodes(shapeId: string): string[];
  
  // Multi-selection support
  selectMultipleNodes(nodeIds: string[]): void;
  selectMultipleShapes(shapeIds: string[]): void;
  
  // Selection synchronization
  syncSelection(): void;
}
```

### 3. **Direct Manipulation System**
```typescript
interface ManipulationHandle {
  parameter: string;              // Which parameter this controls
  handleType: 'move' | 'resize' | 'rotate' | 'corner' | 'anchor';
  position: Point;                // Handle screen position
  value: number;                  // Current parameter value
  constraint?: 'horizontal' | 'vertical' | 'radial';
  
  onDrag(delta: Point): void;     // Update parameter via dragging
  onCommit(value: number): void;  // Commit change to node
}
```

## System Architecture

### Core Components
```
┌─────────────────────────────────────────────────────────────┐
│                     Application Shell                       │
├─────────────┬─────────────────────────────┬─────────────────┤
│             │                             │                 │
│ Node Graph  │     Infinite Canvas         │   Property      │
│ Editor      │                             │   Inspector     │
│             │   ┌─────────────────────┐   │                 │
│ ┌─────────┐ │   │ Shape Instances     │   │ ┌─────────────┐ │
│ │  Node   │ │   │ + Transform Handles │   │ │ Parameters  │ │
│ │ ┌─────┐ │ │   │ + Selection Overlay │   │ │ + Sequences │ │
│ │ │Shape│ │◄────┤ + Visual Feedback   │───┤ │ + Bindings  │ │
│ │ └─────┘ │ │   │                     │   │ │ + Real-time │ │
│ │  ┌───┐  │ │   └─────────────────────┘   │ └─────────────┘ │
│ │  │Seq│  │ │                             │                 │
│ │  └───┘  │ │   Real-time Rendering       │ Live Parameter  │
│ └─────────┘ │   + Shape Compilation       │ Adjustment      │
│             │   + Handle Rendering        │                 │
└─────────────┴─────────────────────────────┴─────────────────┘
```

## Detailed Component Specifications

### 1. **Universal Parameter System**

#### **Parameter Input Component**
```typescript
interface ParameterInput {
  name: string;
  type: 'number' | 'string' | 'color' | 'boolean' | 'enum';
  
  // Current value state
  mode: 'static' | 'sequence' | 'expression';
  value: any;
  
  // Sequence integration
  availableSequences: SequenceDefinition[];
  sequenceRef?: string;
  bindingMode?: 'current' | 'next';
  
  // Expression support
  expression?: string;
  expressionContext: Record<string, any>; // Available variables
  
  // UI configuration
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  
  // Direct manipulation
  hasHandle?: boolean;
  handleType?: 'move' | 'resize' | 'rotate';
  
  // Callbacks
  onChange: (value: any) => void;
  onModeChange: (mode: string) => void;
  onExpressionChange: (expr: string) => void;
}
```

#### **Parameter Editor UI**
```jsx
<ParameterEditor parameter="radius">
  <ModeSelector>
    <Tab active={mode === 'static'}>Static</Tab>
    <Tab active={mode === 'sequence'}>Sequence</Tab>
    <Tab active={mode === 'expression'}>Expression</Tab>
  </ModeSelector>
  
  {mode === 'static' && (
    <NumberInput value={50} min={0} max={200} />
  )}
  
  {mode === 'sequence' && (
    <SequenceSelector>
      <SequenceDropdown sequences={availableSequences} />
      <BindingToggle>() | (next)</BindingToggle>
      <SequenceEditor onEdit={openSequenceEditor} />
    </SequenceSelector>
  )}
  
  {mode === 'expression' && (
    <ExpressionEditor>
      <CodeEditor 
        value="WIDTH() * 0.5 + OFFSET()"
        autocomplete={expressionContext}
        syntax="javascript"
      />
      <VariableList>{Object.keys(expressionContext)}</VariableList>
    </ExpressionEditor>
  )}
</ParameterEditor>
```

### 2. **Bidirectional Selection System**

#### **Selection State Management**
```typescript
class SelectionManager {
  private nodeSelection = new Set<string>();
  private shapeSelection = new Set<string>();
  private nodeToShapes = new Map<string, string[]>();
  private shapeToNodes = new Map<string, string[]>();
  
  // Build mapping when compilation changes
  updateMappings(compilationResult: CompilationResult) {
    this.nodeToShapes.clear();
    this.shapeToNodes.clear();
    
    for (const result of compilationResult.shapes) {
      const { nodeId, shapeInstances } = result;
      
      // Map node to its generated shapes
      this.nodeToShapes.set(nodeId, shapeInstances.map(s => s.id));
      
      // Map each shape back to its source node
      for (const shape of shapeInstances) {
        this.shapeToNodes.set(shape.id, [nodeId]);
      }
    }
  }
  
  // Node selection triggers shape highlighting
  selectNode(nodeId: string) {
    this.nodeSelection.clear();
    this.nodeSelection.add(nodeId);
    
    // Highlight corresponding shapes
    const shapeIds = this.nodeToShapes.get(nodeId) || [];
    this.highlightShapes(shapeIds);
    
    this.emitSelectionChange();
  }
  
  // Shape selection triggers node highlighting  
  selectShape(shapeId: string) {
    this.shapeSelection.clear();
    this.shapeSelection.add(shapeId);
    
    // Highlight corresponding nodes
    const nodeIds = this.shapeToNodes.get(shapeId) || [];
    this.highlightNodes(nodeIds);
    
    this.emitSelectionChange();
  }
  
  // Multi-selection support
  selectMultipleShapes(shapeIds: string[]) {
    this.shapeSelection = new Set(shapeIds);
    
    // Find all corresponding nodes
    const nodeIds = new Set<string>();
    for (const shapeId of shapeIds) {
      const nodes = this.shapeToNodes.get(shapeId) || [];
      nodes.forEach(id => nodeIds.add(id));
    }
    
    this.highlightNodes(Array.from(nodeIds));
    this.emitSelectionChange();
  }
}
```

#### **Visual Selection Feedback**
```typescript
// Canvas selection overlay
interface SelectionOverlay {
  selectedShapes: ShapeInstance[];
  highlightedShapes: ShapeInstance[];
  
  render() {
    // Selected shapes: solid outline
    for (const shape of this.selectedShapes) {
      this.renderSelectionBorder(shape, { 
        color: '#0066ff', 
        width: 2, 
        style: 'solid' 
      });
    }
    
    // Highlighted shapes: dashed outline  
    for (const shape of this.highlightedShapes) {
      this.renderSelectionBorder(shape, { 
        color: '#00ff88', 
        width: 1, 
        style: 'dashed' 
      });
    }
  }
}

// Node editor selection feedback
interface NodeSelectionState {
  selectedNodes: Set<string>;
  highlightedNodes: Set<string>;
  
  getNodeStyle(nodeId: string): NodeStyle {
    if (this.selectedNodes.has(nodeId)) {
      return { border: '2px solid #0066ff', background: '#0066ff20' };
    }
    if (this.highlightedNodes.has(nodeId)) {
      return { border: '1px dashed #00ff88', background: '#00ff8810' };
    }
    return { border: '1px solid #666', background: '#333' };
  }
}
```

### 3. **Direct Manipulation System**

#### **Transform Handle System**
```typescript
interface TransformHandle {
  id: string;
  type: 'move' | 'resize-corner' | 'resize-edge' | 'rotate' | 'anchor';
  position: Point;
  parameter: string;        // Which parameter this controls
  nodeId: string;          // Source node
  shapeId: string;         // Target shape
  constraint?: 'horizontal' | 'vertical' | 'radial' | 'angular';
  
  // Visual appearance
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'diamond' | 'arrow';
  
  // Interaction
  onDragStart(event: MouseEvent): void;
  onDrag(delta: Point, event: MouseEvent): void;
  onDragEnd(): void;
}

class DirectManipulationManager {
  private handles: TransformHandle[] = [];
  private activeHandle?: TransformHandle;
  
  // Generate handles for selected shapes
  generateHandles(selectedShapes: ShapeInstance[]): TransformHandle[] {
    const handles: TransformHandle[] = [];
    
    for (const shape of selectedShapes) {
      const node = this.getSourceNode(shape.id);
      if (!node) continue;
      
      // Position handles (for moveTo, move, offsetX/Y)
      if (this.hasPositionParameters(node)) {
        handles.push(this.createMoveHandle(shape, node));
      }
      
      // Size handles (for width, height, radius)
      if (this.hasSizeParameters(node)) {
        handles.push(...this.createResizeHandles(shape, node));
      }
      
      // Rotation handle (for angle, rotation)
      if (this.hasRotationParameters(node)) {
        handles.push(this.createRotationHandle(shape, node));
      }
      
      // Custom handles for specific shapes
      handles.push(...this.createCustomHandles(shape, node));
    }
    
    return handles;
  }
  
  // Handle parameter mapping
  private createMoveHandle(shape: ShapeInstance, node: NodeInstance): TransformHandle {
    return {
      id: `${shape.id}-move`,
      type: 'move',
      position: shape.center,
      parameter: 'offsetX,offsetY', // Can control multiple parameters
      nodeId: node.id,
      shapeId: shape.id,
      
      onDrag: (delta: Point) => {
        // Update node parameters directly
        this.updateNodeParameter(node.id, 'offsetX', node.data.offsetX + delta.x);
        this.updateNodeParameter(node.id, 'offsetY', node.data.offsetY + delta.y);
        
        // Trigger real-time recompilation
        this.recompileFromNode(node.id);
      }
    };
  }
  
  private createResizeHandles(shape: ShapeInstance, node: NodeInstance): TransformHandle[] {
    const handles: TransformHandle[] = [];
    
    if (node.type === 'circle') {
      // Radius handle
      handles.push({
        id: `${shape.id}-radius`,
        type: 'resize-edge',
        position: { x: shape.center.x + shape.radius, y: shape.center.y },
        parameter: 'radius',
        constraint: 'radial',
        
        onDrag: (delta: Point) => {
          const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
          const newRadius = Math.max(1, shape.radius + distance);
          this.updateNodeParameter(node.id, 'radius', newRadius);
        }
      });
    }
    
    if (node.type === 'rectangle') {
      // Corner handles for width/height
      const bounds = shape.boundingBox;
      handles.push(
        {
          id: `${shape.id}-corner-se`,
          type: 'resize-corner',
          position: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          parameter: 'width,height',
          
          onDrag: (delta: Point) => {
            this.updateNodeParameter(node.id, 'width', bounds.width + delta.x);
            this.updateNodeParameter(node.id, 'height', bounds.height + delta.y);
          }
        }
        // ... other corner handles
      );
    }
    
    return handles;
  }
}
```

#### **Parameter-Handle Binding System**
```typescript
// Define which parameters can be directly manipulated
const MANIPULABLE_PARAMETERS = {
  // Position
  'offsetX': { handle: 'move', axis: 'x' },
  'offsetY': { handle: 'move', axis: 'y' },
  'x': { handle: 'move', axis: 'x' },
  'y': { handle: 'move', axis: 'y' },
  
  // Size  
  'radius': { handle: 'resize-radial', constraint: 'radial' },
  'width': { handle: 'resize-horizontal', axis: 'x' },
  'height': { handle: 'resize-vertical', axis: 'y' },
  'radiusX': { handle: 'resize-horizontal', axis: 'x' },
  'radiusY': { handle: 'resize-vertical', axis: 'y' },
  
  // Rotation
  'angle': { handle: 'rotate', constraint: 'angular' },
  'rotation': { handle: 'rotate', constraint: 'angular' },
  
  // Shape-specific
  'cornerRadius': { handle: 'corner-radius', constraint: 'radial' },
  'sweepAngle': { handle: 'arc-sweep', constraint: 'angular' },
  'taper': { handle: 'trapezoid-taper', axis: 'x' }
};

// Handle generation based on node parameters
function generateHandlesForNode(node: NodeInstance): TransformHandle[] {
  const handles: TransformHandle[] = [];
  
  for (const [param, config] of Object.entries(MANIPULABLE_PARAMETERS)) {
    if (node.data.hasOwnProperty(param)) {
      const paramValue = node.data[param];
      
      // Only create handles for static values (not sequences/expressions)
      if (typeof paramValue === 'number') {
        handles.push(createHandleForParameter(node, param, config));
      }
    }
  }
  
  return handles;
}
```

### 4. **Real-time Compilation Engine**

#### **Incremental Compilation**
```typescript
class IncrementalCompiler {
  private compilationCache = new Map<string, CompilationResult>();
  private dependencyGraph = new Map<string, Set<string>>();
  
  // Only recompile affected subgraphs
  recompileFromNode(changedNodeId: string): CompilationResult {
    // Find all nodes affected by this change
    const affectedNodes = this.findAffectedNodes(changedNodeId);
    
    // Invalidate cache for affected nodes
    for (const nodeId of affectedNodes) {
      this.compilationCache.delete(nodeId);
    }
    
    // Recompile in dependency order
    const result = this.compileNodes(affectedNodes);
    
    // Update visual representation
    this.updateCanvas(result);
    this.updateHandles(result);
    
    return result;
  }
  
  // Track sequence dependencies
  private buildDependencyGraph(nodes: NodeInstance[]) {
    this.dependencyGraph.clear();
    
    for (const node of nodes) {
      const dependencies = this.extractSequenceDependencies(node);
      this.dependencyGraph.set(node.id, dependencies);
    }
  }
  
  private extractSequenceDependencies(node: NodeInstance): Set<string> {
    const deps = new Set<string>();
    
    // Check all parameters for sequence references
    for (const [key, value] of Object.entries(node.data)) {
      if (typeof value === 'string') {
        // Parse sequence references: "MYSEQ()", "WIDTH() + HEIGHT()"
        const seqRefs = this.parseSequenceReferences(value);
        seqRefs.forEach(ref => deps.add(ref));
      }
    }
    
    return deps;
  }
}
```

### 5. **Enhanced Sequence Integration**

#### **Sequence-Aware Parameter Editor**
```jsx
function ParameterEditor({ parameter, value, onChange }) {
  const [mode, setMode] = useState(getParameterMode(value));
  const availableSequences = useSequences();
  
  return (
    <div className="parameter-editor">
      <ParameterLabel>{parameter}</ParameterLabel>
      
      <ModeToggle>
        <Button 
          active={mode === 'static'} 
          onClick={() => setMode('static')}
        >
          123
        </Button>
        <Button 
          active={mode === 'sequence'} 
          onClick={() => setMode('sequence')}
        >
          f(x)
        </Button>
        <Button 
          active={mode === 'expression'} 
          onClick={() => setMode('expression')}
        >
          {...}
        </Button>
      </ModeToggle>
      
      {mode === 'static' && (
        <NumberInput 
          value={typeof value === 'number' ? value : 0}
          onChange={onChange}
        />
      )}
      
      {mode === 'sequence' && (
        <SequenceBinding>
          <SequenceSelector 
            sequences={availableSequences}
            value={value}
            onChange={onChange}
          />
          <SequenceBindingToggle>
            <Button>current</Button>
            <Button>next()</Button>
          </SequenceBindingToggle>
        </SequenceBinding>
      )}
      
      {mode === 'expression' && (
        <ExpressionEditor
          value={value}
          context={availableSequences}
          onChange={onChange}
        />
      )}
    </div>
  );
}
```

#### **Live Sequence Preview**
```typescript
// Show sequence values in real-time
interface SequencePreview {
  sequence: SequenceInstance;
  currentValue: number;
  valueHistory: number[];
  nextValues: number[];
  
  render() {
    return (
      <div className="sequence-preview">
        <div className="current-value">{this.currentValue}</div>
        <div className="value-timeline">
          {this.valueHistory.map((value, i) => (
            <span key={i} className="history-value">{value}</span>
          ))}
          <span className="current-marker">●</span>
          {this.nextValues.map((value, i) => (
            <span key={i} className="future-value">{value}</span>
          ))}
        </div>
      </div>
    );
  }
}
```

## Technical Implementation Stack

### **Frontend Architecture**
```typescript
// React + TypeScript + Zustand state management
const useAppStore = create<AppState>((set, get) => ({
  // Node graph state
  nodes: [],
  connections: [],
  
  // Canvas state  
  shapes: [],
  selection: new SelectionManager(),
  viewport: { x: 0, y: 0, zoom: 1 },
  
  // Sequence state
  sequences: new Map<string, SequenceInstance>(),
  
  // Compilation state
  compilationResult: null,
  isCompiling: false,
  
  // Actions
  addNode: (node) => set(state => ({ 
    nodes: [...state.nodes, node] 
  })),
  
  updateNodeParameter: (nodeId, param, value) => {
    // Update node data
    const node = get().nodes.find(n => n.id === nodeId);
    if (node) {
      node.data[param] = value;
      
      // Trigger incremental recompilation
      get().recompileFromNode(nodeId);
    }
  },
  
  recompileFromNode: async (nodeId) => {
    const compiler = get().compiler;
    const result = await compiler.recompileFromNode(nodeId);
    set({ compilationResult: result });
  }
}));
```

### **Core Libraries**
- **React Flow**: Node editor foundation
- **Konva.js**: High-performance canvas rendering
- **Zustand**: State management
- **Monaco Editor**: Code editing (sequences/expressions)
- **Framer Motion**: UI animations
- **stamp-core**: Existing stamp/sequence computation engine

### **Performance Optimization**
```typescript
// WebGL-accelerated rendering for complex scenes
class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private shapeBuffers = new Map<string, WebGLBuffer>();
  
  // Batch render thousands of shapes efficiently
  renderShapes(shapes: ShapeInstance[]) {
    // Group by material/style
    const batches = this.groupShapesByMaterial(shapes);
    
    for (const batch of batches) {
      this.renderBatch(batch);
    }
  }
  
  // Update only changed shapes
  updateShape(shapeId: string, newGeometry: Geometry) {
    const buffer = this.shapeBuffers.get(shapeId);
    if (buffer) {
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, newGeometry.vertices);
    }
  }
}

// Worker thread for heavy computation
class CompilationWorker {
  // Run stamp compilation off main thread
  async compileStamp(nodes: NodeInstance[]): Promise<CompilationResult> {
    return new Promise((resolve) => {
      this.worker.postMessage({ type: 'compile', nodes });
      this.worker.onmessage = (e) => {
        if (e.data.type === 'compilation-complete') {
          resolve(e.data.result);
        }
      };
    });
  }
}
```

## Development Roadmap

### **Phase 1: Foundation (4 months)**
**Month 1-2: Core Infrastructure**
- [ ] Node editor with basic shape nodes
- [ ] Infinite canvas with pan/zoom  
- [ ] Basic parameter system (static values only)
- [ ] Simple compilation pipeline
- [ ] Canvas-node selection sync

**Month 3-4: Sequence Integration**
- [ ] Universal parameter sequence binding
- [ ] Basic sequence types (random, repeat, range)
- [ ] Sequence editor UI
- [ ] Expression parser integration

### **Phase 2: Direct Manipulation (3 months)**
**Month 5-6: Transform Handles**
- [ ] Handle generation system
- [ ] Move, resize, rotate handles
- [ ] Real-time parameter updates
- [ ] Handle-parameter binding

**Month 7: Advanced Selection**
- [ ] Multi-selection support  
- [ ] Advanced selection feedback
- [ ] Selection-based handle filtering
- [ ] Context-sensitive tools

### **Phase 3: Professional Features (4 months)**
**Month 8-9: Advanced Sequences**
- [ ] Complete sequence type support
- [ ] Sequence dependency graphs
- [ ] Advanced expression editor
- [ ] Sequence debugging tools

**Month 10-11: Export & Optimization**
- [ ] Multi-format export pipeline
- [ ] Performance optimization
- [ ] WebGL rendering
- [ ] Worker thread compilation

### **Phase 4: Collaboration & Polish (2 months)**
**Month 12-13: Final Polish**
- [ ] Cloud synchronization
- [ ] Template marketplace
- [ ] Performance profiling
- [ ] User testing & refinement

## Success Metrics

### **Technical Performance**
- **Compilation speed**: <100ms for 1000+ node graphs
- **Render performance**: 60fps with 10,000+ shapes visible
- **Memory usage**: <2GB for complex projects
- **Export speed**: <5s for complex SVG generation

### **User Experience**
- **Learning curve**: New users productive within 30 minutes
- **Feature discoverability**: 80% of features findable without documentation
- **Selection accuracy**: <1px precision for handle manipulation
- **Real-time feedback**: <50ms parameter update latency

### **Business Goals**
- **User engagement**: 30+ minute average session length
- **Project completion**: 70% of started projects exported
- **User retention**: 40% monthly active user retention
- **Revenue targets**: $50k MRR by month 18

## Conclusion

This blueprint creates a **truly revolutionary** generative art tool that honors the mathematical sophistication of the stamp library while making it accessible through visual programming. The key innovations are:

1. **Universal sequence integration** - every parameter can be procedural
2. **Bidirectional selection** - seamless node-canvas synchronization  
3. **Direct manipulation** - graphical editing of parametric values
4. **Real-time feedback** - immediate visual results from parameter changes

The result is a tool that scales from simple shape creation to complex generative systems, serving both beginners learning generative art and professionals creating sophisticated parametric designs for fabrication.

By maintaining **100% feature parity** with the stamp library while adding intuitive visual workflows, this IDE becomes the definitive tool for procedural 2D art creation.