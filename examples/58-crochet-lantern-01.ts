import * as C2S from "canvas2svg";
import { drawPath } from "../src/lib/draw";
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
const pageWidth = 4 * 96;
const pageHeight = 11 * 96;
const ratio = 2;
const zoom = 1.5;
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
const sizeX = 3.9 * 96;
const sizeY = 11 * 96;
const bands = 30;
const segs = 31;
const doSmooth = true;
const smoothAmount = 0.6;
const doStairStep = true;

let animate = false;

Sequence.fromStatement("repeat 0 AS XX");
Sequence.fromStatement("repeat 23,-23 AS YY");

const func = (perc: number) => {
  let offsetX = Sequence.resolve("XX()");
  let offsetY = Sequence.resolve("YY()");
  let pt = new Point(0, 0);
  pt.x = perc * sizeX;
  pt.x += (stepNum % 2) * (sizeX / segs) * 0.5;
  pt.x += Math.cos(perc * Math.PI * 2 + 1.7) * sizeX * 0.1;
  pt.y = (stepNum * sizeY) / bands;
  pt.x -= offsetX;
  pt.y -= offsetY;

  pt.x += 0; // tweak
  pt.y -= 6; // tweak
  return pt;
};

//SVG.debugMode = true;

function getPaths() {
  let paths: Path[] = [];
  for (let x = 0; x <= bands; x++) {
    stepNum = x;
    const path = new ParametricPath(func, segs, 0.1);
    paths.push(path);
  }

  if (doStairStep) {
    const stepAmt = sizeX / segs;
    paths.forEach((path) => {
      const pts = path.points;
      const newPts: Point[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const ptA = pts[i];
        const ptB = ptA.clone();
        ptB.x += stepAmt;
        newPts.push(ptA);
        newPts.push(ptB);
      }
      newPts.push(pts[pts.length - 1]);
      path.points = newPts;
    });
  }

  if (doSmooth) {
    paths.forEach((path) => {
      const pts = GeomHelpers.smoothLine(
        path.points,
        3,
        1,
        false,
        smoothAmount * 0.3,
        1 - smoothAmount * 0.3,
      );
      path.points = pts;
    });
  }

  const bounds = new BoundingBox(18, 18, w - 36, h - 36);
  paths = GeomHelpers.cropPathsToBounds(paths, bounds);

  // splice out paths with less than 8 points
  paths = paths.filter((path) => path.points.length > 8);
  return paths;
}

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);
  const paths = getPaths();
  paths.forEach((path) => drawPath(ctx, path));
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
