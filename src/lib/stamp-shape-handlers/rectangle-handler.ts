import { IShape, Ray, Point } from '../../geom/core';
import { GeomHelpers } from '../../geom/helpers';
import { Rectangle } from '../../geom/shapes';
import { IShapeHandler, IShapeContext, IRectangleParams } from '../stamp-interfaces';
import { layoutHandlerFromParams } from '../layout';

/**
 * Handler for creating rectangle shapes
 */
export class RectangleHandler implements IShapeHandler {

  handle(params: IRectangleParams, context: IShapeContext): void {

    // backwards compatibility
    if (!params.layout) {
      params.layout = {
        type: "grid",
        columns: params.numX || 1,
        rows: params.numY || 1,
        columnSpacing: params.spacingX || 0,
        rowSpacing: params.spacingY || 0,
        columnPadding: 0,
        rowPadding: 0,
        offsetAlternateRows: false,
      };
    }

    const $ = context.resolveStringOrNumber;
    const layoutHandler = layoutHandlerFromParams(params.layout);
    const centers = layoutHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new Rectangle(center, $(params.width || 1), $(params.height || 1), $(params.divisions || 4), $(params.align || 0));
      if ($(params.skip || 0) > 0) {
        s.hidden = true;
      }
      if (params.style) {
        s.style = params.style;
      }
      shapes.push(s);
    }

    layoutHandler.arrangeShapes(shapes, params, context);
    
    context.make(shapes, $(params.outlineThickness || 0), $(params.scale || 1));

  }

} 