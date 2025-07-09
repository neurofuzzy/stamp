import * as C2S from "canvas2svg";
import { drawShape } from "../src/lib/draw";
import { IShape, ParametricPath, Path, Point, Ray } from "../src/geom/core";
import { GeomHelpers } from "../src/geom/helpers";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import "../src/style.css";
import { AbstractShape, Circle, Polygon } from "../src/geom/shapes";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 4 * 96;
const pageHeight = 8 * 96;
const ratio = 2;
const zoom = 2;
canvas.width = pageWidth * ratio;
canvas.height = pageHeight * ratio;
canvas.style.width = pageWidth * zoom + "px";
canvas.style.height = pageHeight * zoom + "px";
const ctx = canvas.getContext("2d")!;
ctx.scale(ratio, ratio);
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = "black";

let stepNum = 0;
let iter = 919918726;
const step = 4;
const bands = 11;
const blendSteps = 6;
const segs = 32;
const minBand = 2;
const inset = 7;
const maxScore = 60;
const paths: Path[] = [];
const shapes: IShape[] = [];
let animate = false;

AbstractShape.defaultStyle.strokeThickness = 0;
AbstractShape.defaultStyle.fillColor = "#006699";

const func = (perc: number) => {
  let pt = new Point(0, 0);
  pt.y =
    Math.sin(1.5 + perc * Math.PI * 8 + stepNum * 0.125) * 8 +
    Math.cos(perc * Math.PI * 10 + stepNum * 14.7) * 7;
  pt.x = perc * 650;
  return pt;
};

//SVG.debugMode = true;

function createGeometry() {
  Sequence.fromStatement("random 0-0 AS XX", 288);

  let tracks: Path[] = [];
  let step = 4;
  let r = step * 10;

  let bones = [];

  for (let x = 0; x < bands; x++) {
    const path = new ParametricPath(func, segs);
    stepNum = x;
    let pts: Point[] = path.toPoints();
    pts.forEach((pt) => {
      let offsetPt = new Point(Sequence.resolve("XX()") * 1, 0);
      //let ang = GeomUtil.angleBetween(cen, pt);
      //GeomUtil.rotatePoint(offsetPt, 0 - ang);
      pt.x += offsetPt.x * 0.5;
      pt.y += offsetPt.y + x * 40;
      let tmp = pt.x;
      pt.x = pt.y;
      pt.y = tmp;
    });
    let path2 = new Path(pts);
    bones.push(path2);
    r += step * 4;
  }

  for (let x = 1; x < bands; x++) {
    let pA = bones[x - 1];
    let pB = bones[x];
    if (x >= minBand) {
      tracks.push(pA);
    }
    for (let d = 1; d < blendSteps; d++) {
      const pts: Point[] = [];
      pA.points.forEach((ptA, idx) => {
        let ptB = pB.points[idx];
        const pt = GeomHelpers.lerpPoints(ptA, ptB, d / blendSteps);
        pts.push(pt);
      });
    }
  }

  tracks.forEach((path) => {
    const pts = GeomHelpers.smoothLine(path.points, 6, 0.25, false);
    path.points = pts;
  });

  for (let x = 1; x < tracks.length; x++) {
    let trackA = tracks[x - 1].clone();
    let trackB = tracks[x].clone();
    const paPoints = trackA.toPoints();
    const pbPoints = trackB.toPoints();

    paths.push(trackA);

    if (x == tracks.length - 1) {
      break;
    }

    let parentPoly: Polygon;

    if (x % 2 === 1) {
      const outline = trackA
        .toPoints()
        .concat(trackB.toPoints().reverse())
        .map((pt) => pt.toRay());

      parentPoly = new Polygon(new Ray(0, 0), outline);
      shapes.push(parentPoly);
    }

    let score = 0;
    let segIdx = 0;
    let ptB;
    let step = 25;

    paPoints.forEach((ptA, idx) => {
      if (idx == 0 || idx >= paPoints.length - 8) {
        return;
      }
      ptB = pbPoints[idx];
      if (!ptB) {
        return;
      }

      let segScore = 1 / (GeomHelpers.distanceBetweenPoints(ptA, ptB) / step);
      score += segScore;

      if (score > maxScore) {
        const midPt = GeomHelpers.lerpPoints(ptA, ptB, 0.5);
        const center = new Ray(midPt.x, midPt.y, 0);
        const radius = GeomHelpers.distanceBetweenPoints(ptA, ptB) / 2 - inset;
        const shape = new Circle(center, radius);
        if (parentPoly) {
          parentPoly.addChild(shape);
        } else {
          shapes.push(shape);
        }
        const segs = shape.toSegments();
        const pts = segs.map((seg) => seg.a);
        pts.push(segs[1].a.clone());
        const p = new Path(pts);
        paths.push(p);
        score = 0;
        segIdx++;
      }
    });
  }

  const acc: Point[] = [];
  const tracksPts = tracks.reduce(
    (acc, path) => acc.concat(path.toPoints()),
    acc,
  );
  let bb = GeomHelpers.pointsBoundingBox(tracksPts);
  bb.x += 23;
  bb.y += 100;
  bb.width = 3.6 * 96 * 0.5;
  bb.height = 10.6 * 96 * 0.5;
}

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);
  createGeometry();
  shapes.forEach((shape) => drawShape(ctx, shape));
  //paths.forEach((path) => drawPath(ctx, path));
};

document.onkeydown = function (e) {
  if (e.keyCode === 13) {
    Sequence.resetAll();
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

async function main() {
  await ClipperHelpers.init();
  const now = new Date().getTime();
  const drawFrame = () => {
    draw(ctx);
    iter += step;
    if (animate) {
      requestAnimationFrame(drawFrame);
    }
  };
  requestAnimationFrame(drawFrame);
  console.log(`${new Date().getTime() - now}ms`);
}

main();
