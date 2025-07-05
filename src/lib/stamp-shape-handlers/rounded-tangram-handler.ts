import { IShape, Ray, Point } from '../../geom/core';
import { GeomHelpers } from '../../geom/helpers';
import { RoundedTangram } from '../../geom/tangram';
import { IShapeHandler, IShapeContext, ITangramParams } from '../stamp-interfaces';

/**
 * Handler for creating rounded tangram shapes
 */
export class RoundedTangramHandler implements IShapeHandler {
  handle(params: ITangramParams, context: IShapeContext): void {
    const $ = context.resolveStringOrNumber;
    const shapes: IShape[] = [];
    const nnx = $(params.numX || 1);
    const nny = $(params.numY || 1);
    const nspx = $(params.spacingX || 0);
    const nspy = $(params.spacingY || 0);
    const o = context.getGroupOffset(nnx, nny, nspx, nspy);
    
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const s = new RoundedTangram(
          new Ray(
            nspx * i - o.x + $(params.offsetX || 0),
            nspy * j - o.y + $(params.offsetY || 0),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
          ),
          $(params.width || 1),
          $(params.height || 1),
          $(params.type || 0),
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