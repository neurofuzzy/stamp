import { makeCircle } from "../lib/smallest-enclosing-circle";
import { Point, BoundingBox, BoundingCircle, Segment } from "./core";
import { GeomHelpers } from "./helpers";

export class SegmentCollection {
  pivot: Point;
  rotation: number;
  isOpen: boolean;
  isGroup: boolean;
  isStrong: boolean;
  constructor() {
    this.pivot = new Point(0, 0);
    this.rotation = 0;
    this.isOpen = true;
    this.isGroup = false;
    this.isStrong = false;
  }

  _makeAbsolute (pts: Point[]) {
    let rot = (this.rotation * Math.PI) / 180;
    pts.forEach((pt, idx) => {
      const ptA = pt.clone();
      GeomHelpers.rotatePoint(ptA, rot);
      ptA.x += this.pivot.x;
      ptA.y += this.pivot.y;
      pts[idx] = ptA;
    });
  };
  
  _makeSegsAbsolute = (segs: Segment[]) => {
    let rot = (this.rotation * Math.PI) / 180;
    segs.forEach((seg) => {
      const ptA = seg.a.clone();
      const ptB = seg.b.clone();
      GeomHelpers.rotatePoint(ptA, rot);
      GeomHelpers.rotatePoint(ptB, rot);
      GeomHelpers.addToPoint(ptA, this.pivot);
      GeomHelpers.addToPoint(ptB, this.pivot);
      seg.a = ptA;
      seg.b = ptB;
    });
  };

  toPoints(): Point[] {
    throw "not implemented";
  }

  toSegments(): Segment[] {
    throw "not implemented";
  }

  getBoundingBox(): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const pts = this.toPoints();
    pts.forEach((pt) => {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    });
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  /**
   * @returns {BoundingCircle}
   */
  getBoundingCircle() {
    const pts = this.toPoints();
    let c = makeCircle(pts);
    if (c) {
      return new BoundingCircle(c.x, c.y, c.r);
    }
    return new BoundingCircle(this.pivot.x, this.pivot.y, 0);
  }
}

export class Line extends SegmentCollection {

  protected _heading: number;
  protected _length: number;
  protected _numSegs: number;
  protected _numStripes: number;
  protected _terminate: boolean;
  protected _parent: Line | null;
  protected _amplitudeFunc: ((t: number) => number) | null;
  public children: Line[];

  constructor(heading: number, length: number, numSegs: number = 1, numStripes: number = 1, terminate: boolean = false) {
    super();
    this._heading = heading;
    this._length = length;
    this._numSegs = numSegs;
    this._numStripes = numStripes;
    this._terminate = terminate;
    this._parent = null;
    this._amplitudeFunc = null;
    this.children = [];
  }

  parent(): Line | null {
    return this._parent;
  }

  ancestor(d: number): Line {
    let ln: Line = this;
    let dd = 0;
    while (ln.parent() !== null && dd < d) {
      ln = ln.parent() ?? ln;
      dd++;
    }
    return ln;
  }

  root(): Line {
    let ln: Line = this;
    while (ln.parent() !== null) {
      ln = ln.parent() ?? ln;
    }
    return ln;
  }

  depth(): number {
    let ln: Line = this;
    let d = 0;
    while (ln.parent() !== null) {
      ln = ln.parent() ?? ln;
      d++;
    }
    return d;
  }

  isTerminated(): boolean {
    return this._terminate;
  }

  set terminate(t: boolean) {
    this._terminate = t;
  }

  heading(): number {
    let hdg = this._heading;
    if (this._parent) {
      hdg += this._parent.heading();
    }
    return hdg;
  }

  length(): number {
    let len = this._length;
    if (this._parent) {
      len += this._parent.length();
    }
    return len;
  }

  lengthAtStart(): number {
    let len = 0;
    let ln = this._parent;
    while (ln) {
      len += ln._length;
      ln = ln.parent();
    }
    return len;
  }

  amplitude(atLength = 0): number {
    if (this.root()._amplitudeFunc !== null) {
      return this.root()._amplitudeFunc?.(this.lengthAtStart() + atLength) || 0;
    }
    if (this._numStripes > 0 && this._numSegs > 0) {
      return this._length / this._numStripes / this._numSegs;
    }
    return 1;
  }

  setAmplitudeFunc(fn: (atLength: number) => number) {
    this.root()._amplitudeFunc = fn;
  }

  startPoint(): Point {
    return this._parent ? this._parent.endPoint() : new Point(0, 0);
  }

  midPoint(): Point {
    return GeomHelpers.averagePoints([this.startPoint(), this.endPoint()]);
  }

  endPoint(): Point {
    let heading = this.heading();
    let endPt = new Point(0, this._length);
    GeomHelpers.rotatePoint(endPt, (heading * Math.PI) / 180);
    if (this._parent) {
      let p = this._parent.endPoint();
      endPt.x += p.x;
      endPt.y += p.y;
    }
    return endPt;
  }

  append(ln: Line) {
    if (!this._terminate) {
      this.children.push(ln);
      ln._parent = this;
    }
  }

  toPoints(): Point[] {
    let pts;
    if (this._parent) {
      pts = [this._parent.endPoint(), this.endPoint()];
    } else {
      pts = [new Point(0, 0), this.endPoint()];
    }
    if (this._numSegs > 1) {
      pts = GeomHelpers.subdividePointsByDistance(pts[0], pts[1], GeomHelpers.distanceBetweenPoints(pts[0], pts[1]) / this._numSegs);
    }
    return pts;
  }

  toSegments(): Segment[] {
    let segs = [];
    let pts = this.toPoints();
    for (let i = 1; i < pts.length; i++) {
      segs.push(new Segment(pts[i - 1], pts[i]));
    }
    return segs;
  }

  line(heading: number, length: number): Line {
    if (this._terminate) {
      return this;
    }
    const ln = new Line(heading, length);
    ln._parent = this;
    this.children.push(ln);
    return ln;
  }

  all(): Line[] {
    /** @param {Line} line */
    let fn = (line: Line, acc: Line[]) => {
      acc.push(line);
      line.children.forEach((cln) => {
        fn(cln, acc);
      });
      return acc;
    };
    return fn(this.root(), []);
  }

  endLines(): Line[] {
    /** @param {Line} line */
    let fn = (line: Line, acc: Line[]) => {
      if (line.children.length === 0) {
        acc.push(line);
        return;
      } else {
        line.children.forEach((cln) => {
          fn(cln, acc);
        });
      }
    };
    let acc: Line[] = [];
    fn(this.root(), acc);
    return acc;
  }

  linesAtDepth(d: number): Line[] {
    if (d === 0) {
      return [this.root()];
    }
    if (d > 0) {
      let a = this.all();
      return a.filter((ln) => ln.depth() == d);
    } else {
      let a = this.endLines();
      a = a.filter((ln) => ln.depth() > 0 - d);
      a = a.map((ln) => ln.ancestor(0 - d));
      a = a.filter((ln, idx) => a.indexOf(ln) === idx);
      return a;
    }
  }

  static isEqual(lineA: Line, lineB: Line) {
    let pointsA = lineA.toPoints();
    let pointsB = lineB.toPoints();
    if (pointsA.length !== pointsB.length) {
      return false;
    }
    let isEqual = true;
    for (let i = 0; i < pointsA.length; i++) {
      if (!GeomHelpers.pointsAreEqual(pointsA[i], pointsB[i])) {
        isEqual = false;
        break;
      }
    }
    if (isEqual) return true;
    isEqual = true;
    pointsB.reverse();
    for (let i = 0; i < pointsA.length; i++) {
      if (!GeomHelpers.pointsAreEqual(pointsA[i], pointsB[i])) {
        isEqual = false;
        break;
      }
    }
    return isEqual;
  }
}

export class EmptyLine extends Line {
  toSegments(): Segment[] {
    return [];
  }
}

export class CircleLine extends Line {
  constructor(hdg: number, len: number, numSegs = 32, numStripes = 1, terminate = false) {
    super(hdg, len, numSegs, numStripes, terminate);
  }

  toPoints(): Point[] {
    let pts = [];
    let mPt = this.midPoint();
    let h = this.heading();
    for (let j = this._numStripes; j > 0; j--) {
      let r = ((this._length * 0.5) / this._numStripes) * j;
      for (let i = 0; i <= this._numSegs; i++) {
        let deg = i * (360 / this._numSegs);
        let pt = new Point(0, r);
        GeomHelpers.rotatePoint(pt, deg * Math.PI / 180);
        pts.push(pt);
      }
    }

    pts.forEach((pt) => {
      GeomHelpers.rotatePoint(pt, h * Math.PI / 180);
      GeomHelpers.addToPoint(pt, mPt);
    });

    return pts;
  }

  toSegments(): Segment[] {
    let segs = [];
    let pts = this.toPoints();
    for (let i = 1; i < pts.length; i++) {
      if (this._numStripes && i % (this._numSegs + 1) === 0) {
        continue;
      }
      segs.push(new Segment(pts[i - 1], pts[i]));
    }
    return segs;
  }
}

export class DiamondLine extends CircleLine {
  constructor(hdg: number, len: number, numSegs = 4, numStripes = 1, terminate = false) {
    numSegs = 4;
    super(hdg, len, numSegs, numStripes, terminate);
  }
}

export class HexagonLine extends CircleLine {
  constructor(hdg: number, len: number, numSegs = 6, numStripes = 1, terminate = false) {
    numSegs = 6;
    super(hdg, len, numSegs, numStripes, terminate);
  }
}

export class SquareLine extends Line {
  /**
   * @returns {Point[]}
   */
  toPoints(): Point[] {
    let h = this.heading();
    let pts = [];
    let mPt = this.midPoint();
    for (let j = 1; j <= this._numStripes; j++) {
      let len = ((this._length * 0.5) / this._numStripes) * j;
      pts.push(new Point(len, 0));
      pts.push(new Point(len, 0 - len));
      pts.push(new Point(0 - len, 0 - len));
      pts.push(new Point(0 - len, 0));
      pts.push(new Point(0 - len, len));
      pts.push(new Point(len, len));
      pts.push(new Point(len, 0));
    }
    pts.forEach((pt) => {
      GeomHelpers.rotatePoint(pt, (h - 90) * Math.PI / 180);
      GeomHelpers.addToPoint(pt, mPt);
    });
    return pts;
  }

  /**
   * @returns {Segment[]}
   */
  toSegments(): Segment[] {
    let segs = [];
    let pts = this.toPoints();
    for (let i = 1; i < pts.length; i++) {
      if (this._numStripes && i % 7 === 0) {
        continue;
      }
      segs.push(new Segment(pts[i - 1], pts[i]));
    }
    return segs;
  }
}