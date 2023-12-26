
import { AbstractShape, Ray, Circle, Rectangle, RoundedRectangle } from "./shapes";
export class Donut extends AbstractShape {
  innerRadius: number;
  outerRadius: number;
  constructor(center: Ray, innerRadius: number, outerRadius: number) {
    super(center)
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

export class RectangularDonut extends AbstractShape {
  innerWidth: number
  innerHeight: number
  outerWidth: number
  outerHeight: number
  constructor(center: Ray, innerWidth: number, innerHeight: number, outerWidth: number, outerHeight: number) {
    super(center)
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

export class RoundedRectangularDonut extends AbstractShape {
  width: number
  height: number
  radius: number
  thickness: number
  reverse: boolean
  constructor(center: Ray, width: number, height: number, radius: number, thickness: number, reverse: boolean = false) {
    super(center)
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