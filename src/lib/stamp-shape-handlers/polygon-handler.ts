import { IShape, Ray } from '../../geom/core';
import { Polygon } from '../../geom/shapes';
import { IShapeContext, IPolygonParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating polygon shapes
 */
export class PolygonHandler extends BaseHandler {
  handle(params: IPolygonParams, context: IShapeContext): void {
    if (!params.rayStrings?.length) {
      return;
    }
    super.handle(params, context);
    
    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new Polygon(
        center,
        params.rayStrings.map((s) => new Ray(0, 0).fromString(s)),
        $(params.divisions || 4),
        $(params.align || 0),
      );
      
      if (params.style) {
        s.style = params.style;
      }
      
      shapes.push(s);
    }
    
    distributeHandler.arrangeShapes(shapes, params, context);

    context.make(
      shapes, 
      $(params.outlineThickness || 0), 
      $(params.scale || 1)
    );
  }
} 