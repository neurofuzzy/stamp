import { IDistributeHandler, IGridDistributeParams } from "./distribute-interfaces";
import { Ray, IShape, Point } from "../../geom/core";
import { resolveStringOrNumber } from "../stamp-helpers";
import { IShapeContext, IShapeParams } from "../stamp-interfaces";
import { GeomHelpers } from "../../geom/helpers";

const $ = resolveStringOrNumber;

export class GridDistributeHandler implements IDistributeHandler {

  private _resolvedParams: IGridDistributeParams;

  constructor(params: IGridDistributeParams) {
    this._resolvedParams = {
      ...params,
      columns: $(params?.columns) || 1,
      rows:  $(params?.rows) || 1,
      columnSpacing: $(params?.columnSpacing) || 0,
      rowSpacing: $(params?.rowSpacing) || 0,
    }
  }

  private _getGroupOffset(nx = 1, ny = 1, spx = 0, spy = 0): Point {
    const pt = new Point(0, 0);
    pt.x = (nx - 1) * spx * 0.5;
    pt.y = (ny - 1) * spy * 0.5;
    return pt;
  }

  getCenters(): Ray[] {
    const centers: Ray[] = [];
    const n = Number(this._resolvedParams.columns) * Number(this._resolvedParams.rows);
    for (let i = 0; i < n; i++) {
      centers.push(new Ray(0, 0, 0));
    }
    return centers;
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    // 
    const nnx = this._resolvedParams.columns as number;
    const nny = this._resolvedParams.rows as number;
    const nspx = this._resolvedParams.columnSpacing as number;
    const nspy = this._resolvedParams.rowSpacing as number;
    const o = this._getGroupOffset(nnx, nny, nspx, nspy);
    
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const s = shapes[j * nnx + i];
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as IGridDistributeParams).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = s.center;
        center.x = nspx * i - o.x + offset.x;
        center.y = nspy * j - o.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;

        if ($(params.skip || 0) > 0) {
          s.hidden = true;
        }
        
      }
    }
  }

}