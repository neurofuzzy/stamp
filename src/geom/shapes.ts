import { makeCircle } from "../lib/smallest-enclosing-circle";
import { IShape, Ray, ShapeAlignment, IStyle, Point, BoundingBox, BoundingCircle } from "./core";
import { GeomHelpers } from "./helpers";

export class AbstractShape implements IShape {
  static id = 0;
  static defaultStyle: IStyle = {
    strokeColor: "#cccccc",
    strokeThickness: 1,
    fillColor: "#222222",
    fillAlpha: 1,
    hatchStrokeColor: "#cccccc",
    hatchStrokeThickness: 0.5,
    hatchScale: 1,
  }
  id: number = ++AbstractShape.id;
  center: Ray;
  divisions: number;
  reverse: boolean;
  childShapes: IShape[];
  isHole: boolean;
  alignment: ShapeAlignment = ShapeAlignment.CENTER;
  hidden = false;
  style: IStyle = AbstractShape.defaultStyle;
  constructor(
    center?: Ray,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    this.center = center || new Ray(0, 0);
    this.divisions = Math.floor(Math.max(1, divisions));
    this.alignment = alignment;
    this.reverse = reverse || false;
    this.childShapes = [];
    this.isHole = false;
  }
  generate(): Ray[] {
    console.log("generate", this.divisions);
    throw new Error("Generate method not implemented.");
  }
  protected alignmentOffset(): Point {
    let d = this.center.direction;
    this.center.direction = 0;
    let bb = this.boundingBox();
    this.center.direction = d;
    let pt = new Point(0, 0);
    switch (this.alignment) {
      case ShapeAlignment.TOP_LEFT:
        pt.x -= (bb.x) - this.center.x;
        pt.y -= (bb.y + bb.height) - this.center.y;
        break;
      case ShapeAlignment.TOP:
        pt.x -= (bb.x) - this.center.x;
        pt.y -= (bb.y + bb.height) - this.center.y;
        break;
      case ShapeAlignment.TOP_RIGHT:
        pt.x -= (bb.x + bb.width) - this.center.x;
        pt.y -= (bb.y + bb.height) - this.center.y;
        break;
      case ShapeAlignment.LEFT:
        pt.x -= (bb.x) - this.center.x;
        pt.y -= (bb.y + bb.height / 2) - this.center.y;
        break;
      case ShapeAlignment.CENTER:
        pt.x -= (bb.x + bb.width / 2) - this.center.x;
        pt.y -= (bb.y + bb.height / 2) - this.center.y;
        break;
      case ShapeAlignment.RIGHT:
        pt.x -= (bb.x + bb.width) - this.center.x;
        pt.y -= (bb.y + bb.height / 2) - this.center.y;
        break;
      case ShapeAlignment.BOTTOM_LEFT:
        pt.x -= (bb.x) - this.center.x;
        pt.y -= bb.y - this.center.y;
        break;
      case ShapeAlignment.BOTTOM:
        pt.x -= (bb.x + bb.width / 2) - this.center.x;
        pt.y -= bb.y - this.center.y;
        break;
      case ShapeAlignment.BOTTOM_RIGHT:
        pt.x -= (bb.x + bb.width) - this.center.x;
        pt.y -= bb.y - this.center.y;
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
  clone(): IShape {
    throw new Error("Clone method not implemented.");
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
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, divisions, alignment, reverse);
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.reverse = reverse;
  }
  generate() {
    const rays = [];
    for (let i = 0; i <= this.divisions; i++) {
      const angle = GeomHelpers.lerpAngle(
        this.startAngle,
        this.endAngle,
        i / this.divisions
      );
      rays.push(
        new Ray(
          this.center.x + this.radius * Math.cos(angle),
          this.center.y + this.radius * Math.sin(angle),
          this.startAngle + (Math.PI * 2 * i) / this.divisions
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
    const s = new Arc(
      this.center.clone(),
      this.radius,
      this.startAngle,
      this.endAngle,
      this.divisions,
      this.alignment,
      this.reverse
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class Polygon extends AbstractShape {
  rays: Ray[];
  constructor(
    center?: Ray,
    rays: Ray[] = [],
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, divisions, alignment, reverse);
    this.rays = rays;
  }
  generate() {
    let rays = this.rays.slice().map((r) => r.clone());
    if (this.divisions > 1) {
      rays = GeomHelpers.subdivideRaySet(rays, this.divisions);
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
    const s = new Polygon(
      this.center.clone(),
      this.rays,
      this.divisions,
      this.alignment,
      this.reverse
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class Circle extends AbstractShape {
  radius: number;
  constructor(
    center?: Ray,
    radius: number = 50,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, divisions, alignment, reverse);
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
    for (let i = 0; i <= this.divisions; i++) {
      rays.push(
        new Ray(
          this.center.x +
            this.radius *
              Math.cos(
                this.center.direction + (Math.PI * 2 * i) / this.divisions
              ) +
            offset.x,
          this.center.y +
            this.radius *
              Math.sin(
                this.center.direction + (Math.PI * 2 * i) / this.divisions
              ) +
            offset.y,
          this.center.direction + (Math.PI * 2 * i) / this.divisions
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
    const s = new Circle(
      this.center.clone(),
      this.radius,
      this.divisions,
      this.alignment,
      this.reverse
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class Rectangle extends AbstractShape {
  width: number;
  height: number;
  constructor(
    center?: Ray,
    width: number = 100,
    height: number = 100,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, divisions, alignment, reverse);
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
    if (this.divisions > 1) {
      rays = GeomHelpers.subdivideRays(rays[0], rays[1], this.divisions)
        .concat(GeomHelpers.subdivideRays(rays[1], rays[2], this.divisions))
        .concat(GeomHelpers.subdivideRays(rays[2], rays[3], this.divisions))
        .concat(GeomHelpers.subdivideRays(rays[3], rays[0], this.divisions));
    }
    return rays;
  }
  clone() {
    const s = new Rectangle(
      this.center.clone(),
      this.width,
      this.height,
      this.divisions,
      this.alignment,
      this.reverse
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class RoundedRectangle extends Rectangle {
  radius: number;
  constructor(
    center?: Ray,
    width: number = 100,
    height: number = 100,
    radius: number = 25,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    super(center, width, height, divisions, alignment, reverse);
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
      this.divisions * 3
    ).generate();
    const cornerTopRight = new Arc(
      arcCenterTopRight,
      this.radius,
      0 - Math.PI / 2,
      0,
      this.divisions * 3
    ).generate();
    const cornerBottomRight = new Arc(
      arcCenterBottomRight,
      this.radius,
      0,
      Math.PI / 2,
      this.divisions * 3
    ).generate();
    const cornerBottomLeft = new Arc(
      arcCenterBottomLeft,
      this.radius,
      Math.PI / 2,
      Math.PI,
      this.divisions * 3
    ).generate();
    rays.push(...cornerTopLeft);
    if (this.divisions > 1) {
      const top = GeomHelpers.subdivideRays(
        cornerTopLeft[cornerBottomLeft.length - 1],
        cornerTopRight[0],
        this.divisions
      );
      top.shift();
      top.pop();
      rays.push(...top);
    }
    rays.push(...cornerTopRight);
    if (this.divisions > 1) {
      const right = GeomHelpers.subdivideRays(
        cornerTopRight[cornerBottomRight.length - 1],
        cornerBottomRight[0],
        this.divisions
      );
      right.shift();
      right.pop();
      rays.push(...right);
    }
    rays.push(...cornerBottomRight);
    if (this.divisions > 1) {
      const bottom = GeomHelpers.subdivideRays(
        cornerBottomRight[cornerTopRight.length - 1],
        cornerBottomLeft[0],
        this.divisions
      );
      bottom.shift();
      bottom.pop();
      rays.push(...bottom);
    }
    rays.push(...cornerBottomLeft);
    if (this.divisions > 1) {
      const left = GeomHelpers.subdivideRays(
        cornerBottomLeft[cornerTopLeft.length - 1],
        cornerTopLeft[0],
        this.divisions
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
    const s = new RoundedRectangle(
      this.center.clone(),
      this.width,
      this.height,
      this.radius,
      this.divisions,
      this.alignment,
      this.reverse
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}
