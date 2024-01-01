import { HatchFillShape, LineHatchPattern } from "../geom/hatch-patterns";
import { IShape, Ray } from "../geom/shapes";
import { ClipperHelpers } from "./clipper-helpers";
import * as clipperLib from "js-angusj-clipper/web";

export class Hatch {

  applyHatchToShape(shape: IShape, pattern: number = 1): HatchFillShape {
    const bc = shape.boundingCircle();
    const hatchPattern = new LineHatchPattern(new Ray(bc.x, bc.y), bc.radius, bc.radius);
    const shapePaths = ClipperHelpers.shapeToPaths(shape);
    const hatchPaths = ClipperHelpers.hatchAreaToPaths(hatchPattern);
    
    const polyResult = ClipperHelpers.clipper.clipToPolyTree({
      clipType: clipperLib.ClipType.Intersection,
      subjectInputs: [hatchPaths],
      clipInputs: [shapePaths],
      subjectFillType: clipperLib.PolyFillType.EvenOdd,
    });

    return ClipperHelpers.polyTreeToHatchFillShape(polyResult);
  }

}
