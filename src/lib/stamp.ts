import * as clipperLib from "js-angusj-clipper/web";
import {
  BoundingBox,
  BoundingCircle,
  Heading,
  IShape,
  IStyle,
  Path,
  Point,
  Ray,
  ShapeAlignment,
} from "../geom/core";
import { GeomHelpers } from "../geom/helpers";
import {
  AbstractShape,
  Arch,
  Bone,
  Circle,
  Ellipse,
  LeafShape,
  Polygon,
  Rectangle,
  RoundedRectangle,
  Trapezoid,
} from "../geom/shapes";
import { Donut } from "../geom/compoundshapes";
import { RoundedTangram, Tangram } from "../geom/tangram";
import { ClipperHelpers } from "./clipper-helpers";
import { Optimize } from "./optimize";
import { StampsProvider } from "./stamps-provider";
import {
  cloneNode,
  paramsWithDefaults,
  resolveStyle,
  resolveStringOrNumber,
} from "./stamp-helpers";
import {
  IArchParams,
  IBoneParams,
  IBoundsParams,
  ICircleParams,
  IEllipseParams,
  ILeafShapeParams,
  INode,
  IPolygonParams,
  IRectangleParams,
  IRoundedRectangleParams,
  IStampParams,
  IStyleMap,
  ITangramParams,
  ITrapezoidParams,
  IShapeContext,
  IShapeHandlerRegistry,
  IShapeHandler,
} from "./stamp-interfaces";
import { defaultShapeRegistry, ShapeHandlerRegistry } from "./shapes";

const $ = resolveStringOrNumber;

export class Stamp extends AbstractShape implements IShapeContext {
  static readonly NONE = 0;
  static readonly UNION = 1;
  static readonly SUBTRACT = 2;
  static readonly INTERSECT = 3;

  private _nodes: INode[] = [];
  private _tree: clipperLib.PolyTree | null = null;
  private _polys: Polygon[] = [];
  private _unclippedShapes: {
    mode: number;
    shape: IShape;
    outln: number;
    scale: number;
  }[] = [];
  private _boundsStart: number = 0;
  private _boundsEnd: number = 0;
  private _currentBounds: BoundingBox = new BoundingBox(0, 0, 0, 0);
  private _overrideBounds: BoundingBox | null = null;
  private _flipBeforeClip: boolean = false;
  private _styleMap: IStyleMap[] = [];
  private _mode: number = Stamp.UNION;
  private _cursor: Ray = new Ray(0, 0, 0);
  private _cursorHistory: Ray[] = [];
  private _cursorBounds: BoundingBox = new BoundingBox(0, 0, 0, 0);
  private _cropBounds: BoundingBox = new BoundingBox(0, 0, 0, 0);
  private _baked: boolean = false;
  private _bakedAlignmentOffset: Point = new Point(0, 0);
  private _shapeRegistry: IShapeHandlerRegistry;

  constructor(
    center?: Ray,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false,
    shapeRegistry?: IShapeHandlerRegistry,
  ) {
    super(center, 1, alignment, reverse);
    this._shapeRegistry = shapeRegistry || defaultShapeRegistry;
  }

  boundingCircle(): BoundingCircle {
    if (this._overrideBounds) {
      const scale = this.scale || 1;
      return new BoundingCircle(
        this.center.x,
        this.center.y,
        Math.max(
          this._overrideBounds.width * scale,
          this._overrideBounds.height * scale,
        ) / 2,
      );
    }
    return super.boundingCircle();
  }

  boundingBox(): BoundingBox {
    if (this._overrideBounds) {
      const scale = this.scale || 1;
      return new BoundingBox(
        this.center.x - (this._overrideBounds.width / 2) * scale,
        this.center.y - (this._overrideBounds.height / 2) * scale,
        this._overrideBounds.width * scale,
        this._overrideBounds.height * scale,
      );
    }
    return super.boundingBox();
  }

  private _reset() {
    this._tree = null;
    this._polys = [];
    this._unclippedShapes = [];
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
      type = $(type);
    }
    switch (type) {
      case 0:
        this._mode = Stamp.NONE;
        break;
      case 1:
        this._mode = Stamp.UNION;
        break;
      case 2:
        this._mode = Stamp.SUBTRACT;
        break;
      case 3:
        this._mode = Stamp.INTERSECT;
        break;
      default:
        this._mode = Stamp.UNION;
        break;
    }
  }

  private _breakApart() {
    let newPolys: Polygon[] = [];

    const ungroupAll = (poly: Polygon) => {
      if (poly.children().length > 0) {
        poly.children().forEach((p) => ungroupAll(p as Polygon));
      } else {
        newPolys.push(poly);
      }
    };

    if (this._polys.length >= 1) {
      this._polys.forEach((p) => {
        ungroupAll(p);
      });
      this._polys = newPolys;
    }
  }

  private _set(sequenceCall: string) {
    if (sequenceCall.indexOf("()") == -1) {
      sequenceCall += "()";
    }
    $(sequenceCall);
    this._cursorHistory.push(this._cursor.clone());
  }

  private _setCursorBounds(
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    this._cursorBounds.x = x;
    this._cursorBounds.y = y;
    this._cursorBounds.width = width;
    this._cursorBounds.height = height;
  }

  private _moveTo(x: number | string, y: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    if (x !== undefined) {
      this._cursor.x = $(x);
    }
    console.log(y);
    if (y !== undefined) {
      this._cursor.y = $(y);
    }
  }

  private _move(x: number | string, y: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    const v = new Point($(x), $(y));
    GeomHelpers.rotatePoint(v, this._cursor.direction);
    this._cursor.x += v.x;
    this._cursor.y += v.y;
  }

  private _markBoundsStart() {
    this._boundsStart = this._unclippedShapes.length;
    this._boundsEnd = 100000;
  }

  private _markBoundsEnd() {
    this._boundsEnd = this._unclippedShapes.length;
  }

  private _moveOver(heading: number, perc: number = 1) {
    this._cursorHistory.push(this._cursor.clone());
    switch (heading) {
      case Heading.UP:
        this._cursor.y -= this._currentBounds.height * perc;
        break;
      case Heading.RIGHT:
        this._cursor.x += this._currentBounds.width * perc;
        break;
      case Heading.DOWN:
        this._cursor.y += this._currentBounds.height * perc;
        break;
      case Heading.LEFT:
        this._cursor.x -= this._currentBounds.width * perc;
        break;
    }
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
    this._cursor.direction = ($(r) * Math.PI) / 180;
  }

  private _rotate(r: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    const rdeg = $(r);
    const rn = (rdeg * Math.PI) / 180;
    this._cursor.direction = GeomHelpers.normalizeAngle(
      this._cursor.direction + rn,
    );
  }

  private _crop(x: number, y: number, width: number, height: number) {
    this._cropBounds.x = x;
    this._cropBounds.y = y;
    this._cropBounds.width = width;
    this._cropBounds.height = height;
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

  private _make(shapes: IShape[], outln: number = 0, scale: number = 1) {
    scale = scale || 1;
    if (this._cursorBounds.width > 0 && this._cursorBounds.height > 0) {
      if (
        !GeomHelpers.pointIsWithinBoundingBox(this._cursor, this._cursorBounds)
      ) {
        return;
      }
    }
    for (let i = 0; i < shapes.length; i++) {
      let shape: IShape | undefined = shapes[i];

      if (!shape) {
        break;
      }

      let g: IShape = shape.clone();

      // TODO: make shape clone copy style
      if (shape.style) {
        g.style = Object.assign({}, shape.style);
      }

      g.center.x += this.center.x + this._cursor.x;
      g.center.y += this.center.y + this._cursor.y;
      g.center.direction += this.center.direction + this._cursor.direction;

      this._unclippedShapes.push({
        mode: this._mode,
        shape: g,
        outln: outln,
        scale: scale,
      });
    }
    // set bounding box from bounding boxes of all shapes since last markBoundsStart
    this._currentBounds = GeomHelpers.shapesBoundingBox(
      this._unclippedShapes
        .slice(this._boundsStart, this._boundsEnd)
        .map((s) => s.shape),
    );
  }

  private _clipShapes() {
    for (let i = 0; i < this._unclippedShapes.length; i++) {
      let g = this._unclippedShapes[i].shape;
      let outln = this._unclippedShapes[i].outln;
      let mode = this._unclippedShapes[i].mode;
      let scale = this._unclippedShapes[i].scale;

      if (g.style && g.style !== AbstractShape.defaultStyle) {
        const style = resolveStyle(g.style);
        if (mode !== Stamp.SUBTRACT && !g.hidden) {
          this._styleMap.push({
            bounds: g.boundingBox(),
            style,
          });
        }
      }

      let gbb = g.boundingBox();
      if (gbb.width === 0 || gbb.height === 0) {
        continue;
      }

      let b: clipperLib.SubjectInput;
      let b2 = null;

      switch (mode) {
        case Stamp.NONE:
          if (!this._polys) {
            this._polys = [];
          }
          this._polys.push(new Polygon(g.center, g.generate()));
          break;
        case Stamp.UNION:
          if (this._tree) {
            b2 = ClipperHelpers.shapeToClipperPaths(g, scale);
            if (g.hidden) {
              continue;
            }
            if (outln > 0) {
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
            } else if (outln < 0) {
              const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                delta: -outln * 100000,
                offsetInputs: [
                  {
                    data: b2.data,
                    joinType: clipperLib.JoinType.Round,
                    endType: clipperLib.EndType.ClosedPolygon,
                  },
                ],
                arcTolerance: 5000,
              });
              if (offsetResult) {
                let paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);
                let offsetPaths =
                  ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                  clipType: clipperLib.ClipType.Union,
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
            b = ClipperHelpers.shapeToClipperPaths(g, scale);
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
                if (outln < 0) {
                  const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                    delta: -outln * 100000,
                    offsetInputs: [
                      {
                        data: b.data,
                        joinType: clipperLib.JoinType.Round,
                        endType: clipperLib.EndType.ClosedPolygon,
                      },
                    ],
                    arcTolerance: 5000,
                  });
                  if (offsetResult) {
                    let paths = ClipperHelpers.clipper.polyTreeToPaths(
                      this._tree,
                    );
                    let offsetPaths =
                      ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                    const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                      clipType: clipperLib.ClipType.Union,
                      subjectInputs: [{ data: paths, closed: true }],
                      clipInputs: [{ data: offsetPaths }],
                      subjectFillType: clipperLib.PolyFillType.EvenOdd,
                    });
                    this._tree = polyResult;
                  } else {
                    console.log("error offseting", outln);
                  }
                }
              }
            } catch (e) {
              console.log("error unioning", e);
            }
          }
          break;

        case Stamp.SUBTRACT:
          if (this._tree) {
            b2 = ClipperHelpers.shapeToClipperPaths(g, scale);
            if (g.hidden) {
              continue;
            }

            if (outln > 0) {
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
                  clipType: clipperLib.ClipType.Union,
                  subjectInputs: [{ data: paths, closed: true }],
                  clipInputs: [{ data: offsetPaths }],
                  subjectFillType: clipperLib.PolyFillType.EvenOdd,
                });
                this._tree = polyResult;
              } else {
                console.log("error offseting", outln);
              }
            } else if (outln < 0) {
              const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                delta: -outln * 100000,
                offsetInputs: [
                  {
                    data: b2.data,
                    joinType: clipperLib.JoinType.Round,
                    endType: clipperLib.EndType.ClosedPolygon,
                  },
                ],
                arcTolerance: 5000,
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
            b2 = ClipperHelpers.shapeToClipperPaths(g, scale);
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

  // IShapeContext interface methods
  getGroupOffset(nx: number, ny: number, spx: number, spy: number): Point {
    return this._getGroupOffset(nx, ny, spx, spy);
  }

  make(shapes: IShape[], outlineThickness: number = 0, scale: number = 1): void {
    this._make(shapes, outlineThickness, scale);
  }

  getCursorDirection(): number {
    return this._cursor.direction;
  }

  resolveStringOrNumber(value: string | number): number {
    return $(value);
  }

  /**
   * Register a custom shape handler
   */
  registerShapeHandler(shapeName: string, handler: IShapeHandler): void {
    this._shapeRegistry.register(shapeName, handler);
  }

  /**
   * Get the shape registry (for advanced use cases)
   */
  getShapeRegistry(): IShapeHandlerRegistry {
    return this._shapeRegistry;
  }

  private _stamp(params: IStampParams) {
    if (params.providerIndex !== undefined) {
      const stamp = StampsProvider.getInstance(
        params.providerIndex,
      ).nextStamp();
      if (stamp) {
        params.subStampString = stamp.toString();
      }
    }
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
        const center = new Ray(
          nspx * i - o.x + $(params.offsetX),
          nspy * j - o.y + $(params.offsetY),
          params.angle ? ($(params.angle) * Math.PI) / 180 : 0,
        );
        const s = new Stamp(center, $(params.align)).fromString(
          params.subStampString,
        );
        s.bake();
        if ($(params.skip) > 0) {
          s.hidden = true;
        }
        if (params.style) {
          s.style = params.style;
        }
        shapes.push(s);
      }
    }
    // TODO: this._align(shapes, $(params.align));
    this._make(shapes, $(params.outlineThickness), $(params.scale));
  }

  private _circle(params: ICircleParams) {
    const handler = this._shapeRegistry.getHandler('circle');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Circle handler not found in registry');
    }
  }

  private _ellipse(params: IEllipseParams) {
    const handler = this._shapeRegistry.getHandler('ellipse');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Ellipse handler not found in registry');
    }
  }

  private _arch(params: IArchParams) {
    const handler = this._shapeRegistry.getHandler('arch');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Arch handler not found in registry');
    }
  }

  private _leafShape(params: ILeafShapeParams) {
    const handler = this._shapeRegistry.getHandler('leafShape');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('LeafShape handler not found in registry');
    }
  }

  private _rectangle(params: IRectangleParams) {
    const handler = this._shapeRegistry.getHandler('rectangle');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Rectangle handler not found in registry');
    }
  }

  private _trapezoid(params: ITrapezoidParams) {
    const handler = this._shapeRegistry.getHandler('trapezoid');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Trapezoid handler not found in registry');
    }
  }

  private _roundedRectangle(params: IRoundedRectangleParams) {
    const handler = this._shapeRegistry.getHandler('roundedRectangle');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('RoundedRectangle handler not found in registry');
    }
  }

  private _polygon(params: IPolygonParams) {
    const handler = this._shapeRegistry.getHandler('polygon');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Polygon handler not found in registry');
    }
  }

  private _tangram(params: ITangramParams) {
    const handler = this._shapeRegistry.getHandler('tangram');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Tangram handler not found in registry');
    }
  }

  private _roundedTangram(params: ITangramParams) {
    const handler = this._shapeRegistry.getHandler('roundedTangram');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('RoundedTangram handler not found in registry');
    }
  }

  private _bone(params: IBoneParams) {
    const handler = this._shapeRegistry.getHandler('bone');
    if (handler) {
      handler.handle(params, this);
    } else {
      console.warn('Bone handler not found in registry');
    }
  }

  reset() {
    this._nodes.push({ fName: "_reset", args: Array.from(arguments) });
    return this;
  }

  defaultStyle(style: IStyle) {
    this._nodes.push({ fName: "_defaultStyle", args: [style] });
    return this;
  }

  noBoolean() {
    this._nodes.push({ fName: "_boolean", args: [Stamp.NONE] });
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

  markBoundsStart(params?: IBoundsParams) {
    this._nodes.push({ fName: "_markBoundsStart", args: [params] });
    return this;
  }

  markBoundsEnd() {
    this._nodes.push({ fName: "_markBoundsEnd", args: [] });
    return this;
  }

  next() {
    this._nodes.push({ fName: "_next", args: Array.from(arguments) });
    return this;
  }

  set(sequenceCall: string) {
    this._nodes.push({ fName: "_set", args: [sequenceCall] });
    return this;
  }

  setBounds(width: number, height: number) {
    this._overrideBounds = new BoundingBox(0, 0, width, height);
    return this;
  }

  setCursorBounds(x: number, y: number, width: number, height: number) {
    this._nodes.push({
      fName: "_setCursorBounds",
      args: [x, y, width, height],
    });
    return this;
  }

  moveTo(
    x: number | string | undefined = undefined,
    y: number | string | undefined = undefined,
  ) {
    this._nodes.push({ fName: "_moveTo", args: [x, y] });
    return this;
  }

  move(x: number | string = 0, y: number | string = 0) {
    this._nodes.push({ fName: "_move", args: [x, y] });
    return this;
  }

  moveOver(direction: number, perc: number) {
    this._nodes.push({ fName: "_moveOver", args: [direction, perc] });
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

  /**
   * removes any nodes with the given tag
   * @param tag
   * @returns
   */
  removeTag(tag: string) {
    let i = this._nodes.length;
    while (i--) {
      if (this._nodes[i].tag === tag) {
        this._nodes.splice(i, 1);
        // reduce any repeatLasts steps by 1
        for (let j = i; j < this._nodes.length; j++) {
          if (this._nodes[j].fName === "_repeatLast") {
            this._nodes[j].args[0]--;
          }
        }
      }
    }
    return this;
  }

  skipTag(tag: string, condition: string) {
    let i = this._nodes.length;
    while (i--) {
      if (this._nodes[i].tag === tag) {
        if (typeof this._nodes[i].args[0] === "object") {
          this._nodes[i].args[0].skip = condition;
        }
      }
    }
    return this;
  }

  /**
   * replaces any occurances of named sequences
   * @param oldName
   * @param newName
   * @returns
   */
  replaceVariable(oldName: string, newName: string) {
    this._nodes.forEach((node) => {
      node.args.forEach((arg, idx) => {
        if (arg === oldName) {
          arg = newName;
        }
        if (arg === `${oldName}()`) {
          arg = `${newName}()`;
        }
        node.args[idx] = arg;
      });
    });
    return this;
  }

  /**
   * crops the stamp to the given bounds
   * @param x
   * @param y
   * @param width
   * @param height
   * @returns
   */
  crop(x: number, y: number, width: number, height: number) {
    this._nodes.push({ fName: "_crop", args: [x, y, width, height] });
    return this;
  }

  circle(params: ICircleParams) {
    params = paramsWithDefaults<ICircleParams>(params);
    this._nodes.push({
      fName: "_circle",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  arch(params: IArchParams) {
    params = paramsWithDefaults<IArchParams>(params);
    this._nodes.push({
      fName: "_arch",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  ellipse(params: IEllipseParams) {
    params = paramsWithDefaults<IEllipseParams>(params);
    this._nodes.push({
      fName: "_ellipse",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  leafShape(params: ILeafShapeParams) {
    params = paramsWithDefaults<ILeafShapeParams>(params);
    this._nodes.push({
      fName: "_leafShape",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  rectangle(params: IRectangleParams) {
    params = paramsWithDefaults<IRectangleParams>(params);
    this._nodes.push({
      fName: "_rectangle",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  trapezoid(params: ITrapezoidParams) {
    params = paramsWithDefaults<ITrapezoidParams>(params);
    this._nodes.push({
      fName: "_trapezoid",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  roundedRectangle(params: IRoundedRectangleParams) {
    params = paramsWithDefaults<IRoundedRectangleParams>(params);
    this._nodes.push({
      fName: "_roundedRectangle",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  bone(params: IBoneParams) {
    params = paramsWithDefaults<IBoneParams>(params);
    this._nodes.push({
      fName: "_bone",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  polygon(params: IPolygonParams) {
    params = paramsWithDefaults<IPolygonParams>(params);
    params.rayStrings = params.rays.map((r) => r.toString());
    this._nodes.push({
      fName: "_polygon",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  stamp(params: IStampParams) {
    params = paramsWithDefaults<IStampParams>(params);
    if (params.subStamp instanceof StampsProvider) {
      params.providerIndex = params.subStamp.instanceIndex();
    } else {
      params.subStampString = params.subStamp.toString();
    }
    this._nodes.push({
      fName: "_stamp",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  tangram(params: ITangramParams) {
    params = paramsWithDefaults<ITangramParams>(params);
    this._nodes.push({
      fName: "_tangram",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  roundedTangram(params: ITangramParams) {
    params = paramsWithDefaults<ITangramParams>(params);
    this._nodes.push({
      fName: "_roundedTangram",
      tag: params.tag,
      args: [params],
    });
    return this;
  }

  repeatLast(steps: number, times: number | string = 1) {
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

  path(
    scale: number = 1,
    optimize: boolean = true,
    mergeConnectedPaths: boolean = true,
  ): Path[] {
    if (!this._baked) {
      this.bake();
    }
    let points = this._cursorHistory.map((p) => new Point(p.x, p.y));
    points.push(this._cursor.clone());

    const offset = this._bakedAlignmentOffset;

    if (offset) {
      points.forEach((p) => {
        p.x += offset.x;
        p.y += offset.y;
      });
    }

    if (this.center) {
      points.forEach((p) => {
        p.x += this.center.x;
        p.y += this.center.y;
      });
    }

    if (scale !== 1) {
      points.forEach((p) => {
        p.x -= this.center.x;
        p.y -= this.center.y;
        p.x *= scale;
        p.y *= scale;
        p.x += this.center.x;
        p.y += this.center.y;
      });
    }

    let seg = new Path(points);

    if (optimize) {
      let optimizedSegs = Optimize.paths([seg], mergeConnectedPaths);
      return optimizedSegs;
    }

    return [seg];
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
      (poly) => !mappedPolys.includes(poly),
    );
    unmappedPolys.forEach((poly) => {
      poly.style = resolveStyle(this.style);
    });
  }

  /**
   * Flips the order of the shapes before clipping
   */
  flip() {
    this._flipBeforeClip = !this._flipBeforeClip;
    return this;
  }

  /**
   * Extends the stamp with another stamp
   */
  extends(other: Stamp) {
    const newNodes = other._nodes.map((node) => cloneNode(node));
    this._nodes.push(...newNodes);
    return this;
  }

  /**
   * Bakes the clipped solution into a final polytree
   * @param rebake whether to re-bake a baked shape
   */
  bake(rebake: boolean = false): Stamp {
    if (this._baked && !rebake) {
      return this;
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
        let times = $(args[1]);

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
      _add: this._add,
      _arch: this._arch,
      _bone: this._bone,
      _boolean: this._boolean,
      _breakApart: this._breakApart,
      _circle: this._circle,
      _crop: this._crop,
      _defaultStyle: this._defaultStyle,
      _ellipse: this._ellipse,
      _forward: this._forward,
      _intersect: this._intersect,
      _leafShape: this._leafShape,
      _markBoundsEnd: this._markBoundsEnd,
      _markBoundsStart: this._markBoundsStart,
      _move: this._move,
      _moveOver: this._moveOver,
      _moveTo: this._moveTo,
      _polygon: this._polygon,
      _rectangle: this._rectangle,
      _reset: this._reset,
      _rotate: this._rotate,
      _rotateTo: this._rotateTo,
      _roundedRectangle: this._roundedRectangle,
      _roundedTangram: this._roundedTangram,
      _set: this._set,
      _setCursorBounds: this._setCursorBounds,
      _stamp: this._stamp,
      _stepBack: this._stepBack,
      _subtract: this._subtract,
      _tangram: this._tangram,
      _trapezoid: this._trapezoid,
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

    if (this._flipBeforeClip) {
      this._unclippedShapes.reverse();
    }

    this._clipShapes();

    if (this._tree) {
      if (this._cropBounds.width > 0 && this._cropBounds.height > 0) {
        const paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);
        const pts = this._cropBounds.toPoints();
        pts.forEach((pt) => {
          pt.x += this.center.x;
          pt.y += this.center.y;
        });
        const clipRect = ClipperHelpers.shapeToClipperPaths(
          new Polygon(new Ray(0, 0), pts),
          1,
        );
        const polyResult = ClipperHelpers.clipper.clipToPolyTree({
          clipType: clipperLib.ClipType.Intersection,
          subjectInputs: [{ data: paths, closed: true }],
          clipInputs: [clipRect],
          subjectFillType: clipperLib.PolyFillType.EvenOdd,
        });
        this._tree = polyResult;
      }
      this._polys = ClipperHelpers.polyTreeToPolygons(this._tree);
      for (let i = 0; i < breakApartTimes; i++) {
        this._breakApart();
      }
    }

    this.mapStyles();

    const offset = this.alignmentOffset();
    this._bakedAlignmentOffset = offset;

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

    const applyScaleToPoly = (p: Polygon) => {
      p.rays.forEach((r) => {
        r.x -= this.center.x;
        r.y -= this.center.y;
        r.x *= this.scale;
        r.y *= this.scale;
        r.x += this.center.x;
        r.y += this.center.y;
      });
      p.children().forEach((child) => {
        if (child instanceof Polygon) {
          applyScaleToPoly(child as Polygon);
        }
      });
    };

    this._polys.forEach(applyOffsetToPoly);
    this._polys.forEach(applyScaleToPoly);

    return this;
  }

  getNodes() {
    return this._nodes;
  }

  setNodes(nodes: INode[]): Stamp {
    this._nodes = nodes;
    return this;
  }

  toString(): string {
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
    stamp.hidden = this.hidden;
    stamp.isHole = this.isHole;
    stamp.scale = this.scale;
    if (this._overrideBounds) {
      stamp.setBounds(this._overrideBounds.width, this._overrideBounds.height);
    }
    if (this._baked && this._tree) {
      // clone the tree by unioning it with an empty path
      let paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);
      const polyResult = ClipperHelpers.clipper.clipToPolyTree({
        clipType: clipperLib.ClipType.Union,
        subjectInputs: [{ data: paths, closed: true }],
        clipInputs: [{ data: [] }],
        subjectFillType: clipperLib.PolyFillType.EvenOdd,
      });
      stamp._tree = polyResult;
      return stamp;
    }
    return stamp.fromString(this.toString());
  }

  copy(stamp: Stamp): Stamp {
    // @ts-ignore
    this._nodes = stamp._nodes.concat();
    return stamp;
  }
}
