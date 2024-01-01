import { Point, Ray, Segment } from "./shapes";

export interface IHatchPattern {
  generate(): Segment[];
  clone(): IHatchPattern;
}

export class HatchPattern implements IHatchPattern {
  protected center: Ray;
  protected width: number;
  protected height: number;
  protected scale: number;
  constructor(center: Ray, width: number, height: number, scale: number = 1) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.scale = scale;
  }
  generate():Segment[] {
    return [];
  }
  clone() {
    return new HatchPattern(this.center.clone(), this.width, this.height);
  }
}

export class LineHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const hatchStep = this.scale * 10;
    const segments: Segment[] = [];
    let radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      segments.push(new Segment(a, b));
    }
    return segments;
  }
}

export class HatchFillShape implements IHatchPattern {
  protected segments: Segment[];
  constructor(segments: Segment[]) {
    this.segments = segments;
  }
  generate(): Segment[] {
    return this.segments;
  }
  clone() {
    return new HatchFillShape(this.segments.map((s) => s.clone()));
  }
}
