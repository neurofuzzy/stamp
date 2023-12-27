import { GeomHelpers } from "./geom/helpers";
import { Circle, CornerRectangle, IShape, Point, Ray, Rectangle, RoundedRectangle } from "./geom/shapes";
import { Sequence } from "./sequence";

interface INode {
  fName: string;
  args: any[];
}

const $ = (arg: unknown) => typeof arg === "string" ? Sequence.resolve(arg) : typeof arg === "number" ? arg : 0;

export class Stamp {

  static readonly UNION = 1;
  static readonly SUBTRACT = 2;

  _colors?: string[];
  _nodes: INode[] = [];
  _bsp: any;
  _bsps: any[] = [];
  _mats: string[] = [];

  colorIdx: number = 0;
  mode: number = Stamp.UNION;

  offsetX: number = 0;
  offsetY: number = 0;
  cursor: Ray = new Ray(0, 0, 0);

  baked: boolean = false;

  constructor(colors?: string[]) {
    this._reset();
    this._colors = colors;
  }

  private _reset () {
    this._bsps = [];
    this._bsp = null;
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
      this._bsp = null;
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

  private _make (shapes: IShape[], nx = 1, ny = 1, ox = 0, oy = 0) {
      let n = 0;

      for (let iy = 0; iy < ny; iy++) {
        for (let ix = 0; ix < nx; ix++) {
          
          let shape: IShape | undefined = shapes.shift();

          if (!shape) {
            break;
          }

          let g = shape.clone();
n;
          g.center.x += this.cursor.x;
          g.center.y += this.cursor.y;
          GeomHelpers.rotatePointAboutOrigin(this.cursor, g.center);
          g.center.direction = this.cursor.direction;

          if (!this._bsp) {
            this._bsp = [];
          }

          this._bsp.push(g);

          /*
          let b = null;
          let b2 = null;

          switch (this.mode) {
            case Stamp.UNION:
              console.log("MAKING", !!this._bsp);
              if (!this._bsp) {
                let g = new THREE.BoxGeometry(1, 1, 1);
                g.vertices.forEach((v) => {
                  v.x -= 10000;
                  v.y -= 10000;
                  v.z -= 10000;
                });

                b = new ThreeBSP(g, this.colorIdx);
                this._bsp = b.subtract(b);
              }
              b2 = new ThreeBSP(m.geometry, this.colorIdx);
              b = this._bsp.union(b2);

              break;

            case Stamp.SUBTRACT:
              if (this._bsp) {
                b2 = new ThreeBSP(m.geometry, this.colorIdx);
                b = this._bsp.subtract(b2);
              }
              break;
          }

          n++;

          if (b) {
            this._bsp = b;
            //this._next();
          } else {
            return this;
          }

          */

          n++;

        }
      }
      
  };

  private _colorIndex (idx: number) {
    this.colorIdx = idx;
  };

  private _getGroupOffset (w: number, h: number, nx = 1, ny = 1, ox = 0, oy = 0): Point {
    const pt = new Point(0, 0);
    pt.x = (nx - 1) * (w + ox) * 0.5;
    pt.y = (ny - 1) * (h + oy) * 0.5;
    return pt;
  }

  private _circle(
    r: number | string, 
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    let nr = $(r);
    let ns = $(s);
    let o = this._getGroupOffset(nr, nr, nnx, nny, nox, noy);
    for (let i = 0; i < nnx * nny; i++) {
      shapes.push(new Circle(new Ray(nr * i * 2 + nox * i + o.x, nr * i * 2 + noy * i + o.y, 0), nr, ns));
    }
    this._make(shapes, nnx, nny, nox, noy);
  }

  private _rectangle(
    w: number | string, 
    h: number | string, 
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    let nw = $(w);
    let nh = $(h);
    let ns = $(s);
    let o = this._getGroupOffset(nw, nh, nnx, nny, nox, noy);
    for (let j = 0; j < nny; j++) {
      for (let i = 0; i < nnx; i++) {
        shapes.push(new Rectangle(new Ray(nw * i + nox * i - o.x, nh * j + noy * j - o.y, 0), nw, nh, ns));
      }
    }
    this._make(shapes, nnx, nny, nox, noy);
  }

  private _cornerRectangle(
    w: number | string, 
    h: number | string, 
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    for (let i = 0; i < nnx * nny; i++) {
      shapes.push(new CornerRectangle(new Ray(0, 0, 0), $(w), $(h), $(s)));
    }
    this._make(shapes, nnx, nny, nox, noy);
  }

  private _roundedRectangle(
    w: number | string, 
    h: number | string, 
    cr: number | string,
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    let shapes: IShape[] = [];
    let nnx = $(nx), nny = $(ny), nox = $(ox), noy = $(oy);
    for (let i = 0; i < nnx * nny; i++) {
      shapes.push(new RoundedRectangle(new Ray(0, 0, 0), $(w), $(h), $(cr), $(s)));
    }
    this._make(shapes, nnx, nny, nox, noy);
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
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_circle", args: [r, s, nx, ny, ox, oy] });
    return this;
  }

  rectangle(
    w: number | string, 
    h: number | string, 
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_rectangle", args: [w, h, s, nx, ny, ox, oy] });
    return this;
  }

  cornerRectangle(
    w: number | string, 
    h: number | string, 
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_cornerRectangle", args: [w, h, s, nx, ny, ox, oy] });
    return this;
  }


  roundedRectangle(
    w: number | string, 
    h: number | string, 
    cr: number | string, 
    s: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_roundedRectangle", args: [w, h, cr, s, nx, ny, ox, oy] });
    return this;
  }

  repeatLast(steps: number, times: number = 1) {
    this._nodes.push({ fName: "_repeatLast", args: [steps, times] });
    return this;
  }

  bsp() {
    return this._bsp;
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
      _roundedRectangle: this._roundedRectangle,
      _cornerRectangle: this._cornerRectangle,
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
    let stamp = new Stamp();
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
