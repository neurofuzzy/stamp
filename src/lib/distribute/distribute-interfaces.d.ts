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

export interface IGridDistributeParams extends IDistributeParams {
  type: "grid";
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

export interface IPhyllotaxisDistributeParams extends IDistributeParams {
  type: "phyllotaxis";
  count?: string | number;
  angle?: string | number;
  scaleFactor?: string | number;
  itemScaleFalloff?: string | number;
  skipFirst?: string | number;
}

export interface IHexagonalDistributeParams extends IDistributeParams {
  type: "hexagonal";
  columns?: string | number;
  rows?: string | number;
  spacing?: string | number;
  itemScaleFalloff?: string | number;
}

export interface IAttractorDistributeParams extends IDistributeParams {
  type: "attractor";
  particleCount?: string | number;
  initialRadius?: string | number;
  hexSpacing?: string | number;
  strength?: string | number;
  damping?: string | number;
  simulationSteps?: string | number;
  itemScaleFalloff?: string | number;
  padding?: string | number;
}

export interface IPoincareDistributeParams extends IDistributeParams {
  type: "poincare";
  count?: string | number;
  radius?: string | number;
  density?: string | number;
  itemScaleFalloff?: string | number;
  seed?: string | number;
}

export interface IPoissonDiskDistributeParams extends IDistributeParams {
  type: "poisson-disk";
  width?: string | number;
  height?: string | number;
  minDistance?: string | number;
  maxPoints?: string | number;
  seed?: string | number;
  itemScaleFalloff?: string | number;
}

export interface ITriangularDistributeParams extends IDistributeParams {
  type: "triangular";
  columns?: string | number;
  rows?: string | number;
  spacing?: string | number;
  itemScaleFalloff?: string | number;
}

export type IDistribution =
  | IGridDistributeParams
  | IPhyllotaxisDistributeParams
  | IHexagonalDistributeParams
  | IAttractorDistributeParams
  | IPoincareDistributeParams
  | IPoissonDiskDistributeParams
  | ITriangularDistributeParams;
