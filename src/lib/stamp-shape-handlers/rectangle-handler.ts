import { IShape} from '../../geom/core';
import { Rectangle } from '../../geom/shapes';
import { IShapeContext, IRectangleParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating rectangle shapes
 */
export class RectangleHandler extends BaseHandler {

  handle(params: IRectangleParams, context: IShapeContext): void {
    super.handle(params, context);

    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new Rectangle(center, $(params.width || 1), $(params.height || 1), $(params.divisions || 4), $(params.align || 0));
      if (params.style) {
        s.style = params.style;
      }
      shapes.push(s);
    }

    distributeHandler.arrangeShapes(shapes, params, context);
    
    context.make(shapes, $(params.outlineThickness || 0), $(params.scale || 1));

  }

} 