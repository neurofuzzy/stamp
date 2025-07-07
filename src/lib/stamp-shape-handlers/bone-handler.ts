import { IShape } from '../../geom/core';
import { Bone } from '../../geom/shapes';
import { IShapeContext, IBoneParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating bone shapes
 */
export class BoneHandler extends BaseHandler {
  handle(params: IBoneParams, context: IShapeContext): void {
    super.handle(params, context);

    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new Bone(
        center,
        $(params.length || 1),
        $(params.bottomRadius || 0.5),
        $(params.topRadius || 0.5),
        $(params.divisions || 32),
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