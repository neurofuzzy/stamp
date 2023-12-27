import { Point, Ray } from "./shapes"

export class GeomHelpers {

  static pointsAreEqual(p1: Point, p2: Point) {
    return GeomHelpers.distanceBetweenPoints(p1, p2) < 0.0001;
  }

  static distanceBetweenPoints(p1: Point, p2: Point) {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
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
    v.x = v.x * cos - v.y * sin;
    v.y = v.x * sin + v.y * cos;
  }

  static rotatePointAboutOrigin(origin: Ray, point: Point) {
    const x = point.x - origin.x;
    const y = point.y - origin.y;
    point.x = x * Math.cos(origin.direction) - y * Math.sin(origin.direction) + origin.x;
    point.y = x * Math.sin(origin.direction) + y * Math.cos(origin.direction) + origin.y;
  }

  static rotateRayAboutOrigin(origin: Ray, ray: Ray) {
    const x = ray.x - origin.x;
    const y = ray.y - origin.y;
    ray.x = x * Math.cos(origin.direction) - y * Math.sin(origin.direction) + origin.x;
    ray.y = x * Math.sin(origin.direction) + y * Math.cos(origin.direction) + origin.y;
    ray.direction += origin.direction;
  }

  static subdivideRays(start: Ray, end: Ray, segments: number, flipRays = false) {
    const rays = [];
    for (let i = 0; i <= segments; i++) {
      const ray = new Ray(
        start.x + (end.x - start.x) * i / segments,
        start.y + (end.y - start.y) * i / segments
      );
      if (i === 0) {
        ray.direction = start.direction;
      } else if (i === segments) {
        ray.direction = end.direction;
      } else {
        ray.direction = GeomHelpers.angleBetweenPoints(rays[i - 1], ray) - Math.PI / 2;
      }
      rays.push(ray);
    }
    if (flipRays) {
      for (let i = 0; i < segments; i++) {
        rays[i].direction += Math.PI;
      }
    }
    return rays
  }

  static subdivideRaysByDistance(start: Ray, end: Ray, distance: number) {
    const segments = Math.round(GeomHelpers.distanceBetweenPoints(start, end) / distance);
    return GeomHelpers.subdivideRays(start, end, segments);
  }

  static subdivideRaySet(rays: Ray[], segments: number) {
    const newRays = [];
    for (let i = 0; i < rays.length - 1; i++) {
      newRays.push(...GeomHelpers.subdivideRays(rays[i], rays[i + 1], segments));
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

}