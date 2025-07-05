import { IShape, Ray, Point } from '../../geom/core';
import { GeomHelpers } from '../../geom/helpers';
import { Arch } from '../../geom/shapes';
import { IShapeHandler, IShapeContext, IArchParams } from '../stamp-interfaces';

/**
 * Handler for creating arch shapes
 */
export class ArchHandler implements IShapeHandler {
  handle(params: IArchParams, context: IShapeContext): void {
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
        
        const cen = new Ray(
          nspx * i - o.x + offset.x,
          nspy * j - o.y + offset.y,
          params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
        );
        
        const s = new Arch(
          cen,
          $(params.width || 1),
          $(params.sweepAngle || 180),
          $(params.divisions || 32),
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