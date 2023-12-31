import { GeomHelpers } from "./geom/helpers";
import {
  AbstractShape,
  BoundingBox,
  Circle,
  IShape,
  IStyle,
  Point,
  Polygon,
  Ray,
  Rectangle,
  RoundedRectangle,
  ShapeAlignment,
} from "./geom/shapes";
import { Sequence } from "./sequence";
import * as clipperLib from "js-angusj-clipper/web";

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0 ? arg : Sequence.resolve(arg)
    : typeof arg === "number"
    ? arg
    : 0;

interface IShapeParams {
  angle?: number | string;
  segments?: number | string;
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

function paramsWithDefaults<T extends IShapeParams>(params: IShapeParams): T {
  params = Object.assign({}, params);
  params.angle = params.angle ?? 0;
  params.segments = params.segments ?? 1;
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

  static clipper: clipperLib.ClipperLibWrapper;

  static async init() {
    Stamp.clipper = await clipperLib.loadNativeClipperLibInstanceAsync(
      // let it autodetect which one to use, but also available WasmOnly and AsmJsOnly
      clipperLib.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback
    );
    return !!Stamp.clipper;
  }

  _nodes: INode[] = [];
  _tree: clipperLib.PolyTree | null = null;
  _trees: clipperLib.PolyTree[] = [];
  _polys: Polygon[] = [];
  _polygroups: Polygon[][] = [];
  _styleMap: IStyleMap[] = [];

  colorIdx: number = 0;
  mode: number = Stamp.UNION;

  offsetX: number = 0;
  offsetY: number = 0;
  cursor: Ray = new Ray(0, 0, 0);

  baked: boolean = false;

  constructor(
    center?: Ray,
    segments: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, segments, alignment, reverse);
  }

  private _reset() {
    this._tree = null;
    this._trees = [];
    this._polys = [];
    this._polygroups = [];
    this._styleMap = [];
    this.mode = Stamp.UNION;
    this.baked = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.cursor.x = this.cursor.y = this.cursor.direction = 0;
  }

  private _add() {
    this.mode = Stamp.UNION;
  }

  private _subtract() {
    this.mode = Stamp.SUBTRACT;
  }

  private _intersect() {
    this.mode = Stamp.INTERSECT;
  }

  private _boolean(type: string | number) {
    if (typeof type === "string") {
      type = Sequence.resolve(type);
    }
    if (type <= 0) {
      this.mode = Stamp.SUBTRACT;
    } else {
      this.mode = Stamp.UNION;
    }
  }

  private _next() {
    if (this._tree) {
      this._trees.push(this._tree);
      this._tree = null;
      this.mode = Stamp.UNION;
    }
  }

  private _moveTo(x: number | string, y: number | string) {
    this.cursor.x = $(x);
    this.cursor.y = $(y);
  }

  private _move(x: number | string, y: number | string) {
    const v = new Point($(x), $(y));
    GeomHelpers.rotatePoint(v, this.cursor.direction);
    this.cursor.x += v.x;
    this.cursor.y += v.y;
  }

  private _offset(x: number | string, y: number | string) {
    this.offsetX += $(x);
    this.offsetY += $(y);
  }

  private _rotateTo(r: number | string) {
    this.cursor.direction = $(r);
  }

  private _rotate(r: number | string) {
    this.cursor.direction = GeomHelpers.normalizeAngle(
      this.cursor.direction + $(r)
    );
  }

  private _toPaths(shape: IShape): {
    data: clipperLib.IntPoint[] | clipperLib.IntPoint[][];
    closed: boolean;
  } {
    let rays = shape.generate();
    if (rays.length === 0 && shape.children().length === 1) {
      rays = shape.children()[0].generate();
      shape = shape.children()[0];
    }
    const paths = [];
    let path = rays.map(
      (r) =>
        ({
          x: Math.round(r.x * 10000),
          y: Math.round(r.y * 10000),
        } as clipperLib.IntPoint)
    );
    paths.push(path);
    shape.children().forEach((s) => {
      let p = this._toPaths(s);
      paths.push(...p.data);
    });
    return {
      data: paths,
      closed: true,
    };
  }

  private _polyTreeToPolygons(polyTree: clipperLib.PolyTree): Polygon[] {
    let polygons: Polygon[] = [];
    const polyNodeToPolygon = (node: clipperLib.PolyNode): Polygon => {
      const rays: Ray[] = [];
      if (node.contour.length) {
        for (let j = 0; j < node.contour.length; j++) {
          let p = node.contour[j];
          rays.push(
            new Ray(
              Math.round(p.x - 10000) / 10000,
              Math.round(p.y - 10000) / 10000
            )
          );
        }
        rays.push(rays[0].clone());
      }
      let polygon: Polygon = new Polygon(new Ray(0, 0), rays, 1);
      polygon.isHole = node.isHole;
      if (node.childs.length) {
        for (let j = 0; j < node.childs.length; j++) {
          let childNode = node.childs[j];
          let child = polyNodeToPolygon(childNode);
          if (child && polygon) {
            polygon.addChild(child);
          }
        }
      }
      return polygon;
    };

    polyTree.childs.forEach((node) => {
      const polygon = polyNodeToPolygon(node);
      if (polygon) {
        polygons.push(polygon);
      }
    });

    return polygons;
  }

  private _make(shapes: IShape[], outln: number = 0) {
    for (let i = 0; i < shapes.length; i++) {
      let shape: IShape | undefined = shapes[i];

      if (!shape) {
        break;
      }



      let g = shape.clone();

      g.center.x += this.cursor.x + this.center.x;
      g.center.y += this.cursor.y + this.center.y;
      GeomHelpers.rotatePointAboutOrigin(this.center, g.center);
      GeomHelpers.rotatePointAboutOrigin(this.cursor, g.center);
      g.center.direction += this.center.direction + this.cursor.direction;

      if (shape.style) {

        const style = resolveStyle(shape.style);

        if (this.mode !== Stamp.SUBTRACT && !shape.hidden) {
          this._styleMap.push({
            bounds: g.boundingBox(),
            style,
          })
        }

      }

      let b: clipperLib.SubjectInput;
      let b2 = null;

      switch (this.mode) {
        case Stamp.UNION:
          if (this._tree) {
            b2 = this._toPaths(g);
            if (g.hidden) {
              continue;
            }
            if (outln) {
              const offsetResult = Stamp.clipper.offsetToPolyTree({
                delta: outln * 10000,
                offsetInputs: [
                  {
                    data: b2.data,
                    joinType: clipperLib.JoinType.Miter,
                    endType: clipperLib.EndType.ClosedPolygon,
                  },
                ],
              });
              if (offsetResult) {
                let paths = Stamp.clipper.polyTreeToPaths(this._tree);
                let offsetPaths = Stamp.clipper.polyTreeToPaths(offsetResult);
                const polyResult = Stamp.clipper.clipToPolyTree({
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
            let paths = Stamp.clipper.polyTreeToPaths(this._tree);
            const polyResult = Stamp.clipper.clipToPolyTree({
              clipType: clipperLib.ClipType.Union,
              subjectInputs: [{ data: paths, closed: true }],
              clipInputs: [b2],
              subjectFillType: clipperLib.PolyFillType.EvenOdd,
            });
            //const paths = Stamp.clipper.polyTreeToPaths(polyResult);
            this._tree = polyResult;
          } else {
            b = this._toPaths(g);
            if (g.hidden) {
              continue;
            }
            const polyResult = Stamp.clipper.clipToPolyTree({
              clipType: clipperLib.ClipType.Union,
              subjectInputs: [b],
              subjectFillType: clipperLib.PolyFillType.EvenOdd,
            });
            this._tree = polyResult;
          }
          break;

        case Stamp.SUBTRACT:
          if (this._tree) {
            b2 = this._toPaths(g);
            if (g.hidden) {
              continue;
            }
            let paths = Stamp.clipper.polyTreeToPaths(this._tree);
            const polyResult = Stamp.clipper.clipToPolyTree({
              clipType: clipperLib.ClipType.Difference,
              subjectInputs: [{ data: paths, closed: true }],
              clipInputs: [b2],
              subjectFillType: clipperLib.PolyFillType.EvenOdd,
            });
            //const paths = Stamp.clipper.polyTreeToPaths(polyResult);
            this._tree = polyResult;
          }
          break;

        case Stamp.INTERSECT:
          if (this._tree) {
            b2 = this._toPaths(g);
            if (g.hidden) {
              continue;
            }
            let paths = Stamp.clipper.polyTreeToPaths(this._tree);
            const polyResult = Stamp.clipper.clipToPolyTree({
              clipType: clipperLib.ClipType.Intersection,
              subjectInputs: [{ data: paths, closed: true }],
              clipInputs: [b2],
              subjectFillType: clipperLib.PolyFillType.EvenOdd,
            });
            //const paths = Stamp.clipper.polyTreeToPaths(polyResult);
            this._tree = polyResult;
          }
          break;
      }
    }

    return this;
  }

  private _colorIndex(idx: number) {
    this.colorIdx = idx;
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
        const s = new Circle(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            nspy * j - o.y + $(params.offsetY),
            0
          ),
          $(params.radius),
          $(params.segments),
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
        const s = new Rectangle(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            +nspy * j - o.y + $(params.offsetY),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.width),
          $(params.height),
          $(params.segments),
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
        const s = new RoundedRectangle(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            +nspy * j - o.y + $(params.offsetY),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          $(params.width),
          $(params.height),
          $(params.cornerRadius),
          $(params.segments),
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
        const s = new Polygon(
          new Ray(
            nspx * i - o.x + $(params.offsetX),
            +nspy * j - o.y + $(params.offsetY),
            params.angle ? ($(params.angle) * Math.PI) / 180 : 0
          ),
          params.rayStrings.map((s) => new Ray(0, 0).fromString(s)),
          $(params.segments),
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
          1,
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

  reset() {
    this._nodes.push({ fName: "_reset", args: Array.from(arguments) });
    return this;
  }

  materialIndex(idx = 1) {
    this._nodes.push({ fName: "_materialIndex", args: [idx] });
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

  repeatLast(steps: number, times: number = 1) {
    this._nodes.push({ fName: "_repeatLast", args: [steps, times] });
    return this;
  }

  generate(): Ray[] {
    if (!this.baked) {
      this.bake();
    }
    return [];
  }

  children() {
    if (!this.baked) {
      this.bake();
    }
    return this._polys;
  }

  getCursor(): Ray {
    return this.cursor;
  }

  getLastMode() {
    let i = this._nodes.length;

    while (i--) {
      let node = this._nodes[i];
      if (node.fName == "_add") {
        return Stamp.UNION;
      }
      if (node.fName == "_subtract") {
        return Stamp.SUBTRACT;
      }
    }

    return Stamp.UNION;
  }

  getLastColorIndex() {
    let i = this._nodes.length;

    while (i--) {
      let node = this._nodes[i];
      if (node.fName == "_colorIndex") {
        return node.args[0];
      }
    }

    return 0;
  }

  mapStyles() {
    // sort style map by bounds area
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
        }
      }
    }
  }

  /**
   * Bakes the CSG solution into a final tree
   * @param {boolean} rebake whether to re-bake a baked shape
   */
  bake(rebake = false) {
    if (this.baked && !rebake) {
      return;
    }

    this.baked = true;

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
          if (i > 4096 || nodes.length > 4096) {
            console.error("too many nodes");
            break;
          }
        }
      }
    }

    const privateFunctionMap: { [key: string]: Function } = {
      _add: this._add,
      _subtract: this._subtract,
      _intersect: this._intersect,
      _boolean: this._boolean,
      _next: this._next,
      _moveTo: this._moveTo,
      _move: this._move,
      _offset: this._offset,
      _rotateTo: this._rotateTo,
      _rotate: this._rotate,
      _colorIndex: this._colorIndex,
      _circle: this._circle,
      _rectangle: this._rectangle,
      _reset: this._reset,
      _roundedRectangle: this._roundedRectangle,
      _polygon: this._polygon,
      _stamp: this._stamp,
    };

    for (let i = 0; i < nodes.length; i++) {
      let fName = nodes[i].fName;
      let fn: Function = privateFunctionMap[fName];
      let args = nodes[i].args;
      if (fn) {
        fn.apply(this, args);
      }
    }

    this._polys = this._tree ? this._polyTreeToPolygons(this._tree) : [];

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
    let stamp = new Stamp(
      this.center.clone(),
      this.segments,
      this.alignment,
      this.reverse
    );
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
