# Advanced Distribution Handlers Integration

## Overview

Successfully integrated advanced distribution algorithms from `utils.ts` into the Stamp generative art environment's two-phase distribution system. The new handlers support the `IDistributeHandler` interface with `getCenters()` and `arrangeShapes()` methods.

## New Distribution Types

### 1. **PhyllotaxisDistributeHandler** (`type: "phyllotaxis"`)
- **Purpose**: Creates fibonacci spiral patterns found in nature
- **Parameters**:
  - `count`: Number of elements (default: 100)
  - `angle`: Golden angle in degrees (default: 137.5)
  - `scaleFactor`: Spiral expansion rate (default: 2)
  - `itemScaleFalloff`: Scale reduction from center (default: 0)
- **Use Cases**: Sunflower seeds, pinecone patterns, galaxy spirals

### 2. **HexagonalDistributeHandler** (`type: "hexagonal"`)
- **Purpose**: Creates honeycomb-like hexagonal grid patterns
- **Parameters**:
  - `columns`: Number of columns (default: 5)
  - `rows`: Number of rows (default: 5)
  - `spacing`: Distance between centers (default: 50)
  - `itemScaleFalloff`: Scale reduction from center (default: 0)
- **Use Cases**: Honeycomb patterns, molecular structures, tiled surfaces

### 3. **TriangularDistributeHandler** (`type: "triangular"`)
- **Purpose**: Creates triangular grid patterns with offset rows
- **Parameters**:
  - `columns`: Number of columns (default: 5)
  - `rows`: Number of rows (default: 5)
  - `spacing`: Distance between centers (default: 50)
  - `itemScaleFalloff`: Scale reduction from center (default: 0)
- **Use Cases**: Crystal structures, architectural patterns

### 4. **AttractorDistributeHandler** (`type: "attractor"`)
- **Purpose**: Physics-based particle simulation with gravity and collision
- **Parameters**:
  - `particleCount`: Number of particles (default: 50)
  - `initialRadius`: Starting distribution radius (default: 200)
  - `hexSpacing`: Initial hexagonal spacing (default: 40)
  - `strength`: Gravitational force strength (default: 5)
  - `damping`: Velocity damping factor (default: 0.95)
  - `simulationSteps`: Physics simulation iterations (default: 100)
- **Features**: 
  - Collision detection and resolution
  - Gravitational attraction to center
  - Variable particle sizes based on physics
- **Use Cases**: Organic clustering, bubble arrangements, particle systems

### 5. **PoincareDistributeHandler** (`type: "poincare"`)
- **Purpose**: Hyperbolic disc distribution with configurable density bias
- **Parameters**:
  - `count`: Number of elements (default: 80)
  - `radius`: Disc radius (default: 150)
  - `density`: Distribution bias - 0.5=uniform, <0.5=center bias, >0.5=edge bias (default: 0.5)
  - `itemScaleFalloff`: Scale reduction from center (default: 0)
- **Use Cases**: Hyperbolic geometry, non-euclidean patterns

### 6. **PoissonDiskDistributeHandler** (`type: "poisson-disk"`)
- **Purpose**: Organic scattered distribution with minimum distance constraints
- **Parameters**:
  - `width`: Distribution area width (default: 400)
  - `height`: Distribution area height (default: 400)
  - `minDistance`: Minimum distance between points (default: 30)
  - `maxPoints`: Maximum number of points (default: 100)
  - `seed`: Random seed for reproducibility (default: 1234)
- **Features**: Ensures no two points are closer than `minDistance`
- **Use Cases**: Realistic scattering, forest distributions, organic textures

## Implementation Details

### Two-Phase Architecture
1. **`getCenters()`**: Generates initial positions where shapes will be placed
2. **`arrangeShapes()`**: Positions and scales actual shapes with access to their geometry

### Key Features
- **Item Scale Falloff**: All handlers support scaling shapes based on distance from center
- **Offset Support**: Integration with existing offset and rotation parameters
- **Type Safety**: Full TypeScript interface definitions
- **Physics Integration**: Attractor handler includes collision detection and particle dynamics
- **Deterministic**: Seed-based randomization for reproducible results

### Factory Integration
The new handlers are integrated into the existing `distributeHandlerFromParams()` factory function:

```typescript
const handler = distributeHandlerFromParams({
  type: "phyllotaxis",
  count: 50,
  angle: 137.5,
  scaleFactor: 2,
  itemScaleFalloff: 0.3
});
```

## Files Modified/Created

### New Files
- `src/lib/distribute/distribute-advanced.ts` - All new distribution handlers
- `examples/test-distribution-simple.js` - Verification test

### Modified Files
- `src/lib/distribute/distribute-interfaces.d.ts` - Added new interface definitions
- `src/lib/distribute/index.ts` - Added exports and factory integration
- `src/lib/distribute/nodeProcessor.ts` - Updated to support new types (unused legacy code)

## Usage Examples

```typescript
// Fibonacci spiral
const phyllotaxis = new PhyllotaxisDistributeHandler({
  type: "phyllotaxis",
  count: 100,
  angle: 137.5,
  scaleFactor: 3,
  itemScaleFalloff: 0.5
});

// Physics simulation
const attractor = new AttractorDistributeHandler({
  type: "attractor",
  particleCount: 60,
  initialRadius: 150,
  strength: 8,
  simulationSteps: 200
});

// Organic scattering
const poisson = new PoissonDiskDistributeHandler({
  type: "poisson-disk",
  width: 500,
  height: 500,
  minDistance: 25,
  seed: 12345
});
```

## Benefits

1. **Rich Pattern Variety**: Six distinct distribution algorithms for diverse creative applications
2. **Physics Integration**: Real collision detection and particle dynamics
3. **Natural Patterns**: Algorithms based on natural phenomena (phyllotaxis, hexagonal packing)
4. **Performance**: Optimized with iteration limits and performance monitoring
5. **Extensibility**: Clean interface makes adding new distribution types straightforward
6. **Integration**: Seamless integration with existing stamp shape handlers

## Testing

Successfully tested all distribution algorithms:
- ✅ All patterns generate expected point distributions
- ✅ Parameters produce expected variations
- ✅ Integration with two-phase distribution system working
- ✅ TypeScript compilation successful
- ✅ No breaking changes to existing functionality

The integration provides powerful new tools for creating complex, natural-looking distributions while maintaining the simplicity and elegance of the Stamp generative art philosophy. 