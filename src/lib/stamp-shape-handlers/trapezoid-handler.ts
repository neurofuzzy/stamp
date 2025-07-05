import { IShape, Ray, Point } from '../../geom/core';
import { GeomHelpers } from '../../geom/helpers';
import { Trapezoid } from '../../geom/shapes';
import { IShapeHandler, IShapeContext, ITrapezoidParams } from '../stamp-interfaces';

/**
 * Handler for creating trapezoid shapes
 */
export class TrapezoidHandler implements IShapeHandler {
  handle(params: ITrapezoidParams, context: IShapeContext): void {
    const $ = context.resolveStringOrNumber;
    const shapes: IShape[] = [];
    const nnx = $(params.numX || 1);
    const nny = $(params.numY || 1);
    const nspx = $(params.spacingX || 0);
    const nspy = $(params.spacingY || 0);
    const o = context.getGroupOffset(nnx, nny, nspx, nspy);
    
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const offset = new Point(
          $(params.offsetX || 0),
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const s = new Trapezoid(
          new Ray(
            nspx * i - o.x + offset.x,
            nspy * j - o.y + offset.y,
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
          ),
          $(params.width || 1),
          $(params.height || 1),
          $(params.taper || 0),
          $(params.divisions || 4),
          $(params.align || 0),
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