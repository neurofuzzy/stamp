import { Ray } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";
import { AbstractShape } from "../geom/shapes";
import { Sequence } from "./sequence";
import { Stamp } from "./stamp";

interface IStampLayoutParams {
  stamp: Stamp;
  seedSequence: Sequence | null;
}

interface IGridStampLayoutParams extends IStampLayoutParams {
  columns: number;
  rows: number;
  columnSpacing: number;
  rowSpacing: number;
  offsetAlternateRows?: boolean;
}

interface ICircleGridStampLayoutParams extends IStampLayoutParams {
  rings: number;
  numPerRing: number;
  spacing: number;
}

class AbstractStampLayout extends AbstractShape {
  
  params: IStampLayoutParams;

  constructor(center: Ray, params: IStampLayoutParams) {
    super(center);
    this.params = params;
  }
  generate(): Ray[] {
    return [];
  }

}

export class GridStampLayout extends AbstractStampLayout {
  
  constructor(center: Ray, params: IGridStampLayoutParams) {
    super(center, params);
  }

  children(): Stamp[] {
    const c: Stamp[] = [];
    const params = this.params as IGridStampLayoutParams;
    const w = params.columnSpacing * (params.columns - 1);
    const h = params.rowSpacing * (params.rows - 1);
    for (let j = 0; j < params.rows; j++) {
      let cols = params.columns;
      if (params.offsetAlternateRows && j % 2 === 1) {
        cols++;
      }
      for (let i = 0; i < cols; i++) {
        const seed = params.seedSequence?.next() || i;
        Sequence.resetAll(seed, [params.seedSequence]);
        Sequence.seed = seed;
        const x = params.columnSpacing * i;
        const y = params.rowSpacing * j;
        const stamp = params.stamp.clone();
        stamp.center = new Ray(this.center.x + x - w / 2, this.center.y + y - h / 2, stamp.center.direction);
        if (params.offsetAlternateRows && j % 2 === 1) {
          stamp.center.x -= params.columnSpacing / 2;
        }
        stamp.generate();
        c.push(stamp);
      }
    }
    return c;
  }
  
}

export class CircleGridStampLayout extends AbstractStampLayout {
  
  constructor(center: Ray, params: ICircleGridStampLayoutParams) {
    super(center, params);
  }

  children(): Stamp[] {
    const c: Stamp[] = [];
    const params = this.params as ICircleGridStampLayoutParams;
    for (let j = 0; j < params.rings; j++) {
      for (let i = 0; i < Math.max(1, params.numPerRing * j); i++) {
        const seed = params.seedSequence?.next() || i;
        Sequence.resetAll(seed, [params.seedSequence]);
        Sequence.seed = seed;
        const stamp = params.stamp.clone();
        const center = new Ray(0, params.spacing * j);
        if (j > 0) {
          GeomHelpers.rotatePoint(center, i * (360 / params.numPerRing / j) * Math.PI / 180);
        }
        if (j > 0) {
          GeomHelpers.rotatePoint(center, (90 / params.numPerRing * (j - 1)) * Math.PI / 180);
        }
        center.x += this.center.x;
        center.y += this.center.y;
        stamp.center = new Ray(center.x, center.y, stamp.center.direction);
        stamp.generate();
        c.push(stamp);
      }
    }
    return c;
  }
  
}