import { Ray } from "../../geom/core";
import { GeomHelpers } from "../../geom/helpers";
import { AbstractShape } from "../../geom/shapes";
import { Sequence } from "../sequence";
import { Stamp } from "../stamp";
import * as arbit from "arbit";
import { resolveStringOrNumber } from "../stamp-helpers";
import { IStampLayoutParams, IGridStampLayoutParams, ICircleGridStampLayoutParams, ICirclePackingStampLayoutParams } from "./layout-interfaces";

const $ = resolveStringOrNumber;

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

function resetSequences(params: IStampLayoutParams, idx: number) {
  const seed = $(params.stampSeed) ?? idx;
  const skipSequences: Sequence[] = [];
  if (typeof params.stampSeed === "string") {
    skipSequences.push(Sequence.getSequence(params.stampSeed));
  }
  if (typeof params.scale === "string") {
    skipSequences.push(Sequence.getSequence(params.scale));
  }
  Sequence.resetAll(seed, skipSequences);
  Sequence.seed = seed;
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
        resetSequences(params, i);
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
        resetSequences(params, i);
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

export class CirclePackingStampLayout extends AbstractStampLayout {
  constructor(center: Ray, params: ICirclePackingStampLayoutParams) {
    super(center, params);
  }

  children(): Stamp[] {
    const c: Stamp[] = [];
    const params = this.params as ICirclePackingStampLayoutParams;
    const layoutSeed = params.layoutSeed ?? 1;
    const prng = arbit(layoutSeed);
    const numPoints = params.count ?? 20;
    const numTriesPerPoint = 200;
    const radius = params.radius;
    const padding = params.padding ?? 2;
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
          let currentDist = GeomHelpers.distanceBetweenPoints(pt, c[k].center);
          if (currentDist < dist) {
            dist = currentDist;
          }
        }
        if (c.length > 0 && dist > radius * 0.5) {
          continue;
        }
        if (
          GeomHelpers.distanceBetweenPointsSquared(pt, this.center) >
          radius * radius
        ) {
          continue;
        }
        pointDists.push({ pt, dist });
      }
      // sort points by distance from all other points
      pointDists.sort((a, b) => {
        const aDist = a.dist;
        const bDist = b.dist;
        return bDist - aDist;
      });
      const farthest = pointDists[0].pt;
      const distFromCenter = GeomHelpers.distanceBetweenPoints(
        farthest,
        this.center,
      );
      if (distFromCenter > radius) {
        continue;
      }
      const stamp = params.stamp.clone();
      stamp.center = farthest.clone();
      stamp.scale =
        ($(params.scale) ?? 1) *
        (1 -
          distFromCenter / radius / Math.max(1, 100 - (params.spherify || 0)));
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
    const velocities: Ray[] = [];
    c.forEach(() => {
      velocities.push(new Ray(0, 0));
    });
    for (let t = 0; t < 16; t++) {
      let f = t / 3 + 1;
      // pull in with gravity
      for (let i = 0; i < c.length; i++) {
        const dist = GeomHelpers.distanceBetweenPoints(
          c[i].center,
          this.center,
        );
        const angle = GeomHelpers.angleBetweenPoints(c[i].center, this.center);
        const force = (1 * (dist / radius)) / f;
        velocities[i].x += force * Math.cos(angle);
        velocities[i].y += force * Math.sin(angle);
      }
      // push away from eachother
      for (let j = 0; j < c.length; j++) {
        for (let i = 0; i < c.length; i++) {
          if (i === j) {
            continue;
          }
          const dist =
            GeomHelpers.distanceBetweenPoints(c[i].center, c[j].center) -
            (stampRadii[i] + stampRadii[j]);
          const angle = GeomHelpers.angleBetweenPoints(
            c[i].center,
            c[j].center,
          );
          const force = 1 / dist / f;
          velocities[i].x -= force * Math.cos(angle);
          velocities[i].y -= force * Math.sin(angle);
          velocities[j].x += force * Math.cos(angle);
          velocities[j].y += force * Math.sin(angle);
        }
      }

      // apply velocity to centers
      for (let i = 0; i < c.length; i++) {
        c[i].center.x += velocities[i].x;
        c[i].center.y += velocities[i].y;
      }
    }
    for (let k = 0; k < padding; k += 0.125) {
      c.reverse();
      stampRadii.reverse();
      for (let i = 0; i < c.length; i++) {
        for (let j = 0; j < c.length; j++) {
          const dist =
            GeomHelpers.distanceBetweenPoints(c[i].center, c[j].center) -
            (stampRadii[i] + stampRadii[j]) -
            k;
          const angle = GeomHelpers.angleBetweenPoints(
            c[i].center,
            c[j].center,
          );
          if (dist <= k) {
            // resolve penetration
            // move both stamps away from each other by half the negative distance
            // consider the angle between the two stamps
            c[i].center.x += (dist / padding) * Math.cos(angle);
            c[i].center.y += (dist / padding) * Math.sin(angle);
            c[j].center.x += (dist / padding) * Math.cos(angle + Math.PI);
            c[j].center.y += (dist / padding) * Math.sin(angle + Math.PI);
          }
          const distFromCenter = GeomHelpers.distanceBetweenPoints(
            c[i].center,
            this.center,
          );
          if (k < padding - 1) {
            if (distFromCenter > radius - stampRadii[i]) {
              const factor = 1 - (radius - stampRadii[i]) / distFromCenter;
              c[i].center.x -= this.center.x;
              c[i].center.y -= this.center.y;
              c[i].center.x *= 1 - factor / (k + 1);
              c[i].center.y *= 1 - factor / (k + 1);
              c[i].center.x += this.center.x;
              c[i].center.y += this.center.y;
            }
          }
        }
      }
    }

    c.forEach((stamp, idx) => {
      const seed = $(params.stampSeed) ?? idx;
      Sequence.seed = seed;
      stamp.generate();
    });
    return c;
  }
}
