import { Point, Ray } from "./core"

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
    if (ang < 0) {
      ang += Math.PI * 2;
    } else if (ang > Math.PI * 2) {
      ang -= Math.PI * 2;
    }
    return ang;
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

  static subdivideRays(start: Ray, end: Ray, segments: number) {
    const rays = [start];
    for (let i = 1; i < segments; i++) {
      const ray = new Ray(
        start.x + (end.x - start.x) * i / segments,
        start.y + (end.y - start.y) * i / segments
      );
      ray.direction = GeomHelpers.angleBetweenPoints(rays[i - 1], ray) - Math.PI / 2;
      rays.push(ray);
    }
    rays.push(end);
    return rays
  }

  static subdivideRaysByDistance(start: Ray, end: Ray, distance: number) {
    const segments = Math.round(GeomHelpers.distanceBetweenPoints(start, end) / distance);
    return GeomHelpers.subdivideRays(start, end, segments);
  }

  static normalizeRayDirections(rays: Ray[]) {
    if (rays.length < 3) {
      return;
    }
    let isClosed = GeomHelpers.pointsAreEqual(rays[0], rays[rays.length - 1]);
    if (isClosed) {
      rays[0].direction = (
        GeomHelpers.angleBetweenPoints(rays[rays.length - 2], rays[0]) +
        GeomHelpers.angleBetweenPoints(rays[0], rays[1])
      ) / 2 + Math.PI / 2;
    } else {
      rays[0].direction = GeomHelpers.angleBetweenPoints(rays[0], rays[1]) - Math.PI / 2;
    }

    for (let i = 1; i < rays.length - 1; i++) {
      rays[i].direction = (
        GeomHelpers.angleBetweenPoints(rays[i - 1], rays[i]) + 
        GeomHelpers.angleBetweenPoints(rays[i], rays[i + 1])
      ) / 2 - Math.PI / 2;
    }
    
    if (isClosed) {
      rays[rays.length - 1].direction = (
        GeomHelpers.angleBetweenPoints(rays[rays.length - 2], rays[0]) + 
        GeomHelpers.angleBetweenPoints(rays[0], rays[1])
      ) / 2 + Math.PI / 2;
    } else {
      rays[rays.length - 1].direction = GeomHelpers.angleBetweenPoints(rays[rays.length - 2], rays[rays.length - 1]) - Math.PI / 2;
    }
  }

}