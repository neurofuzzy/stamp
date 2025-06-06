import {
  AbstractShape,
  Circle,
  Rectangle,
  RoundedRectangle,
} from "./shapes";
import { BoundingBox, IShape, Ray, ShapeAlignment } from "./core";

export class Donut extends Circle {
  innerRadius: number;
  constructor(
    center?: Ray,
    innerRadius: number = 30,
    outerRadius: number = 50,
    divisions: number = 32,
    alignment: ShapeAlignment = ShapeAlignment.CENTER
  ) {
    super(center, outerRadius, divisions, alignment, false);
    this.innerRadius = innerRadius;
  }
  generate() {
    return [];
  }
  children(): IShape[] {
    const offset = this.alignmentOffset();
    offset.x *= 0.5;
    offset.y *= 0.5;
    const offsetCenter = new Ray(
      this.center.x + offset.x,
      this.center.y + offset.y,
      this.center.direction
    );
    const inner = new Circle(
      offsetCenter,
      this.innerRadius,
      this.divisions,
      ShapeAlignment.CENTER,
      true
    );
    const outer = new Circle(
      offsetCenter,
      this.radius,
      this.divisions
    );
    return [outer, inner];
  }
  boundingBox(): BoundingBox {
    return new BoundingBox(
      this.center.x - this.radius,
      this.center.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new Donut(
      this.center.clone(),
      this.innerRadius * scale,
      this.radius * scale,
      this.divisions,
      this.alignment
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class RectangularDonut extends Rectangle {
  innerWidth: number;
  innerHeight: number;
  constructor(
    center?: Ray,
    innerWidth: number = 60,
    innerHeight: number = 60,
    outerWidth: number = 100,
    outerHeight: number = 100,
    divisions: number = 1,
    alignment: ShapeAlignment = ShapeAlignment.CENTER
  ) {
    super(center, outerWidth, outerHeight, divisions, alignment, false);
    this.innerWidth = innerWidth;
    this.innerHeight = innerHeight;
  }
  generate(): Ray[] {
    return [];
  }
  children() {
    const offset = this.alignmentOffset();
    offset.x *= 0.5;
    offset.y *= 0.5;
    const offsetCenter = new Ray(
      this.center.x + offset.x,
      this.center.y + offset.y,
      this.center.direction
    );
    const inner = new Rectangle(
      offsetCenter,
      this.innerWidth,
      this.innerHeight,
      this.divisions,
      ShapeAlignment.CENTER,
      true
    );
    const outer = new Rectangle(
      offsetCenter,
      this.width,
      this.height,
      this.divisions
    );
    return [outer, inner];
  }
  boundingBox(): BoundingBox {
    return new BoundingBox(
      this.center.x - this.width / 2,
      this.center.y - this.height / 2,
      this.width,
      this.height
    );
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new RectangularDonut(
      this.center.clone(),
      this.innerWidth * scale,
      this.innerHeight * scale,
      this.width * scale,
      this.height * scale,
      this.divisions,
      this.alignment
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class RoundedRectangularDonut extends AbstractShape {
  width: number;
  height: number;
  radius: number;
  thickness: number;
  constructor(
    center?: Ray,
    width: number = 100,
    height: number = 100,
    radius: number = 25,
    thickness: number = 20,
    divisions: number = 3,
    alignment: ShapeAlignment = ShapeAlignment.CENTER
  ) {
    super(center, divisions, alignment, false);
    this.width = width;
    this.height = height;
    this.radius = radius;
    this.thickness = thickness;
  }
  generate(): Ray[] {
    return [];
  }
  children() {
    const offset = this.alignmentOffset();
    offset.x *= 0.5;
    offset.y *= 0.5;
    const offsetCenter = new Ray(
      this.center.x + offset.x,
      this.center.y + offset.y,
      this.center.direction
    );
    const outer = new RoundedRectangle(
      offsetCenter,
      this.width,
      this.height,
      this.radius,
      this.divisions
    );
    const inner =
      this.radius - this.thickness > 0
        ? new RoundedRectangle(
            offsetCenter,
            this.width - this.thickness * 2,
            this.height - this.thickness * 2,
            this.radius - this.thickness,
            this.divisions,
            ShapeAlignment.CENTER,
            true
          )
        : new Rectangle(
            offsetCenter,
            this.width - this.thickness * 2,
            this.height - this.thickness * 2,
            this.divisions,
            ShapeAlignment.CENTER,
            true
          );
    return [outer, inner];
  }
  boundingBox(): BoundingBox {
    return new BoundingBox(
      this.center.x - this.width / 2,
      this.center.y - this.height / 2,
      this.width,
      this.height
    );
  }
  clone(atScale = 1) {
    const scale = atScale || 1;
    const s = new RoundedRectangularDonut(
      this.center.clone(),
      this.width * scale,
      this.height * scale,
      this.radius * scale,
      this.thickness * scale,
      this.divisions,
      this.alignment
    );
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}
