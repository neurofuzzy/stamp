
import { AbstractShape, BoundingBox, Circle, Ray, Rectangle, RoundedRectangle } from "./shapes";
export class Donut extends AbstractShape {
  innerRadius: number;
  outerRadius: number;
  constructor(center?: Ray, innerRadius: number = 30, outerRadius: number = 50, segments: number = 32) {
    super(center, segments, false)
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
  }
  generate() {
    const inner = new Circle(this.center, this.innerRadius, this.segments, true).generate()
    const outer = new Circle(this.center, this.outerRadius, this.segments).generate()
    return [
      ...outer,
      ...inner,
      outer[0]
    ]
  }
  clone() {
    return new Donut(this.center.clone(), this.innerRadius, this.outerRadius, this.segments);
  }
  boundingBox(): BoundingBox {
    return new BoundingBox(this.center.x - this.outerRadius, this.center.y - this.outerRadius, this.outerRadius * 2, this.outerRadius * 2);
  }
}

export class RectangularDonut extends AbstractShape {
  innerWidth: number
  innerHeight: number
  outerWidth: number
  outerHeight: number
  constructor(center?: Ray, innerWidth: number = 60, innerHeight: number = 60, outerWidth: number = 100, outerHeight: number = 100, segments: number = 1) {
    super(center, segments, false)
    this.innerWidth = innerWidth
    this.innerHeight = innerHeight
    this.outerWidth = outerWidth
    this.outerHeight = outerHeight
  }
  generate() {
    const inner = new Rectangle(this.center, this.innerWidth, this.innerHeight, this.segments, true).generate()
    const outer = new Rectangle(this.center, this.outerWidth, this.outerHeight, this.segments).generate()
    return [
      ...outer,
      ...inner,
      outer[0]
    ]
  }
  clone() {
    return new RectangularDonut(this.center.clone(), this.innerWidth, this.innerHeight, this.outerWidth, this.outerHeight, this.segments);
  }
  boundingBox(): BoundingBox {
    return new BoundingBox(this.center.x - this.outerWidth / 2, this.center.y - this.outerHeight / 2, this.outerWidth, this.outerHeight);
  }
}

export class RoundedRectangularDonut extends AbstractShape {
  width: number
  height: number
  radius: number
  thickness: number
  constructor(center?: Ray, width: number = 100, height: number = 100, radius: number = 25, thickness: number = 20, segments: number = 3) {
    super(center, segments, false)
    this.width = width
    this.height = height
    this.radius = radius
    this.thickness = thickness
  }
  generate() {
    const outer = new RoundedRectangle(this.center, this.width, this.height, this.radius, this.segments).generate();
    const inner = this.radius - this.thickness > 0 ? 
      new RoundedRectangle(this.center, this.width - this.thickness * 2, this.height - this.thickness * 2, this.radius - this.thickness, this.segments, true).generate() :
      new Rectangle(this.center, this.width - this.thickness * 2, this.height - this.thickness * 2, this.segments, true).generate();
      return [
        ...outer,
        ...inner,
        outer[0]
      ]
  }
  clone() {
    return new RoundedRectangularDonut(this.center.clone(), this.width, this.height, this.radius, this.thickness, this.segments);
  }
  boundingBox(): BoundingBox {
    return new BoundingBox(this.center.x - this.width / 2, this.center.y - this.height / 2, this.width, this.height);
  }
}