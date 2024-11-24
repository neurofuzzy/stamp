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
  tag?: string;
}

export interface ICircleParams extends IShapeParams {
  radius: number | string;
  innerRadius?: number | string;
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
