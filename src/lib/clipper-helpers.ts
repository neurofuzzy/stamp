import * as clipperLib from "js-angusj-clipper/web";
import {
  IShape,
  Point,
  Polygon,
  Ray,
  Segment
} from "../geom/shapes";
import { HatchFillShape, IHatchPattern } from "../geom/hatch-patterns";

export class ClipperHelpers {

  static clipper: clipperLib.ClipperLibWrapper;

  static async init() {
    ClipperHelpers.clipper = await clipperLib.loadNativeClipperLibInstanceAsync(
      // let it autodetect which one to use, but also available WasmOnly and AsmJsOnly
      clipperLib.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback
    );
    return !!ClipperHelpers.clipper;
  }

  static shapeToPaths(shape: IShape): {
    data: clipperLib.IntPoint[] | clipperLib.IntPoint[][];
    closed: boolean;
  } {
    let rays: Ray[] = shape.generate();
    if (rays.length === 0 && shape.children().length === 1) {
      rays = shape.children()[0].generate();
      shape = shape.children()[0];
    }
    const paths = [];
    let path = rays.map(
      (r) =>
        ({
          x: Math.round(r.x * 10000),
          y: Math.round(r.y * 10000),
        } as clipperLib.IntPoint)
    );
    paths.push(path);
    shape.children().forEach((s: IShape) => {
      let p = ClipperHelpers.shapeToPaths(s);
      paths.push(...p.data);
    });
    return {
      data: paths,
      closed: true,
    };
  }

  static polyTreeToPolygons(polyTree: clipperLib.PolyTree): Polygon[] {
    let polygons: Polygon[] = [];
    const polyNodeToPolygon = (node: clipperLib.PolyNode): Polygon => {
      const rays: Ray[] = [];
      if (node.contour.length) {
        for (let j = 0; j < node.contour.length; j++) {
          let p = node.contour[j];
          rays.push(
            new Ray(
              Math.round(p.x - 10000) / 10000,
              Math.round(p.y - 10000) / 10000
            )
          );
        }
        rays.push(rays[0].clone());
      }
      let polygon: Polygon = new Polygon(new Ray(0, 0), rays, 1);
      polygon.isHole = node.isHole;
      if (node.childs.length) {
        for (let j = 0; j < node.childs.length; j++) {
          let childNode = node.childs[j];
          let child = polyNodeToPolygon(childNode);
          if (child && polygon) {
            polygon.addChild(child);
          }
        }
      }
      return polygon;
    };

    polyTree.childs.forEach((node) => {
      const polygon = polyNodeToPolygon(node);
      if (polygon) {
        polygons.push(polygon);
      }
    });

    return polygons;
  }

  static hatchAreaToPaths(shape: IHatchPattern): {
    data: clipperLib.IntPoint[] | clipperLib.IntPoint[][];
    closed: boolean;
  } {
    let segments = shape.generate();
    const paths = segments.map(
      (seg) =>
        [
          {
            x: Math.round(seg.a.x * 10000),
            y: Math.round(seg.a.y * 10000),
          } as clipperLib.IntPoint,
          {
            x: Math.round(seg.b.x * 10000),
            y: Math.round(seg.b.y * 10000),
          } as clipperLib.IntPoint,
        ]
    );
    return {
      data: paths,
      closed: false,
    };
  }

  static polyTreeToHatchFillShape(polyTree: clipperLib.PolyTree): HatchFillShape {
    let segments: Segment[] = [];
    const polyNodeToSegments = (node: clipperLib.PolyNode): void => {
      if (node.contour.length > 1) {
        for (let j = 1; j < node.contour.length; j++) {
          let cA = node.contour[j - 1];
          let cB = node.contour[j];
          let a = new Point(cA.x / 10000, cA.y / 10000);
          let b = new Point(cB.x / 10000, cB.y / 10000);
          segments.push(new Segment(a, b));
        }
      }
      if (node.childs.length) {
        for (let j = 0; j < node.childs.length; j++) {
          let childNode = node.childs[j];
          polyNodeToSegments(childNode);
        }
      }
    };

    polyTree.childs.forEach((node) => {
      polyNodeToSegments(node);
    });

    return new HatchFillShape(segments);
  }

}