import { IShape} from '../../geom/core';
import { Arch } from '../../geom/shapes';
import { IShapeContext, IArchParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating arch shapes
 */
export class ArchHandler extends BaseHandler {

  handle(params: IArchParams, context: IShapeContext): void {
    super.handle(params, context);

    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new Arch(
        center,
        $(params.width || 1),
        $(params.sweepAngle || 180),
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