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
const step = 4;
const bands = 32;
const blendSteps = 6;
const segs = 32;
const minBand = 2;
let animate = false;

const func = (perc: number) => {
  let pt = new Point(0, 0);
  pt.y =
    Math.sin(1.5 + perc * Math.PI * 8 + stepNum * 0.25) * 5 +
    Math.cos(0 - perc * Math.PI * 20 + stepNum * 10) * 6;
  pt.x = perc * 750;
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
      let offsetPt = new Point(Sequence.resolve("XX()") * 1, 0);
      //let ang = GeomUtil.angleBetween(cen, pt);
      //GeomUtil.rotatePoint(offsetPt, 0 - ang);
      pt.x += offsetPt.x * 0.5;
      pt.y += offsetPt.y + x * 10;
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
      paths.push(pA);
    }
    for (let d = 1; d < blendSteps; d++) {
      const pts: Point[] = [];
      pA.points.forEach((ptA, idx) => {
        let ptB = pB.points[idx];
        const pt = GeomHelpers.lerpPoints(ptA, ptB, d / blendSteps);
        pts.push(pt);
      });
      const path = new Path(pts);
      if (x >= minBand) {
        paths.push(path);
      }
    }
  }

  for (let i = 0; i < paths.length; i++) {
    let path = paths[i];
    if (i % 2 === 0) {
      path.points.reverse();
    }
  }

  paths.forEach((path) => {
    const pts = GeomHelpers.smoothLine(path.points, 4, 0.25, false, 0.3, 0.7);
    path.points = pts;
  });

  const acc: Point[] = [];
  const pathsPts = paths.reduce(
    (acc, path) => acc.concat(path.toPoints()),
    acc,
  );
  let bb = GeomHelpers.pointsBoundingBox(pathsPts);
  bb.x += 20;
  bb.width -= 40;
  bb.y += 190;
  bb.height -= 380;

  return GeomHelpers.cropPathsToBounds(paths, bb);
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
