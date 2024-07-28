import * as arbit from "arbit";
import { GeomHelpers } from "./helpers";
import { IStyle, Point, Ray, Path } from "./core";

const prng = arbit(29374);

export interface IHatchPattern {
  style: IStyle;
  generate(): Path[];
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
  protected offsetX: number;
  protected offsetY: number;
  style: IStyle = HatchPattern.defaultStyle;
  constructor(center: Ray, width: number, height: number, scale: number = 1, offsetX: number = 0, offsetY: number = 0) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
  generate():Path[] {
    return [];
  }
  clone() {
    return new HatchPattern(this.center.clone(), this.width, this.height);
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
}

export class LineHatchPattern extends HatchPattern {
  generate(): Path[] {
    const hatchStep = this.scale * 10;
    const segments: Path[] = [];
    const radius = Math.max(this.width, this.height) * 0.5;
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      segments.push(new Path([a, b]));
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
    const radius = Math.max(this.width, this.height) * 0.5 + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
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
    return segments;
  }
}

export class SpiralHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 15;
    const radius = Math.max(this.width, this.height) * 2 + Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
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
    return segments;
  }
}

export class CrossHatchPattern extends HatchPattern {
  generate(): Path[] {
    const hatchStep = this.scale * 10;
    const segments: Path[] = [];
    let radius = Math.max(this.width, this.height) * 0.5;
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    const rotationOrigins = [this.center.clone(), this.center];
    rotationOrigins[0].direction = Math.PI / 2;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < numSegments; i++) {
        const a = new Point(startX + i * hatchStep, this.center.y - radius);
        const b = new Point(startX + i * hatchStep, this.center.y + radius);
        segments.push(new Path([a, b]));
      }
      segments.forEach((s) => {
        s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(rotationOrigins[j], p));
      });
    }
    return segments;
  }
}

export class SawtoothHatchPattern extends HatchPattern {
  generate(): Path[] {
    const segments: Path[] = [];
    const hatchStep = this.scale * 10;
    const radius = Math.max(this.width, this.height) * 0.5;
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
      segments.push(new Path(pts));
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
    const radius = Math.max(this.width, this.height) * 0.5;
    const startX = this.center.x - Math.round(radius / hatchStep) * hatchStep;
    const numSegments = Math.ceil(radius * 2 / hatchStep);
    for (let i = 0; i < numSegments; i++) {
      const a = new Point(startX + i * hatchStep, this.center.y - radius);
      const b = new Point(startX + i * hatchStep, this.center.y + radius);
      const pts = GeomHelpers.subdividePointsByDistance(a, b, Math.max(1, Math.floor(hatchStep / 6)));
      pts.forEach((p, idx) => {
        p.x += Math.sin(idx * Math.PI / 16) * hatchStep * 0.25;
      });
      segments.push(new Path(pts));
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
    const radius = Math.max(this.width, this.height) * 0.5;
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
      segments.push(new Path(pts));
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
    const radius = Math.max(this.width, this.height) * 0.5;
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
    const radius = Math.max(this.width, this.height) * 0.5;
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
    const radius = Math.max(this.width, this.height) * 0.5;
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
    const radius = Math.max(this.width, this.height) * 0.5;
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
    segments.forEach((s) => {
      s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(this.center, p));
    })
    return segments;
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
    const radius = Math.max(this.width, this.height) * 0.5;
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
    const radius = Math.max(this.width, this.height) * 0.5;
    const hatchStep = radius / 3 * this.scale;
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
        tSegments.push(new Path([a, b]));
      }
      tSegments.forEach((s) => {
        s.points.forEach((p) => GeomHelpers.rotatePointAboutOrigin(tCenter, p));
      });
      segments.push(...tSegments);
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
    const radius = 200;
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
    return segments;
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
  shouldSkipSegment(x: number, y: number) {
    return (x % 3 * y % 3) % 3 !== 2;
  }
}


export class ChevronHatchPattern extends TriGridHatchPattern {
  shouldSkipSegment(x: number, y: number) {
    return (x % 3 + y % 3) % 2 === 0;
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
  SPIRAL = 25,
  CLOVER = 26,
  ROCK = 27,
  OFFSET = 28,
}

export enum HatchBooleanType {
  DECAL = 0,
  DIFFERENCE = 1,
  INTERSECT = 2,
}