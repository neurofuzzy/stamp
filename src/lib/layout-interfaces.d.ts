import { IShape } from "../geom/core";
import { IStyle } from "../geom/core";
import { Stamp } from "./stamp";

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


// grid layout

export interface IGridLayoutParams extends ILayoutParams {
  type: "grid";
  columns: number;
  rows: number;
  columnSpacing: number;
  rowSpacing: number;
  columnPadding?: number;
  rowPadding?: number;
  offsetAlternateRows?: boolean;
}

export interface IGridShapeLayoutParams extends IGridLayoutParams, IShapeLayoutParams {};

export interface IGridStampLayoutParams extends IGridLayoutParams, IStampLayoutParams {};


// scatter layout

export interface IScatterLayoutParams extends ILayoutParams {
  container: IShape;
  maxShapes: number;
  minSpacing: number;
  padding: number;
}

export interface IScatterShapeLayoutParams extends IScatterLayoutParams, IShapeLayoutParams {};


// circle grid layout

export interface ICircleGridLayoutParams extends ILayoutParams {
  rings: number;
  numPerRing: number;
  spacing: number;
}

export interface ICircleGridShapeLayoutParams extends ICircleGridLayoutParams, IShapeLayoutParams {};

export interface ICircleGridStampLayoutParams extends ICircleGridLayoutParams, IStampLayoutParams {};


// circle packing layout

export interface ICirclePackingLayoutParams extends ILayoutParams {
  radius: number;
  count: number;
  padding?: number;
  /** number between 0 - 100 */
  spherify?: number;
}

export interface ICirclePackingShapeLayoutParams extends ICirclePackingLayoutParams, IShapeLayoutParams {};

export interface ICirclePackingStampLayoutParams extends ICirclePackingLayoutParams, IStampLayoutParams {};