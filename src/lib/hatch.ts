import * as clipperLib from "js-angusj-clipper/web";
import { BuntingHatchPattern, CrossHatchPattern, DashedHatchPattern, HatchFillShape, HatchPatternType, IHatchPattern, LineHatchPattern, RockHatchPattern, SawtoothHatchPattern, SinewaveHatchPattern, SlateHatchPattern } from "../geom/hatch-patterns";
import { IShape, Ray } from "../geom/core";
import { ClipperHelpers } from "./clipper-helpers";
import { Sequence } from "./sequence";

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0 ? parseInt(arg.replace("#", "0x"), 16) : Sequence.resolve(arg)
    : typeof arg === "number"
    ? arg
    : 0;

export class Hatch {
  static applyHatchToShape(
    shape: IShape,
    pattern: number | string = 1,
    angle: number | string = 0,
    scale: number | string = 1,
    inset: number | string = 0
  ): HatchFillShape {
    const npattern = $(pattern);
    const nangle = $(angle);
    const nscale = $(scale);
    const ninset = $(inset);
    const bc = shape.boundingCircle();
    const args:[Ray, number, number, number] = [new Ray(bc.x, bc.y, nangle * Math.PI / 180),
      bc.radius * 2,
      bc.radius * 2,
      nscale];
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
        shapePaths = { data: ClipperHelpers.clipper.polyTreeToPaths(offsetResult), closed: true };
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
    return fillShape;
  }
}
