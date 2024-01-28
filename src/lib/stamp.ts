import * as clipperLib from "js-angusj-clipper/web";
import {
  BoundingBox,
  IShape,
  IStyle,
  Point,
  Ray,
  ShapeAlignment,
} from "../geom/core";
import { GeomHelpers } from "../geom/helpers";
import {
  AbstractShape,
  Circle,
  Ellipse,
  Polygon,
  Rectangle,
  RoundedRectangle,
  Bone,
} from "../geom/shapes";
import { Donut } from "../geom/compoundshapes";
import { RoundedTangram, Tangram } from "../geom/tangram";
import { ClipperHelpers } from "./clipper-helpers";
import { Sequence } from "./sequence";

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
      ? parseInt(arg.replace("#", "0x"), 16)
      : Sequence.resolve(arg)
    : typeof arg === "number"
    ? arg
    : 0;

interface IShapeParams {
  angle?: number | string;
  divisions?: number | string;
  align?: number | string;
  numX?: number | string;
  numY?: number | string;
  spacingX?: number | string;
  spacingY?: number | string;
  outlineThickness?: number | string;
  offsetX?: number | string;
  offsetY?: number | string;
  skip?: number | string;
  style?: IStyle;
}

export interface ICircleParams extends IShapeParams {
  radius: number | string;
  innerRadius?: number | string;
}

export interface IEllipseParams extends IShapeParams {
  radiusX: number | string;
  radiusY: number | string;
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
  subStamp: Stamp;
  /* processed internally */
  subStampString?: string;
}

export interface ITangramParams extends IShapeParams {
  width: number | string;
  height: number | string;
  type: number | string;
}

export interface IBoneParams extends IShapeParams {
  length: number | string;
  bottomRadius: number | string;
  topRadius: number | string;
}

function paramsWithDefaults<T extends IShapeParams>(params: IShapeParams): T {
  params = Object.assign({}, params);
  params.angle = params.angle ?? 0;
  params.divisions = params.divisions ?? 1;
  params.align = params.align ?? ShapeAlignment.CENTER;
  params.numX = params.numX ?? 1;
  params.numY = params.numY ?? 1;
  params.spacingX = params.spacingX ?? 0;
  params.spacingY = params.spacingY ?? 0;
  params.outlineThickness = params.outlineThickness ?? 0;
  params.offsetX = params.offsetX ?? 0;
  params.offsetY = params.offsetY ?? 0;
  params.skip = params.skip ?? 0;
  return params as T;
}

function resolveStyle(style: IStyle) {
  const out = Object.assign({}, style);
  if (out.strokeColor !== undefined) out.strokeColor = $(out.strokeColor);
  if (out.fillColor !== undefined) out.fillColor = $(out.fillColor);
  if (out.hatchPattern !== undefined) out.hatchPattern = $(out.hatchPattern);
  if (out.hatchScale !== undefined) out.hatchScale = $(out.hatchScale);
  if (out.hatchAngle !== undefined) out.hatchAngle = $(out.hatchAngle);
  return out;
}

interface IStyleMap {
  bounds: BoundingBox;
  style: IStyle;
}

interface INode {
  fName: string;
  args: any[];
}

export class Stamp extends AbstractShape {

  static readonly UNION = 1;
  static readonly SUBTRACT = 2;
  static readonly INTERSECT = 3;

  private _nodes: INode[] = [];
  private _tree: clipperLib.PolyTree | null = null;
  private _polys: Polygon[] = [];
  private _styleMap: IStyleMap[] = [];
  private _mode: number = Stamp.UNION;
  private _cursor: Ray = new Ray(0, 0, 0);
  private _cursorHistory: Ray[] = [];
  private _baked: boolean = false;

  constructor(
    center?: Ray,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, 1, alignment, reverse);
  }

  private _reset() {
    this._tree = null;
    this._polys = [];
    this._styleMap = [];
    this._mode = Stamp.UNION;
    this._baked = false;
    this._cursor.x = this._cursor.y = this._cursor.direction = 0;
    this._cursorHistory = [];
  }

  private _defaultStyle(style: IStyle) {
    this.style = style;
  }

  private _add() {
    this._mode = Stamp.UNION;
  }

  private _subtract() {
    this._mode = Stamp.SUBTRACT;
  }

  private _intersect() {
    this._mode = Stamp.INTERSECT;
  }

  private _boolean(type: string | number) {
    if (typeof type === "string") {
      type = Sequence.resolve(type);
    }
    if (type <= 0) {
      this._mode = Stamp.SUBTRACT;
    } else {
      this._mode = Stamp.UNION;
    }
  }

  private _breakApart() {

    let newPolys: Polygon[] = [];

    const ungroupAll = (poly: Polygon) => {
      if (poly.children().length > 0) {
        poly.children().forEach(p => ungroupAll(p as Polygon));
      } else {
        newPolys.push(poly);
      }
    }

    if (this._polys.length >= 1) {
      this._polys.forEach(p => {
        ungroupAll(p);
      })
      this._polys = newPolys;
    }
  }

  private _moveTo(x: number | string, y: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    this._cursor.x = $(x);
    this._cursor.y = $(y);
  }

  private _move(x: number | string, y: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    const v = new Point($(x), $(y));
    GeomHelpers.rotatePoint(v, this._cursor.direction);
    this._cursor.x += v.x;
    this._cursor.y += v.y;
  }

  private _forward(distance: number) {
    this._cursorHistory.push(this._cursor.clone());
    distance = $(distance);
    var sinAng = Math.sin(this._cursor.direction);
    var cosAng = Math.cos(this._cursor.direction);
    this._cursor.x += sinAng * distance;
    this._cursor.y -= cosAng * distance;
  }

  private _rotateTo(r: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    this._cursor.direction = ($(r) * Math.PI / 180);
  }

  private _rotate(r: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    const rdeg = $(r);
    const rn = (rdeg * Math.PI / 180);
    this._cursor.direction = GeomHelpers.normalizeAngle(this._cursor.direction + rn);
  }

  private _stepBack(steps: number | string) {
    const sn = $(steps);
    for (let i = 0; i < sn; i++) {
      let c = this._cursorHistory.pop();
      if (c) {
        this._cursor = c;
      } else {
        break;
      }
    }
  }

  private _make(shapes: IShape[], outln: number = 0) {
    for (let i = 0; i < shapes.length; i++) {
      let shape: IShape | undefined = shapes[i];

      if (!shape) {
        break;
      }

      let g = shape.clone();

      g.center.x += this.center.x + this._cursor.x;
      g.center.y += this.center.y + this._cursor.y;
      g.center.direction += this.center.direction + this._cursor.direction;

      if (shape.style && shape.style !== AbstractShape.defaultStyle) {
        const style = resolveStyle(shape.style);
        if (this._mode !== Stamp.SUBTRACT && !shape.hidden) {
          this._styleMap.push({
            bounds: g.boundingBox(),
            style,
          });
        }
      }

      let b: clipperLib.SubjectInput;
      let b2 = null;

      switch (this._mode) {
        case Stamp.UNION:
          if (this._tree) {
            b2 = ClipperHelpers.shapeToPaths(g);
            if (g.hidden) {
              continue;
            }
            if (outln) {
              const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                delta: outln * 100000,
                offsetInputs: [
                  {
                    data: b2.data,
                    joinType: clipperLib.JoinType.Miter,
                    endType: clipperLib.EndType.ClosedPolygon,
                  },
                ],
              });
              if (offsetResult) {
                let paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);
                let offsetPaths =
                  ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                  clipType: clipperLib.ClipType.Difference,
                  subjectInputs: [{ data: paths, closed: true }],
                  clipInputs: [{ data: offsetPaths }],
                  subjectFillType: clipperLib.PolyFillType.EvenOdd,
                });
                this._tree = polyResult;
              } else {
                console.log("error offseting", outln);
              }
            }
            let paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);
            const polyResult = ClipperHelpers.clipper.clipToPolyTree({
              clipType: clipperLib.ClipType.Union,
              subjectInputs: [{ data: paths, closed: true }],
              clipInputs: [b2],
              subjectFillType: clipperLib.PolyFillType.EvenOdd,
            });
            this._tree = polyResult;
          } else {
            b = ClipperHelpers.shapeToPaths(g);
            if (g.hidden) {
              continue;
            }
            let polyResult: clipperLib.PolyTree;

            try {
              polyResult = ClipperHelpers.clipper.clipToPolyTree({
                clipType: clipperLib.ClipType.Union,
                subjectInputs: [b],
                subjectFillType: clipperLib.PolyFillType.EvenOdd,
              });
              if (polyResult) {
                this._tree = polyResult;
              }
            } catch (e) {
              console.log("error unioning", e);
            }
          }
          break;

        case Stamp.SUBTRACT:
          if (this._tree) {
            b2 = ClipperHelpers.shapeToPaths(g);
            if (g.hidden) {
              continue;
            }
            let paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);

            let polyResult: clipperLib.PolyTree;

            try {
              polyResult = ClipperHelpers.clipper.clipToPolyTree({
                clipType: clipperLib.ClipType.Difference,
                subjectInputs: [{ data: paths, closed: true }],
                clipInputs: [b2],
                subjectFillType: clipperLib.PolyFillType.EvenOdd,
              });
              if (polyResult) {
                this._tree = polyResult;
              }
            } catch (e) {
              console.log("error subtracting", e);
            }
          }
          break;

        case Stamp.INTERSECT:
          if (this._tree) {
            b2 = ClipperHelpers.shapeToPaths(g);
            if (g.hidden) {
              continue;
            }
            let paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);

            let polyResult: clipperLib.PolyTree;

            try {
              polyResult = ClipperHelpers.clipper.clipToPolyTree({
                clipType: clipperLib.ClipType.Intersection,
                subjectInputs: [{ data: paths, closed: true }],
                clipInputs: [b2],
                subjectFillType: clipperLib.PolyFillType.EvenOdd,
              });
              if (polyResult) {
                this._tree = polyResult;
              }
            } catch (e) {
              console.log("error intersecting", e);
            }
          }
          break;
      }
    }

    return this;
  }

  private _getGroupOffset(nx = 1, ny = 1, spx = 0, spy = 0): Point {
    const pt = new Point(0, 0);
    pt.x = (nx - 1) * spx * 0.5;
    pt.y = (ny - 1) * spy * 0.5;
    return pt;
  }

  private _circle(params: ICircleParams) {
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const offset = new Point($(params.offsetX || 0), $(params.offsetY || 0));
        GeomHelpers.rotatePoint(offset, this._cursor.direction);
        let s;
        let innerRadius = $(params.innerRadius);
        let cen = new Ray(
          nspx * i - o.x + offset.x,
          nspy * j - o.y + offset.y,
          params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
        );
        if (!innerRadius) {
          s = new Circle(
            cen,
            $(params.radius),
            $(params.divisions),
            $(params.align)
          );
        } else {
          s = new Donut(
            cen,
            $(params.radius),
            innerRadius,
            $(params.divisions),
            $(params.align)
          );
        }
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _ellipse(params: IEllipseParams) {
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const offset = new Point($(params.offsetX || 0), $(params.offsetY || 0));
        GeomHelpers.rotatePoint(offset, this._cursor.direction);
        const s = new Ellipse(
          new Ray(
            nspx * i - o.x + offset.x,
            nspy * j - o.y + offset.y,
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
          ),
          $(params.radiusX),
          $(params.radiusY),
          $(params.divisions),
          $(params.align)
        );
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _rectangle(params: IRectangleParams) {
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const offset = new Point($(params.offsetX || 0), $(params.offsetY || 0));
        GeomHelpers.rotatePoint(offset, this._cursor.direction);
        const s = new Rectangle(
          new Ray(
            nspx * i - o.x + offset.x,
            +nspy * j - o.y + offset.y,
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.width),
          $(params.height),
          $(params.divisions),
          $(params.align)
        );
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _roundedRectangle(params: IRoundedRectangleParams) {
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const offset = new Point($(params.offsetX || 0), $(params.offsetY || 0));
        GeomHelpers.rotatePoint(offset, this._cursor.direction);
        const s = new RoundedRectangle(
          new Ray(
            nspx * i - o.x + offset.x,
            +nspy * j - o.y + offset.y,
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.width),
          $(params.height),
          $(params.cornerRadius),
          $(params.divisions),
          $(params.align)
        );
        if ($(params.skip) > 0) {
          const s = shapes[shapes.length - 1];
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _polygon(params: IPolygonParams) {
    if (!params.rayStrings?.length) {
      return;
    }
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const offset = new Point($(params.offsetX || 0), $(params.offsetY || 0));
        GeomHelpers.rotatePoint(offset, this._cursor.direction);
        const s = new Polygon(
          new Ray(
            nspx * i - o.x + offset.x,
            +nspy * j - o.y + offset.y,
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          params.rayStrings.map((s) => new Ray(0, 0).fromString(s)),
          $(params.divisions),
          $(params.align)
        );
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _stamp(params: IStampParams) {
    if (!params.subStampString) {
      return;
    }
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const s = new Stamp(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            +nspy * j - o.y + $(params.offsetY),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.align)
        ).fromString(params.subStampString);
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _tangram(params: ITangramParams) {
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const s = new Tangram(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            +nspy * j - o.y + $(params.offsetY),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.width),
          $(params.height),
          $(params.type),
          $(params.divisions),
          $(params.align)
        );
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _roundedTangram(params: ITangramParams) {
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const s = new RoundedTangram(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            +nspy * j - o.y + $(params.offsetY),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.width),
          $(params.height),
          $(params.type),
          $(params.divisions),
          $(params.align)
        );
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  private _bone(params: IBoneParams) {
    let shapes: IShape[] = [];
    let nnx = $(params.numX),
      nny = $(params.numY),
      nspx = $(params.spacingX),
      nspy = $(params.spacingY);
    let o = this._getGroupOffset(nnx, nny, nspx, nspy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        const s = new Bone(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            +nspy * j - o.y + $(params.offsetY),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.length),
          $(params.bottomRadius),
          $(params.topRadius),
          $(params.divisions),
          $(params.align)
        );
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    this._make(shapes, $(params.outlineThickness));
  }

  reset() {
    this._nodes.push({ fName: "_reset", args: Array.from(arguments) });
    return this;
  }

  defaultStyle(style: IStyle) {
    this._nodes.push({ fName: "_defaultStyle", args: [style] });
    return this;
  }

  add() {
    this._nodes.push({ fName: "_add", args: Array.from(arguments) });
    return this;
  }

  subtract() {
    this._nodes.push({ fName: "_subtract", args: Array.from(arguments) });
    return this;
  }

  intersect() {
    this._nodes.push({ fName: "_intersect", args: Array.from(arguments) });
    return this;
  }

  boolean(type: number | string) {
    this._nodes.push({ fName: "_boolean", args: [type] });
    return this;
  }

  breakApart() {
    this._nodes.push({ fName: "_breakApart", args: [] });
    return this;
  }

  next() {
    this._nodes.push({ fName: "_next", args: Array.from(arguments) });
    return this;
  }

  moveTo(x: number | string = 0, y: number | string = 0) {
    this._nodes.push({ fName: "_moveTo", args: [x, y] });
    return this;
  }

  move(x: number | string = 0, y: number | string = 0) {
    this._nodes.push({ fName: "_move", args: [x, y] });
    return this;
  }

  forward(distance: number | string = 0) {
    this._nodes.push({ fName: "_forward", args: [distance] });
    return this;
  }

  offset(x: number, y: number = 0) {
    this._nodes.push({ fName: "_offset", args: [x, y] });
    return this;
  }

  rotateTo(r: number | string = 0) {
    this._nodes.push({ fName: "_rotateTo", args: [r] });
    return this;
  }

  rotate(r: number | string = 0) {
    this._nodes.push({ fName: "_rotate", args: [r] });
    return this;
  }

  circle(params: ICircleParams) {
    params = paramsWithDefaults<ICircleParams>(params);
    this._nodes.push({
      fName: "_circle",
      args: [params],
    });
    return this;
  }

  ellipse(params: IEllipseParams) {
    params = paramsWithDefaults<IEllipseParams>(params);
    this._nodes.push({
      fName: "_ellipse",
      args: [params],
    });
    return this;
  }

  rectangle(params: IRectangleParams) {
    params = paramsWithDefaults<IRectangleParams>(params);
    this._nodes.push({
      fName: "_rectangle",
      args: [params],
    });
    return this;
  }

  roundedRectangle(params: IRoundedRectangleParams) {
    params = paramsWithDefaults<IRoundedRectangleParams>(params);
    this._nodes.push({
      fName: "_roundedRectangle",
      args: [params],
    });
    return this;
  }

  bone(params: IBoneParams) {
    params = paramsWithDefaults<IBoneParams>(params);
    this._nodes.push({
      fName: "_bone",
      args: [params],
    });
    return this;
  }

  polygon(params: IPolygonParams) {
    params = paramsWithDefaults<IPolygonParams>(params);
    params.rayStrings = params.rays.map((r) => r.toString());
    this._nodes.push({
      fName: "_polygon",
      args: [params],
    });
    return this;
  }

  stamp(params: IStampParams) {
    params = paramsWithDefaults<IStampParams>(params);
    params.subStampString = params.subStamp.toString();
    this._nodes.push({
      fName: "_stamp",
      args: [params],
    });
    return this;
  }

  tangram(params: ITangramParams) {
    params = paramsWithDefaults<ITangramParams>(params);
    this._nodes.push({
      fName: "_tangram",
      args: [params],
    });
    return this;
  }

  roundedTangram(params: ITangramParams) {
    params = paramsWithDefaults<ITangramParams>(params);
    this._nodes.push({
      fName: "_roundedTangram",
      args: [params],
    });
    return this;
  }

  repeatLast(steps: number, times: number = 1) {
    this._nodes.push({ fName: "_repeatLast", args: [steps, times] });
    return this;
  }

  stepBack(steps: number | string) {
    this._nodes.push({ fName: "_stepBack", args: [steps] });
    return this;
  }

  generate(): Ray[] {
    if (!this._baked) {
      this.bake();
    }
    return [];
  }

  children() {
    if (!this._baked) {
      this.bake();
    }
    return this._polys;
  }

  getCursor(): Ray {
    return this._cursor.clone();
  }

  private mapStyles() {
    // sort style map by bounds area
    const mappedPolys: Polygon[] = [];
    this._styleMap.sort((a, b) => {
      const areaA = a.bounds.area();
      const areaB = b.bounds.area();
      return areaA - areaB;
    });
    let i = this._styleMap.length;
    while (i--) {
      let styleArea = this._styleMap[i];
      for (let j = 0; j < this._polys.length; j++) {
        let poly = this._polys[j];
        if (GeomHelpers.shapeWithinBoundingBox(poly, styleArea.bounds, 1.1)) {
          poly.style = styleArea.style;
          mappedPolys.push(poly);
        }
      }
    }
    const unmappedPolys = this._polys.filter(
      (poly) => !mappedPolys.includes(poly)
    );
    unmappedPolys.forEach((poly) => {
      poly.style = resolveStyle(this.style);
    })
  }

  /**
   * Bakes the clipped solution into a final polytree
   * @param {boolean} rebake whether to re-bake a baked shape
   */
  bake(rebake = false) {
    if (this._baked && !rebake) {
      return;
    }

    this._baked = true;

    let nodes = this._nodes.concat();
    let i = nodes.length;

    while (i--) {
      let node = nodes[i];
      if (!node) {
        continue;
      }
      let fName = node.fName;
      let args = node.args;

      if (fName === "_repeatLast") {
        nodes.splice(i, 1);
        //i--;
        let len = nodes.length;
        let steps = args[0];
        let times = args[1];

        if (steps > 0 && steps <= len) {
          let r = nodes.slice(i - steps, i);
          let tmp = nodes.slice(0, i);
          let tmp2 = nodes.slice(i, nodes.length);
          for (let j = 0; j < times; j++) {
            tmp = tmp.concat(r);
            i += steps;
          }
          nodes = tmp.concat(tmp2);
          if (i > 8192 || nodes.length > 8192) {
            console.error("too many nodes");
            break;
          }
        }
      }
    }

    const privateFunctionMap: { [key: string]: Function } = {
      _defaultStyle: this._defaultStyle,
      _add: this._add,
      _subtract: this._subtract,
      _intersect: this._intersect,
      _boolean: this._boolean,
      _breakApart: this._breakApart,
      _moveTo: this._moveTo,
      _move: this._move,
      _forward: this._forward,
      _rotateTo: this._rotateTo,
      _rotate: this._rotate,
      _stepBack: this._stepBack,
      _circle: this._circle,
      _ellipse: this._ellipse,
      _rectangle: this._rectangle,
      _reset: this._reset,
      _roundedRectangle: this._roundedRectangle,
      _bone: this._bone,
      _polygon: this._polygon,
      _stamp: this._stamp,
      _tangram: this._tangram,
      _roundedTangram: this._roundedTangram,
    };

    let breakApartTimes = 0;

    for (let i = 0; i < nodes.length; i++) {
      let fName = nodes[i].fName;
      let fn: Function = privateFunctionMap[fName];
      let args = nodes[i].args;
      if (fName === "_breakApart") {
        breakApartTimes++;
        continue;
      }
      if (fn) {
        fn.apply(this, args);
      }
    }

    this._polys = this._tree
      ? ClipperHelpers.polyTreeToPolygons(this._tree)
      : [];

    for (let i = 0; i < breakApartTimes; i++) {
      this._breakApart();
    }
    
    this.mapStyles();

    const offset = this.alignmentOffset();

    const applyOffsetToPoly = (p: Polygon) => {
      p.rays.forEach((r) => {
        r.x += offset.x;
        r.y += offset.y;
      });
      p.children().forEach((child) => {
        if (child instanceof Polygon) {
          applyOffsetToPoly(child as Polygon);
        }
      });
    };

    this._polys.forEach(applyOffsetToPoly);

    return this;
  }

  getNodes() {
    return this._nodes;
  }

  setNodes(nodes: INode[]): Stamp {
    this._nodes = nodes;
    return this;
  }

  /**
   * @returns {String}
   */
  toString() {
    return JSON.stringify([this._nodes]);
  }

  fromString(data: string): Stamp {
    try {
      let h = JSON.parse(data);
      this._nodes = h[0];
    } catch (err) {
      console.error(err);
    }
    return this;
  }

  clone(): Stamp {
    let stamp = new Stamp(this.center.clone(), this.alignment, this.reverse);
    stamp.isHole = this.isHole;
    stamp.hidden = this.hidden;
    return stamp.fromString(this.toString());
  }

  copy(stamp: Stamp): Stamp {
    // @ts-ignore
    this._nodes = stamp._nodes.concat();
    return stamp;
  }
}
