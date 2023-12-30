import { GeomHelpers } from "./geom/helpers";
import { AbstractShape, Circle, IShape, Point, Polygon, Ray, Rectangle, RoundedRectangle, ShapeAlignment } from "./geom/shapes";
import { Sequence } from "./sequence";
import * as clipperLib from "js-angusj-clipper/web";

interface INode {
  fName: string;
  args: any[];
}

const $ = (arg: unknown) => typeof arg === "string" ? Sequence.resolve(arg) : typeof arg === "number" ? arg : 0;

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

  _colors?: string[];
  _nodes: INode[] = [];
  _bsp: clipperLib.PolyTree | null = null;
  _bsps: clipperLib.PolyTree[] = [];
  _polys: IShape[] = [];
  _polygroups: IShape[][] = [];
  _mats: string[] = [];

  colorIdx: number = 0;
  mode: number = Stamp.UNION;

  offsetX: number = 0;
  offsetY: number = 0;
  cursor: Ray = new Ray(0, 0, 0);

  baked: boolean = false;

  constructor(center?: Ray, segments: number = 1, alignment: ShapeAlignment = ShapeAlignment.CENTER, reverse: boolean = false) {
    super(center, segments, alignment, reverse);
  }

  private _reset () {
    this._bsp = null;
    this._bsps = [];
    this._polys = [];
    this._polygroups = [];
    this.mode = Stamp.UNION;
    this.baked = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.cursor.x = this.cursor.y = this.cursor.direction = 0;
  };

  private _add() {
    this.mode = Stamp.UNION;
  };

  private _subtract() {
    this.mode = Stamp.SUBTRACT;
  };

  private _intersect() {
    this.mode = Stamp.INTERSECT;
  }

  private _boolean (type: string | number) {
    if (typeof type === "string") {
      type = Sequence.resolve(type);
    }
    if (type <= 0) {
      this.mode = Stamp.SUBTRACT;
    } else {
      this.mode = Stamp.UNION;
    }
  };

  private _next () {
    if (this._bsp) {
      this._bsps.push(this._bsp);
      this._bsp = null
      this.mode = Stamp.UNION;
    }
  };

  private _moveTo (x: number | string, y: number | string) {
    this.cursor.x = $(x);
    this.cursor.y = $(y);
  };

  private _move (x: number | string, y: number | string) {
    const v = new Point($(x), $(y));
    GeomHelpers.rotatePoint(v, this.cursor.direction);
    this.cursor.x += v.x;
    this.cursor.y += v.y;
  };

  private _offset (x: number | string, y: number | string) {
    this.offsetX += $(x);
    this.offsetY += $(y);
  };

  private _rotateTo (r: number | string) {
    this.cursor.direction = $(r);
  };

  private _rotate (r: number | string) {
    this.cursor.direction = GeomHelpers.normalizeAngle(this.cursor.direction + $(r));
  };

  private _toPaths (shape: IShape): { data: clipperLib.IntPoint[] | clipperLib.IntPoint[][], closed: boolean } {
    let rays = shape.generate();
    if (rays.length === 0 && shape.children().length === 1) {
      rays = shape.children()[0].generate();
      shape = shape.children()[0];
    }
    const paths = [];
    let path = rays.map(r => ({ x: Math.round(r.x * 10000), y: Math.round(r.y * 10000) } as clipperLib.IntPoint));
    paths.push(path);
    shape.children().forEach((s) => {
      let p = this._toPaths(s);
      paths.push(...p.data);
    })
    return { 
      data: paths, 
      closed: true
    };
  }

  private _polyTreeToPolygons (polyTree: clipperLib.PolyTree): IShape[] {
    let polygons: IShape[] = [];
    const polyNodeToShape = (node: clipperLib.PolyNode): IShape => {
      const rays: Ray[] = [];
      if (node.contour.length) {
        for (let j = 0; j < node.contour.length; j++) {
          let p = node.contour[j];
          rays.push(new Ray(Math.round(p.x - 10000) / 10000, Math.round(p.y - 10000) / 10000));
        }
        rays.push(rays[0].clone());
      }
      let polygon: IShape = new Polygon(new Ray(0, 0), rays, 1);
      polygon.isHole = node.isHole;
      if (node.childs.length) {
        for (let j = 0; j < node.childs.length; j++) {
          let childNode = node.childs[j];
          let child = polyNodeToShape(childNode);
          if (child && polygon) {
            polygon.addChild(child);
          }
        }
      }
      return polygon;
    }
    
    polyTree.childs.forEach(node => {
      const polygon = polyNodeToShape(node);
      if (polygon) {
        polygons.push(polygon);
      }
    });

    return polygons;
  }

  private _make (shapes: IShape[]) {

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

        /*
        if (!this._bsp) {
          this._bsp = [];
        }

        this._bsp.push(g);
        */

        let b: clipperLib.SubjectInput;
        let b2 = null;

        switch (this.mode) {
          case Stamp.UNION:
            if (this._bsp) {
              b2 = this._toPaths(g);
              let paths = Stamp.clipper.polyTreeToPaths(this._bsp);
              const polyResult = Stamp.clipper.clipToPolyTree({
                clipType: clipperLib.ClipType.Union,
                subjectInputs: [{ data: paths, closed: true }],
                clipInputs: [b2],
                subjectFillType: clipperLib.PolyFillType.EvenOdd,
              });
              //const paths = Stamp.clipper.polyTreeToPaths(polyResult);
              this._bsp = polyResult;
            } else {
              b = this._toPaths(g);
              const polyResult = Stamp.clipper.clipToPolyTree({
                clipType: clipperLib.ClipType.Union,
                subjectInputs: [b],
                subjectFillType: clipperLib.PolyFillType.EvenOdd,
              });
              this._bsp = polyResult;
            }
            break;

          case Stamp.SUBTRACT:
            if (this._bsp) {
              b2 = this._toPaths(g);
              let paths = Stamp.clipper.polyTreeToPaths(this._bsp);
              const polyResult = Stamp.clipper.clipToPolyTree({
                clipType: clipperLib.ClipType.Difference,
                subjectInputs: [{ data: paths, closed: true }],
                clipInputs: [b2],
                subjectFillType: clipperLib.PolyFillType.EvenOdd,
              });
              //const paths = Stamp.clipper.polyTreeToPaths(polyResult);
              this._bsp = polyResult;
            }
            break;

          case Stamp.INTERSECT:
            if (this._bsp) {
              b2 = this._toPaths(g);
              let paths = Stamp.clipper.polyTreeToPaths(this._bsp);
              const polyResult = Stamp.clipper.clipToPolyTree({
                clipType: clipperLib.ClipType.Intersection,
                subjectInputs: [{ data: paths, closed: true }],
                clipInputs: [b2],
                subjectFillType: clipperLib.PolyFillType.EvenOdd,
              });
              //const paths = Stamp.clipper.polyTreeToPaths(polyResult);
              this._bsp = polyResult;
            }
            break;
        }

      }

      return this;
      
  };

  private _colorIndex (idx: number) {
    this.colorIdx = idx;
  };

  private _getGroupOffset (nx = 1, ny = 1, ox = 0, oy = 0): Point {
    const pt = new Point(0, 0);
    pt.x = (nx - 1) * (ox) * 0.5;
    pt.y = (ny - 1) * (oy) * 0.5;
    return pt;
  }

  private _circle(
    r: number | string, 
    s: number | string = 32, 
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    let o = this._getGroupOffset(nnx, nny, nox, noy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        shapes.push(new Circle(new Ray(nox * i - o.x, noy * j - o.y, 0), $(r), $(s), $(a)));
      }
    }
    this._make(shapes);
  }

  private _rectangle(
    w: number | string, 
    h: number | string, 
    ang: number | string, 
    s: number | string = 1,
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    let o = this._getGroupOffset(nnx, nny, nox, noy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        shapes.push(new Rectangle(new Ray(nox * i - o.x, + noy * j - o.y, ang ? $(ang) * Math.PI / 180 : 0), $(w), $(h), $(s), $(a)));
      }
    }
    this._make(shapes);
  }

  private _roundedRectangle(
    w: number | string, 
    h: number | string,
    ang: number | string,
    cr: number | string = 0,
    s: number | string = 1, 
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    let o = this._getGroupOffset(nnx, nny, nox, noy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        shapes.push(new RoundedRectangle(new Ray(nox * i - o.x, + noy * j - o.y, ang ? $(ang) * Math.PI / 180 : 0), $(w), $(h), $(cr), $(s), $(a)));
      }
    }
    this._make(shapes);
  }

  private _polygon(
    rayStrings: string[],
    ang: number | string = 0,
    s: number | string = 1,
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1,
    ny: number | string = 1,
    ox: number | string = 0,
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    let o = this._getGroupOffset(nnx, nny, nox, noy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        shapes.push(new Polygon(new Ray(nox * i - o.x, + noy * j - o.y, ang ? $(ang) * Math.PI / 180 : 0), rayStrings.map((s) => new Ray(0, 0).fromString(s)), $(s), $(a)));
      }
    }
    this._make(shapes);
  }

  private _stamp(
    subStampString: string,
    ang: number | string = 0,
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1,
    ny: number | string = 1,
    ox: number | string = 0,
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    let o = this._getGroupOffset(nnx, nny, nox, noy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        shapes.push(new Stamp(new Ray(nox * i - o.x, + noy * j - o.y, ang ? $(ang) * Math.PI / 180 : 0), 1, $(a)).fromString(subStampString));
      }
    }
    this._make(shapes);
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

  circle(
    r: number | string, 
    s: number | string = 32, 
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_circle", args: [r, s, a, nx, ny, ox, oy] });
    return this;
  }

  rectangle(
    w: number | string, 
    h: number | string, 
    ang: number | string = 0,
    s: number | string = 1, 
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_rectangle", args: [w, h, ang, s, a, nx, ny, ox, oy] });
    return this;
  }

  roundedRectangle(
    w: number | string, 
    h: number | string, 
    ang: number | string = 0,
    cr: number | string = 0, 
    s: number | string = 3, 
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_roundedRectangle", args: [w, h, ang, cr, s, a, nx, ny, ox, oy] });
    return this;
  }

  polygon(
    rays: Ray[],
    ang: number | string = 0,
    s: number | string = 1,
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1,
    ny: number | string = 1,
    ox: number | string = 0,
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_polygon", args: [rays.map(r => r.toString()), ang, s, a, nx, ny, ox, oy] });
    return this;
  }

  stamp(
    subStamp: Stamp,
    ang: number | string = 0,
    a: number | string = ShapeAlignment.CENTER,
    nx: number | string = 1,
    ny: number | string = 1,
    ox: number | string = 0,
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_stamp", args: [subStamp.toString(), ang, a, nx, ny, ox, oy] });
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

  /**
   * Bakes the CSG solution into a final bsp
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

    const privateFunctionMap: { [key:string]: Function } = {
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
    }

    for (let i = 0; i < nodes.length; i++) {
      let fName = nodes[i].fName;
      let fn: Function = privateFunctionMap[fName];
      let args = nodes[i].args;
      if (fn) {
        fn.apply(this, args);
      }
    }

    if (!this._colors) {
      this._colors = ["white"];
    }

    this._polys = this._bsp ? this._polyTreeToPolygons(this._bsp) : [];

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
    let stamp = new Stamp(this.center.clone(), this.segments, this.alignment, this.reverse);
    stamp._colors = this._colors?.concat();
    return stamp.fromString(this.toString());
  }

  copy(stamp: Stamp): Stamp {
    // @ts-ignore
    this._nodes = stamp._nodes.concat();
    this._colors = stamp._colors?.concat();
    return stamp;
  }
}
