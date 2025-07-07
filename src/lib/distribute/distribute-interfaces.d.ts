import { IShape, Ray } from "../../geom/core";
import { IStyle } from "../../geom/core";
import { Stamp } from "../stamp";
import { IShapeParams, IShapeContext } from "../stamp-interfaces";

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
  negateOffsetX?: boolean;
}

export interface IGrid2DistributeParams extends IDistributeParams {
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

export interface IGridShapeDistributeParams extends IGridDistributeParams, IShapeDistributeParams {}

export interface IGridStampDistributeParams extends IGridDistributeParams, IStampDistributeParams {}


// scatter distribute params

export interface IScatterDistributeParams extends IDistributeParams {
  container: IShape;
  maxShapes: string | number;
  minSpacing: string | number;
  padding: string | number;
}

export interface IScatterShapeDistributeParams extends IScatterDistributeParams, IShapeDistributeParams {}


// circle grid distribute params

export interface ICircleGridDistributeParams extends IDistributeParams {
  rings: string | number;
  numPerRing: string | number;
  spacing: string | number;
}

export interface ICircleGridShapeDistributeParams extends ICircleGridDistributeParams, IShapeDistributeParams {}

export interface ICircleGridStampDistributeParams extends ICircleGridDistributeParams, IStampDistributeParams {}


// circle packing distribute params

export interface ICirclePackingDistributeParams extends IDistributeParams {
  radius: string | number;
  count: string | number;
  padding?: string | number;
  /** number between 0 - 100 */
  spherify?: string | number;
}

export interface ICirclePackingShapeDistributeParams extends ICirclePackingDistributeParams, IShapeDistributeParams {}

export interface ICirclePackingStampDistributeParams extends ICirclePackingDistributeParams, IStampDistributeParams {}

// distribute handlers

export interface IDistributeHandler {
  getCenters(): Ray[];
  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void;
}

export interface IPhyllotaxisDistributeParams extends IDistributeParams {
  type: "phyllotaxis";
  count?: string | number;
  angle?: string | number;
  scaleFactor?: string | number;
  itemScaleFalloff?: string | number;
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
}

export interface IPoincareDistributeParams extends IDistributeParams {
  type: "poincare";
  count?: string | number;
  radius?: string | number;
  density?: string | number;
  itemScaleFalloff?: string | number;
}

export interface IPoissonDiskDistributeParams extends IDistributeParams {
  type: "poisson-disk";
  width?: string | number;
  height?: string | number;
  minDistance?: string | number;
  maxPoints?: string | number;
  seed?: string | number;
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
  | IGrid2DistributeParams
  | IScatterDistributeParams
  | ICircleGridDistributeParams
  | ICirclePackingDistributeParams
  | IPhyllotaxisDistributeParams
  | IHexagonalDistributeParams
  | IAttractorDistributeParams
  | IPoincareDistributeParams
  | IPoissonDiskDistributeParams
  | ITriangularDistributeParams;
