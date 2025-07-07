import { IShape } from '../../geom/core';
import { RoundedTangram } from '../../geom/tangram';
import { IShapeContext, ITangramParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating rounded tangram shapes
 */
export class RoundedTangramHandler extends BaseHandler {
  handle(params: ITangramParams, context: IShapeContext): void {
    super.handle(params, context);

    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new RoundedTangram(
        center,
        $(params.width || 1),
        $(params.height || 1),
        $(params.type || 0),
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