import { IDistribution } from "./layout-interfaces.d.ts";

interface IShapeParams {
  angle?: number | string;
  divisions?: number | string;
  align?: number | string;
  numX?: number | string;
  numY?: number | string;
  spacingX?: number | string;
  spacingY?: number | string;
  outlineThickness?: number | string;
  scale?: number | string;
  offsetX?: number | string;
  offsetY?: number | string;
  skip?: number | string;
  style?: IStyle;
  layout?: ILayout;
  tag?: string;
}

export interface ICircleParams extends IShapeParams {
  radius: number | string;
  innerRadius?: number | string;
}

export interface IArchParams extends IShapeParams {
  width: number | string;
  sweepAngle?: number | string;
}

export interface IEllipseParams extends IShapeParams {
  radiusX: number | string;
  radiusY: number | string;
}

export interface ILeafShapeParams extends IShapeParams {
  radius: number | string;
  splitAngle: number | string;
  splitAngle2?: number | string;
  serration?: number | string;
}

export interface IRectangleParams extends IShapeParams {
  width: number | string;
  height: number | string;
}

export interface IRoundedRectangleParams extends IShapeParams {
  width: number | string;
  height: number | string;
  cornerRadius: number | string;
}

export interface IPolygonParams extends IShapeParams {
  rays: Ray[];
  /* processed internally */
  rayStrings?: string[];
}

export interface IStampParams extends IShapeParams {
  subStamp: Stamp | StampsProvider;
  /* processed internally */
  subStampString?: string;
  providerIndex?: number;
}

export interface ITangramParams extends IShapeParams {
  width: number | string;
  height: number | string;
  type: number | string;
}

export interface ITrapezoidParams extends IShapeParams {
  width: number | string;
  height: number | string;
  taper: number | string;
}

export interface IBoneParams extends IShapeParams {
  length: number | string;
  bottomRadius: number | string;
  topRadius: number | string;
}

interface IStyleMap {
  bounds: BoundingBox;
  style: IStyle;
}

interface INode {
  fName: string;
  tag?: string;
  args: any[];
}

interface IBoundsParams {
  padding?: number | string;
}

/**
 * Context interface providing access to Stamp's internal methods and state
 */
export interface IShapeContext {
  getGroupOffset(nx: number, ny: number, spx: number, spy: number): Point;
  make(shapes: IShape[], outlineThickness?: number, scale?: number): void;
  getCursor(): Ray;
  getCursorDirection(): number;
  resolveStringOrNumber(value: string | number): number;
}

/**
 * Interface for shape handler extensions
 */
export interface IShapeHandler {
  /**
   * Handles the creation of a specific shape type
   * @param params - Shape-specific parameters
   * @param context - Context providing access to core functionality
   */
  handle(params: any, context: IShapeContext): void;
}

/**
 * Registry interface for managing shape handlers
 */
export interface IShapeHandlerRegistry {
  register(shapeName: string, handler: IShapeHandler): void;
  getHandler(shapeName: string): IShapeHandler | undefined;
  hasHandler(shapeName: string): boolean;
}

// Params interfaces for public methods that need to be converted
export interface ISetBoundsParams {
  width: number | string;
  height: number | string;
}

export interface ISetCursorBoundsParams {
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
}

export interface IMoveToParams {
  x?: number | string;
  y?: number | string;
}

export interface IMoveParams {
  x?: number | string;
  y?: number | string;
}

export interface IMoveOverParams {
  direction: number | string;
  percentage?: number | string;
}

export interface IForwardParams {
  distance?: number | string;
}

export interface IOffsetParams {
  x: number | string;
  y?: number | string;
}

export interface IRotateToParams {
  rotation?: number | string;
}

export interface IRotateParams {
  rotation?: number | string;
}

export interface ICropParams {
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
}

export interface IBooleanParams {
  type: number | string;
}

export interface ISetParams {
  sequenceCall: string;
}

export interface IRemoveTagParams {
  tag: string;
}

export interface ISkipTagParams {
  tag: string;
  condition: string;
}

export interface IReplaceVariableParams {
  oldName: string;
  newName: string;
}

export interface IRepeatLastParams {
  steps: number | string;
  times?: number | string;
}

export interface IStepBackParams {
  steps: number | string;
}

export interface IPathParams {
  scale?: number | string;
  optimize?: boolean;
  mergeConnectedPaths?: boolean;
}
