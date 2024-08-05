import * as arbit from "arbit";
import { GeomHelpers } from "./helpers";
import { IStyle, Point, Ray, Path } from "./core";
import { PathModifiers } from "./path-modifiers";

const prng = arbit(29374);

export interface IHatchPattern {
  style: IStyle;
  generate(): Path[];
  clone(): IHatchPattern;
  get doOptimize(): boolean;
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
  protected overflow: number;
  protected offsetX: number;
  protected offsetY: number;
  protected spherify: boolean;
  style: IStyle = HatchPattern.defaultStyle;
  constructor(center: Ray, width: number, height: number, scale: number = 1, overflow: number = 0, offsetX: number = 0, offsetY: number = 0, spherify = false) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.overflow = overflow;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.spherify = spherify;
  }
  generate():Path[] {
    return [];
  }
  clone() {
    return new HatchPattern(this.center.clone(), this.width, this.height);
  }
  get doOptimize(): boolean {
    return false;
  }
}

export class HatchFillShape implements IHatchPattern {
  protected segments: Path[];
  style: IStyle = {
    hatchStrokeColor: "#ccc",
    hatchStrokeThickness: 0.5,
  }
  constructor(segments: Path[], style?: IStyle) {
    this.segments = segments;
    this.style = style || this.style;
  }
  generate(): Path[] {
    return this.segments;
  }
  clone() {
    return new HatchFillShape(this.segments.map((s) => s.clone()));
  }
  get doOptimize(): boolean {
    return false;
  }
}

export class LineHatchPattern extends HatchPattern {
  generate(): Path[] {
    const hatchStep = this.scale * 10;
    const segments: Path[] = [];
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow;
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePoints(a, b, numSegments);
      if (i % 2 === 1) {
        pts.reverse();
      }
      segments.push(new Path(pts));
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2.02);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class CircleHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 20;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let j = 0; j < numSegments; j++) {
      const pts:Point[] = [];
      const currentRadius = j / numSegments * radius + radius / numSegments / 1.5;
      for (let i = 0; i < 360; i+=4) {
        const angle = i * Math.PI / 180;
        pts.push(new Point(this.center.x + Math.cos(angle) * currentRadius, this.center.y + Math.sin(angle) * currentRadius));       
      }
      pts.push(pts[0].clone());
      let p = new Path(pts);
      segments.push(p);
    }
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    return segments;
  }
}

export class SpiralHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 15;
    const radius = Math.max(this.width, this.height) * 2 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    let currentRadius = 0;
    const step = radius / numSegments;
    const div = 4;
    const pts:Point[] = [];
    for (let j = 0; j < numSegments; j++) {
      for (let i = 0; i < 360; i+=div) {
        const angle = i * Math.PI / 180;
        pts.push(new Point(this.center.x + Math.cos(angle) * currentRadius, this.center.y + Math.sin(angle) * currentRadius));
        currentRadius += step / (360 / div);
      }
    }
    let p = new Path(pts);
    segments.push(p);
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 0.5);
    }
    return segments;
  }
}

export class PhylloHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 15;
    const radius = Math.max(this.width, this.height) * 2 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    let currentRadius = 0;
    const step = radius / numSegments;
    const div = 2;
    const pts:Point[] = [];
    for (let j = 0; j < numSegments; j++) {
      for (let i = 0; i <= 360; i+=div) {
        const angle = i * Math.PI / 180;
        const pt = new Point(0, currentRadius);
        pt.y += Math.sin(angle * (12 / this.scale + 0.5)) * currentRadius / 12.5 * this.scale * (j % 2 - 0.5);
        GeomHelpers.rotatePoint(pt, angle);
        pt.x += this.center.x;
        pt.y += this.center.y;
        pts.push(pt);
        currentRadius += step / (360 / div);
      }
    }
    let p = new Path(pts);
    segments.push(p);
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 0.5);
    }
    return segments;
  }
}

export class ShellHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    let hatchStep = this.scale * 25;
    const radius = Math.max(this.width, this.height) * 2 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const numSegments = Math.ceil(radius / hatchStep);
    let currentRadius = 0;
    let step = radius / numSegments;
    const div = 0.5;
    const pts:Point[] = [];
    const pts2:Point[] = [];
    const valuesAtAngle = [];
    for (let j = 0; j < numSegments / 3; j++) {
      for (let i = 0; i <= 360; i+=div) {
        const lastValueAtAngle = valuesAtAngle[i] || 0;
        const angle = i * Math.PI / 180;
        const pt = new Point(0, currentRadius);
        pt.y += Math.sin(angle * (6 / this.scale + 0.5)) * (0 + currentRadius) / 4.5 * this.scale * (j % 2 - 0.5);
        valuesAtAngle[i] = pt.y;
        pt.y = Math.max(lastValueAtAngle, pt.y);
        const pt2 = pt.clone();
        GeomHelpers.rotatePoint(pt, angle);
        GeomHelpers.rotatePoint(pt2, angle + Math.PI);
        pt.x += this.center.x;
        pt.y += this.center.y;
        pt2.x += this.center.x;
        pt2.y += this.center.y;
        pts.push(pt);
        pts2.push(pt2);
        currentRadius += step / (360 / div);
        step *= 1.00005;
      }
    }
    let p = new Path(pts);
    let p2 = new Path(pts2);
    segments.push(p);
    segments.push(p2);
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 0.46);
    }
    return segments;
  }
}

export class FlowerHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    let hatchStep = this.scale * 15;
    const radius = Math.max(this.width, this.height) * 2 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const numSegments = Math.ceil(radius / hatchStep);
    let currentRadius = 0;
    let step = radius / numSegments;
    const div = 0.5;
    const pts:Point[] = [];
    const valuesAtAngle = [];
    for (let j = 0; j < numSegments / 5; j++) {
      for (let i = 0; i <= 360; i+=div) {
        const lastValueAtAngle = valuesAtAngle[i] || 0;
        const angle = i * Math.PI / 180;
        const pt = new Point(0, currentRadius);
        pt.y += Math.sin(angle * (12 / this.scale + 0.5)) * currentRadius / 6.5 * this.scale * (j % 2 - 0.5);
        valuesAtAngle[i] = pt.y;
        pt.y = Math.max(lastValueAtAngle, pt.y);
        GeomHelpers.rotatePoint(pt, angle);
        pt.x += this.center.x;
        pt.y += this.center.y;
        pts.push(pt);
        currentRadius += step / (360 / div);
        if (j < numSegments - numSegments * 0.84) {
          step *= 1.00005;
        } else {
          step *= 0.99;
        }
      }
    }
    let p = new Path(pts);
    segments.push(p);
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    return segments;
  }
}

export class CrossHatchPattern extends HatchPattern {
  generate(): Path[] {
    const hatchStep = this.scale * 10;
    const segments: Path[] = [];
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    const rotationOrigins = [this.center.clone(), this.center];
    rotationOrigins[0].direction = Math.PI / 2;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < numSegments; i++) {
        const a = new Point(startX + i * hatchStep, this.center.y - radius);
        const b = new Point(startX + i * hatchStep, this.center.y + radius);
        const pts = GeomHelpers.subdividePoints(a, b, numSegments);
        if (i % 2 === 1) {
          pts.reverse();
        }
        segments.push(new Path(pts));
      }
      segments.forEach((s) => {
        s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(rotationOrigins[j], p));
      });
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    return segments;
  }
}

export class SawtoothHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, hatchStep);
      pts.forEach((p, idx) => {
        if (idx % 2 === 1) {
          p.x += hatchStep;
        }
      });
      if (i % 2 === 0) {
        pts.reverse();
      }
      segments.push(new Path(pts));
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class SinewaveHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.max(1, Math.floor(hatchStep / 6)));
      pts.forEach((p, idx) => {
        p.x += Math.sin(idx * Math.PI / 16) * hatchStep * 0.25;
      });
      if (i % 2 === 0) {
        pts.reverse();
      }
      segments.push(new Path(pts));
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class WaveHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startY = this.center.y - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(this.center.x - radius, startY + i * hatchStep);
      const b = new Point(this.center.x + radius, startY + i * hatchStep);
      const dist = Math.max(0.5, Math.floor(hatchStep / 6));
      const pts = GeomHelpers.subdividePointsByDistance(a, b, dist);
      pts.forEach((p, idx) => {
        p.y += Math.abs(Math.sin(idx * Math.PI / 12) * hatchStep * 0.5) - hatchStep * 0.25;
      });
      if (i % 2 === 0) {
        pts.reverse();
      }
      segments.push(new Path(pts));
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class DashedHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, hatchStep);
      pts.forEach((p, idx) => {
        if (i % 2 === 0) {
          if (idx > 0 && idx % 2 === 0) {
            segments.push(new Path([pts[idx - 1], p]));
          }
        } else {
          if (idx < pts.length - 1 && idx % 2 === 0) {
            segments.push(new Path([p, pts[idx + 1]]));
          }
        }
      });
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class SlateHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
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
            segments.push(new Path([pts[nextPenDown], p]));
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
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class RockHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
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
            const seg = new Path([ppt, p, mpt, ppt.clone()]);
            const cen = GeomHelpers.averagePoints(seg.points);
            const ray = new Ray(cen.x, cen.y, prng.nextFloat() * Math.PI);
            seg.points.forEach((pp) => GeomHelpers.rotatePointAboutOrigin(ray, pp));
            segments.push(seg);
          }
          nextRock = nextRock + prng.nextInt(2, 4);
        }
      });
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class BrickHatchPattern extends HatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x + y) % 2 === 0;
  }
  generate(): Path[] {
    // generate a series of paths that are evenly spaced apart
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const startY = this.center.y - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let y = 0; y < numSegments; y++) {
      for (let x = 0; x < numSegments; x++) {
        const a = new Point(startX + x * hatchStep, startY + y * hatchStep);
        const b = new Point(startX + x * hatchStep, startY + (y + 1) * hatchStep);
        const c = new Point(startX + (x + 1) * hatchStep, startY + (y + 1) * hatchStep);
        if (this.shouldSkipSegment(x, y)) {
          segments.push(new Path([b,c]));
        } else {
          segments.push(new Path([a,b,c]));
        }
      }
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
  get doOptimize(): boolean {
    return true;
  }
}

export class RailHatchPattern extends BrickHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x * y) % 2 - (x + y) % 2 !== 0;
  }
}

export class HerringboneHatchPattern extends BrickHatchPattern {
  generate(): Path[] {
    // generate a series of paths that are evenly spaced apart
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const startY = this.center.y - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let y = 0; y < numSegments; y++) {
      for (let x = 0; x < numSegments; x++) {
        const a = new Point(startX + x * hatchStep, startY + y * hatchStep);
        const b1 = new Point(startX + x * hatchStep, startY + (y + 1) * hatchStep);
        const b2 = new Point(startX + x * hatchStep, startY + (y + 1) * hatchStep);
        const c = new Point(startX + (x + 1) * hatchStep, startY + (y + 1) * hatchStep);
        // create paths in herringbone pattern
        if ((x + y) % 4 !== 0) {
          segments.push(new Path([a,b1]));
        } 
        if ((x + y) % 4 !== 1) {
          segments.push(new Path([b2,c]));
        }
      }
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}


export class TriangularGridHatchPattern extends HatchPattern {
  generate(): Path[] {
    // generate a triangle grid, which has lines at 0, 120, 240 degrees
    const segments: Path[] = [];
    const radius = 250 + this.overflow;
    const hatchStep = radius / 20;
    const tCenter = this.center.clone();
    for (let k = 0; k < 3; k++) {
      tCenter.direction = 120 * k * Math.PI / 180;
      let tSegments: Path[] = [];
      let startX = this.center.x - radius;
      let startY = this.center.y - radius;
      let numSegments = Math.ceil(radius * 2 / hatchStep);
      if (numSegments % 2 === 1) {
        numSegments = numSegments + 1;
        startX -= hatchStep / 2;
        startY -= hatchStep / 2;
      }
      for (let y = 0; y < numSegments; y++) {
        const a = new Point(startX, startY + y * hatchStep);
        const b = new Point(startX + radius * 2, startY + y * hatchStep);
        const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.ceil(hatchStep * 0.5));
        tSegments.push(new Path(pts));
      }
      tSegments.forEach((s) => {
        s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(tCenter, p));
      });
      segments.push(...tSegments);
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 0.75);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    });
    return segments;
  }
}


export class TriGridHatchPattern extends HatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x + y) % 3 === 0;
  }
  generate(): Path[] {
    // generate a triangle grid, which has lines at 0, 120, 240 degrees
    const segments: Path[] = [];
    const radius = 200 + this.overflow;
    const hatchStep = radius / 20;
    const tCenter = this.center.clone();
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let k = 0; k < 3; k++) {
      tCenter.direction = (270 + 120 * k) * Math.PI / 180;
      let tSegments: Path[] = [];
      for (let y = 0; y < numSegments; y++) {
        const a = new Point(this.center.x - radius, this.center.y - radius + y * hatchStep);
        const b = new Point(this.center.x, this.center.y - radius + y * hatchStep);
        const c = new Point(this.center.x + radius, this.center.y - radius + y * hatchStep);

        a.x -= hatchStep / Math.sqrt(3) * y;
        b.x -= hatchStep / Math.sqrt(3) * y;
        c.x += hatchStep / Math.sqrt(3) * y;

        let ptsA = GeomHelpers.subdividePointsByDistanceExact(b, a, 2 * hatchStep / Math.sqrt(3)).reverse();
        let ptsB = GeomHelpers.subdividePointsByDistanceExact(b, c, 2 * hatchStep / Math.sqrt(3));
        ptsA.pop();
        let pts = ptsA.concat(ptsB);
        pts.forEach((ptB, idx) => {
          if (idx === 0) return;
          if (this.shouldSkipSegment(idx, y)) return;
          const ptA = pts[idx - 1].clone();
          tSegments.push(new Path([ptA, ptB]));
        });
      }
      tSegments.forEach((s) => {
        s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(tCenter, p));
      });
      segments.push(...tSegments);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    });
    segments.forEach((s) => {
      s.points.forEach((p) => {
        p.x -= this.center.x;
        p.y -= this.center.y;
        p.x *= this.scale;
        p.y *= this.scale;
        p.x += this.center.x;
        p.y += this.center.y;
      });
    })
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 0.7);
    }
    return segments;
  }
  get doOptimize(): boolean {
    return true;
  }
}


export class HexHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x + y) % 3 !== 0;
  }
}


export class AltWeaveHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return x % 3 - y % 3 === 0;
  }
}


export class PinwheelHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return x % 2 - y % 2 !== 0;
  }
}


export class CloverHatchPattern extends TriGridHatchPattern {
  constructor(...args: any[]) {
    // @ts-ignore
    super(...args);
    this.scale = 0.5;
  }
  shouldSkipSegment(x: number, y: number) {
    return (x % 3 * y % 3) % 3 !== 2;
  }
}


export class ChevronHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return ((1 + x) % 4 * (y + 1) % 4) % 3 === 0;
  }
}


export class TriWeaveHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (y / 3) % 1 !== 0 && 
      (x % 3 + y % 3) % 4 !== 0 &&
      ((2 - x) % 3 - (2 + y) % 3) % 4 !== 0;
  }
}

export class OrigamiHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x % 3 + y % 3) % 4 !== 0 &&
      ((2 - x) % 3 - (2 + y) % 3) % 4 !== 0;
  }
}

export class LatticeHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x % 3 + y % 3) % 4 !== 0 &&
      ((1 - x) % 3 * (1 - y) % 3) % 3 === 0;
  }
}

export class TerraceHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return x % 3 - y % 3 === 0 || x % 3 === 2;
  }
}

export class HexagonHatchPattern extends TriGridHatchPattern {
  constructor(...args: any[]) {
    // @ts-ignore
    super(...args);
    this.scale = 0.75;
  }
  shouldSkipSegment(x: number, y: number) {
    return x % 3 - y % 3 === 0 || (x % 3 + y % 3) % 2 !== 0;
  }
}

export class MoleculeHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return x % 3 + y % 3 === 0 || (x % 3 + y % 3) % 2 !== 0;
  }
}

export class BraidHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x % 3 + y % 3) % 2 !== 0;
  }
}

export class QbertHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x + y) % 3 === 0;
  }
}

export class CurlyHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.75;
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep / 4);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep * 4, this.center.y - radius - hatchStep * 3);
      const b = new Point(startX + i * hatchStep * 4, this.center.y + radius + hatchStep * 3);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.max(1, Math.floor(hatchStep / 24)));
      pts.forEach((p, idx) => {
        p.x += Math.sin(idx * Math.PI / 16 / this.scale) * hatchStep * 3.7;
        p.y -= Math.cos(idx * Math.PI / 16 / this.scale) * hatchStep * 3.7;
      });
      if (i % 2 === 0) {
        pts.reverse();
      }
      segments.push(new Path(pts));
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 1.3);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    });
    return segments;
  }
}

export class ScribbleHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 5;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep / 2);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep * 4, this.center.y - radius - hatchStep);
      const b = new Point(startX + i * hatchStep * 4, this.center.y + radius + hatchStep);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.max(1, Math.floor(hatchStep / 24)));
      pts.forEach((p, idx) => {
        p.x += Math.cos(idx * Math.PI / 8 / this.scale) * hatchStep * 2;
        p.x += Math.sin(idx * Math.PI / 32 / this.scale) * hatchStep;
      });
      if (i % 2 === 0) {
        pts.reverse();
      }
      segments.push(new Path(pts));
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class LoopHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 5;
    const radius = Math.max(this.width, this.height) * 0.5 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep / 2);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep * 5, this.center.y - radius - hatchStep);
      const b = new Point(startX + i * hatchStep * 5, this.center.y + radius + hatchStep);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.max(1, Math.floor(hatchStep / 24)));
      pts.forEach((p, idx) => {
        p.x += Math.sin(idx * Math.PI / 8 / this.scale) * hatchStep * 2;
        p.x += Math.sin(idx * Math.PI / 32 / this.scale) * hatchStep;
        p.y -= Math.cos(idx * Math.PI / 8 / this.scale) * hatchStep * 2;
      });
      if (i % 2 === 0) {
        pts.reverse();
      }
      segments.push(new Path(pts));
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 2);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
  }
}

export class GlobeHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 20;
    const radius = Math.max(this.width, this.height) * 2 + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let j = 0; j < numSegments; j++) {
      const pts:Point[] = [];
      const currentRadius = j / numSegments * radius + radius / numSegments / 1.5;
      for (let i = 0; i < 360; i+=4) {
        const angle = i * Math.PI / 180;
        const pt = new Point(this.center.x + Math.cos(angle) * currentRadius, this.center.y + Math.sin(angle) * currentRadius);
        pt.x += j * hatchStep * 0.1 + radius * 0.35;
        pt.y += j * hatchStep * 0.05 + radius * 0.3;
        pts.push(pt);
      }
      pts.push(pts[0].clone());
      let p = new Path(pts);
      segments.push(p);
    }
    for (let j = 0; j < numSegments; j++) {
      const pts:Point[] = [];
      const currentRadius = j / numSegments * radius + radius / numSegments / 1.5;
      for (let i = 0; i < 360; i+=4) {
        const angle = i * Math.PI / 180;
        const pt = new Point(this.center.x + Math.cos(angle) * currentRadius, this.center.y + Math.sin(angle) * currentRadius);
        pt.x -= j * hatchStep * 0.1 + radius * 0.2;
        pt.y += j * hatchStep * 0.05 + radius * 0.4;
        pts.push(pt);
      }
      pts.push(pts[0].clone());
      let p = new Path(pts);
      segments.push(p);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, radius * 0.5);
    }
    return segments;
  }
}

export class GreekHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 20;
    const size = Math.max(this.width, this.height) + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY)) + hatchStep * 2;
    const numSegments = Math.ceil(size * 2 / hatchStep);
    const rts = [0,0,0,90,90,-90,-90,0,-90,0,0,-90,0,0,90,0,90,90,-90];
    for (let j = 0; j < numSegments; j++) {
      let lastPt = new Point(this.center.x - j * hatchStep, this.center.y - size * 0.75 + j * hatchStep);
      let lastAng = 0;
      const pts = [];
      for (let i = 0; i < size / hatchStep * 24; i++) {
        const pt = new Point(hatchStep * 0.25, 0);
        GeomHelpers.rotatePoint(pt, (lastAng + rts[i % rts.length]) * Math.PI / 180);
        pt.x += lastPt.x;
        pt.y += lastPt.y;
        pts.push(pt);
        lastPt = pt;
        lastAng += rts[i % rts.length];
      }
      let p = new Path(pts);
      segments.push(p);
    }
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, size);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    });
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    return segments;
  }
}

export class OrthoHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 20;
    const size = Math.max(this.width, this.height) + this.overflow + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY)) + hatchStep * 2;
    const numSegments = Math.ceil(size * 2 / hatchStep);
    const expandPoints = (pts:Point[], hatchStep = 10, flip:boolean = false) => {
      let i = pts.length;
      while (i--) {
        if (i % 2 === 0) {
          // add point
          const pt = pts[i].clone();
          pt.y += hatchStep * 0.667;
          pts.splice(i + 0, 0, pt);
        }
        if (i % 2 === 1) {
          // add point
          const pt = pts[i].clone();
          pt.y += hatchStep * 0.667;
          pts.splice(i + 1, 0, pt);
        }
      }
      i = pts.length;
      while (i--) {
        if (i % 4 === 0) {
          // add point
          const pt = pts[i];
          const ptB = pt.clone();
          pt.x += hatchStep * 0.667;
          const ptC = pt.clone();
          ptB.y -= hatchStep * 0.333;
          ptC.y -= hatchStep * 0.333;
          pts.splice(i + 1, 0, ptC, ptB);
        }
        if (i % 4 === 2) {
          // add point
          const pt = pts[i];
          const ptB = pt.clone();
          pt.x += hatchStep * 0.667;
          const ptC = pt.clone();
          ptB.y += hatchStep * 0.333;
          ptC.y += hatchStep * 0.333;
          pts.splice(i + 1, 0, ptC, ptB);
        }
      }
      if (flip) {
        pts.forEach((p) => {
          p.x += hatchStep * 0.5;
        });
      }
    };
    for (let j = 0; j < numSegments; j++) {
      const ptA = new Point(this.center.x - size * 0.5, this.center.y - size * 0.5 + j * hatchStep);
      const ptB = new Point(this.center.x + size * 0.5, this.center.y - size * 0.5 + j * hatchStep);
      const pts = GeomHelpers.subdividePointsByDistanceExact(ptA, ptB, hatchStep);
      expandPoints(pts, hatchStep, j % 2 == 0);
      let p = new Path(pts);
      segments.push(p);
    }
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    segments.forEach((p) => {
      p.points.forEach((p) => {
        p.x += this.offsetX;
        p.y += this.offsetY;
      });
    });
    if (this.spherify) {
      PathModifiers.spherify(segments, this.center, size);
    }
    return segments;
  }
}

export class SmoothOrthoHatchPattern extends OrthoHatchPattern {
  generate(): Path[] {
      const paths = super.generate();
      paths.forEach((p) => {
        p.points = GeomHelpers.smoothLine(p.points, 3, 1);
      });
      return paths;
  }
}


export class OffsetHatchPattern extends HatchPattern {
  get offsetStep(): number {
    return this.scale * 10;
  }
  generate(): Path[] {
    return []; // note: not implemented, placeholder
  }
}

export enum HatchPatternType {
  LINE = 1,
  CIRCLE = 2,
  CROSS = 3,
  BRICK = 4,
  HERRINGBONE = 5,
  DASHED = 6,
  TRIANGLE = 7,
  QBERT = 8,
  SAWTOOTH = 9,
  SINEWAVE = 10,
  WAVE = 11,
  SLATE = 12,
  TRIWEAVE = 13,
  CHEVRON = 14,
  ALTWEAVE = 15,
  PINWHEEL = 16,
  HEX = 17,
  ORIGAMI = 18,
  LATTICE = 19,
  TERRACE = 20,
  HEXAGON = 21,
  MOLECULE = 22,
  BRAID = 23,
  RAIL = 24,
  CLOVER = 25,
  SPIRAL = 26,
  CURLY = 27,
  SCRIBBLE = 28,
  LOOP = 29,
  PHYLLO = 30,
  GLOBE = 31,
  ORTHO = 32,
  SMOOTHORTHO = 33,
  GREEK = 34,
  SHELL = 35,
  FLOWER = 36,
  ROCK = 37,
  OFFSET = 38,
}

export enum HatchBooleanType {
  DECAL = 0,
  DIFFERENCE = 1,
  INTERSECT = 2,
}