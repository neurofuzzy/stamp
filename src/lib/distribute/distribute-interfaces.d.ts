import { IShape, Ray } from "../../geom/core";
import { IStyle } from "../../geom/core";
import { Stamp } from "../stamp";

// distribute params

export interface IDistributeParams {
  type: string;
}

export interface IShapeDistributeParams {
  shape: IShape;
  style?: IStyle;
}

export interface IStampDistributeParams {
  stamp: Stamp;
  stampSeed?: string | number;
  scale?: string | number;
  distributeSeed?: number;
}


// grid distribute params

export interface IGridDistributeParams extends IDistributeParams {
  type: "grid";
  columns: string | number;
  rows: string | number;
  columnSpacing: string | number;
  rowSpacing: string | number;
  columnPadding?: string | number;
  rowPadding?: string | number;
  offsetAlternateRows?: boolean;
}

export interface IGridShapeDistributeParams extends IGridDistributeParams, IShapeDistributeParams {};

export interface IGridStampDistributeParams extends IGridDistributeParams, IStampDistributeParams {};


// scatter distribute params

export interface IScatterDistributeParams extends IDistributeParams {
  container: IShape;
  maxShapes: string | number;
  minSpacing: string | number;
  padding: string | number;
}

export interface IScatterShapeDistributeParams extends IScatterDistributeParams, IShapeDistributeParams {};


// circle grid distribute params

export interface ICircleGridDistributeParams extends IDistributeParams {
  rings: string | number;
  numPerRing: string | number;
  spacing: string | number;
}

export interface ICircleGridShapeDistributeParams extends ICircleGridDistributeParams, IShapeDistributeParams {};

export interface ICircleGridStampDistributeParams extends ICircleGridDistributeParams, IStampDistributeParams {};


// circle packing distribute params

export interface ICirclePackingDistributeParams extends IDistributeParams {
  radius: string | number;
  count: string | number;
  padding?: string | number;
  /** number between 0 - 100 */
  spherify?: string | number;
}

export interface ICirclePackingShapeDistributeParams extends ICirclePackingDistributeParams, IShapeDistributeParams {};

export interface ICirclePackingStampDistributeParams extends ICirclePackingDistributeParams, IStampDistributeParams {};

// distribute handlers

export interface IDistributeHandler {
  getCenters(): Ray[];
  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void;
}