import { IShape } from '../../geom/core';
import { Circle } from '../../geom/shapes';
import { Donut } from '../../geom/compoundshapes';
import { IShapeContext, ICircleParams } from '../stamp-interfaces';
import { distributeHandlerFromParams } from '../distribute';
import { resolveStringOrNumber } from '../stamp-helpers';
import { BaseHandler } from './base-handler';

const $ = resolveStringOrNumber;

/**
 * Handler for creating circle shapes
 */
export class CircleHandler extends BaseHandler {
  handle(params: ICircleParams, context: IShapeContext): void {
    super.handle(params, context);

    const distributeHandler = distributeHandlerFromParams(params.distribute!);
    const centers = distributeHandler.getCenters();
    const shapes: IShape[] = [];

    for (let i = 0; i < centers.length; i++) {
      const center = centers[i];
      let s: IShape;
      const innerRadius = params.innerRadius ? $(params.innerRadius) : 0;
      
      if (!innerRadius) {
        s = new Circle(
          center,
          $(params.radius || 1),
          $(params.divisions || 32),
          $(params.align || 0),
        );
      } else {
        s = new Donut(
          center,
          $(params.radius || 1),
          innerRadius,
          $(params.divisions || 32),
          $(params.align || 0),
        );
      }
      
      if (params.style) {
        s.style = { ...params.style };
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