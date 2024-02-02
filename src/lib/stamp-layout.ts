import { IShape, Ray } from "../geom/core";
import { AbstractShape, Polygon } from "../geom/shapes";
import { Sequence } from "./sequence";
import { Stamp } from "./stamp";

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
      ? parseInt(arg.replace("#", "0x"), 16)
      : Sequence.resolve(arg)
    : typeof arg === "number"
    ? arg
    : 0;

interface IStampLayoutParams {
  stamp: Stamp;
  seedSequence: Sequence | null;
}

interface IGridStampLayoutParams extends IStampLayoutParams {
  columns: number;
  rows: number;
  columnSpacing: number;
  rowSpacing: number;
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
      for (let i = 0; i < params.columns; i++) {
        const seed = params.seedSequence?.next() || i;
        console.log(seed)
        Sequence.resetAll(seed, [params.seedSequence]);
        Sequence.seed = seed;
        const x = params.columnSpacing * i;
        const y = params.rowSpacing * j;
        const stamp = params.stamp.clone();
        stamp.center = new Ray(this.center.x + x - w / 2, this.center.y + y - h / 2, 0);
        stamp.generate();
        c.push(stamp);
      }
    }
    return c;
  }
  
}