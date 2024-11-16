import {
  BoundingBox,
  BoundingCircle,
  IShape,
  IStyle,
  Ray,
  Segment,
  ShapeAlignment,
} from "../geom/core";
import { AbstractShape } from "../geom/shapes";
import { Sequence } from "./sequence";

export class ShapesProvider implements IShape {
  protected shapes: IShape[];
  protected indexSequence: Sequence | null;
  protected currentShapeIndex = 0;
  protected currentShape: IShape = new AbstractShape();
  constructor(shapes: IShape[] = [], indexSequence: Sequence | null = null) {
    this.shapes = shapes;
    this.indexSequence = indexSequence;
  }
  protected next() {
    console.log("next");
    if (!this.shapes.length) {
      return;
    }
    this.currentShapeIndex = this.indexSequence
      ? this.indexSequence.next()
      : this.currentShapeIndex + 1;
    const i = this.currentShapeIndex % this.shapes.length;
    this.currentShape = this.shapes[i]?.clone() || new AbstractShape();
  }
  get id(): number {
    return this.currentShape.id;
  }
  get center(): Ray {
    return this.currentShape.center;
  }
  set center(center: Ray) {
    this.currentShape.center = center;
  }
  get divisions(): number {
    return this.currentShape.divisions;
  }
  get reverse(): boolean {
    return this.currentShape.reverse;
  }
  get isHole(): boolean {
    return this.currentShape.isHole;
  }
  get alignment(): ShapeAlignment {
    return this.currentShape.alignment;
  }
  get hidden(): boolean {
    return this.currentShape.hidden;
  }
  get style(): IStyle {
    return this.currentShape.style;
  }
  boundingBox(): BoundingBox {
    return this.currentShape.boundingBox();
  }
  boundingCircle(): BoundingCircle {
    return this.currentShape.boundingCircle();
  }
  generate(): Ray[] {
    this.next();
    return this.currentShape.generate();
  }
  toSegments(): Segment[] {
    return this.currentShape.toSegments();
  }
  addChild(shape: IShape) {
    this.shapes.push(shape);
  }
  children(): IShape[] {
    return this.shapes;
  }
  reset() {
    this.indexSequence?.reset();
  }
  clone() {
    this.next();
    return this.currentShape.clone();
  }
}
