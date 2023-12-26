import { GeomHelpers } from "./helpers";

class Vec2 {
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

export class Ray extends Point {
  direction: number;
  constructor(x: number, y: number, direction: number = 0) {
    super(x, y);
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
  center: Ray
  radius: number
  reverse: boolean
  constructor(center: Ray, radius: number, reverse = false) {
    this.center = center;
    this.radius = radius;
    this.reverse = reverse
  }
  generate(segments: number) {
    const rays = []
    for (let i = 0; i <= segments; i++) {
      rays.push(
        new Ray(
          this.center.x + this.radius * Math.cos(this.center.direction + Math.PI * 2 * i / segments),
          this.center.y + this.radius * Math.sin(this.center.direction + Math.PI * 2 * i / segments),
          this.center.direction + Math.PI * 2 * i / segments
        )
      )
    }
    if (this.reverse) {
      rays.reverse();
      rays.forEach(r => r.direction += Math.PI);
    }
    return rays
  }
  flatten(segments = 32) {
    const rays = this.generate(segments)
    return rays.map(r => r.flatten());
  }
}

export class Donut {
  center: Ray;
  innerRadius: number;
  outerRadius: number;
  constructor(center: Ray, innerRadius: number, outerRadius: number) {
    this.center = center;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
  }
  flatten(segments = 32) {
    const inner = new Circle(this.center, this.innerRadius, true).flatten(segments)
    const outer = new Circle(this.center, this.outerRadius).flatten(segments)
    return [
      ...outer,
      ...inner,
      outer[0]
    ]
  }
}

export class Rectangle {
  center: Ray
  width: number
  height: number
  reverse: boolean
  constructor(center: Ray, width: number, height: number, reverse: boolean = false) {
    this.center = center
    this.width = width
    this.height = height
    this.reverse = reverse
  }
  generate() {
    const rays: Ray[] = [];
    // add rectangle corners
    rays.push(new Ray(this.center.x - this.width / 2, this.center.y - this.height / 2));
    rays.push(new Ray(this.center.x + this.width / 2, this.center.y - this.height / 2));
    rays.push(new Ray(this.center.x + this.width / 2, this.center.y + this.height / 2));
    rays.push(new Ray(this.center.x - this.width / 2, this.center.y + this.height / 2));
    rays.push(new Ray(this.center.x - this.width / 2, this.center.y - this.height / 2));
    if (this.reverse) {
      rays.reverse();
    }
    GeomHelpers.normalizeRayDirections(rays);
    rays.forEach(r => {
      GeomHelpers.rotateRayAboutOrigin(this.center, r)
    })
    return rays;
  }
  flatten(segments = 1) {
    let rays = this.generate();
    if (segments > 1) {
      rays = GeomHelpers.subdivideRays(rays[0], rays[1], segments)
        .concat(GeomHelpers.subdivideRays(rays[1], rays[2], segments))
        .concat(GeomHelpers.subdivideRays(rays[2], rays[3], segments))
        .concat(GeomHelpers.subdivideRays(rays[3], rays[0], segments))
    }
    return rays.map(r => r.flatten());
  }
}

export class RectangularDonut {
  center: Ray
  innerWidth: number
  innerHeight: number
  outerWidth: number
  outerHeight: number
  constructor(center: Ray, innerWidth: number, innerHeight: number, outerWidth: number, outerHeight: number) {
    this.center = center
    this.innerWidth = innerWidth
    this.innerHeight = innerHeight
    this.outerWidth = outerWidth
    this.outerHeight = outerHeight
  }
  flatten(segments = 32) {
    const inner = new Rectangle(this.center, this.innerWidth, this.innerHeight, true).flatten(segments)
    const outer = new Rectangle(this.center, this.outerWidth, this.outerHeight).flatten(segments)
    return [
      ...outer,
      ...inner,
      outer[0]
    ]
  }
  
}