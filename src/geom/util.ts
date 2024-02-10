import { IShape } from "../geom/core";
import { GeomHelpers } from "./helpers";

export class GeomUtils {
  static measureShapePerimeter(shape:IShape):number {
    let perimeter = 0;
    const paths = shape.generate();
    for (let i = 0; i < paths.length - 1; i++) {
      perimeter += GeomHelpers.distanceBetweenPoints(paths[i], paths[i + 1]);
    }
    for (let i = 0; i < shape.children().length; i++) {
      perimeter += GeomUtils.measureShapePerimeter(shape.children()[i]);
    }
    return perimeter;
  }
}