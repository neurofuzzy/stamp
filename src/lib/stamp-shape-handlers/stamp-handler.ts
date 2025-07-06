import { IShape } from '../../geom/core';
import { Stamp } from '../stamp';
import { StampProvider } from '../stamp-provider';
import { IShapeContext, IStampParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating stamp shapes
 */
export class StampHandler extends BaseHandler {
  handle(params: IStampParams, context: IShapeContext): void {
    super.handle(params, context);

    if (params.providerIndex !== undefined) {
      const stamp = StampProvider.getInstance(
        params.providerIndex,
      ).nextStamp();
      if (stamp) {
        params.subStampString = stamp.toString();
      }
    }

    if (!params.subStampString) {
      return;
    }

    const distributeHandler = distributeHandlerFromParams(params.distribute);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      const s = new Stamp(center, $(params.align || 0)).fromString(
        params.subStampString,
      );
      s.bake();

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