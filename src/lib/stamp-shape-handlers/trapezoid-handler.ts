import { IShape } from '../../geom/core';
import { Trapezoid } from '../../geom/shapes';
import { IShapeContext, ITrapezoidParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating trapezoid shapes
 */
export class TrapezoidHandler extends BaseHandler {
  handle(params: ITrapezoidParams, context: IShapeContext): void {
    super.handle(params, context);

    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new Trapezoid(
        center,
        $(params.width || 1),
        $(params.height || 1),
        $(params.taper || 0),
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