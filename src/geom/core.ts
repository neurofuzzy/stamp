export class Vec2 {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

export class Point extends Vec2 {
  constructor(x: number, y: number) {
    super(x, y)
  }
  flatten() {
    return [this.x, this.y];
  }
}

export class Ray {
  x: number;
  y: number;
  direction: number;
  constructor(x: number, y: number, direction: number = 0) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }
  flatten() {
    return [this.x, this.y, this.direction];
  }
}

export class Segment {
  start: Point
  end: Point
  constructor(start: Point, end: Point) {
    this.start = start
    this.end = end
  }
  flatten() {
    return [this.start.x, this.start.y, this.end.x, this.end.y];
  }
}

export class Polygon {
  points: Point[];
  constructor(points: Point[]) {
    this.points = points;
  }
  flatten() {
    return this.points.map(p => p.flatten())
  }
}

export class Circle {
  center: Ray;
  radius: number
  constructor(center: Ray, radius: number) {
    this.center = center;
    this.radius = radius;
  }
  flatten(segments = 32) {
    const rays = [];
    for (let i = 0; i <= segments; i++) {
      rays.push(
        new Ray(
          this.center.x + this.radius * Math.cos(this.center.direction + Math.PI * 2 * i / segments), 
          this.center.y + this.radius * Math.sin(this.center.direction + Math.PI * 2 * i / segments), 
          this.center.direction + Math.PI * 2 * i / segments
        )
      )
    }
    return rays.map(r => r.flatten());
  }
}