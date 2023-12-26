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
  clone() {
    return new Ray(this.x, this.y, this.direction);
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

export class Arc {
  center: Ray
  radius: number
  startAngle: number
  endAngle: number
  reverse: boolean
  constructor(center: Ray, radius: number, startAngle: number, endAngle: number, reverse: boolean = false) {
    this.center = center
    this.radius = radius
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.reverse = reverse
  }
  generate(segments: number) {
    const rays = []
    for (let i = 0; i <= segments; i++) {
      const angle = GeomHelpers.lerpAngle(this.startAngle, this.endAngle, i / segments);
      rays.push(
        new Ray(
          this.center.x + this.radius * Math.cos(angle),
          this.center.y + this.radius * Math.sin(angle),
          this.startAngle + Math.PI * 2 * i / segments
        )
      )
    }
    if (this.reverse) {
      rays.reverse();
      rays.forEach(r => r.direction += Math.PI);
    }
    if (this.reverse) {
      rays.reverse();
    }
    GeomHelpers.normalizeRayDirections(rays);
    if (this.center.direction) {
      rays.forEach(r => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r)
      })
    }
    return rays 
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
  generate(segments = 1) {
    let rays: Ray[] = [];
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
    if (this.center.direction) {
      rays.forEach(r => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r)
      })
    }
    if (segments > 1) {
      rays = GeomHelpers.subdivideRays(rays[0], rays[1], segments)
        .concat(GeomHelpers.subdivideRays(rays[1], rays[2], segments))
        .concat(GeomHelpers.subdivideRays(rays[2], rays[3], segments))
        .concat(GeomHelpers.subdivideRays(rays[3], rays[0], segments))
    }
    return rays;
  }
  flatten(segments = 1) {
    let rays = this.generate(segments);
    
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

export class RoundedRectangle {
  center: Ray
  width: number
  height: number
  radius: number
  reverse: boolean
  constructor(center: Ray, width: number, height: number, radius: number, reverse: boolean = false) {
    this.center = center
    this.width = width
    this.height = height
    this.radius = radius
    this.reverse = reverse
  }
  generate(cornerSegments: number = 8, edgeSegments: number = 1) {
    const rays: Ray[] = [];
    // add rectangle corners
    const arcCenterTopLeft = new Ray(this.center.x - this.width / 2 + this.radius, this.center.y - this.height / 2 + this.radius);
    const arcCenterTopRight = new Ray(this.center.x + this.width / 2 - this.radius, this.center.y - this.height / 2 + this.radius);
    const arcCenterBottomRight = new Ray(this.center.x + this.width / 2 - this.radius, this.center.y + this.height / 2 - this.radius);
    const arcCenterBottomLeft = new Ray(this.center.x - this.width / 2 + this.radius, this.center.y + this.height / 2 - this.radius);
    const cornerTopLeft = new Arc(arcCenterTopLeft, this.radius, 0 - Math.PI, 0 - Math.PI / 2).generate(cornerSegments);
    const cornerTopRight = new Arc(arcCenterTopRight, this.radius, 0 - Math.PI / 2, 0).generate(cornerSegments);
    const cornerBottomRight = new Arc(arcCenterBottomRight, this.radius, 0, Math.PI / 2).generate(cornerSegments);
    const cornerBottomLeft = new Arc(arcCenterBottomLeft, this.radius, Math.PI / 2, Math.PI).generate(cornerSegments);
    rays.push(...cornerTopLeft);
    if (edgeSegments > 1) {
      const top = GeomHelpers.subdivideRays(cornerTopLeft[cornerBottomLeft.length - 1], cornerTopRight[0], edgeSegments);
      top.shift();
      top.pop();
      rays.push(...top);
    }
    rays.push(...cornerTopRight);
    if (edgeSegments > 1) {
      const right = GeomHelpers.subdivideRays(cornerTopRight[cornerBottomRight.length - 1], cornerBottomRight[0], edgeSegments);
      right.shift();
      right.pop();
      rays.push(...right);
    }
    rays.push(...cornerBottomRight);
    if (edgeSegments > 1) {
      const bottom = GeomHelpers.subdivideRays(cornerBottomRight[cornerTopRight.length - 1], cornerBottomLeft[0], edgeSegments);
      bottom.shift();
      bottom.pop();
      rays.push(...bottom);
    }
    rays.push(...cornerBottomLeft);
    if (edgeSegments > 1) {
      const left = GeomHelpers.subdivideRays(cornerBottomLeft[cornerTopLeft.length - 1], cornerTopLeft[0], edgeSegments);
      left.shift();
      rays.push(...left);
    } else {
      rays.push(cornerTopLeft[0].clone());
    }
    if (this.reverse) {
      rays.reverse();
    }
    GeomHelpers.normalizeRayDirections(rays);
    if (this.center.direction) {
      rays.forEach(r => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r)
      })
    }
    return rays;
  }
  flatten(cornerSegments: number = 8, edgeSegments: number = 1) {
    return this.generate(cornerSegments, edgeSegments).map(r => r.flatten())
  }
}

export class RoundedRectangularDonut {
  center: Ray
  width: number
  height: number
  radius: number
  thickness: number
  reverse: boolean
  constructor(center: Ray, width: number, height: number, radius: number, thickness: number, reverse: boolean = false) {
    this.center = center
    this.width = width
    this.height = height
    this.radius = radius
    this.thickness = thickness
    this.reverse = reverse
  }
  generate(cornerSegments: number = 8, edgeSegments: number = 1) {
    const outer = new RoundedRectangle(this.center, this.width, this.height, this.radius).generate(cornerSegments, edgeSegments);
    const inner = this.radius - this.thickness > 0 ? 
      new RoundedRectangle(this.center, this.width - this.thickness * 2, this.height - this.thickness * 2, this.radius - this.thickness, true).generate(cornerSegments, edgeSegments) :
      new Rectangle(this.center, this.width - this.thickness * 2, this.height - this.thickness * 2, true).generate(edgeSegments);
      return [
        ...outer,
        ...inner,
        outer[0]
      ]
  }
  flatten(cornerSegments: number = 8, edgeSegments: number = 1) {
    return this.generate(cornerSegments, edgeSegments).map(r => r.flatten())
  }
}