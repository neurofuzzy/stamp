import { IDistributeHandler, IGridDistributeParams } from "./distribute-interfaces";
import { Ray, IShape, Point } from "../../geom/core";
import { resolveStringOrNumber } from "../stamp-helpers";
import { IShapeContext, IShapeParams } from "../stamp-interfaces";
import { GeomHelpers } from "../../geom/helpers";

const $ = resolveStringOrNumber;
// Enhanced grid distribution handler with falloff support
export class GridDistributeHandler implements IDistributeHandler {

  private _resolvedParams: IGridDistributeParams;
  private _positions: { x: number; y: number }[] = [];

  constructor(params: IGridDistributeParams) {
    this._resolvedParams = {
      ...params,
      columns: $(params?.columns) || 1,
      rows: $(params?.rows) || 1,
      columnSpacing: $(params?.columnSpacing) || 0,
      rowSpacing: $(params?.rowSpacing) || 0,
      itemScaleFalloff: $(params?.itemScaleFalloff) || 0,
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
    const nnx = this._resolvedParams.columns as number;
    const nny = this._resolvedParams.rows as number;
    const nspx = this._resolvedParams.columnSpacing as number;
    const nspy = this._resolvedParams.rowSpacing as number;
    const o = this._getGroupOffset(nnx, nny, nspx, nspy);
    
    // Generate and store positions for use in arrangeShapes
    this._positions = [];
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const x = nspx * i - o.x;
        const y = nspy * j - o.y;
        this._positions.push({ x, y });
        centers.push(new Ray(x, y, 0));
      }
    }
    
    return centers;
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    const falloffStrength = this._resolvedParams.itemScaleFalloff as number;
    const nnx = this._resolvedParams.columns as number;
    const nny = this._resolvedParams.rows as number;
    const nspx = this._resolvedParams.columnSpacing as number;
    const nspy = this._resolvedParams.rowSpacing as number;
    
    // Calculate maximum distance for falloff
    const halfWidth = (nnx - 1) * nspx / 2;
    const halfHeight = (nny - 1) * nspy / 2;
    const maxDistance = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight) || 1;

    
    shapes.forEach((shape, index) => {
      if (index < this._positions.length) {
        const position = this._positions[index];
        
        // Calculate falloff based on distance from center
        const distance = Math.sqrt(position.x * position.x + position.y * position.y);
        const falloffScale = 1 - (distance / (maxDistance * 2)) * falloffStrength;
        
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as IGridDistributeParams).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = shape.center;
        center.x = position.x + offset.x;
        center.y = position.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;

        // Apply falloff scaling
        if (falloffScale < 1 && falloffStrength > 0) {
          shape.rescale(falloffScale);
        }

        if ($(params.skip || 0) > 0) {
          shape.hidden = true;
        }
      }
    });
  }

}