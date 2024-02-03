import * as clipperLib from "js-angusj-clipper/web";
import {
  Polygon} from "../geom/shapes";
import {
  IShape,
  Point, Ray,
  Path
} from "../geom/core";
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
          x: Math.round(r.x * 100000),
          y: Math.round(r.y * 100000),
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
              Math.round(p.x - 100000) / 100000,
              Math.round(p.y - 100000) / 100000
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
        seg.points.map(
          (p) =>
            ({
              x: Math.round(p.x * 100000),
              y: Math.round(p.y * 100000),
            } as clipperLib.IntPoint)
        )
    );
    return {
      data: paths,
      closed: false,
    };
  }

  static polyTreeToHatchFillShape(polyTree: clipperLib.PolyTree): HatchFillShape {
    let segments: Path[] = [];
    const polyNodeToSegments = (node: clipperLib.PolyNode): void => {
      if (node.contour.length > 1) {
        let segPts = node.contour.map(
          (p) => new Point(p.x / 100000, p.y / 100000)
        )
        if (!node.isOpen) {
          segPts.push(segPts[0]);
        }
        segments.push(new Path(segPts));
      }
      if (node.childs.length) {
        for (let j = 0; j < node.childs.length; j++) {
          let childNode = node.childs[j];
          polyNodeToSegments(childNode);
        }
      }
    };

    polyTree.childs.forEach((node) => {
      polyNodeToSegments(node,);
    });

    return new HatchFillShape(segments);
  }

}