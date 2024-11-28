import { Ray } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";
import { AbstractShape } from "../geom/shapes";
import { Sequence } from "./sequence";
import { Stamp } from "./stamp";
import * as arbit from "arbit";

interface IStampLayoutParams {
  stamp: Stamp;
  permutationSequence?: Sequence | null;
  scaleSequence?: Sequence | null;
  seed?: number;
}

interface IGridStampLayoutParams extends IStampLayoutParams {
  columns: number;
  rows: number;
  columnSpacing: number;
  rowSpacing: number;
  offsetAlternateRows?: boolean;
}

interface ICircleGridStampLayoutParams extends IStampLayoutParams {
  rings: number;
  numPerRing: number;
  spacing: number;
}

interface ICircleFillStampLayoutParams extends IStampLayoutParams {
  radius: number;
  count: number;
}

class AbstractStampLayout extends AbstractShape {
  params: IStampLayoutParams;

  constructor(center: Ray, params: IStampLayoutParams) {
    super(center);
    this.params = params;
  }
  generate(): Ray[] {
    return [];
  }
}

export class GridStampLayout extends AbstractStampLayout {
  constructor(center: Ray, params: IGridStampLayoutParams) {
    super(center, params);
  }

  children(): Stamp[] {
    const c: Stamp[] = [];
    const params = this.params as IGridStampLayoutParams;
    const w = params.columnSpacing * (params.columns - 1);
    const h = params.rowSpacing * (params.rows - 1);
    for (let j = 0; j < params.rows; j++) {
      let cols = params.columns;
      if (params.offsetAlternateRows && j % 2 === 1) {
        cols++;
      }
      for (let i = 0; i < cols; i++) {
        const seed = params.permutationSequence?.next() || i;
        Sequence.resetAll(seed, [
          params.permutationSequence,
          params.scaleSequence,
        ]);
        Sequence.seed = seed;
        const x = params.columnSpacing * i;
        const y = params.rowSpacing * j;
        const stamp = params.stamp.clone();
        stamp.center = new Ray(
          this.center.x + x - w / 2,
          this.center.y + y - h / 2,
          stamp.center.direction,
        );
        if (params.offsetAlternateRows && j % 2 === 1) {
          stamp.center.x -= params.columnSpacing / 2;
        }
        stamp.generate();
        c.push(stamp);
      }
    }
    return c;
  }
}

export class CircleGridStampLayout extends AbstractStampLayout {
  constructor(center: Ray, params: ICircleGridStampLayoutParams) {
    super(center, params);
  }

  children(): Stamp[] {
    const c: Stamp[] = [];
    const params = this.params as ICircleGridStampLayoutParams;
    for (let j = 0; j < params.rings; j++) {
      for (let i = 0; i < Math.max(1, params.numPerRing * j); i++) {
        const seed = params.permutationSequence?.next() || i;
        Sequence.resetAll(seed, [
          params.permutationSequence,
          params.scaleSequence,
        ]);
        Sequence.seed = seed;
        const stamp = params.stamp.clone();
        const center = new Ray(0, params.spacing * j);
        if (j > 0) {
          GeomHelpers.rotatePoint(
            center,
            (i * (360 / params.numPerRing / j) * Math.PI) / 180,
          );
        }
        if (j > 0) {
          GeomHelpers.rotatePoint(
            center,
            ((90 / params.numPerRing) * (j - 1) * Math.PI) / 180,
          );
        }
        center.x += this.center.x;
        center.y += this.center.y;
        stamp.center = new Ray(center.x, center.y, stamp.center.direction);
        stamp.generate();
        c.push(stamp);
      }
    }
    return c;
  }
}

export class CircleFillStampLayout extends AbstractStampLayout {
  constructor(center: Ray, params: ICircleFillStampLayoutParams) {
    super(center, params);
  }

  children(): Stamp[] {
    const c: Stamp[] = [];
    const params = this.params as ICircleFillStampLayoutParams;
    const layoutSeed = params.seed ?? 1;
    const prng = arbit(layoutSeed);
    const numPoints = params.count ?? 20;
    const numTriesPerPoint = 100;
    const radius = params.radius;
    for (let j = 0; j < numPoints; j++) {
      const pointDists: { pt: Ray; dist: number }[] = [];
      for (let i = 0; i < numTriesPerPoint; i++) {
        const pt = new Ray(
          prng.nextInt(0 - radius, radius) + this.center.x,
          prng.nextInt(0 - radius, radius) + this.center.y,
          0,
        );
        let dist = Infinity;
        for (let k = 0; k < c.length; k++) {
          let currentDist = GeomHelpers.distanceBetweenPointsSquared(
            pt,
            c[k].center,
          );
          if (currentDist < dist) {
            dist = currentDist;
          }
        }
        if (
          GeomHelpers.distanceBetweenPointsSquared(pt, this.center) >
          radius * radius
        ) {
          continue;
        }
        pointDists.push({ pt, dist });
      }
      // sort points by distance from center
      pointDists.sort((a, b) => {
        const aDist = a.dist;
        const bDist = b.dist;
        return bDist - aDist;
      });
      const farthest = pointDists[0].pt;

      const stamp = params.stamp.clone();
      stamp.center = farthest.clone();
      stamp.scale = params.scaleSequence?.next() || 1;
      //stamp.generate();
      c.push(stamp);
    }
    // for all stamps, use basic physics to force them away from eachother based on their distance from each other
    const stampRadii: number[] = [];
    c.forEach((stamp) => {
      stamp = stamp.clone();
      const bc = stamp.boundingCircle();
      stampRadii.push(bc?.radius || 0);
    });
    for (let t = 0; t < 600; t++) {
      c.reverse();
      for (let i = 0; i < c.length; i++) {
        for (let j = 0; j < c.length; j++) {
          if (i === j) {
            continue;
          }
          const dist = Math.max(
            1,
            GeomHelpers.distanceBetweenPoints(c[i].center, c[j].center) -
              (stampRadii[i] + stampRadii[j]),
          );
          const angle = GeomHelpers.angleBetweenPoints(
            c[i].center,
            c[j].center,
          );
          const otherDistFromCenterFactor =
            GeomHelpers.distanceBetweenPoints(c[j].center, this.center) /
            radius;
          const forceFactor =
            (stampRadii[j] / stampRadii[i]) * otherDistFromCenterFactor;
          const impulse = 0 - Math.min(dist + 40, 80);
          const force = (impulse / Math.pow(dist, 2)) * forceFactor;
          const forceAngle = angle;

          c[i].center.x += force * Math.cos(forceAngle) * forceFactor;
          c[i].center.y += force * Math.sin(forceAngle) * forceFactor;
          c[j].center.x -= (force * Math.cos(forceAngle)) / forceFactor;
          c[j].center.y -= (force * Math.sin(forceAngle)) / forceFactor;
          const distFromCenter = GeomHelpers.distanceBetweenPoints(
            c[i].center,
            this.center,
          );
          if (distFromCenter > radius - stampRadii[i]) {
            const factor = 1 - (radius - stampRadii[i]) / distFromCenter;
            c[i].center.x -= this.center.x;
            c[i].center.y -= this.center.y;
            c[i].center.x *= 1 - factor / 10;
            c[i].center.y *= 1 - factor / 10;
            c[i].center.x += this.center.x;
            c[i].center.y += this.center.y;
          }
        }
      }
    }
    c.forEach((stamp) => {
      const seed = params.permutationSequence?.next() || i;
      Sequence.resetAll(seed, [
        params.permutationSequence,
        params.scaleSequence,
      ]);
      Sequence.seed = seed;
      stamp.generate();
    });
    return c;
  }
}
