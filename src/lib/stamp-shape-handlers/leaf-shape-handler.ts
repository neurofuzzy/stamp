/*
import { IShape, Ray, Point } from '../../geom/core';
import { GeomHelpers } from '../../geom/helpers';
import { LeafShape } from '../../geom/shapes';
import { IShapeHandler, IShapeContext, ILeafShapeParams } from '../stamp-interfaces';
*/
/**
 * Handler for creating leaf shapes
 */
/*
export class LeafShapeHandler implements IShapeHandler {
  handle(params: ILeafShapeParams, context: IShapeContext): void {
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
          0 - $(params.offsetX || 0),
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const s = new LeafShape(
          new Ray(
            nspx * i - o.x + offset.x,
            nspy * j - o.y + offset.y,
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
          ),
          $(params.radius || 1),
          $(params.divisions || 32),
          $(params.splitAngle || 60),
          $(params.splitAngle2 || params.splitAngle || 60),
          $(params.serration || 0),
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
*/
import { IShape } from '../../geom/core';
import { LeafShape } from '../../geom/shapes';
import { IShapeContext, ILeafShapeParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { BaseHandler } from './base-handler';

/**
 * Handler for creating leaf shapes
 */
export class LeafShapeHandler extends BaseHandler {
  handle(params: ILeafShapeParams, context: IShapeContext): void {
    const $ = context.resolveStringOrNumber;
    super.handle(params, context);

    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new LeafShape(
        center,
        $(params.radius || 1),
        $(params.divisions || 32),
        $(params.splitAngle || 60),
        $(params.splitAngle2 || params.splitAngle || 60),
        $(params.serration || 0),
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