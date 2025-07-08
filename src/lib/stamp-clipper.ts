import * as clipperLib from "js-angusj-clipper/web";
import { IShape, IStyle } from "../geom/core";
import { AbstractShape, Polygon } from "../geom/shapes";
import { BoundingBox } from "../geom/core";
import { ClipperHelpers } from "./clipper-helpers";
import { resolveStyle } from "./stamp-helpers";
import * as StampConstants from "./stamp-constants";

type UnclippedShapeEntry = {
    mode: number;
    shape: IShape;
    outln: number;
    scale: number;
};

type StyleMapEntry = {
    bounds: BoundingBox;
    style: IStyle;
}

export function clipUnclippedShapes(
    unclippedShapes: UnclippedShapeEntry[],
    initialTree: clipperLib.PolyTree | null
): { tree: clipperLib.PolyTree | null; polys: Polygon[]; styleMap: StyleMapEntry[] } {
    let tree = initialTree;
    const polys: Polygon[] = [];
    const styleMap: StyleMapEntry[] = [];

    for (let i = 0; i < unclippedShapes.length; i++) {
        let g = unclippedShapes[i].shape;
        let outln = unclippedShapes[i].outln;
        let mode = unclippedShapes[i].mode;
        let scale = unclippedShapes[i].scale;

        if (g.style && g.style !== AbstractShape.defaultStyle) {
            const style = resolveStyle(g.style);
            if (mode !== StampConstants.SUBTRACT && !g.hidden) {
                styleMap.push({
                    bounds: g.boundingBox(),
                    style,
                });
            }
        }

        let gbb = g.boundingBox();
        if (gbb.width === 0 || gbb.height === 0) {
            continue;
        }

        let b: clipperLib.SubjectInput;
        let b2 = null;

        switch (mode) {
            case StampConstants.NONE:
                polys.push(new Polygon(g.center, g.generate()));
                break;
            case StampConstants.UNION:
                if (tree) {
                    b2 = ClipperHelpers.shapeToClipperPaths(g, scale);
                    if (g.hidden) {
                        continue;
                    }
                    if (outln > 0) {
                        const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                            delta: outln * StampConstants.CLIPPER_SCALE_FACTOR,
                            offsetInputs: [
                                {
                                    data: b2.data,
                                    joinType: clipperLib.JoinType.Miter,
                                    endType: clipperLib.EndType.ClosedPolygon,
                                },
                            ],
                        });
                        if (offsetResult) {
                            let paths = ClipperHelpers.clipper.polyTreeToPaths(tree);
                            let offsetPaths =
                                ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                            const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                                clipType: clipperLib.ClipType.Difference,
                                subjectInputs: [{ data: paths, closed: true }],
                                clipInputs: [{ data: offsetPaths }],
                                subjectFillType: clipperLib.PolyFillType.EvenOdd,
                            });
                            tree = polyResult;
                        } else {
                            console.log("error offseting", outln);
                        }
                    } else if (outln < 0) {
                        const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                            delta: -outln * StampConstants.CLIPPER_SCALE_FACTOR,
                            offsetInputs: [
                                {
                                    data: b2.data,
                                    joinType: clipperLib.JoinType.Round,
                                    endType: clipperLib.EndType.ClosedPolygon,
                                },
                            ],
                            arcTolerance: StampConstants.ARC_TOLERANCE,
                        });
                        if (offsetResult) {
                            let paths = ClipperHelpers.clipper.polyTreeToPaths(tree);
                            let offsetPaths =
                                ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                            const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                                clipType: clipperLib.ClipType.Union,
                                subjectInputs: [{ data: paths, closed: true }],
                                clipInputs: [{ data: offsetPaths }],
                                subjectFillType: clipperLib.PolyFillType.EvenOdd,
                            });
                            tree = polyResult;
                        } else {
                            console.log("error offseting", outln);
                        }
                    }
                    let paths = ClipperHelpers.clipper.polyTreeToPaths(tree);
                    const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                        clipType: clipperLib.ClipType.Union,
                        subjectInputs: [{ data: paths, closed: true }],
                        clipInputs: [b2],
                        subjectFillType: clipperLib.PolyFillType.EvenOdd,
                    });
                    tree = polyResult;
                } else {
                    b = ClipperHelpers.shapeToClipperPaths(g, scale);
                    if (g.hidden) {
                        continue;
                    }
                    let polyResult: clipperLib.PolyTree;

                    try {
                        polyResult = ClipperHelpers.clipper.clipToPolyTree({
                            clipType: clipperLib.ClipType.Union,
                            subjectInputs: [b],
                            subjectFillType: clipperLib.PolyFillType.EvenOdd,
                        });
                        if (polyResult) {
                            tree = polyResult;
                            if (outln < 0) {
                                const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                                    delta: -outln * StampConstants.CLIPPER_SCALE_FACTOR,
                                    offsetInputs: [
                                        {
                                            data: b.data,
                                            joinType: clipperLib.JoinType.Round,
                                            endType: clipperLib.EndType.ClosedPolygon,
                                        },
                                    ],
                                    arcTolerance: StampConstants.ARC_TOLERANCE,
                                });
                                if (offsetResult) {
                                    let paths = ClipperHelpers.clipper.polyTreeToPaths(
                                        tree,
                                    );
                                    let offsetPaths =
                                        ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                                    const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                                        clipType: clipperLib.ClipType.Union,
                                        subjectInputs: [{ data: paths, closed: true }],
                                        clipInputs: [{ data: offsetPaths }],
                                        subjectFillType: clipperLib.PolyFillType.EvenOdd,
                                    });
                                    tree = polyResult;
                                } else {
                                    console.log("error offseting", outln);
                                }
                            }
                        }
                    } catch (e) {
                        console.log("error unioning", e);
                    }
                }
                break;
            case StampConstants.SUBTRACT:
                if (tree) {
                    b2 = ClipperHelpers.shapeToClipperPaths(g, scale);
                    if (g.hidden) {
                        continue;
                    }
                    if (outln > 0) {
                        const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                            delta: outln * StampConstants.CLIPPER_SCALE_FACTOR,
                            offsetInputs: [
                                {
                                    data: b2.data,
                                    joinType: clipperLib.JoinType.Miter,
                                    endType: clipperLib.EndType.ClosedPolygon,
                                },
                            ],
                        });
                        if (offsetResult) {
                            let paths = ClipperHelpers.clipper.polyTreeToPaths(tree);
                            let offsetPaths =
                                ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                            const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                                clipType: clipperLib.ClipType.Union,
                                subjectInputs: [{ data: paths, closed: true }],
                                clipInputs: [{ data: offsetPaths }],
                                subjectFillType: clipperLib.PolyFillType.EvenOdd,
                            });
                            tree = polyResult;
                        } else {
                            console.log("error offseting", outln);
                        }
                    } else if (outln < 0) {
                        const offsetResult = ClipperHelpers.clipper.offsetToPolyTree({
                            delta: -outln * StampConstants.CLIPPER_SCALE_FACTOR,
                            offsetInputs: [
                                {
                                    data: b2.data,
                                    joinType: clipperLib.JoinType.Round,
                                    endType: clipperLib.EndType.ClosedPolygon,
                                },
                            ],
                            arcTolerance: StampConstants.ARC_TOLERANCE,
                        });
                        if (offsetResult) {
                            let paths = ClipperHelpers.clipper.polyTreeToPaths(tree);
                            let offsetPaths =
                                ClipperHelpers.clipper.polyTreeToPaths(offsetResult);
                            const polyResult = ClipperHelpers.clipper.clipToPolyTree({
                                clipType: clipperLib.ClipType.Difference,
                                subjectInputs: [{ data: paths, closed: true }],
                                clipInputs: [{ data: offsetPaths }],
                                subjectFillType: clipperLib.PolyFillType.EvenOdd,
                            });
                            tree = polyResult;
                        } else {
                            console.log("error offseting", outln);
                        }
                    }

                    let paths = ClipperHelpers.clipper.polyTreeToPaths(tree);
                    let polyResult: clipperLib.PolyTree;
                    try {
                        polyResult = ClipperHelpers.clipper.clipToPolyTree({
                            clipType: clipperLib.ClipType.Difference,
                            subjectInputs: [{ data: paths, closed: true }],
                            clipInputs: [b2],
                            subjectFillType: clipperLib.PolyFillType.EvenOdd,
                        });
                        if (polyResult) {
                            tree = polyResult;
                        }
                    } catch (e) {
                        console.log("error subtracting", e);
                    }
                }
                break;
            case StampConstants.INTERSECT:
                if (tree) {
                    b2 = ClipperHelpers.shapeToClipperPaths(g, scale);
                    if (g.hidden) {
                        continue;
                    }
                    let paths = ClipperHelpers.clipper.polyTreeToPaths(tree);

                    let polyResult: clipperLib.PolyTree;

                    try {
                        polyResult = ClipperHelpers.clipper.clipToPolyTree({
                            clipType: clipperLib.ClipType.Intersection,
                            subjectInputs: [{ data: paths, closed: true }],
                            clipInputs: [b2],
                            subjectFillType: clipperLib.PolyFillType.EvenOdd,
});
                        if (polyResult) {
                            tree = polyResult;
                        }
                    } catch (e) {
                        console.log("error intersecting", e);
                    }
                }
                break;
        }
    }
    return { tree, polys, styleMap };
} 