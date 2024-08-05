import { makeCircle } from "../lib/smallest-enclosing-circle";
import { Point, Ray, Path, BoundingBox, IShape, BoundingCircle, Segment } from "./core";

export class GeomHelpers {

  static pointsAreEqual(p1: Point, p2: Point, threshold: number = 0.0001) {
    return GeomHelpers.distanceBetweenPoints(p1, p2) < threshold;
  }

  static distanceBetweenPoints(p1: Point, p2: Point) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceBetweenPointsSquared(p1: Point, p2: Point) {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return dx * dx + dy * dy;
  }

  static angleBetweenPoints(p1: Point, p2: Point) {
    let ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    if (ang < 0 - Math.PI) {
      ang += Math.PI * 2;
    } else if (ang > Math.PI) {
      ang -= Math.PI * 2;
    }
    return ang;
  }

  static angleBetweenABC(a: Point, b: Point, c: Point) {
    const ba = new Point(b.x - a.x, b.y - a.y);
    const ca = new Point(c.x - a.x, c.y - a.y);
    const dot = ba.x * ca.x + ba.y * ca.y;
    const det = ba.x * ca.y - ba.y * ca.x;
    return Math.atan2(det, dot);
  }

  static normalizeAngle(angle: number) {
    while (angle > Math.PI) {
      angle -= Math.PI * 2;
    }
    while (angle < -Math.PI) {
      angle += Math.PI * 2;
    }
    return angle;
  }

  static lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  static lerpAngle(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  static clamp(x: number, min: number, max: number) {
    return Math.max(min, Math.min(x, max));
  }

  static degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180;
  }

  static radiansToDegrees(radians: number) {
    return radians * 180 / Math.PI;
  }

  static rotatePoint(pt: Point, rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const oldY = pt.y;
    const oldX = pt.x;
    pt.y = cos * oldY - sin * oldX;
    pt.x = sin * oldY + cos * oldX;
  }

  static rotatePoints(rad: number, ...points: Point[]) {
    points.forEach((pt) => {
      GeomHelpers.rotatePoint(pt, rad);
    });
  }

  static rotatePointAbountPoint(origin: Point, point: Point, angle: number) {
    if (angle === Math.round(angle)) {
      angle = angle * Math.PI / 180;
    }
    const x = point.x - origin.x;
    const y = point.y - origin.y;
    point.x = x * Math.cos(angle) - y * Math.sin(angle) + origin.x;
    point.y = x * Math.sin(angle) + y * Math.cos(angle) + origin.y;
  }

  static rotatePointAboutOrigin(origin: Ray, point: Point) {
    const x = point.x - origin.x;
    const y = point.y - origin.y;
    point.x = x * Math.cos(origin.direction) - y * Math.sin(origin.direction) + origin.x;
    point.y = x * Math.sin(origin.direction) + y * Math.cos(origin.direction) + origin.y;
  }

  static scalePointsRelativeToCenter(points: { x: number, y: number }[], center: { x: number, y: number }, scale: number) {
    points.forEach((pt) => {
      pt.x -= center.x;
      pt.y -= center.y;
      pt.x *= scale;
      pt.y *= scale;
      pt.x += center.x;
      pt.y += center.y;
    }); 
  }

  static averagePoints(points: Point[]) {
    let x = 0;
    let y = 0;
    for (let i = 0; i < points.length; i++) {
      x += points[i].x;
      y += points[i].y;
    }
    return new Point(x / points.length, y / points.length);
  }

  static addToPoint(pt: Point, add: Point) {
    pt.x += add.x;
    pt.y += add.y;
  }

  static subdividePoints(start: Point, end: Point, divisions: number): Point[] {
    const points = [];
    for (let i = 0; i <= divisions; i++) {
      const pt = new Point(
        start.x + (end.x - start.x) * i / divisions,
        start.y + (end.y - start.y) * i / divisions
      );
      points.push(pt);
    }
    return points
  }

  static subdividePointsByDistance(start: Point, end: Point, distance: number): Point[] {
    const divisions = Math.round(GeomHelpers.distanceBetweenPoints(start, end) / distance);
    return GeomHelpers.subdividePoints(start, end, divisions);
  }

  static subdividePointsByDistanceExact(start: Point, end: Point, dist: number): Point[] {
    const points = [];
    const len = GeomHelpers.distanceBetweenPoints(start, end);
    const ang = GeomHelpers.angleBetweenPoints(start, end);
    let runningDist = 0;
    while (runningDist < len + dist) {
      if (runningDist > len) {
        points.push(end);
        break;
      }
      const pt = new Point(
        start.x + Math.cos(ang) * runningDist,
        start.y + Math.sin(ang) * runningDist
      );
      runningDist += dist;
      points.push(pt);
    }
    return points;
  }

  static rotateRayAboutOrigin(origin: Ray, ray: Ray) {
    const x = ray.x - origin.x;
    const y = ray.y - origin.y;
    ray.x = x * Math.cos(origin.direction) - y * Math.sin(origin.direction) + origin.x;
    ray.y = x * Math.sin(origin.direction) + y * Math.cos(origin.direction) + origin.y;
    ray.direction += origin.direction;
  }

  static subdivideRays(start: Ray, end: Ray, divisions: number, flipRays = false): Ray[] {
    if (divisions === 0) {
      return [start, end];
    }
    const rays = [];
    for (let i = 0; i <= divisions; i++) {
      const ray = new Ray(
        start.x + (end.x - start.x) * i / divisions,
        start.y + (end.y - start.y) * i / divisions
      );
      if (i === 0) {
        ray.direction = start.direction;
      } else if (i === divisions) {
        ray.direction = end.direction;
      } else {
        ray.direction = GeomHelpers.angleBetweenPoints(rays[i - 1], ray) - Math.PI / 2;
      }
      rays.push(ray);
    }
    if (flipRays) {
      for (let i = 0; i < divisions; i++) {
        rays[i].direction += Math.PI;
      }
    }
    return rays
  }

  static subdivideRaysByDistance(start: Ray, end: Ray, distance: number): Ray[] {
    const divisions = Math.round(GeomHelpers.distanceBetweenPoints(start, end) / distance);
    return GeomHelpers.subdivideRays(start, end, divisions);
  }

  static subdivideRaySet(rays: Ray[], divisions: number) {
    const newRays = [];
    for (let i = 0; i < rays.length - 1; i++) {
      newRays.push(...GeomHelpers.subdivideRays(rays[i], rays[i + 1], divisions));
    }
    return newRays
  }

  static subdivideRaySetByDistance(rays: Ray[], distance: number) {
    const newRays = [];
    for (let i = 0; i < rays.length - 1; i++) {
      newRays.push(...GeomHelpers.subdivideRaysByDistance(rays[i], rays[i + 1], distance));
    }
    return newRays
  }

  static smoothLine(pts:Point[], iterations:number, minDist = 5, closed = false, d1 = 0.25, d2 = 0.75) {

    let inn = pts.concat();
    let out = [];
    let prev = inn.concat();

    for (let j = 0; j < iterations; j++) {

      out = [];

      if (prev.length && !closed) {
        out.push(prev[0])
      }

      let len = prev.length - 1;
      if (closed) len++;

      for (let i = 0; i < len; i++) {

        let p1 = prev[i];
        let p2 = prev[i + 1] || prev[0];

        if (i > 1 && i < len - 2) {
          let p0 = prev[i - 1];
          let p3 = prev[i + 2];
          if (p0 && p1 && p2 && p3) {
            if (p0.x == p1.x && p1.x == p2.x && p2.x == p3.x) {
              out.push(p1.clone());
              continue;
            }
            if (p0.y == p1.y && p1.y == p2.y && p2.y == p3.y) {
              out.push(p1.clone());
              continue;
            }
          }
        }

        if (!p2) continue;

        if (GeomHelpers.distanceBetweenPoints(p1, p2) > minDist * 2) {

          let mx = d2 * p1.x + d1 * p2.x;
          let my = d2 * p1.y + d1 * p2.y;
          let nx = d1 * p1.x + d2 * p2.x;
          let ny = d1 * p1.y + d2 * p2.y;

          out.push(new Point(mx, my));
          out.push(new Point(nx, ny));

        } else if (!closed) {
          out.push(p2.clone());
        } else {
          out.push(GeomHelpers.averagePoints([p1, p2]));
        }

      }

      prev = out;

    }

    if (closed && out.length) {
      out.push(out[0]);
    } else {
      out.push(inn[inn.length - 1]);
    }

    return out;

  }

  static normalizeRayDirections(rays: Ray[], isReversed = false) {
    const r: Ray[] = rays.slice();
    if (r.length < 3) {
      return;
    }
    let isClosed = GeomHelpers.pointsAreEqual(r[0], r[r.length - 1]);
    if (isClosed) {
      r.unshift(r[r.length - 2]);
    } else {
      r.unshift(r[0]);
      r.push(r[r.length - 1]);
    }
    for (let i = 1; i < r.length - 1; i++) {
      r[i].direction = GeomHelpers.normalizeAngle(
        GeomHelpers.angleBetweenPoints(r[i - 1], r[i]) +
        GeomHelpers.angleBetweenABC(r[i - 1], r[i], r[i + 1]) +
        (isReversed ? Math.PI * 0.5 : 0 - Math.PI * 0.5)
      );
    }
    if (isClosed) {
      r[r.length - 1].direction = r[1].direction;
    }
  }

  static raySetIsClockwise(rays: Ray[]) {
    let sum = 0;
    for (let i = 0; i < rays.length - 1; i++) {
      sum += GeomHelpers.angleBetweenPoints(rays[i], rays[i + 1]);
    }
    return sum < 0
  }

  static boundingBoxIsWithinBoundingBox(
    boundingBox: BoundingBox,
    outerBoundingBox: BoundingBox,
    tolerance = 0
  ) {
    return (
      boundingBox.x + tolerance >= outerBoundingBox.x &&
      boundingBox.y + tolerance >= outerBoundingBox.y &&
      boundingBox.x + boundingBox.width - tolerance <= outerBoundingBox.x + outerBoundingBox.width &&
      boundingBox.y + boundingBox.height - tolerance <= outerBoundingBox.y + outerBoundingBox.height
    );
  }

  static shapeWithinBoundingBox(
    shape: IShape,
    outerBoundingBox: BoundingBox,
    tolerance = 0
  ) {
    return GeomHelpers.boundingBoxIsWithinBoundingBox(
      shape.boundingBox(),
      outerBoundingBox,
      tolerance
    );
  }

  // Based on http://stackoverflow.com/a/12037737

  static circleCircleTangents(ptA: Point, rA: number, ptB: Point, rB: number): Point[] {
    var dx = ptB.x - ptA.x;
    var dy = ptB.y - ptA.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= Math.abs(rB - rA)) return []; // no valid tangents

    // Rotation from x-axis
    var angle1 = Math.atan2(dy, dx);
    var angle2 = Math.acos((rA - rB) / dist);

    return [
      new Point(
        ptB.x + rB * Math.cos(angle1 + angle2),
        ptB.y + rB * Math.sin(angle1 + angle2),
      ),
      new Point(
        ptA.x + rA * Math.cos(angle1 + angle2),
        ptA.y + rA * Math.sin(angle1 + angle2),
      ),
      new Point(
        ptA.x + rA * Math.cos(angle1 - angle2),
        ptA.y + rA * Math.sin(angle1 - angle2),
      ),
      new Point(
        ptB.x + rB * Math.cos(angle1 - angle2),
        ptB.y + rB * Math.sin(angle1 - angle2),
      )
    ];
  }

  static canOptimizePath(path: Path, threshold = 0.0001): Path {
    let i = path.points.length;
    let pts = path.points.concat();
    while (i > 1) {
      i--;
      let ptA = pts[i];
      let ptB = pts[i - 1];
      let j = 1;
      while (j < i) {
        j++;
        let ptC = pts[j];
        let ptD = pts[j - 1];
        if (GeomHelpers.pointsAreEqual(ptA, ptD, threshold) && GeomHelpers.pointsAreEqual(ptB, ptC, threshold)) {
          pts.splice(i, 1);
          break;
        }
      }
    }
    return new Path(pts);
  }

  static sub(ptA: Point, ptB: Point) {
    return new Point(ptA.x - ptB.x, ptA.y - ptB.y);
  }

  static dot(ptA: Point, ptB: Point): number {
    return ptA.x * ptB.x + ptA.y * ptB.y;
  }

  static cross(ptA: Point, ptB: Point): number {
    return ptA.x * ptB.y - ptA.y * ptB.x;
  }

  static closestPtPointSegment(pt: Point, seg: Segment): Point {
    var ab = GeomHelpers.sub(seg.b, seg.a);
    var ca = GeomHelpers.sub(pt, seg.a);
    var t = GeomHelpers.dot(ca, ab);
    if (t < 0) {
      pt = seg.a;
    } else {
      var denom = GeomHelpers.dot(ab, ab);
      if (t >= denom) {
        pt = seg.b;
      } else {
        t /= denom;
        // reuse ca
        ca.x = seg.a.x + t * ab.x;
        ca.y = seg.a.y + t * ab.y;
        pt = ca;
      }
    }
    return pt.clone();
  }

  static distancePointSegment(pt: Point, seg: Segment): number {
    return GeomHelpers.distanceBetweenPoints(pt, GeomHelpers.closestPtPointSegment(pt, seg));
  }

  static segmentSegmentIntersect(segA: Segment, segB: Segment, ignoreTouching = false): Point | null {
    const x1 = segA.a.x;
    const y1 = segA.a.y;
    const x2 = segA.b.x;
    const y2 = segA.b.y;
    const x3 = segB.a.x;
    const y3 = segB.a.y;
    const x4 = segB.b.x;
    const y4 = segB.b.y;

    const s1_x = x2 - x1;
    const s1_y = y2 - y1;
    const s2_x = x4 - x3;
    const s2_y = y4 - y3;

    const s = (-s1_y * (x1 - x3) + s1_x * (y1 - y3)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = (s2_x * (y1 - y3) - s2_y * (x1 - x3)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      const atX = x1 + t * s1_x;
      const atY = y1 + t * s1_y;
      let intPt = new Point(atX, atY);
      if (ignoreTouching) {
        if (GeomHelpers.pointsAreEqual(intPt, segB.a) || GeomHelpers.pointsAreEqual(intPt, segB.b)) {
          return null;
        }
        if (GeomHelpers.pointsAreEqual(intPt, segA.a) || GeomHelpers.pointsAreEqual(intPt, segA.b)) {
          return null;
        }
      }
      return intPt;
    }

    return null;
  }

  static segmentSegmentsIntersections(segA: Segment, segs: Segment[], ignoreTouching = false, removeDuplicates = false) {
    let intersections: { pt: Point, dist: number }[] = [];
    segs.forEach((seg) => {
      if (seg == segA) {
        return;
      }
      let intPt = GeomHelpers.segmentSegmentIntersect(segA, seg, ignoreTouching);
      if (intPt) {
        let exists = false;
        if (removeDuplicates) {
          for (let intersection of intersections) {
            if (GeomHelpers.pointsAreEqual(intersection.pt, intPt)) {
              exists = true;
              break;
            }
          }
        }
        if (!exists) {
          const intersection = { pt: intPt, dist: GeomHelpers.distanceBetweenPoints(segA.a, intPt) };
          intersections.push(intersection);
        }
      }
    });
    return intersections;
  }

  static segmentsAreEqual(segA: Segment, segB: Segment, threshold = 0.0001, noReverseSegCheck = false): boolean {
    if (noReverseSegCheck) {
      return GeomHelpers.pointsAreEqual(segA.a, segB.a, threshold) && GeomHelpers.pointsAreEqual(segA.b, segB.b, threshold);
    } else {
      return (
        GeomHelpers.pointsAreEqual(segA.a, segB.b, threshold) && GeomHelpers.pointsAreEqual(segA.b, segB.a, threshold) ||
        GeomHelpers.pointsAreEqual(segA.a, segB.a, threshold) && GeomHelpers.pointsAreEqual(segA.b, segB.b, threshold)
      );
    }
  }

  static segmentsAreSameAngle(segA: Segment, segB: Segment): boolean {
    let aA = GeomHelpers.angleBetweenPoints(segA.a, segA.b);
    let aB = GeomHelpers.angleBetweenPoints(segB.a, segB.b);
    return Math.abs(aA - aB) < 0.001;
  }

  static segmentsAreSameAngleRev(segA: Segment, segB: Segment): boolean {
    let aA = GeomHelpers.angleBetweenPoints(segA.a, segA.b);
    let aB = GeomHelpers.angleBetweenPoints(segB.b, segB.a);
    return Math.abs(aA - aB) < 0.001;
  }

  static optimizePath(path: Path, threshold = 0.0001): Path[] {
    let i = path.points.length;
    let pts = path.points.concat();
    let isClosed = GeomHelpers.pointsAreEqual(pts[0], pts[pts.length - 1], threshold);
    let newPts: Point[] = [];
    let segs = [];
    if (isClosed) {
      i--;
    }
    for (let i = 1; i < pts.length; i++) {
      let ptA = pts[i];
      let ptB = pts[i - 1];
      if (GeomHelpers.distanceBetweenPoints(ptA, ptB) < threshold * 0.5) {
        continue;
      }
      let duplicate = false;
      for (let j = 1; j < newPts.length; j++) {
        let ptC = pts[j];
        let ptD = pts[j - 1];
        if (
          (GeomHelpers.pointsAreEqual(ptA, ptD, threshold) && GeomHelpers.pointsAreEqual(ptB, ptC, threshold)) ||
          (GeomHelpers.pointsAreEqual(ptA, ptC, threshold) && GeomHelpers.pointsAreEqual(ptB, ptD, threshold))
        ) {
          duplicate = true;
          if (newPts.length > 1) {
            segs.push(new Path(newPts));
            newPts = [];
          }
          break;
        }
      }
      if (!duplicate) {
        newPts.push(ptA);
        continue;
      }
    }
    if (newPts.length > 1) {
      if (
        newPts.length > 2 && 
        isClosed && 
        segs.length === 0
      ) {
        newPts.push(newPts[0].clone());
      }
      segs.push(new Path(newPts));
    }
    return segs;
  }

  static boundingCircleFromPaths (paths: Path[]):BoundingCircle | null {
    let pts: Point[] = [];
    for (let i = 0; i < paths.length; i++) {
      pts = pts.concat(paths[i].points);
    }
    const c = makeCircle(pts);
    if (c) {
      return new BoundingCircle(c.x, c.y, c.r);
    }
    return null;
  }

  static pointWithinPolygon(pt: Point, shape: IShape): boolean {
    const b = shape.boundingBox();

    let startPtA = new Point(b.x - 99000.9, b.y - 1110000.1);
    let startPtB = new Point(b.x + b.width + 1110000.1, b.y + b.height + 99000.9);
    let segA = new Segment(startPtA, pt);
    let segB = new Segment(startPtB, pt);

    let ptsA = [];
    let ptsB = [];
    const polyPts = shape.generate();
    let polySegs = [];
    for (let i = 0; i < polyPts.length - 1; i++) {
      polySegs.push(new Segment(polyPts[i], polyPts[i + 1]));
    }
    polySegs.forEach((seg) => {
      const ptA = GeomHelpers.segmentSegmentIntersect(segA, seg);
      if (ptA) {
        ptsA.push(ptA);
      }
      const ptB = GeomHelpers.segmentSegmentIntersect(segB, seg);
      if (ptB) {
        ptsB.push(ptB);
      }
    });

    return ptsA.length % 2 !== 0 && ptsB.length % 2 !== 0;
  }

  static raycast(ptA: Point, ptB: Point, segs: Segment[], ignoreTouching = true): { pt: Point, dist: number }[] {

    let hitPts = GeomHelpers.segmentSegmentsIntersections(new Segment(ptA, ptB), segs, ignoreTouching);

    hitPts.sort((a, b) => {
      const distA = a.dist;
      const distB = b.dist;
      if (distA > distB) {
        return 1;
      } else if (distA < distB) {
        return -1;
      }
      return 0;
    });

    if (hitPts.length) {
      if (GeomHelpers.pointsAreEqual(hitPts[0].pt, ptA, 10)) {
        hitPts.shift();
      }
    }

    if (hitPts.length) {
      return hitPts;
    }

    return [];

  }

  static cropSegsToShape (segs: Segment[], shape: IShape): Segment[] {

    const outSegs = segs.concat();

    let i = outSegs.length;

    while (i--) {

      let seg = outSegs[i];
      let aok = GeomHelpers.pointWithinPolygon(seg.a, shape);
      let bok = GeomHelpers.pointWithinPolygon(seg.b, shape);

      if (aok && bok) {
        continue;
      }

      const borderSegs = shape.toSegments();

      let intPts = GeomHelpers.segmentSegmentsIntersections(seg, borderSegs, false, false);

      if (!aok && !bok) {
        if (intPts && intPts.length > 1) {
          seg.a = intPts[0].pt;
          seg.b = intPts[intPts.length - 1].pt;
          continue;
        }
        outSegs.splice(i, 1);
        continue;
      }

      if (aok && !bok) {
        if (intPts && intPts.length) {
          seg = seg.clone();
          seg.b = intPts[0].pt;
          outSegs[i] = seg;
          continue;
        }
      }

      if (!aok && bok) {
        if (intPts && intPts.length) {
          seg = seg.clone();
          seg.a = intPts[0].pt;
          outSegs[i] = seg;
          continue;
        }
      }

    }

    return outSegs;

  }

  static cutShapeFromSegs (segs: Segment[], shape: IShape): Segment[] {

    let outSegs = segs.concat();
    let i = outSegs.length;
    let shapeSegs = shape.toSegments();

    while (i--) {

      let seg = outSegs[i];
      let aok = GeomHelpers.pointWithinPolygon(seg.a, shape);
      let bok = GeomHelpers.pointWithinPolygon(seg.b, shape);

      if (aok && bok) {
        outSegs.splice(i, 1);
        continue;
      }

      let intPts = GeomHelpers.segmentSegmentsIntersections(seg, shapeSegs, false, false);

      if (!aok && !bok) {
        if (intPts && intPts.length > 1) {

          let segA = new Segment(seg.a, intPts[0].pt);
          let segB = new Segment(intPts[intPts.length - 1].pt, seg.b);
          outSegs.splice(i, 1, segA, segB);
          continue;
        }
        continue;
      }

      if (aok && !bok) {
        if (intPts && intPts.length) {
          seg = seg.clone();
          seg.a = intPts[0].pt;
          outSegs[i] = seg;
          continue;
        }
      }

      if (!aok && bok) {
        if (intPts && intPts.length) {
          seg = seg.clone();
          seg.b = intPts[0].pt;
          outSegs[i] = seg;
          continue;
        }
      }

    }

    return outSegs;

  }

}