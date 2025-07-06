import { makeCircle } from "../lib/smallest-enclosing-circle";
import {
  IShape,
  Ray,
  ShapeAlignment,
  IStyle,
  Point,
  BoundingBox,
  BoundingCircle,
  Segment,
} from "./core";
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
  };
  id: number = ++AbstractShape.id;
  center: Ray;
  scale: number = 1;
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
    reverse: boolean = false,
  ) {
    this.center = center || new Ray(0, 0);
    this.divisions = Math.floor(Math.max(1, divisions));
    this.alignment = alignment;
    this.reverse = reverse || false;
    this.childShapes = [];
    this.isHole = false;
    this.scale = 1;
  }
  generate(): Ray[] {
    console.log("generate", this.divisions);
    throw new Error("Generate method not implemented.");
  }
  toSegments(): Segment[] {
    const rays = this.generate();
    const segs: Segment[] = [];
    rays.forEach((r, idx) => {
      if (idx > 0) {
        segs.push(new Segment(rays[idx - 1], r));
      }
    });
    segs.push(new Segment(rays[rays.length - 1], rays[0]));
    return segs;
  }
  protected alignmentOffset(): Point {
    let d = this.center.direction;
    this.center.direction = 0;
    let bb = this.boundingBox();
    this.center.direction = d;
    let pt = new Point(0, 0);
    switch (this.alignment) {
      case ShapeAlignment.TOP_LEFT:
        pt.x -= bb.x - this.center.x;
        pt.y -= bb.y + bb.height - this.center.y;
        break;
      case ShapeAlignment.TOP:
        pt.x -= bb.x - this.center.x;
        pt.y -= bb.y + bb.height - this.center.y;
        break;
      case ShapeAlignment.TOP_RIGHT:
        pt.x -= bb.x + bb.width - this.center.x;
        pt.y -= bb.y + bb.height - this.center.y;
        break;
      case ShapeAlignment.LEFT:
        pt.x -= bb.x - this.center.x;
        pt.y -= bb.y + bb.height / 2 - this.center.y;
        break;
      case ShapeAlignment.CENTER:
        pt.x -= bb.x + bb.width / 2 - this.center.x;
        pt.y -= bb.y + bb.height / 2 - this.center.y;
        break;
      case ShapeAlignment.RIGHT:
        pt.x -= bb.x + bb.width - this.center.x;
        pt.y -= bb.y + bb.height / 2 - this.center.y;
        break;
      case ShapeAlignment.BOTTOM_LEFT:
        pt.x -= bb.x - this.center.x;
        pt.y -= bb.y - this.center.y;
        break;
      case ShapeAlignment.BOTTOM:
        pt.x -= bb.x + bb.width / 2 - this.center.x;
        pt.y -= bb.y - this.center.y;
        break;
      case ShapeAlignment.BOTTOM_RIGHT:
        pt.x -= bb.x + bb.width - this.center.x;
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
      if (bb.x + bb.width > maxX) maxX = bb.x + bb.width;
      if (bb.y + bb.height > maxY) maxY = bb.y + bb.height;
    });
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
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
  protected fit(rays: Ray[], withinArea?: BoundingBox) {
    if (withinArea) {
      const bb = this.boundingBox();
      const scale = Math.min(
        withinArea.width / bb.width,
        withinArea.height / bb.height,
      );
      rays.forEach((r) => {
        r.x *= scale;
        r.y *= scale;
      });
    }
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
    reverse: boolean = false,
  ) {
    super(center, divisions, alignment, reverse);
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.reverse = reverse;
  }
  generate(withinArea?: BoundingBox) {
    const rays = [];
    for (let i = 0; i <= this.divisions; i++) {
      const angle = GeomHelpers.lerpAngle(
        this.startAngle,
        this.endAngle,
        i / this.divisions,
      );
      rays.push(
        new Ray(
          this.center.x + this.radius * Math.cos(angle),
          this.center.y + this.radius * Math.sin(angle),
          this.startAngle + (Math.PI * 2 * i) / this.divisions,
        ),
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
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Arc(
      this.center.clone(),
      this.radius * scale,
      this.startAngle,
      this.endAngle,
      this.divisions,
      this.alignment,
      this.reverse,
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class Arch extends AbstractShape {
  radius: number;
  width: number;
  private _height: number;
  sweepAngleDegrees: number;
  startAngle: number;
  endAngle: number;
  constructor(
    center?: Ray,
    width: number = 100,
    sweepAngleDegrees: number = 30,
    divisions: number = 64,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false,
  ) {
    super(center, divisions, alignment, reverse);
    this.width = width;
    this.sweepAngleDegrees = sweepAngleDegrees;
    this.startAngle = 0 - (sweepAngleDegrees * Math.PI) / 180 - Math.PI / 2;
    this.endAngle = (sweepAngleDegrees * Math.PI) / 180 - Math.PI / 2;
    const b = this.width * 0.5;
    const a = b * Math.tan(this.endAngle);
    this.radius = Math.sqrt(b * b + a * a);
    this._height = (this.radius + this.radius * Math.sin(this.endAngle)) * 2;
    this.reverse = reverse;
  }
  generate(withinArea?: BoundingBox) {
    if (this.sweepAngleDegrees === 0) {
      return [];
    }
    const rays = [];
    for (let i = 0; i <= this.divisions; i++) {
      const angle = GeomHelpers.lerpAngle(
        this.startAngle,
        this.endAngle,
        i / this.divisions,
      );
      rays.push(
        new Ray(
          this.center.x + this.radius * Math.cos(angle),
          this.center.y + this.radius * Math.sin(angle) + this.radius,
          this.startAngle + (Math.PI * 2 * i) / this.divisions,
        ),
      );
    }
    rays.forEach((r) => {
      r.y -= this._height * 0.5;
    });
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
    this.fit(rays, withinArea);
    return rays;
  }
  boundingBox(): BoundingBox {
    if (this.sweepAngleDegrees === 0) {
      return new BoundingBox(this.center.x, this.center.y, 0, 0);
    }
    return new BoundingBox(
      this.center.x - this.width / 2,
      this.center.y - this._height / 2,
      this.width,
      this._height,
    );
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Arch(
      this.center.clone(),
      this.width * scale,
      this.sweepAngleDegrees,
      this.divisions,
      this.alignment,
      this.reverse,
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class Polygon extends AbstractShape {
  rays: Ray[];
  _scale: number = 1;
  constructor(
    center?: Ray,
    rays: Ray[] = [],
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false,
  ) {
    super(center, divisions, alignment, reverse);
    this.rays = rays;
  }
  setScale(s: number) {
    if (!isNaN(s)) {
      this._scale = s;
    }
  }
  generate(withinArea?: BoundingBox) {
    let rays = this.rays.slice().map((r) => r.clone());
    if (this._scale !== 1) {
      rays.forEach((r) => {
        r.x *= this._scale;
        r.y *= this._scale;
      });
    }
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
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Polygon(
      this.center.clone(),
      this.rays.map((r) => r.clone()),
      this.divisions,
      this.alignment,
      this.reverse,
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    s.setScale(scale);
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
    reverse: boolean = false,
  ) {
    if (divisions <= 2) {
      divisions = 32;
    }
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
  generate(withinArea?: BoundingBox) {
    const rays = [];
    const offset = this.alignmentOffset();
    for (let i = 0; i <= this.divisions; i++) {
      rays.push(
        new Ray(
          this.center.x +
            this.radius *
              Math.cos(
                this.center.direction + (Math.PI * 2 * i) / this.divisions,
              ) +
            offset.x,
          this.center.y +
            this.radius *
              Math.sin(
                this.center.direction + (Math.PI * 2 * i) / this.divisions,
              ) +
            offset.y,
          this.center.direction + (Math.PI * 2 * i) / this.divisions,
        ),
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
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Circle(
      this.center.clone(),
      this.radius * scale,
      this.divisions,
      this.alignment,
      this.reverse,
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class Ellipse extends AbstractShape {
  radiusX: number;
  radiusY: number;
  constructor(
    center?: Ray,
    radiusX: number = 50,
    radiusY: number = 50,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false,
  ) {
    super(center, divisions, alignment, reverse);
    this.radiusX = radiusX;
    this.radiusY = radiusY;
  }
  protected alignmentOffset(): Point {
    switch (this.alignment) {
      case ShapeAlignment.TOP_LEFT:
        return new Point(-this.radiusX, -this.radiusY);
      case ShapeAlignment.TOP:
        return new Point(0, -this.radiusY);
      case ShapeAlignment.TOP_RIGHT:
        return new Point(this.radiusX, -this.radiusY);
      case ShapeAlignment.LEFT:
        return new Point(-this.radiusX, 0);
      case ShapeAlignment.CENTER:
        return new Point(0, 0);
      case ShapeAlignment.RIGHT:
        return new Point(this.radiusX, 0);
      case ShapeAlignment.BOTTOM_LEFT:
        return new Point(-this.radiusX, this.radiusY);
      case ShapeAlignment.BOTTOM:
        return new Point(0, this.radiusY);
      case ShapeAlignment.BOTTOM_RIGHT:
        return new Point(this.radiusX, this.radiusY);
      default:
        return new Point(0, 0);
    }
  }
  generate(withinArea?: BoundingBox) {
    const rays = [];
    const offset = this.alignmentOffset();
    for (let i = 0; i <= this.divisions; i++) {
      rays.push(
        new Ray(
          this.center.x +
            this.radiusX *
              Math.cos(
                this.center.direction + (Math.PI * 2 * i) / this.divisions,
              ) +
            offset.x,
          this.center.y +
            this.radiusY *
              Math.sin(
                this.center.direction + (Math.PI * 2 * i) / this.divisions,
              ) +
            offset.y,
          this.center.direction + (Math.PI * 2 * i) / this.divisions,
        ),
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
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Ellipse(
      this.center.clone(),
      this.radiusX * scale,
      this.radiusY * scale,
      this.divisions,
      this.alignment,
      this.reverse,
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
    reverse: boolean = false,
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
  generate(withinArea?: BoundingBox) {
    let rays: Ray[] = [];
    const offset = this.alignmentOffset();
    // add rectangle corners
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x,
        this.center.y - this.height / 2 + offset.y,
      ),
    );
    rays.push(
      new Ray(
        this.center.x + this.width / 2 + offset.x,
        this.center.y - this.height / 2 + offset.y,
      ),
    );
    rays.push(
      new Ray(
        this.center.x + this.width / 2 + offset.x,
        this.center.y + this.height / 2 + offset.y,
      ),
    );
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x,
        this.center.y + this.height / 2 + offset.y,
      ),
    );
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x,
        this.center.y - this.height / 2 + offset.y,
      ),
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
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Rectangle(
      this.center.clone(),
      this.width * scale,
      this.height * scale,
      this.divisions,
      this.alignment,
      this.reverse,
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class Trapezoid extends Rectangle {
  taper: number;
  constructor(
    center?: Ray,
    width: number = 100,
    height: number = 100,
    taper: number = 20,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false,
  ) {
    super(center, width, height, divisions, alignment, reverse);
    this.taper = taper;
  }
  generate(withinArea?: BoundingBox) {
    let rays: Ray[] = [];
    const offset = this.alignmentOffset();
    // add rectangle corners
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x + this.taper,
        this.center.y - this.height / 2 + offset.y,
      ),
    );
    rays.push(
      new Ray(
        this.center.x + this.width / 2 + offset.x - this.taper,
        this.center.y - this.height / 2 + offset.y,
      ),
    );
    rays.push(
      new Ray(
        this.center.x + this.width / 2 + offset.x,
        this.center.y + this.height / 2 + offset.y,
      ),
    );
    rays.push(
      new Ray(
        this.center.x - this.width / 2 + offset.x,
        this.center.y + this.height / 2 + offset.y,
      ),
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
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Trapezoid(
      this.center.clone(),
      this.width * scale,
      this.height * scale,
      this.taper * scale,
      this.divisions,
      this.alignment,
      this.reverse,
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
    reverse: boolean = false,
  ) {
    super(center, width, height, divisions, alignment, reverse);
    this.radius = radius;
  }
  generate(withinArea?: BoundingBox) {
    if (this.radius === 0) {
      return super.generate();
    }
    const rays: Ray[] = [];
    const offset = this.alignmentOffset();
    // add rectangle corners
    const arcCenterTopLeft = new Ray(
      this.center.x - this.width / 2 + this.radius + offset.x,
      this.center.y - this.height / 2 + this.radius + offset.y,
    );
    const arcCenterTopRight = new Ray(
      this.center.x + this.width / 2 - this.radius + offset.x,
      this.center.y - this.height / 2 + this.radius + offset.y,
    );
    const arcCenterBottomRight = new Ray(
      this.center.x + this.width / 2 - this.radius + offset.x,
      this.center.y + this.height / 2 - this.radius + offset.y,
    );
    const arcCenterBottomLeft = new Ray(
      this.center.x - this.width / 2 + this.radius + offset.x,
      this.center.y + this.height / 2 - this.radius + offset.y,
    );
    const cornerTopLeft = new Arc(
      arcCenterTopLeft,
      this.radius,
      0 - Math.PI,
      0 - Math.PI / 2,
      this.divisions * 3,
    ).generate();
    const cornerTopRight = new Arc(
      arcCenterTopRight,
      this.radius,
      0 - Math.PI / 2,
      0,
      this.divisions * 3,
    ).generate();
    const cornerBottomRight = new Arc(
      arcCenterBottomRight,
      this.radius,
      0,
      Math.PI / 2,
      this.divisions * 3,
    ).generate();
    const cornerBottomLeft = new Arc(
      arcCenterBottomLeft,
      this.radius,
      Math.PI / 2,
      Math.PI,
      this.divisions * 3,
    ).generate();
    rays.push(...cornerTopLeft);
    if (this.divisions > 1) {
      const top = GeomHelpers.subdivideRays(
        cornerTopLeft[cornerBottomLeft.length - 1],
        cornerTopRight[0],
        this.divisions,
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
        this.divisions,
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
        this.divisions,
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
        this.divisions,
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
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new RoundedRectangle(
      this.center.clone(),
      this.width * scale,
      this.height * scale,
      this.radius * scale,
      this.divisions,
      this.alignment,
      this.reverse,
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

// Bone is a shape that is a rounded trapezoid where the top and bottom have different radii
export class Bone extends AbstractShape {
  length: number;
  topRadius: number;
  bottomRadius: number;
  constructor(
    center: Ray,
    length: number,
    bottomRadius: number,
    topRadius: number,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false,
  ) {
    super(center, divisions, alignment, reverse);
    this.center = center;
    this.length = length;
    this.bottomRadius = bottomRadius;
    this.topRadius = topRadius;
    this.divisions = divisions;
    this.alignment = alignment;
    this.reverse = reverse;
  }
  generate(withinArea?: BoundingBox) {
    const bottomCenter = new Ray(
      this.center.x,
      this.center.y - this.length * 0.5,
    );
    const topCenter = new Ray(this.center.x, this.center.y + this.length * 0.5);
    switch (this.alignment) {
      case ShapeAlignment.CENTER:
        break;
      case ShapeAlignment.TOP:
        (bottomCenter.y -= this.length * 0.5),
          (topCenter.y -= this.length * 0.5);
        break;
      case ShapeAlignment.BOTTOM:
        (bottomCenter.y += this.length * 0.5),
          (topCenter.y += this.length * 0.5);
        break;
    }
    const tangents = GeomHelpers.circleCircleTangents(
      bottomCenter,
      this.bottomRadius,
      topCenter,
      this.topRadius,
    );
    const rays = [];
    rays.push(tangents[0].toRay());
    rays.push(tangents[1].toRay());

    let side1 = GeomHelpers.subdivideRays(
      tangents[0].toRay(),
      tangents[1].toRay(),
      this.divisions,
    );
    if (this.divisions > 0) {
      side1 = side1.slice(1, -1);
    }
    rays.push(...side1);

    if (this.divisions > 0) {
      const arc1 = new Arc(
        bottomCenter,
        this.bottomRadius,
        GeomHelpers.angleBetweenPoints(tangents[0], tangents[1]) -
          Math.PI * 0.5,
        GeomHelpers.angleBetweenPoints(tangents[2], tangents[3]) -
          Math.PI * 0.5,
        this.divisions * 2,
      );
      rays.push(...arc1.generate());
    }

    let side2 = GeomHelpers.subdivideRays(
      tangents[2].toRay(),
      tangents[3].toRay(),
      this.divisions,
    );
    if (this.divisions > 0) {
      side2 = side2.slice(1, -1);
    }
    rays.push(...side2);

    if (this.divisions > 0) {
      const arc2 = new Arc(
        topCenter,
        this.topRadius,
        GeomHelpers.angleBetweenPoints(tangents[2], tangents[3]) -
          Math.PI * 0.5,
        GeomHelpers.angleBetweenPoints(tangents[0], tangents[1]) -
          Math.PI * 0.5 +
          Math.PI * 2,
        this.divisions * 2,
      );
      rays.push(...arc2.generate());
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

    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Bone(
      this.center.clone(),
      this.length * scale,
      this.topRadius * scale,
      this.bottomRadius * scale,
      this.divisions,
      this.alignment,
      this.reverse,
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class LeafShape extends AbstractShape {
  radius: number;
  splitAngle: number;
  splitAngle2: number;
  serration: number;
  constructor(
    center?: Ray, 
    radius: number = 50, 
    divisions: number = 12, 
    splitAngle: number = 45, 
    splitAngle2: number = 0,
    serration: number = 0,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false
  ) {
    divisions = Math.max(2, Math.ceil(divisions / 2) * 2);
    super(center, divisions, alignment, reverse);
    this.radius = radius;
    this.splitAngle = splitAngle;
    this.splitAngle2 = splitAngle2 || this.splitAngle;
    this.serration = serration;
  }
  protected alignmentOffset(): Point {
    const r1 = this.radius - Math.cos(this.splitAngle2 * Math.PI / 180) * this.radius;
    const r2 = this.radius - Math.cos(this.splitAngle * Math.PI / 180) * this.radius;
    const minY = 0 - r2 * Math.sin(this.splitAngle2 * Math.PI / 180);
    const maxY = r1 * Math.sin(this.splitAngle * Math.PI / 180);
    const maxX = r1 - r1 * Math.cos(this.splitAngle * Math.PI / 180);
    const minX = 0 - maxX;
    switch (this.alignment) {
      case ShapeAlignment.TOP_LEFT:
        return new Point(minX, minY);
      case ShapeAlignment.TOP:
        return new Point(0, minY);
      case ShapeAlignment.TOP_RIGHT:
        return new Point(maxX, minY);
      case ShapeAlignment.LEFT:
        return new Point(minX, 0);
      case ShapeAlignment.CENTER:
        return new Point(0, 0);
      case ShapeAlignment.RIGHT:
        return new Point(maxX, 0);
      case ShapeAlignment.BOTTOM_LEFT:
        return new Point(minX, maxY);
      case ShapeAlignment.BOTTOM:
        return new Point(0, maxY);
      case ShapeAlignment.BOTTOM_RIGHT:
        return new Point(maxX, maxY);
      default:
        return new Point(0, 0);
    }
  }
  generate(withinArea?: BoundingBox) {
    let rays = [];
    const offset = this.alignmentOffset();
    let degsPerStep = this.splitAngle * 2 / this.divisions;
    const r1 = this.radius - Math.cos(this.splitAngle2 * Math.PI / 180) * (this.radius + this.serration);
    for (let i = 0; i <= this.divisions / 2; i++) {
      let currentAngle = degsPerStep * i;
      let deg = 90 + currentAngle - this.splitAngle;
      let delta = r1;
      if (this.serration !== 0 && i % 2 === 0) {
        delta = r1 + this.serration;
      }
      let r = new Ray(0, delta);
      GeomHelpers.rotatePoint(r, deg * Math.PI / 180);
      r.x += this.radius - r1;
      r.y = 0 - r.y;
      rays.push(r);
    }
    const r2 = this.radius - Math.cos(this.splitAngle * Math.PI / 180) * (this.radius + this.serration);
    degsPerStep = this.splitAngle2 * 2 / this.divisions;
    for (let i = this.divisions / 2; i <= this.divisions; i++) {
      let currentAngle = degsPerStep * i;
      let deg = 90 + currentAngle - this.splitAngle2;
      let delta = r2;
      if (this.serration !== 0 && i % 2 === 0) {
        delta = r2 + this.serration;
      }
      let r = new Ray(0, delta);
      GeomHelpers.rotatePoint(r, deg * Math.PI / 180);
      r.x += this.radius - r2;
      r.y = 0 - r.y;
      rays.push(r);
    }
    const minX = Math.min(...rays.map(pt => pt.x));
    rays.forEach((r) => {
      r.x -= minX;
    });
    const mirroredRays = rays.map(pt => new Ray(-pt.x, pt.y, GeomHelpers.normalizeAngle(pt.direction + Math.PI)));
    rays = rays.concat(mirroredRays.reverse());
    GeomHelpers.normalizeRayDirections(rays);
    rays.forEach((r) => {
      r.x += this.center.x + offset.x;
      r.y += this.center.y + offset.y;
    });
    if (this.center.direction) {
      rays.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    if (this.reverse) {
      rays.reverse();
      rays.forEach((r) => (r.direction += Math.PI));
    }
    this.fit(rays, withinArea);
    return rays;
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new LeafShape(
      this.center.clone(),
      this.radius * scale,
      this.divisions,
      this.splitAngle,
      this.splitAngle2,
      this.serration,
      this.alignment,
      this.reverse
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}