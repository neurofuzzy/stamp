import * as clipperLib from "js-angusj-clipper/web";
import {
  BuntingHatchPattern,
  CrossHatchPattern,
  DashedHatchPattern,
  HatchFillShape,
  HatchPatternType,
  IHatchPattern,
  LineHatchPattern,
  RockHatchPattern,
  SawtoothHatchPattern,
  SinewaveHatchPattern,
  SlateHatchPattern,
} from "../geom/hatch-patterns";
import { IShape, Ray } from "../geom/core";
import { ClipperHelpers } from "./clipper-helpers";
import { Sequence } from "./sequence";
import { Polygon } from "../geom/shapes";

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
      ? parseInt(arg.replace("#", "0x"), 16)
      : Sequence.resolve(arg)
    : typeof arg === "number"
    ? arg
    : 0;

export class Hatch {
  static applyHatchToShape(shape: IShape, forcedOffset: number = 0): HatchFillShape {
    const npattern = $(shape.style.hatchPattern) || 0;
    const nangle = $(shape.style.hatchAngle) || 0;
    const nscale = $(shape.style.hatchScale) || 1;
    const ninset = forcedOffset !== 0 ? 0 - forcedOffset : $(shape.style.hatchInset) || 0;
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
      default:
        hatchPattern = new LineHatchPattern(...args);
        break;
    }
    let shapePaths = ClipperHelpers.shapeToPaths(shape);
    const hatchPaths = ClipperHelpers.hatchAreaToPaths(hatchPattern);

    if (ninset > 0) {
      const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
        delta: 0 - ninset * 10000,
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

  static subtractHatchFromShape(shape: IShape): Polygon[] {
    const hatchFillShape = Hatch.applyHatchToShape(shape, 10);
    const hatchPaths = ClipperHelpers.hatchAreaToPaths(hatchFillShape);
    const strokeWidth = Math.max($(shape.style.hatchStrokeThickness) || 0, 2);
    if (strokeWidth > 0) {
      const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
        delta: strokeWidth * 5000, // 0.5 * 10000
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
          clipType: clipperLib.ClipType.Difference,
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
        return polys;
      } else {
        console.log("error offseting for hatch to polygons", strokeWidth);
      }
    }
    return [];
  }

}
