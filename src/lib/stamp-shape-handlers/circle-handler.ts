import { IShape, Ray, Point } from '../../geom/core';
import { GeomHelpers } from '../../geom/helpers';
import { Circle } from '../../geom/shapes';
import { Donut } from '../../geom/compoundshapes';
import { IShapeHandler, IShapeContext, ICircleParams } from '../stamp-interfaces';

/**
 * Handler for creating circle shapes
 */
export class CircleHandler implements IShapeHandler {
  handle(params: ICircleParams, context: IShapeContext): void {
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
        
        let s: IShape;
        const innerRadius = params.innerRadius ? $(params.innerRadius) : 0;
        const cen = new Ray(
          nspx * i - o.x + offset.x,
          nspy * j - o.y + offset.y,
          params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
        );
        
        if (!innerRadius) {
          s = new Circle(
            cen,
            $(params.radius || 1),
            $(params.divisions || 32),
            $(params.align || 0),
          );
        } else {
          s = new Donut(
            cen,
            $(params.radius || 1),
            innerRadius,
            $(params.divisions || 32),
            $(params.align || 0),
          );
        }
        
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