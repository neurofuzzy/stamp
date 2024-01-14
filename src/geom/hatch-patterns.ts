import * as arbit from "arbit";
import { GeomHelpers } from "./helpers";
import { IStyle, Point, Ray, Segment } from "./core";
import { Polygon } from "./shapes";

const prng = arbit(29374);

export interface IHatchPattern {
  style: IStyle;
  generate(): Segment[];
  clone(): IHatchPattern;
}

export class HatchPattern implements IHatchPattern {
  static defaultStyle: IStyle = {
    strokeColor: "#ccc",
    strokeThickness: 0.5,
    fillColor: "#333"
  }
  protected center: Ray;
  protected width: number;
  protected height: number;
  protected scale: number;
  style: IStyle = HatchPattern.defaultStyle;
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

export class HatchFillShape implements IHatchPattern {
  protected segments: Segment[];
  style: IStyle = {
    hatchStrokeColor: "#ccc",
    hatchStrokeThickness: 0.5,
  }
  constructor(segments: Segment[], style?: IStyle) {
    this.segments = segments;
    this.style = style || this.style;
  }
  generate(): Segment[] {
    return this.segments;
  }
  clone() {
    return new HatchFillShape(this.segments.map((s) => s.clone()));
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
      segments.push(new Segment([a, b]));
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class CrossHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const hatchStep = this.scale * 10;
    const segments: Segment[] = [];
    let radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    let rotationOrigins = [this.center.clone(), this.center];
    rotationOrigins[0].direction = Math.PI / 2;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < numSegments; i++) {
        const a = new Point(startX + i * hatchStep, this.center.y - radius);
        const b = new Point(startX + i * hatchStep, this.center.y + radius);
        segments.push(new Segment([a, b]));
      }
      segments.forEach((s) => {
        s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(rotationOrigins[j], p));
      });
    }
    return segments;
  }
}

export class SawtoothHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const segments: Segment[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, hatchStep);
      pts.forEach((p, idx) => {
        if (idx % 2 === 1) {
          p.x += hatchStep;
        }
      });
      segments.push(new Segment(pts));
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class SinewaveHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const segments: Segment[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.max(1, Math.floor(hatchStep / 6)));
      pts.forEach((p, idx) => {
        p.x += Math.sin(idx * Math.PI / 16) * hatchStep * 0.25;
      });
      segments.push(new Segment(pts));
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class BuntingHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const segments: Segment[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const dist = Math.max(0.5, Math.floor(hatchStep / 6));
      const pts = GeomHelpers.subdividePointsByDistance(a, b, dist);
      pts.forEach((p, idx) => {
        p.x += Math.abs(Math.sin(idx * Math.PI / 12) * hatchStep * 0.5) - hatchStep * 0.25;
      });
      segments.push(new Segment(pts));
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class DashedHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const segments: Segment[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, hatchStep);
      pts.forEach((p, idx) => {
        if (i % 2 === 0) {
          if (idx > 0 && idx % 2 === 0) {
            segments.push(new Segment([pts[idx - 1], p]));
          }
        } else {
          if (idx < pts.length - 1 && idx % 2 === 0) {
            segments.push(new Segment([p, pts[idx + 1]]));
          }
        }
      });
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class SlateHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const segments: Segment[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius * 2);
      const b = new Point(startX + i * hatchStep, this.center.y + radius * 2);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.ceil(hatchStep * 0.5));
      let nextPenDown = 0;
      let nextPenUp = 0;
      let penIsUp = i % 2 === 0;
      pts.forEach((p, idx) => {
        if (!penIsUp) {
          if (idx === nextPenUp) {
            segments.push(new Segment([pts[nextPenDown], p]));
            penIsUp = true;
            nextPenDown = nextPenUp + prng.nextInt(1, 3);
          }
        } else {
          if (idx === nextPenDown) {
            penIsUp = false;
            nextPenUp = nextPenDown + prng.nextInt(2, 5);
          }
        }
      });
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class RockHatchPattern extends HatchPattern {
  generate(): Segment[] {
    const segments: Segment[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5;
    let startX = this.center.x - radius;
    let numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius * 4);
      const b = new Point(startX + i * hatchStep, this.center.y + radius * 4);
      if (i % 2 === 0) {
        a.y += hatchStep * 0.5;
        b.y += hatchStep * 0.5;
      }
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.ceil(hatchStep * 0.5));
      let nextRock = 1 + prng.nextInt(1, 6);
      pts.forEach((p, idx) => {
        if (idx >= nextRock) {
          const ppt = pts[idx - 1];
          if (prng.nextFloat() > 0.4) {
            const mpt = new Point((p.x + ppt.x) / 2 + hatchStep * 0.35, (p.y + ppt.y) / 2);
            const seg = new Segment([ppt, p, mpt, ppt.clone()]);
            const cen = GeomHelpers.averagePoints(seg.points);
            const ray = new Ray(cen.x, cen.y, prng.nextFloat() * Math.PI);
            seg.points.forEach((pp) => GeomHelpers.rotatePointAboutOrigin(ray, pp));
            segments.push(seg);
          }
          nextRock = nextRock + prng.nextInt(2, 4);
        }
      });
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export enum HatchPatternType {
  LINE = 1,
  CROSS = 2,
  DASHED = 3,
  SAWTOOTH = 4,
  SINEWAVE = 5,
  BUNTING = 6,
  SLATE = 7,
  ROCK = 8,
}