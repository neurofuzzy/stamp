import * as clipperLib from "js-angusj-clipper/web";
import {
  BuntingHatchPattern,
  CrossHatchPattern,
  DashedHatchPattern,
  HatchBooleanType,
  HatchFillShape,
  HatchPatternType,
  IHatchPattern,
  LineHatchPattern,
  OffsetHatchPattern,
  RockHatchPattern,
  SawtoothHatchPattern,
  SinewaveHatchPattern,
  SlateHatchPattern,
} from "../geom/hatch-patterns";
import { IShape, Ray, Segment } from "../geom/core";
import { ClipperHelpers } from "./clipper-helpers";
import { Sequence } from "./sequence";
import { Polygon } from "../geom/shapes";
import { GeomHelpers } from "../geom/helpers";

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
      ? parseInt(arg.replace("#", "0x"), 16)
      : Sequence.resolve(arg)
    : typeof arg === "number"
    ? arg
    : 0;

export class Hatch {
  static applyHatchToShape(shape: IShape, optimize: boolean = true): HatchFillShape | null {
    const npattern = $(shape.style.hatchPattern) || 0;
    const nangle = $(shape.style.hatchAngle) || 0;
    const nscale = $(shape.style.hatchScale) || 1;
    const ninset = $(shape.style.hatchInset) || 0;
    const bc = shape.boundingCircle();
    const args: [Ray, number, number, number] = [
      new Ray(bc.x, bc.y, (nangle * Math.PI) / 180),
      bc.radius * 2,
      bc.radius * 2,
      nscale,
    ];
    let hatchPattern: IHatchPattern;

    switch (npattern) {
      case HatchPatternType.LINE:
        hatchPattern = new LineHatchPattern(...args);
        break;
      case HatchPatternType.CROSS:
        hatchPattern = new CrossHatchPattern(...args);
        break;
      case HatchPatternType.DASHED:
        hatchPattern = new DashedHatchPattern(...args);
        break;
      case HatchPatternType.SAWTOOTH:
        hatchPattern = new SawtoothHatchPattern(...args);
        break;
      case HatchPatternType.SINEWAVE:
        hatchPattern = new SinewaveHatchPattern(...args);
        break;
      case HatchPatternType.BUNTING:
        hatchPattern = new BuntingHatchPattern(...args);
        break;
      case HatchPatternType.SLATE:
        hatchPattern = new SlateHatchPattern(...args);
        break;
      case HatchPatternType.ROCK:
        hatchPattern = new RockHatchPattern(...args);
        break;
      case HatchPatternType.OFFSET:
        return Hatch.offsetHatchFromShape(shape, new OffsetHatchPattern(...args), optimize);
      default:
        return null;
    }
    let shapePaths = ClipperHelpers.shapeToPaths(shape);
    const hatchPaths = ClipperHelpers.hatchAreaToPaths(hatchPattern);

    if (ninset > 0) {
      const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
        delta: 0 - ninset * 100000,
        offsetInputs: [
          {
            data: shapePaths.data,
            joinType: clipperLib.JoinType.Miter,
            endType: clipperLib.EndType.ClosedPolygon,
          },
        ],
      });
      if (offsetResult) {
        shapePaths = {
          data: ClipperHelpers.clipper.polyTreeToPaths(offsetResult),
          closed: true,
        };
      } else {
        console.log("error offseting for hatch", ninset);
      }
    }

    const hatchResult = ClipperHelpers.clipper.clipToPolyTree({
      clipType: clipperLib.ClipType.Intersection,
      subjectInputs: [hatchPaths],
      clipInputs: [shapePaths],
      subjectFillType: clipperLib.PolyFillType.EvenOdd,
    });

    const fillShape = ClipperHelpers.polyTreeToHatchFillShape(hatchResult);
    fillShape.style = shape.style;
    return fillShape;
  }

  static subtractHatchFromShape(shape: IShape): Polygon | null {
    const hatchFillShape = Hatch.applyHatchToShape(shape);
    if (!hatchFillShape) {
      return shape as Polygon;
    }
    const hatchPaths = ClipperHelpers.hatchAreaToPaths(hatchFillShape);
    const strokeWidth = Math.max($(shape.style.hatchStrokeThickness) || 0, 2);
    if (strokeWidth > 0) {
      const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
        delta: strokeWidth * 5000, // 0.5 * 100000
        offsetInputs: [
          {
            data: hatchPaths.data,
            joinType: clipperLib.JoinType.Miter,
            endType: clipperLib.EndType.OpenSquare,
          },
        ],
      });
      if (offsetResult) {
        const hatchResult = ClipperHelpers.clipper.clipToPolyTree({
          clipType: shape.style.hatchBooleanType === HatchBooleanType.DIFFERENCE ? clipperLib.ClipType.Difference : clipperLib.ClipType.Intersection,
          subjectInputs: [ClipperHelpers.shapeToPaths(shape)],
          clipInputs: [{
            data: ClipperHelpers.clipper.polyTreeToPaths(offsetResult),
          }],
          subjectFillType: clipperLib.PolyFillType.EvenOdd,
        });
        const polys = ClipperHelpers.polyTreeToPolygons(hatchResult);
        polys.forEach(p => {
          p.style = Object.assign({}, shape.style);
          p.style.hatchPattern = 0;
        });
        const poly = new Polygon();
        polys.forEach(p => {
          poly.addChild(p);
        })
        poly.style = Object.assign({}, shape.style);
        return poly;
      } else {
        console.log("error offseting for hatch to polygons", strokeWidth);
      }
    }
    return null;
  }

  static offsetHatchFromShape(shape: IShape, hatchPattern: OffsetHatchPattern, optimize: boolean = true): HatchFillShape | null  {
    let ninset = hatchPattern.offsetStep;
    const shapePaths = ClipperHelpers.shapeToPaths(shape);
    const fills: HatchFillShape[] = [];
    let iter = 0;
    do {
      iter++;
      if (iter > 100) {
        break;
      }
      const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
        delta: 0 - ninset * 100000,
        offsetInputs: [
          {
            data: shapePaths.data,
            joinType: clipperLib.JoinType.Miter,
            endType: clipperLib.EndType.ClosedPolygon,
          },
        ],
      });
      if (!offsetResult || (offsetResult.childs.length === 0 && offsetResult.contour.length === 0)) {
        break;
      }
      if (offsetResult) {
        fills.push(ClipperHelpers.polyTreeToHatchFillShape(offsetResult));
      }
      ninset += hatchPattern.offsetStep;
    } while (true);

    if (fills.length === 0) {
      return null;
    }

    if (optimize) {
      for (let i = 0; i < fills.length; i++) {
        const fill = fills[i];
        const fillSegs = fill.generate();
        const newSegs: Segment[] = [];
        fillSegs.map((seg) => {
          const res = GeomHelpers.optimizeSegment(seg, 1);
          newSegs.push(...res);
        });
        fills[i] = new HatchFillShape(newSegs);
      }
    }

    const allSegments = fills
      .map((fill) => fill.generate())
      .reduce((a, b) => a.concat(b), []);
    const fillShape = new HatchFillShape(allSegments);
    fillShape.style = shape.style;
    return fillShape;
  }
}
