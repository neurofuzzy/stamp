import { Point, Path } from "./core";

export class PathModifiers {
  static spherify(paths: Path[], center: Point, size: number) {
    paths.forEach((p) => {
      p.points.forEach((p) => {
        p.x -= center.x;
        p.y -= center.y;
        let dist = Math.max(0.5, 1.5 - Math.sqrt(p.x * p.x + p.y * p.y) / size);
        p.x *= dist;
        p.y *= dist;
        p.x += center.x;
        p.y += center.y;
      });
    });
  }
}