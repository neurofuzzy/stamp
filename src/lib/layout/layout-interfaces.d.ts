import { IShape, Ray } from "../../geom/core";
import { IStyle } from "../../geom/core";
import { Stamp } from "../stamp";
import { IShapeParams, IShapeContext } from "../stamp-interfaces";

// layout params

export interface ILayoutParams {
  type: string;
}

export interface IShapeLayoutParams {
  shape: IShape;
  style?: IStyle;
}

export interface IStampLayoutParams {
  stamp: Stamp;
  stampSeed?: string | number;
  scale?: string | number;
  layoutSeed?: number;
}


// grid layout params

export interface IGridLayoutParams extends ILayoutParams {
  type: "grid";
  columns: string | number;
  rows: string | number;
  columnSpacing: string | number;
  rowSpacing: string | number;
  columnPadding?: string | number;
  rowPadding?: string | number;
  offsetAlternateRows?: boolean;
  negateOffsetX?: boolean;
}

export interface IGrid2LayoutParams extends ILayoutParams {
  type: "grid2";
  columns: string | number;
  rows: string | number;
  columnSpacing: string | number;
  rowSpacing: string | number;
  columnPadding?: string | number;
  rowPadding?: string | number;
  offsetAlternateRows?: boolean;
  negateOffsetX?: boolean;
  itemScaleFalloff?: string | number;
}

export interface IGridShapeLayoutParams extends IGridLayoutParams, IShapeLayoutParams {}

export interface IGridStampLayoutParams extends IGridLayoutParams, IStampLayoutParams {}


// scatter layout params

export interface IScatterLayoutParams extends ILayoutParams {
  container: IShape;
  maxShapes: string | number;
  minSpacing: string | number;
  padding: string | number;
}

export interface IScatterShapeLayoutParams extends IScatterLayoutParams, IShapeLayoutParams {}


// circle grid layout params

export interface ICircleGridLayoutParams extends ILayoutParams {
  rings: string | number;
  numPerRing: string | number;
  spacing: string | number;
}

export interface ICircleGridShapeLayoutParams extends ICircleGridLayoutParams, IShapeLayoutParams {}

export interface ICircleGridStampLayoutParams extends ICircleGridLayoutParams, IStampLayoutParams {}


// circle packing layout params

export interface ICirclePackingLayoutParams extends ILayoutParams {
  radius: string | number;
  count: string | number;
  padding?: string | number;
  /** number between 0 - 100 */
  spherify?: string | number;
}

export interface ICirclePackingShapeLayoutParams extends ICirclePackingLayoutParams, IShapeLayoutParams {}

export interface ICirclePackingStampLayoutParams extends ICirclePackingLayoutParams, IStampLayoutParams {}
