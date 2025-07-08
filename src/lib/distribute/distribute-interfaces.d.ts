import { IShape, Ray } from "../../geom/core";
import { IStyle } from "../../geom/core";
import { Stamp } from "../stamp";
import { IShapeParams, IShapeContext } from "../stamp-interfaces";

export interface IDistributeParams {
  type: string;
}

export interface IDistributeHandler {
  getCenters(): Ray[];
  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void;
}

// Base interfaces for common parameter groups
export interface IScaleFalloffParams {
  itemScaleFalloff?: string | number;
}

export interface IGridLayoutParams {
  columns?: string | number;
  rows?: string | number;
  spacing?: string | number;
}

export interface ICountBasedParams {
  count?: string | number;
}

export interface IRandomizedParams {
  seed?: string | number;
}

export interface IDimensionParams {
  width?: string | number;
  height?: string | number;
}

export interface IPaddingParams {
  padding?: string | number;
}

export interface IGridDistributeParams extends IDistributeParams, IScaleFalloffParams {
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

export interface IPhyllotaxisDistributeParams extends IDistributeParams, IScaleFalloffParams, ICountBasedParams {
  type: "phyllotaxis";
  angle?: string | number;
  scaleFactor?: string | number;
  skipFirst?: string | number;
}

export interface IHexagonalDistributeParams extends IDistributeParams, IScaleFalloffParams, IGridLayoutParams {
  type: "hexagonal";
}

export interface IAttractorDistributeParams extends IDistributeParams, IScaleFalloffParams, IPaddingParams {
  type: "attractor";
  count?: string | number;
  initialRadius?: string | number;
  hexSpacing?: string | number;
  strength?: string | number;
  damping?: string | number;
  simulationSteps?: string | number;
}

export interface IPoincareDistributeParams extends IDistributeParams, IScaleFalloffParams, ICountBasedParams, IRandomizedParams {
  type: "poincare";
  radius?: string | number;
  density?: string | number;
}

export interface IPoissonDiskDistributeParams extends IDistributeParams, IScaleFalloffParams, IRandomizedParams, IDimensionParams {
  type: "poisson-disk";
  minDistance?: string | number;
  count?: string | number;
}

export interface ITriangularDistributeParams extends IDistributeParams, IScaleFalloffParams, IGridLayoutParams {
  type: "triangular";
}

export type IDistribution =
  | IGridDistributeParams
  | IPhyllotaxisDistributeParams
  | IHexagonalDistributeParams
  | IAttractorDistributeParams
  | IPoincareDistributeParams
  | IPoissonDiskDistributeParams
  | ITriangularDistributeParams;
