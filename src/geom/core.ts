
export enum ShapeAlignment {
  TOP_LEFT = 0,
  TOP = 1,
  TOP_RIGHT = 2,
  LEFT = 3,
  CENTER = 4,
  RIGHT = 5,
  BOTTOM_LEFT = 6,
  BOTTOM = 7,
  BOTTOM_RIGHT = 8
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
  generate(): Ray[];
  clone(): IShape;
  boundingBox(): BoundingBox;
  boundingCircle(): BoundingCircle;
  children(): IShape[];
  addChild(shape: IShape): void;
}

export interface IStyle {
  strokeColor?: number | string;
  strokeThickness?: number | string;
  fillColor?: number | string;
  hatchPattern?: number | string;
  hatchScale?: number | string;
  hatchAngle?: number | string;
  hatchInset?: number | string;
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
  fromString(s: string) {
    const [x, y] = s.slice(1, -1).split(',').map(Number);
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
    const [x, y, direction] = s.slice(1, -1).split(',').map(Number);
    this.x = x;
    this.y = y;
    this.direction = direction;
    return this;
  }
}

export class Segment {
  points: Point[];
  constructor(points: Point[]) {
    this.points = points;
  }
  clone() {
    return new Segment(this.points.map((p) => p.clone()));
  }
  toString() {
    return `[${this.points.map((p) => p.toString()).join(', ')}]`;
  }
  fromString(s: string) {
    const points = s.slice(1, -1).split(', ').map((s) => {
      const [x, y] = s.split(',').map(Number);
      return new Point(x, y);
    });
    this.points = points;
    return this;
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
