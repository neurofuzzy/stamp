# Shape Handler Extension System

The Stamp class has been refactored to use an extension-based architecture for shape handlers. This allows for easy addition of new shape types without modifying the core Stamp class.

## Architecture

- **IShapeHandler**: Interface that all shape handlers must implement
- **IShapeContext**: Interface providing access to Stamp's internal methods
- **ShapeHandlerRegistry**: Registry for managing shape handlers
- **Individual Handlers**: Each shape type has its own handler class

## Using the Extension System

### 1. Using Built-in Handlers

The system comes with pre-registered handlers for common shapes:

```typescript
import { Stamp } from './stamp';

const stamp = new Stamp();

// These will use the registered handlers
stamp.circle({ radius: 10 });
stamp.rectangle({ width: 20, height: 10 });
stamp.ellipse({ radiusX: 15, radiusY: 8 });
```

### 2. Creating Custom Shape Handlers

To create a custom shape handler, implement the `IShapeHandler` interface:

```typescript
import { IShapeHandler, IShapeContext } from '../stamp-interfaces';
import { IShape, Ray, Point } from '../../geom/core';
import { MyCustomShape } from './my-custom-shape';

export class MyCustomShapeHandler implements IShapeHandler {
  handle(params: any, context: IShapeContext): void {
    const $ = context.resolveStringOrNumber;
    const shapes: IShape[] = [];
    
    // Extract parameters with defaults
    const nnx = $(params.numX || 1);
    const nny = $(params.numY || 1);
    const nspx = $(params.spacingX || 0);
    const nspy = $(params.spacingY || 0);
    const o = context.getGroupOffset(nnx, nny, nspx, nspy);
    
    // Create shapes in a grid pattern
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const offset = new Point(
          $(params.offsetX || 0),
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const s = new MyCustomShape(
          new Ray(
            nspx * i - o.x + offset.x,
            nspy * j - o.y + offset.y,
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
          ),
          $(params.myParam || 1),
          // ... other shape-specific parameters
        );
        
        if ($(params.skip || 0) > 0) {
          s.hidden = true;
        }
        
        if (params.style) {
          s.style = params.style;
        }
        
        shapes.push(s);
      }
    }
    
    context.make(shapes, $(params.outlineThickness || 0), $(params.scale || 1));
  }
}
```

### 3. Registering Custom Handlers

Register your custom handler with the Stamp instance:

```typescript
import { Stamp } from './stamp';
import { MyCustomShapeHandler } from './my-custom-shape-handler';

const stamp = new Stamp();

// Register the custom handler
stamp.registerShapeHandler('myCustomShape', new MyCustomShapeHandler());

// Now you can use it (you'll need to add the method to Stamp class)
// stamp.myCustomShape({ myParam: 5 });
```

### 4. Using Custom Registries

For advanced use cases, you can create your own registry:

```typescript
import { Stamp } from './stamp';
import { ShapeHandlerRegistry } from './shape-handler-registry';
import { MyCustomShapeHandler } from './my-custom-shape-handler';

// Create a custom registry
const customRegistry = new ShapeHandlerRegistry();
customRegistry.register('myShape', new MyCustomShapeHandler());

// Use it with a Stamp instance
const stamp = new Stamp(undefined, undefined, false, customRegistry);
```

## Available Context Methods

The `IShapeContext` interface provides access to:

- `getGroupOffset(nx, ny, spx, spy)`: Calculate offset for grid layouts
- `make(shapes, outlineThickness, scale)`: Add shapes to the stamp
- `getCursorDirection()`: Get current cursor direction
- `resolveStringOrNumber(value)`: Resolve string expressions to numbers

## Benefits of the Extension System

1. **Modularity**: Each shape type is isolated in its own handler
2. **Extensibility**: Easy to add new shape types without touching core code
3. **Testability**: Individual handlers can be unit tested
4. **Maintainability**: Cleaner, more focused code
5. **Reusability**: Handlers can be shared across different projects

## Migration Guide

If you're migrating from the previous monolithic approach:

1. Extract your shape creation logic into a handler class
2. Implement the `IShapeHandler` interface
3. Register your handler with the registry
4. Update the corresponding private method in Stamp to use the registry

This system maintains backward compatibility while providing a clean path for extension. 