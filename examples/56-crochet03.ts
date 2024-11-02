import * as C2S from "canvas2svg";
import { drawHatchPattern, drawPath, drawShape } from "../src/lib/draw";
import { BoundingBox, ParametricPath, Path, Point } from "../src/geom/core";
import { GeomHelpers } from "../src/geom/helpers";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import "../src/style.css";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 4.5 * 96;
const pageHeight = 6.5 * 96;
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
const step = 0.1;
const size = 190;
const bands = 10;
const segs = 40;
const scale = 1;
const minBand = 3;
const doSpiral = false;
const doSmooth = true;
const doStairStep = true;
const truncateStart = 1;
const truncateEnd = 3;

let animate = false;

Sequence.fromStatement("repeat 0,0 AS XX", 288);
Sequence.fromStatement("repeat 32,0 AS YY", 288);

const func = (perc: number) => {
  const s = doSpiral ? stepNum + perc : stepNum;
  const twist = 0; //s / 48;
  const ang = perc * Math.PI * 2 + twist;
  let offsetX = Sequence.resolve("XX()");
  let offsetY = Sequence.resolve("YY()");
  let pt = new Point(0, 0);
  pt.x = 0;
  pt.y = (s * size) / bands; //Math.log2(s + logPadding) * size;
  pt.x += offsetX;
  pt.y += offsetY;
  GeomHelpers.rotatePoint(pt, ang);
  return pt;
};

//SVG.debugMode = true;

function getPaths() {
  let paths: Path[] = [];
  let step = 4;
  let r = step * 10;

  for (let x = 0; x < bands; x++) {
    const path = new ParametricPath(func, segs, 0.1);
    stepNum = x;
    let pts: Point[] = path.toPoints();
    pts.forEach((pt) => {
      pt.x *= scale;
      pt.y *= scale;
      pt.x += w / 2;
      pt.y += h / 2;
    });
    let path2 = new Path(pts);
    if (x >= minBand) {
      paths.push(path2);
    }
    r += step * 4;
  }

  if (doSpiral) {
    // join all paths points into one
    let pts: Point[] = [];
    paths.forEach((path) => {
      pts = pts.concat(path.points);
    });
    let j = pts.length - 1;
    while (j--) {
      if (GeomHelpers.pointsAreEqual(pts[j], pts[j + 1], 1)) {
        pts.splice(j + 1, 1);
      }
    }
    for (let i = 0; i < truncateStart; i++) {
      pts.shift();
    }
    for (let i = 0; i < truncateEnd; i++) {
      pts.pop();
    }
    paths = [new Path(pts)];
  }

  if (doStairStep) {
    const angleStep = (1 / segs) * (Math.PI * 2);
    paths.forEach((path) => {
      const pts = path.points.concat();
      const newPts: Point[] = [];
      for (let i = 0; i < pts.length; i++) {
        const ptA = pts[i];
        const ptB = ptA.clone();
        ptB.x -= w / 2;
        ptB.y -= h / 2;
        GeomHelpers.rotatePoint(ptB, angleStep);
        ptB.x += w / 2;
        ptB.y += h / 2;
        newPts.push(ptA);
        newPts.push(ptB);
      }
      path.points = newPts;
    });
  }

  if (doSmooth) {
    paths.forEach((path) => {
      const pts = GeomHelpers.smoothLine(path.points, 4, 1, false);
      if (!doSpiral) {
        pts.pop();
        const lastPt = pts[pts.length - 1];
        let iter = 0;
        while (!GeomHelpers.pointsAreEqual(lastPt, pts[0], 3)) {
          pts.shift();
          iter++;
          if (iter > 100) {
            break;
          }
        }
      }
      path.points = pts;
    });
  }

  const bounds = new BoundingBox(25, 25, w - 50, h - 50);
  paths = GeomHelpers.cropPathsToBounds(paths, bounds);
  return paths;
}

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);
  const paths = getPaths();
  paths.forEach((path) => drawPath(ctx, path));
};

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    // draw the boundary
    ctx2.backgroundColor = "#000";

    // draw the shapes
    draw(ctx2);
    // download the SVG
    const svg = ctx2.getSerializedSvg(true).split("#FFFFFF").join("#000000");
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

async function main() {
  await ClipperHelpers.init();
  const now = new Date().getTime();
  const drawFrame = (t) => {
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
