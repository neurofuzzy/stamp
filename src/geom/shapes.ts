import { makeCircle } from "../lib/smallest-enclosing-circle";
import { GeomHelpers } from "./helpers";

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
  center: Ray;
  segments: number;
  reverse: boolean;
  isHole: boolean;
  alignment: ShapeAlignment;
  generate(): Ray[];
  clone(): IShape;
  boundingBox(): BoundingBox;
  boundingCircle(): BoundingCircle;
  children(): IShape[];
  addChild(shape: IShape): void;
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
}

export class BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
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
}

export class AbstractShape implements IShape {
  center: Ray;
  segments: number;
  reverse: boolean;
  childShapes: IShape[];
  isHole: boolean;
  alignment: ShapeAlignment = ShapeAlignment.CENTER;
  constructor(
    center?: Ray,
    segments: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    this.center = center || new Ray(0, 0);
    this.segments = Math.floor(Math.max(1, segments));
    this.alignment = alignment;
    this.reverse = reverse || false;
    this.childShapes = [];
    this.isHole = false;
  }
  generate(): Ray[] {
    console.log("generate", this.segments);
    throw new Error("Method not implemented.");
  }
  clone(): IShape {
    return new AbstractShape(this.center.clone(), this.segments, this.alignment, this.reverse);
  }
  protected alignmentOffset(): Point {
    let d = this.center.direction;
    this.center.direction = 0;
    let bb = this.boundingBox();
    this.center.direction = d;
    let pt = new Point(0, 0);
    switch (this.alignment) {
      case ShapeAlignment.TOP_LEFT:
        pt.x -= bb.width * 0.5;
        pt.y -= bb.height * 0.5;
        break;
      case ShapeAlignment.TOP:
        pt.y -= bb.height * 0.5;
        break;
      case ShapeAlignment.TOP_RIGHT:
        pt.x += bb.width * 0.5;
        pt.y -= bb.height * 0.5;
        break;
      case ShapeAlignment.LEFT:
        pt.x -= bb.width * 0.5;
        break;
      case ShapeAlignment.CENTER:
        break;
      case ShapeAlignment.RIGHT:
        pt.x += bb.width * 0.5;
        break;
      case ShapeAlignment.BOTTOM_LEFT:
        pt.x -= bb.width * 0.5;
        pt.y += bb.height * 0.5;
        break;
      case ShapeAlignment.BOTTOM:
        pt.y += bb.height * 0.5;
        break;
      case ShapeAlignment.BOTTOM_RIGHT:
        pt.x += bb.width * 0.5;
    }
    return pt;
  }
  boundingBox(): BoundingBox {
    const rays = this.generate();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    rays.forEach((r) => {
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x > maxX) maxX = r.x;
      if (r.y > maxY) maxY = r.y;
    });
    this.children().forEach((shape) => {
      const bb = shape.boundingBox();
      if (bb.x < minX) minX = bb.x;
      if (bb.y < minY) minY = bb.y;
      if (bb.x + bb.width > maxX)
        maxX = bb.x + bb.width;
      if (bb.y + bb.height > maxY)
        maxY = bb.y + bb.height;
    });
    return new BoundingBox(
      minX,
      minY,
      maxX - minX,
      maxY - minY
    );
  }
  boundingCircle(): BoundingCircle {
    const rays = this.generate();
    this.children().forEach((shape) => {
      rays.push(...shape.generate());
    });
    let c = makeCircle(rays);
    if (c) {
      return new BoundingCircle(c.x, c.y, c.r);
    }
    return new BoundingCircle(this.center.x, this.center.y, 0);
  }
  children(): IShape[] {
    return this.childShapes;
  }
  addChild(shape: IShape) {
    this.childShapes.push(shape);
  }
}

export class Arc extends AbstractShape {
  radius: number;
  startAngle: number;
  endAngle: number;
  constructor(
    center?: Ray,
    radius: number = 50,
    startAngle: number = 0,
    endAngle: number = Math.PI * 2,
    segments: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, segments, alignment, reverse);
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.reverse = reverse;
  }
  generate() {
    const rays = [];
    for (let i = 0; i <= this.segments; i++) {
      const angle = GeomHelpers.lerpAngle(
        this.startAngle,
        this.endAngle,
        i / this.segments
      );
      rays.push(
        new Ray(
          this.center.x + this.radius * Math.cos(angle),
          this.center.y + this.radius * Math.sin(angle),
          this.startAngle + (Math.PI * 2 * i) / this.segments
        )
      );
    }
    if (this.reverse) {
      rays.reverse();
      rays.forEach((r) => (r.direction += Math.PI));
    }
    if (this.reverse) {
      rays.reverse();
    }
    GeomHelpers.normalizeRayDirections(rays);
    if (this.center.direction) {
      rays.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    return rays;
  }
  clone() {
    return new Arc(
      this.center.clone(),
      this.radius,
      this.startAngle,
      this.endAngle,
      this.segments,
      this.alignment,
      this.reverse
    );
  }
}

export class Polygon extends AbstractShape {
  rays: Ray[];
  constructor(
    center?: Ray,
    rays: Ray[] = [],
    segments: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, segments, alignment, reverse);
    this.rays = rays;
    const bc = makeCircle(rays);
    const offset = this.alignmentOffset();
    if (bc) {
      this.center.x = bc.x + offset.x;
      this.center.y = bc.y + offset.y;
    }
  }
  generate() {
    let rays = this.rays.slice().map((r) => r.clone());
    if (this.segments > 1) {
      rays = GeomHelpers.subdivideRaySet(rays, this.segments);
    }
    GeomHelpers.normalizeRayDirections(rays);
    if (this.center.direction) {
      rays.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    if (this.reverse) {
      rays.reverse();
      rays.forEach((r) => (r.direction += Math.PI));
    }
    return rays;
  }
  clone() {
    return new Polygon(
      this.center.clone(),
      this.rays,
      this.segments,
      this.alignment,
      this.reverse
    );
  }
}

export class Circle extends AbstractShape {
  radius: number;
  constructor(
    center?: Ray,
    radius: number = 50,
    segments: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, segments, alignment, reverse);
    this.radius = radius;
  }
  protected alignmentOffset(): Point {
    switch (this.alignment) {
      case ShapeAlignment.TOP_LEFT:
        return new Point(-this.radius, -this.radius);
      case ShapeAlignment.TOP:
        return new Point(0, -this.radius);
      case ShapeAlignment.TOP_RIGHT:
        return new Point(this.radius, -this.radius);
      case ShapeAlignment.LEFT:
        return new Point(-this.radius, 0);
      case ShapeAlignment.CENTER:
        return new Point(0, 0);
      case ShapeAlignment.RIGHT:
        return new Point(this.radius, 0);
      case ShapeAlignment.BOTTOM_LEFT:
        return new Point(-this.radius, this.radius);
      case ShapeAlignment.BOTTOM:
        return new Point(0, this.radius);
      case ShapeAlignment.BOTTOM_RIGHT:
        return new Point(this.radius, this.radius);
      default:
        return new Point(0, 0);
    }
  }
  generate() {
    const rays = [];
    const offset = this.alignmentOffset();
    for (let i = 0; i <= this.segments; i++) {
      rays.push(
        new Ray(
          this.center.x +
            this.radius *
              Math.cos(
                this.center.direction + (Math.PI * 2 * i) / this.segments
              ) +
            offset.x,
          this.center.y +
            this.radius *
              Math.sin(
                this.center.direction + (Math.PI * 2 * i) / this.segments
              ) +
            offset.y,
          this.center.direction + (Math.PI * 2 * i) / this.segments
        )
      );
    }
    if (this.center.direction) {
      rays.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    if (this.reverse) {
      rays.reverse();
      rays.forEach((r) => (r.direction += Math.PI));
    }
    return rays;
  }
  clone() {
    return new Circle(
      this.center.clone(),
      this.radius,
      this.segments,
      this.alignment,
      this.reverse
    );
  }
}

export class Rectangle extends AbstractShape {
  width: number;
  height: number;
  constructor(
    center?: Ray,
    width: number = 100,
    height: number = 100,
    segments: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, segments, alignment, reverse);
    this.width = width;
    this.height = height;
  }
  protected alignmentOffset(): Point {
    switch (this.alignment) {
      case ShapeAlignment.TOP_LEFT:
        return new Point(-this.width / 2, -this.height / 2);
      case ShapeAlignment.TOP:
        return new Point(0, -this.height / 2);
      case ShapeAlignment.TOP_RIGHT:
        return new Point(this.width / 2, -this.height / 2);
      case ShapeAlignment.LEFT:
        return new Point(-this.width / 2, 0);
      case ShapeAlignment.CENTER:
        return new Point(0, 0);
      case ShapeAlignment.RIGHT:
        return new Point(this.width / 2, 0);
      case ShapeAlignment.BOTTOM_LEFT:
        return new Point(-this.width / 2, this.height / 2);
      case ShapeAlignment.BOTTOM:
        return new Point(0, this.height / 2);
      case ShapeAlignment.BOTTOM_RIGHT:
        return new Point(this.width / 2, this.height / 2);
      default:
        return new Point(0, 0);
    }
  }
  generate() {
    let rays: Ray[] = [];
    const offset = this.alignmentOffset();
    // add rectangle corners
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x,
        this.center.y - this.height / 2 + offset.y
      )
    );
    rays.push(
      new Ray(
        this.center.x + this.width / 2 + offset.x,
        this.center.y - this.height / 2 + offset.y
      )
    );
    rays.push(
      new Ray(
        this.center.x + this.width / 2 + offset.x,
        this.center.y + this.height / 2 + offset.y
      )
    );
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x,
        this.center.y + this.height / 2 + offset.y
      )
    );
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x,
        this.center.y - this.height / 2 + offset.y
      )
    );
    if (this.reverse) {
      rays.reverse();
    }
    GeomHelpers.normalizeRayDirections(rays);
    if (this.center.direction) {
      rays.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    if (this.segments > 1) {
      rays = GeomHelpers.subdivideRays(rays[0], rays[1], this.segments)
        .concat(GeomHelpers.subdivideRays(rays[1], rays[2], this.segments))
        .concat(GeomHelpers.subdivideRays(rays[2], rays[3], this.segments))
        .concat(GeomHelpers.subdivideRays(rays[3], rays[0], this.segments));
    }
    return rays;
  }
  clone() {
    return new Rectangle(
      this.center.clone(),
      this.width,
      this.height,
      this.segments,
      this.alignment,
      this.reverse
    );
  }
}

export class RoundedRectangle extends Rectangle {
  radius: number;
  constructor(
    center?: Ray,
    width: number = 100,
    height: number = 100,
    radius: number = 25,
    segments: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, width, height, segments, alignment, reverse);
    this.radius = radius;
  }
  generate() {
    if (this.radius === 0) {
      return super.generate();
    }
    const rays: Ray[] = [];
    const offset = this.alignmentOffset();
    // add rectangle corners
    const arcCenterTopLeft = new Ray(
      this.center.x - this.width / 2 + this.radius + offset.x,
      this.center.y - this.height / 2 + this.radius + offset.y
    );
    const arcCenterTopRight = new Ray(
      this.center.x + this.width / 2 - this.radius + offset.x,
      this.center.y - this.height / 2 + this.radius + offset.y
    );
    const arcCenterBottomRight = new Ray(
      this.center.x + this.width / 2 - this.radius + offset.x,
      this.center.y + this.height / 2 - this.radius + offset.y
    );
    const arcCenterBottomLeft = new Ray(
      this.center.x - this.width / 2 + this.radius + offset.x,
      this.center.y + this.height / 2 - this.radius + offset.y
    );
    const cornerTopLeft = new Arc(
      arcCenterTopLeft,
      this.radius,
      0 - Math.PI,
      0 - Math.PI / 2,
      this.segments * 3
    ).generate();
    const cornerTopRight = new Arc(
      arcCenterTopRight,
      this.radius,
      0 - Math.PI / 2,
      0,
      this.segments * 3
    ).generate();
    const cornerBottomRight = new Arc(
      arcCenterBottomRight,
      this.radius,
      0,
      Math.PI / 2,
      this.segments * 3
    ).generate();
    const cornerBottomLeft = new Arc(
      arcCenterBottomLeft,
      this.radius,
      Math.PI / 2,
      Math.PI,
      this.segments * 3
    ).generate();
    rays.push(...cornerTopLeft);
    if (this.segments > 1) {
      const top = GeomHelpers.subdivideRays(
        cornerTopLeft[cornerBottomLeft.length - 1],
        cornerTopRight[0],
        this.segments
      );
      top.shift();
      top.pop();
      rays.push(...top);
    }
    rays.push(...cornerTopRight);
    if (this.segments > 1) {
      const right = GeomHelpers.subdivideRays(
        cornerTopRight[cornerBottomRight.length - 1],
        cornerBottomRight[0],
        this.segments
      );
      right.shift();
      right.pop();
      rays.push(...right);
    }
    rays.push(...cornerBottomRight);
    if (this.segments > 1) {
      const bottom = GeomHelpers.subdivideRays(
        cornerBottomRight[cornerTopRight.length - 1],
        cornerBottomLeft[0],
        this.segments
      );
      bottom.shift();
      bottom.pop();
      rays.push(...bottom);
    }
    rays.push(...cornerBottomLeft);
    if (this.segments > 1) {
      const left = GeomHelpers.subdivideRays(
        cornerBottomLeft[cornerTopLeft.length - 1],
        cornerTopLeft[0],
        this.segments
      );
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
      rays.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    return rays;
  }
  clone() {
    return new RoundedRectangle(
      this.center.clone(),
      this.width,
      this.height,
      this.radius,
      this.segments,
      this.alignment,
      this.reverse
    );
  }
}
