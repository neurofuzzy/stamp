import * as arbit from "arbit";
import { BoundingBox, Ray } from "../../geom/core";
import { AbstractShape } from "../../geom/shapes";
import { IShape } from "../../geom/core";
import { GeomHelpers } from "../../geom/helpers";
import { resolveStringOrNumber } from "../stamp-helpers";

import { IShapeLayoutParams, IGridShapeLayoutParams, IScatterShapeLayoutParams } from "./layout-interfaces";

const $ = resolveStringOrNumber;


class AbstractShapeLayout extends AbstractShape {
  params: IShapeLayoutParams;
  constructor(center: Ray, params: IShapeLayoutParams) {
    super(center);
    this.params = params;
  }
  generate(): Ray[] {
    return [];
  }
}

export class GridShapeLayout extends AbstractShapeLayout {
  
  constructor(center: Ray, params: IGridShapeLayoutParams) {
    super(center, params);
  }

  children(): IShape[] {
    const c: IShape[] = [];
    const params = this.params as IGridShapeLayoutParams;
    const w = $(params.columnSpacing) * ($(params.columns) - 1);
    const h = ($(params.rowSpacing || params.columnSpacing) * ($(params.rows) - 1));
    const bb = new BoundingBox(
      0, 
      0, 
      $(params.columnSpacing) - ($(params.columnPadding) || 0), 
      ($(params.rowSpacing || params.columnSpacing) - ($(params.rowPadding) || $(params.columnPadding) || 0))
    );
    const nnx = $(params.columns) || 1;
    const nny = $(params.rows) || 1;
    const nspx = $(params.columnSpacing) || 0;
    const nspy = $(params.rowSpacing || params.columnSpacing) || 0;

    for (let j = 0; j < nnx; j++) {
      for (let i = 0; i < nny; i++) {
        const x = nspx * i;
        const y = nspy * j;
        let shape = params.shape.clone();
        const sbb = shape.boundingBox();
        const scale = Math.min(bb.width / sbb.width, bb.height / sbb.height);
        shape = shape.clone(scale);
        shape.center = new Ray(this.center.x + x - w / 2, this.center.y + y - h / 2, shape.center.direction);
        if (params.style) {
          shape.style = params.style;
        }
        c.push(shape);
      }
    }
    return c;
  }
  
}

export class ScatterShapeLayout extends AbstractShapeLayout {

  containerPts: Ray[];
  containerBounds: BoundingBox;
  scatterPoints: Ray[];
  scatterPointsClosestDist: number[];
  constructor(center: Ray, params: IScatterShapeLayoutParams) {
    super(center, params);
    this.containerPts = params.container.generate();
    this.containerPts.forEach((pt) => {
      pt.x += this.center.x;
      pt.y += this.center.y;
    });
    this.containerBounds = params.container.boundingBox();

    this.scatterPoints = [];
    const n = $(params.maxShapes) || 1;
    const prng = arbit(n);
    const minSpacing = $(params.minSpacing) || 0;
    
    for (let j = 0; j < n * 2; j++) {
      const possiblePts: { pt: Ray, dist: number }[] = [];
      for (let i = 0; i < 500; i++) {
        const pt = new Ray(
          prng.nextFloat(this.containerBounds.x, this.containerBounds.x + this.containerBounds.width),
          prng.nextFloat(this.containerBounds.y, this.containerBounds.y + this.containerBounds.height)
        );
        if (GeomHelpers.pointWithinPolygon(pt, params.container)) {
          let p = {
            pt: pt,
            dist: 0,
          }
          let minDist = 1000000;
          this.scatterPoints.forEach((pt) => {
            const dist = GeomHelpers.distanceBetweenPoints(pt, p.pt);
            if (dist < minDist) {
              minDist = dist;
            }
          });
          p.dist = minDist;
          if (p.dist >= minSpacing) {
            possiblePts.push(p);
          }
        }
      }
      possiblePts.sort((a, b) => b.dist - a.dist);
      if (possiblePts.length > 0) {
        this.scatterPoints.push(possiblePts[0].pt);
        if (this.scatterPoints.length >= n) {
          break;
        }
      }
    }

    this.scatterPointsClosestDist = [];
    this.scatterPoints.forEach((pt) => {
      let minDist = 1000000;
      this.scatterPoints.forEach((pt2) => {
        if (pt === pt2) return;
        const dist = GeomHelpers.distanceBetweenPoints(pt, pt2);
        if (dist < minDist) {
          minDist = dist;
        }
      });
      this.scatterPointsClosestDist.push(minDist);
    });

    
  }

  children(): IShape[] {

    const c: IShape[] = [];
    const params = this.params as IScatterShapeLayoutParams;
    const padding = $(params.padding) || 0;

    for (let i = 0; i < this.scatterPoints.length; i++) {
      const x = this.scatterPoints[i].x;
      const y = this.scatterPoints[i].y;
      const size = this.scatterPointsClosestDist[i] - padding;
      let shape = params.shape.clone();
      const sbb = shape.boundingBox();
      const scale = Math.min(size / sbb.width, size / sbb.height);
      shape = shape.clone(scale);
      shape.center = new Ray(x, y, shape.center.direction);
      if (params.style) {
        shape.style = params.style;
      }
      c.push(shape);
    }
    return c;
  }

}