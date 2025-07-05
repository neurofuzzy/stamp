import { ShapeHandlerRegistry } from '../shape-handler-registry';
import { CircleHandler } from './circle-handler';
import { RectangleHandler } from './rectangle-handler';
import { EllipseHandler } from './ellipse-handler';
import { ArchHandler } from './arch-handler';
import { LeafShapeHandler } from './leaf-shape-handler';
import { TrapezoidHandler } from './trapezoid-handler';
import { RoundedRectangleHandler } from './rounded-rectangle-handler';
import { PolygonHandler } from './polygon-handler';
import { TangramHandler } from './tangram-handler';
import { RoundedTangramHandler } from './rounded-tangram-handler';
import { BoneHandler } from './bone-handler';

// Export all handlers
export { CircleHandler } from './circle-handler';
export { RectangleHandler } from './rectangle-handler';
export { EllipseHandler } from './ellipse-handler';
export { ArchHandler } from './arch-handler';
export { LeafShapeHandler } from './leaf-shape-handler';
export { TrapezoidHandler } from './trapezoid-handler';
export { RoundedRectangleHandler } from './rounded-rectangle-handler';
export { PolygonHandler } from './polygon-handler';
export { TangramHandler } from './tangram-handler';
export { RoundedTangramHandler } from './rounded-tangram-handler';
export { BoneHandler } from './bone-handler';

// Create and export default registry
export const defaultShapeRegistry = new ShapeHandlerRegistry();

// Register default handlers
defaultShapeRegistry.register('circle', new CircleHandler());
defaultShapeRegistry.register('rectangle', new RectangleHandler());
defaultShapeRegistry.register('ellipse', new EllipseHandler());
defaultShapeRegistry.register('arch', new ArchHandler());
defaultShapeRegistry.register('leafShape', new LeafShapeHandler());
defaultShapeRegistry.register('trapezoid', new TrapezoidHandler());
defaultShapeRegistry.register('roundedRectangle', new RoundedRectangleHandler());
defaultShapeRegistry.register('polygon', new PolygonHandler());
defaultShapeRegistry.register('tangram', new TangramHandler());
defaultShapeRegistry.register('roundedTangram', new RoundedTangramHandler());
defaultShapeRegistry.register('bone', new BoneHandler());

// Export registry class for custom registries
export { ShapeHandlerRegistry } from '../shape-handler-registry'; 