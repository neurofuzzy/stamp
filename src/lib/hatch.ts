import * as clipperLib from "js-angusj-clipper/web";
import {
  AltWeaveHatchPattern,
  BraidHatchPattern,
  BrickHatchPattern,
  WaveHatchPattern,
  ChevronHatchPattern,
  CircleHatchPattern,
  CloverHatchPattern,
  CrossHatchPattern,
  DashedHatchPattern,
  HatchBooleanType,
  HatchFillShape,
  HatchPatternType,
  HerringboneHatchPattern,
  HexHatchPattern,
  HexagonHatchPattern,
  IHatchPattern,
  LatticeHatchPattern,
  LineHatchPattern,
  MoleculeHatchPattern,
  OffsetHatchPattern,
  OrigamiHatchPattern,
  PinwheelHatchPattern,
  QbertHatchPattern,
  RailHatchPattern,
  RockHatchPattern,
  SawtoothHatchPattern,
  SinewaveHatchPattern,
  SlateHatchPattern,
  SpiralHatchPattern,
  TerraceHatchPattern,
  TriWeaveHatchPattern,
  TriangularGridHatchPattern,
  CurlyHatchPattern,
  ScribbleHatchPattern,
  LoopHatchPattern,
  GlobeHatchPattern,
  FlowerHatchPattern,
  PhylloHatchPattern,
  OrthoHatchPattern,
  SmoothOrthoHatchPattern,
  GreekHatchPattern,
} from "../geom/hatch-patterns";
import { IShape, Ray, Path } from "../geom/core";
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
    const noverflow = $(shape.style.hatchOverflow) || 0;
    const noffsetX = $(shape.style.hatchOffsetX) || 0;
    const noffsetY = $(shape.style.hatchOffsetY) || 0;
    const nspherify = shape.style.hatchSpherify || false;
    const ninset = $(shape.style.hatchInset) || 0;
    const bc = shape.boundingCircle();
    const args: [Ray, number, number, number, number, number, number, boolean] = [
      new Ray(bc.x, bc.y, (nangle * Math.PI) / 180),
      bc.radius * 2,
      bc.radius * 2,
      nscale,
      noverflow,
      noffsetX,
      noffsetY,
      nspherify,
    ];
    let hatchPattern: IHatchPattern;

    switch (npattern) {
      case HatchPatternType.LINE:
        hatchPattern = new LineHatchPattern(...args);
        break;
      case HatchPatternType.CIRCLE:
        hatchPattern = new CircleHatchPattern(...args);
        break;
      case HatchPatternType.CROSS:
        hatchPattern = new CrossHatchPattern(...args);
        break;
      case HatchPatternType.BRICK:
        hatchPattern = new BrickHatchPattern(...args);
        break;
      case HatchPatternType.HERRINGBONE:
        hatchPattern = new HerringboneHatchPattern(...args);
        break;
      case HatchPatternType.BRICK:
        hatchPattern = new BrickHatchPattern(...args);
        break;
      case HatchPatternType.DASHED:
        hatchPattern = new DashedHatchPattern(...args);
        break;
      case HatchPatternType.TRIANGLE:
        hatchPattern = new TriangularGridHatchPattern(...args);
        break;
      case HatchPatternType.QBERT:
        hatchPattern = new QbertHatchPattern(...args);
        break;
      case HatchPatternType.SAWTOOTH:
        hatchPattern = new SawtoothHatchPattern(...args);
        break;
      case HatchPatternType.SINEWAVE:
        hatchPattern = new SinewaveHatchPattern(...args);
        break;
      case HatchPatternType.WAVE:
        hatchPattern = new WaveHatchPattern(...args);
        break;
      case HatchPatternType.SLATE:
        hatchPattern = new SlateHatchPattern(...args);
        break;
      case HatchPatternType.ROCK:
        hatchPattern = new RockHatchPattern(...args);
        break;
      case HatchPatternType.TRIWEAVE:
        hatchPattern = new TriWeaveHatchPattern(...args);
        break;
      case HatchPatternType.CHEVRON:
        hatchPattern = new ChevronHatchPattern(...args);
        break;
      case HatchPatternType.ALTWEAVE:
        hatchPattern = new AltWeaveHatchPattern(...args);
        break;
      case HatchPatternType.PINWHEEL:
        hatchPattern = new PinwheelHatchPattern(...args);
        break;
      case HatchPatternType.HEX:
        hatchPattern = new HexHatchPattern(...args);
        break;
      case HatchPatternType.ORIGAMI:
        hatchPattern = new OrigamiHatchPattern(...args);
        break;
      case HatchPatternType.LATTICE:
        hatchPattern = new LatticeHatchPattern(...args);
        break;
      case HatchPatternType.TERRACE:
        hatchPattern = new TerraceHatchPattern(...args);
        break;
      case HatchPatternType.HEXAGON:
        hatchPattern = new HexagonHatchPattern(...args);
        break;
      case HatchPatternType.MOLECULE:
        hatchPattern = new MoleculeHatchPattern(...args);
        break;
      case HatchPatternType.BRAID:
        hatchPattern = new BraidHatchPattern(...args);
        break;
      case HatchPatternType.RAIL:
        hatchPattern = new RailHatchPattern(...args);
        break;
      case HatchPatternType.SPIRAL:
        hatchPattern = new SpiralHatchPattern(...args);
        break;
      case HatchPatternType.CLOVER:
        hatchPattern = new CloverHatchPattern(...args);
        break;
      case HatchPatternType.CURLY:
        hatchPattern = new CurlyHatchPattern(...args);
        break;
      case HatchPatternType.SCRIBBLE:
        hatchPattern = new ScribbleHatchPattern(...args);
        break;
      case HatchPatternType.LOOP:
        hatchPattern = new LoopHatchPattern(...args);
        break;
      case HatchPatternType.PHYLLO:
        hatchPattern = new PhylloHatchPattern(...args);
        break;
      case HatchPatternType.FLOWER:
        hatchPattern = new FlowerHatchPattern(...args);
        break;
      case HatchPatternType.GLOBE:
        hatchPattern = new GlobeHatchPattern(...args);
        break;
      case HatchPatternType.ORTHO:
        hatchPattern = new OrthoHatchPattern(...args);
        break;
      case HatchPatternType.SMOOTHORTHO:
        hatchPattern = new SmoothOrthoHatchPattern(...args);
        break;
      case HatchPatternType.GREEK:
        hatchPattern = new GreekHatchPattern(...args);
        break;
      case HatchPatternType.OFFSET:
        return Hatch.offsetHatchFromShape(shape, new OffsetHatchPattern(...args), optimize);
      default:
        return null;
    }
    let shapePaths = ClipperHelpers.shapeToClipperPaths(shape);
    const hatchPaths = ClipperHelpers.hatchAreaToClipperPaths(hatchPattern);

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
    const hatchPaths = ClipperHelpers.hatchAreaToClipperPaths(hatchFillShape);
    const strokeWidth = Math.max($(shape.style.hatchStrokeThickness) || 0, 2);
    if (strokeWidth > 0) {
      const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
        delta: strokeWidth * 50000, // 0.5 * 100000
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
          subjectInputs: [ClipperHelpers.shapeToClipperPaths(shape)],
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
    const shapePaths = ClipperHelpers.shapeToClipperPaths(shape);
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
        const newSegs: Path[] = [];
        fillSegs.map((seg) => {
          const res = GeomHelpers.optimizePath(seg, 1);
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
