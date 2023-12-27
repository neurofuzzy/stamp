import { GeomHelpers } from "./geom/helpers";
import { IShape, Point, Ray } from "./geom/shapes";
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

  matIdx: number = 0;
  mode: number = Stamp.UNION;

  offsetX: number = 0;
  offsetY: number = 0;
  cursorX: number = 0;
  cursorY: number = 0;
  cursorRotation: number = 0;

  baked: boolean = false;

  constructor(colors?: string[]) {
    this._reset();
    this._colors = colors;
  }

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
    this.offsetX = $(x);
    this.offsetY = $(y);
  };

  private _offset (x: number | string, y: number | string) {
    this.offsetX += $(x);
    this.offsetY += $(y);
  };

  private _walk (dist: number) {
    dist = $(dist);
    const v = new Point(0, dist);
    GeomHelpers.rotatePoint(v, this.cursorRotation);
    this.cursorX += v.x;
    this.cursorY += v.y;
  };

  private _rotateTo (r: number | string) {
    this.cursorRotation = $(r);
  };

  private _rotate (r: number | string) {
    this.cursorRotation = GeomHelpers.normalizeAngle(this.cursorRotation + $(r));
  };

  private _make (shapes: IShape[], nx = 1, ny = 1, ox = 0, oy = 0) {
    let n = 0;

    for (let iz = 0; iz < nz; iz++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let ix = 0; ix < nx; ix++) {
          
          let geom = shapes;
          if (Array.isArray(shapes)) {
            geom = shapes.shift();
          }

          let g = geom.clone();

          var mo = new THREE.Matrix4();
          var mcr = new THREE.Matrix4();
          var mc = new THREE.Matrix4();

          mo.setPosition(
            new THREE.Vector3(
              nx > 1 ? this.offsetX + ox * ix : this.offsetX + ox * n,
              ny > 1 ? this.offsetY + oy * iy : this.offsetY + oy * n,
              nz > 1 ? this.offsetZ + oz * iz : this.offsetZ + oz * n
            )
          );

          let e = new THREE.Euler(
            (this.cursorRotX * Math.PI) / 180,
            (this.cursorRotY * Math.PI) / 180,
            (this.cursorRotZ * Math.PI) / 180
          );

          mcr.makeRotationFromEuler(e);

          let m = new THREE.Mesh(g, null);

          // @ts-ignore
          m.geometry.applyMatrix4(mo);
          // @ts-ignore
          m.geometry.applyMatrix4(mcr);

          mc.setPosition(new THREE.Vector3(this.cursorX, this.cursorY, this.cursorZ));
          // @ts-ignore
          m.geometry.applyMatrix4(mc);

          // m.position.x += this.cursorX;
          // m.position.y += this.cursorY;
          // m.position.z += this.cursorZ;

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

                b = new ThreeBSP(g, this.matIdx);
                this._bsp = b.subtract(b);
              }
              b2 = new ThreeBSP(m.geometry, this.matIdx);
              b = this._bsp.union(b2);

              break;

            case Stamp.SUBTRACT:
              if (this._bsp) {
                b2 = new ThreeBSP(m.geometry, this.matIdx);
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
        }
      }
    }
  };

  private _materialIndex (idx: number) {
    this.matIdx = idx;
  };


  private _box (w, l, h, ws = 1, ls = 1, hs = 1, nx = 1, ny = 1, nz = 1, ox = 0, oy = 0, oz = 0, mod = null) {
    let geoms = [];

    for (let i = 0; i < nx * ny * nz; i++) {  
      geoms.push(new THREE.BoxGeometry($(w), $(l), $(h), $(ws), $(ls), $(hs)));
    }

    this._make(geoms, nx, ny, nz, ox, oy, oz, mod);
  };

  private _box2 (w, l, h, ws = 1, ls = 1, hs = 1, nx = 1, ny = 1, nz = 1, ox = 0, oy = 0, oz = 0, mod = null) {
    let geoms = [];

    for (let i = 0; i < nx * ny * nz; i++) {  
      let lr = $(l);
      let geom = new THREE.BoxGeometry($(w), lr, $(h), $(ws), $(ls), $(hs));
      geom.vertices.forEach((v) => {
        v.y += lr * 0.5;
      });
      geoms.push(geom);
    }

    this._make(geoms, nx, ny, nz, ox, oy, oz, mod);
  };

  private _exbox (w, l, h, ws = 1, ls = 1, hs = 1, nx = 1, ny = 1, nz = 1, ox = 0, oy = 0, oz = 0, mod = null) {
    let geoms = [];
    
    for (let i = 0; i < nx * ny * nz; i++) {  
      let wr = $(w);
      let lr = $(l);
      let hr = $(h);
      let p1 = new THREE.Vector2(0, 0);
      let p2 = new THREE.Vector2(wr, 0);
      let p3 = new THREE.Vector2(wr, lr);
      let p4 = new THREE.Vector2(0, lr);
      let rect = new THREE.Shape([p1, p2, p3, p4]);
      let geom = new THREE.ExtrudeGeometry(rect, { depth: hr, steps: $(hs), bevelEnabled: false });
      geoms.push(geom);
    }

    this._make(geoms, nx, ny, nz, ox, oy, oz, mod);
  };

  private _cylinder (r1, r2, h, rs = 12, hs = 1, nx = 1, ny = 1, nz = 1, ox = 0, oy = 0, oz = 0, mod = null) {
    let geoms = [];
    
    for (let i = 0; i < nx * ny * nz; i++) {  
      geoms.push(new THREE.CylinderGeometry($(r1), $(r2), $(h), $(rs), $(hs)));
    }

    this._make(geoms, nx, ny, nz, ox, oy, oz, mod);
  };

  private _sphere (r, ws, hs, nx = 1, ny = 1, nz = 1, ox = 0, oy = 0, oz = 0, mod = null) {
    let geoms = [];
    
    for (let i = 0; i < nx * ny * nz; i++) {  
      geoms.push(new THREE.SphereGeometry($(r), $(ws), $(hs)));
    }

    this._make(geoms, nx, ny, nz, ox, oy, oz, mod);
  };

  private _extrusion (points, h = 1, hs = 1, nx = 1, ny = 1, nz = 1, ox = 0, oy = 0, oz = 0, mod = null) {
    let geoms = [];
    
    for (let i = 0; i < nx * ny * nz; i++) {  
      let pts = [];
      for (let i = 0; i < points.length; i++) {
        pts.push(new THREE.Vector2(points[i].x, points[i].y));
      }

      let shape = new THREE.Shape(pts);

      let settings = {
        steps: $(hs),
        depth: $(h),
        bevelEnabled: false,
        bevelSize: 0,
      };
      let geom = new THREE.ExtrudeGeometry(shape, settings);
      geom.rotateX((90 * Math.PI) / 180);
      geom.vertices.forEach((v) => {
        v.y += settings.depth;
      });
      geoms.push(geom);
    }

    this._make(geoms, nx, ny, nz, ox, oy, oz, mod);
  };

  private _reset () {
    this._bsps = [];
    this._bsp = null;
    this.mode = Stamp.UNION;
    this.baked = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.cursorRotation = 0;
  };

  reset() {
    // @ts-ignore
    this._nodes.push({ fName: "_reset", args: Array.from(arguments) });
    return this;
  }

  /**
   *
   * @param {number} idx the material index to apply to future solids
   */
  materialIndex(idx = 1) {
    // @ts-ignore
    this._nodes.push({ fName: "_materialIndex", args: [idx] });
    return this;
  }

  add() {
    // @ts-ignore
    this._nodes.push({ fName: "_add", args: Array.from(arguments) });
    return this;
  }

  subtract() {
    // @ts-ignore
    this._nodes.push({ fName: "_subtract", args: Array.from(arguments) });
    return this;
  }

  boolean(type: number | string) {
    // @ts-ignore
    this._nodes.push({ fName: "_boolean", args: [type] });
    return this;
  }

  next() {
    // @ts-ignore
    this._nodes.push({ fName: "_next", args: Array.from(arguments) });
    return this;
  }
  
  moveTo(x = 0, y = 0) {
    // @ts-ignore
    this._nodes.push({ fName: "_moveTo", args: [x, y] });
    return this;
  }

  offset(x: number, y: number = 0) {
    // @ts-ignore
    this._nodes.push({ fName: "_offset", args: [x, y] });
    return this;
  }

  walk(dist: number | string) {
    // @ts-ignore
    this._nodes.push({ fName: "_walk", args: [dist] });
    return this;
  }

  /**
   * @param {number | string} x
   * @param {number | string} y
   * @param {number | string} z
   */
  rotateTo(x = 0, y = 0, z = 0) {
    // @ts-ignore
    this._nodes.push({ fName: "_rotateTo", args: [x, y, z] });
    return this;
  }

  /**
   * @param {number | string} x
   * @param {number | string} y
   * @param {number | string} z
   */
  rotate(x = 0, y = 0, z = 0) {
    // @ts-ignore
    this._nodes.push({ fName: "_rotate", args: [x, y, z] });
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
    cs: number | string, 
    es: number | string, 
    nx: number | string = 1, 
    ny: number | string = 1, 
    ox: number | string = 0, 
    oy: number | string = 0
  ) {
    this._nodes.push({ fName: "_roundedRectangle", args: [w, h, cr, cs, es, nx, ny, ox, oy] });
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
    return new Ray(this.cursorX, this.cursorY, this.cursorRotation);
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
    ThreeBSP.MatIdx = 0;

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

    //console.log(nodes);

    for (let i = 0; i < nodes.length; i++) {
      let fName = nodes[i].fName;
      let fn = this[fName];
      let args = nodes[i].args;

      if (fn) {
        fn.apply(this, args);
      }
    }

    if (!this._mats) {
      this._mats = new THREE.MeshStandardMaterial({
        flatShading: false,
        wireframe: false,
        color: 0,
      });
    }

    return this;
  }

  /**
   * get a mesh of the final result
   * @param {Boolean} unify_uv_coords
   * @param {number} uv_scale
   * @param {Array<THREE.MeshPhongMaterial>} materials
   * @returns {THREE.Mesh}
   */
  mesh(unify_uv_coords = false, uv_scale = 100, materials = null) {
    if (!this.baked) {
      this.bake();
    }

    let res;

    let geom = new THREE.Geometry();

    this._bsps.forEach((bsp) => {
      let g = bsp.toGeometry();
      geom.merge(g, bsp.matrix, 0);
    });

    if (this._bsp) {
      let g = this._bsp.toGeometry();
      geom.merge(g, this._bsp.matrix, 0);
    }

    if (unify_uv_coords) {
      SolidUtils.unifyUVCoordinates(geom, uv_scale);
    }

    res = new THREE.Mesh(geom, materials || this._mats);

    return res;
  }

  getNodes() {
    return this._nodes;
  }

  /**
   * @param {Array<Node>} nodes
   * @returns {Solid}
   */
  setNodes(nodes) {
    this._nodes = nodes;
    return this;
  }

  /**
   * @returns {String}
   */
  toString() {
    return JSON.stringify([this.attributes, this._nodes]);
  }

  /**
   *
   * @param {String} data
   */
  fromString(data) {
    try {
      let h = JSON.parse(data);
      this.attributes = h[0];
      this._nodes = h[1];
    } catch (err) {
      console.error(err);
    }

    return this;
  }

  /**
   * @returns {Solid}
   */
  clone() {
    let solid = new Solid();
    Stamp._mats = this._mats;
    return Stamp.fromString(this.toString());
  }

  /**
   * @returns {Solid}
   */
  copy(solid) {
    // @ts-ignore
    this.attributes = Object.assign({}, Stamp.attributes);
    this._nodes = Stamp._nodes.concat();
    this._mats = Stamp._mats;
    return solid;
  }
}
