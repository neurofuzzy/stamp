import { Point, Ray, Segment, BoundingBox, IShape } from "./core";

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

  static rotatePoint(v: Point, angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x1 = v.x * cos - v.y * sin;
    const y1 = v.x * sin + v.y * cos;
    v.x = x1;
    v.y = y1;
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

  static averagePoints(points: Point[]) {
    let x = 0;
    let y = 0;
    for (let i = 0; i < points.length; i++) {
      x += points[i].x;
      y += points[i].y;
    }
    return new Point(x / points.length, y / points.length);
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

  static canOptimizeSegment(segment: Segment, threshold = 0.0001): Segment {
    let i = segment.points.length;
    let pts = segment.points.concat();
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
    return new Segment(pts);
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

  static optimizeSegment(segment: Segment, threshold = 0.0001): Segment[] {
    let i = segment.points.length;
    let pts = segment.points.concat();
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
      let j = i;
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
            segs.push(new Segment(newPts));
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
      segs.push(new Segment(newPts));
    }
    return segs;
  }
}