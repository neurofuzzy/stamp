/*
import { IShape, Ray } from '../../geom/core';
import { Stamp } from '../stamp';
import { StampProvider } from '../stamp-provider';
import { IShapeHandler, IShapeContext, IStampParams } from '../stamp-interfaces';
*/
/**
 * Handler for creating stamp shapes
 */
/*
export class StampHandler implements IShapeHandler {
  handle(params: IStampParams, context: IShapeContext): void {
    const $ = context.resolveStringOrNumber;

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

    const shapes: IShape[] = [];
    const nnx = $(params.numX || 1);
    const nny = $(params.numY || 1);
    const nspx = $(params.spacingX || 0);
    const nspy = $(params.spacingY || 0);
    const o = context.getGroupOffset(nnx, nny, nspx, nspy);
    
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const center = new Ray(
          nspx * i - o.x + $(params.offsetX || 0),
          nspy * j - o.y + $(params.offsetY || 0),
          params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
        );
        const s = new Stamp(center, $(params.align || 0)).fromString(
          params.subStampString,
        );
        s.bake();
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