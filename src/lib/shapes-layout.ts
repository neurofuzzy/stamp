import { BoundingBox, IStyle, Ray } from "../geom/core";
import { AbstractShape } from "../geom/shapes";
import { IShape } from "../geom/core";

interface IShapeLayoutParams {
  shape: IShape;
  style?: IStyle;
}

interface IGridShapeLayoutParams extends IShapeLayoutParams {
  columns: number;
  rows: number;
  columnSpacing: number;
  rowSpacing?: number;
  columnPadding?: number;
  rowPadding?: number;
}

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
    const w = params.columnSpacing * (params.columns - 1);
    const h = (params.rowSpacing || params.columnSpacing) * (params.rows - 1);
    const bb = new BoundingBox(
      0, 
      0, 
      params.columnSpacing - (params.columnPadding || 0), 
      (params.rowSpacing || params.columnSpacing) - (params.rowPadding || params.columnPadding || 0)
    );
    for (let j = 0; j < params.rows; j++) {
      for (let i = 0; i < params.columns; i++) {
        const x = params.columnSpacing * i;
        const y = (params.rowSpacing || params.columnSpacing) * j;
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