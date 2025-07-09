import * as C2S from "canvas2svg";
import { drawPath } from "../src/lib/draw";
import { ParametricPath, Path, Point } from "../src/geom/core";
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
const size = 60;
const freq = 6;
const amp = 2;
const bands = 24;
const blendSteps = 2;
const segs = 250;
const scale = 0.5;
const minBand = 2;
const logPadding = 0.7;
const doSpiral = true;
const doSmooth = true;
const truncate = 0;

let animate = false;

Sequence.fromStatement("yoyo 1,2,4,8,64 AS XX", 288);

const func = (perc: number) => {
  const s = doSpiral ? stepNum + perc : stepNum;
  const a = amp * Math.log2(s / bands + 1);
  const twist = s / 20;
  let pt = new Point(0, 0);
  pt.x = 0;
  pt.y = Math.log2(s + logPadding) * size;
  pt.y += Sequence.resolve("XX()") * (stepNum / 10);
  //pt.x -= Sequence.resolve("XX") * (stepNum / 10);
  // pt.x += Math.sin(perc * Math.PI * 3 * freq) * s * a;
  // pt.y += Math.cos(perc * Math.PI * 3 * freq) * s * a;

  GeomHelpers.rotatePoint(pt, perc * Math.PI * 2 + twist);
  return pt;
};

//SVG.debugMode = true;

function getPaths() {
  Sequence.fromStatement("random 0-10 AS XX", 288);

  let paths: Path[] = [];
  let step = 4;
  let r = step * 10;

  let bones = [];

  for (let x = 0; x < bands; x++) {
    const path = new ParametricPath(func, segs);
    stepNum = x;
    let pts: Point[] = path.toPoints();
    pts.forEach((pt) => {
      pt.x += w / 2;
      pt.y += h / 2;
    });
    let path2 = new Path(pts);
    bones.push(path2);
    r += step * 4;
  }

  for (let x = 1; x < bands; x++) {
    let pA = bones[x - 1];
    let pB = bones[x];
    for (let d = 1; d < blendSteps; d++) {
      const pts: Point[] = [];
      pA.points.forEach((ptA, idx) => {
        let ptB = pB.points[idx];
        const pt = GeomHelpers.lerpPoints(ptA, ptB, d / blendSteps);
        pt.x -= w / 2;
        pt.y -= h / 2;
        pt.x *= scale;
        pt.y *= scale;
        pt.x += w / 2;
        pt.y += h / 2;
        pts.push(pt);
      });
      const path = new Path(pts);
      if (x >= minBand) {
        paths.push(path);
      }
    }
  }

  if (doSpiral) {
    // join all paths points into one
    let pts: Point[] = [];
    paths.forEach((path) => {
      pts = pts.concat(path.points);
    });
    for (let i = 0; i < truncate; i++) {
      pts.pop();
    }
    if (doSmooth) {
      pts = GeomHelpers.smoothLine(pts, 4, 1, false);
    }
    const path = new Path(pts);
    paths = [path];
  }

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
