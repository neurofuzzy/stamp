import { makeCircle } from "../lib/smallest-enclosing-circle";

export enum Heading {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export enum ShapeAlignment {
  TOP_LEFT = 0,
  TOP = 1,
  TOP_RIGHT = 2,
  LEFT = 3,
  CENTER = 4,
  RIGHT = 5,
  BOTTOM_LEFT = 6,
  BOTTOM = 7,
  BOTTOM_RIGHT = 8,
}

export interface IShape {
  id: number;
  center: Ray;
  divisions: number;
  reverse: boolean;
  isHole: boolean;
  alignment: ShapeAlignment;
  hidden: boolean;
  style: IStyle;
  generate(withinArea?: BoundingBox): Ray[];
  toSegments(): Segment[];
  clone(atScale?: number): IShape;
  boundingBox(): BoundingBox;
  boundingCircle(): BoundingCircle;
  children(): IShape[];
  addChild(shape: IShape): void;
}

export interface IStyle {
  strokeColor?: number | string;
  strokeThickness?: number | string;
  fillColor?: number | string;
  fillAlpha?: number | string;
  hatchPattern?: number | string;
  hatchScale?: number | string;
  hatchStrokeColor?: number | string;
  hatchStrokeThickness?: number | string;
  hatchAngle?: number | string;
  hatchInset?: number | string;
  hatchBooleanType?: number | string;
  hatchOverflow?: number | string;
  hatchOffsetX?: number | string;
  hatchOffsetY?: number | string;
  hatchSpherify?: boolean;
}

export class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  clone() {
    return new Point(this.x, this.y);
  }
  toString() {
    return `(${this.x}, ${this.y})`;
  }
  toRay(direction = 0) {
    return new Ray(this.x, this.y, direction);
  }
  fromString(s: string) {
    const [x, y] = s.slice(1, -1).split(",").map(Number);
    this.x = x;
    this.y = y;
    return this;
  }
}

export class Ray extends Point {
  direction: number;
  constructor(x: number, y: number, direction: number = 0) {
    super(x, y);
    this.direction = direction;
  }
  clone() {
    return new Ray(this.x, this.y, this.direction);
  }
  toString() {
    return `(${this.x}, ${this.y}, ${this.direction})`;
  }
  fromString(s: string) {
    const [x, y, direction] = s.slice(1, -1).split(",").map(Number);
    this.x = x;
    this.y = y;
    this.direction = direction;
    return this;
  }
}

export class Segment {
  a: Point;
  b: Point;
  constructor(a: Point, b: Point) {
    this.a = a;
    this.b = b;
  }
  toPath() {
    return new Path([this.a, this.b]);
  }
  clone() {
    return new Segment(this.a.clone(), this.b.clone());
  }
  toString() {
    return `[${this.a.toString()},${this.b.toString()}]`;
  }
  fromString(s: string) {
    const [a, b] = s.slice(1, -1).split(",");
    this.a.fromString(a);
    this.b.fromString(b);
    return this;
  }
}

export class Path {
  points: Point[];
  constructor(points: Point[]) {
    this.points = points;
  }
  boundingBox(): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    this.points.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    });
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }
  boundingCircle(): BoundingCircle {
    let c = makeCircle(this.points);
    if (c) {
      return new BoundingCircle(c.x, c.y, c.r);
    }
    let totalX = 0;
    let totalY = 0;
    this.points.forEach((pt) => {
      totalX += pt.x;
      totalY += pt.y;
    });
    const center = new Point(
      totalX / this.points.length,
      totalY / this.points.length,
    );
    return new BoundingCircle(center.x, center.y, 0);
  }
  toPoints() {
    return this.points.concat();
  }
  toSegments() {
    const segments: Segment[] = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      segments.push(new Segment(this.points[i], this.points[i + 1]));
    }
    return segments;
  }
  clone() {
    return new Path(this.points.map((p) => p.clone()));
  }
  toString() {
    return `[${this.points.map((p) => p.toString()).join(", ")}]`;
  }
  fromString(s: string) {
    const points = s
      .slice(1, -1)
      .split(", ")
      .map((s) => {
        const [x, y] = s.split(",").map(Number);
        return new Point(x, y);
      });
    this.points = points;
    return this;
  }
}

export class ParametricPath extends Path {
  pointsFunction: (t: number, points?: Point[]) => Point;
  segs: number;
  constructor(
    pointsFunction: (t: number, points?: Point[]) => Point,
    segs = 12,
    addTolerance = 0,
  ) {
    super([]);
    this.pointsFunction = pointsFunction;
    this.segs = segs;
    const pts = this.points;
    const step = Math.floor(100000 / this.segs);
    let i = 0;
    while (i <= 1 + addTolerance) {
      const pt = this.pointsFunction(i, pts);
      if (pt) pts.push(pt);
      i += step * 0.00001;
    }
  }
  clone() {
    return new ParametricPath(this.pointsFunction, this.segs);
  }
}

export class BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  center: Ray;
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.center = new Ray(this.x + this.width / 2, this.y + this.height / 2, 0);
  }
  area() {
    return (this.width || 0) * (this.height || 0);
  }
  toSegments() {
    return [
      new Segment(
        new Point(this.x, this.y),
        new Point(this.x + this.width, this.y),
      ),
      new Segment(
        new Point(this.x + this.width, this.y),
        new Point(this.x + this.width, this.y + this.height),
      ),
      new Segment(
        new Point(this.x + this.width, this.y + this.height),
        new Point(this.x, this.y + this.height),
      ),
      new Segment(
        new Point(this.x, this.y + this.height),
        new Point(this.x, this.y),
      ),
    ];
  }
  toPoints() {
    return [
      new Ray(this.x, this.y),
      new Ray(this.x + this.width, this.y),
      new Ray(this.x + this.width, this.y + this.height),
      new Ray(this.x, this.y + this.height),
    ];
  }
  clone() {
    return new BoundingBox(this.x, this.y, this.width, this.height);
  }
}

export class BoundingCircle {
  x: number;
  y: number;
  radius: number;
  constructor(x: number, y: number, radius: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }
  area() {
    return Math.PI * (this.radius || 0) * (this.radius || 0);
  }
  clone() {
    return new BoundingCircle(this.x, this.y, this.radius);
  }
}
