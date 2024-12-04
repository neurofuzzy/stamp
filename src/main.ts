import * as C2S from "canvas2svg";
import { drawShape } from "../src/lib/draw";
import { Heading, Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import { StampsProvider } from "../src/lib/stamps-provider";
import { AbstractShape, Arch, Rectangle } from "./geom/shapes";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 4 * 96;
const pageHeight = 4 * 96;
const ratio = 2;
const zoom = 1;
canvas.width = pageWidth * ratio;
canvas.height = pageHeight * ratio;
canvas.style.width = pageWidth * zoom + "px";
canvas.style.height = pageHeight * zoom + "px";
const ctx = canvas.getContext("2d")!;
ctx.scale(ratio, ratio);
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = "white";

let seed = 27;

Sequence.fromStatement("repeat 2,1 AS BOOL", seed);
Sequence.fromStatement("repeat 2,1 AS BOOL2", seed);
Sequence.fromStatement("repeat 2,1 AS BOOL3", seed);
Sequence.fromStatement("random 40,70,70,100,130 AS BW", seed);
Sequence.fromStatement("repeat 80,130,80,130,80 AS BH", seed);
Sequence.fromStatement("repeat 80,80,80,80,80 AS BH2", seed);
Sequence.fromStatement("repeat 18,24,18,24,18 AS WH", seed);
Sequence.fromStatement("random 1,2,2,3,4 AS NWX", seed);
Sequence.fromStatement("repeat 2,3,2,3,2 AS NWY", seed);
Sequence.fromStatement("repeat 0,0,1 AS DOFF", seed);
Sequence.fromStatement("random 0,15,15,0,45 AS DX", seed);

Sequence.fromStatement("repeat 35,50,40,45 AS TH", 22);
Sequence.fromStatement("random 70,100,100 AS CW", seed);
Sequence.fromStatement("random 2,3,3 AS CNWX", seed);
Sequence.fromStatement("random 0,1,1 AS CARCH", seed);
Sequence.fromStatement("repeat -30,0,30 AS STEEPLEX", seed);
Sequence.fromStatement("repeat 60,50,40 AS STEEPLEH", seed);
Sequence.fromStatement("repeat 15,20,30 AS CH", seed);
Sequence.fromStatement("repeat 0,1 AS T1", seed);
Sequence.fromStatement("repeat 1,0 AS T2", seed);

Sequence.fromStatement("random 80,80,110,140 AS STW", seed);
Sequence.fromStatement("repeat 120,80,120,80 AS STH", seed);
Sequence.fromStatement("random 2,2,3,4 AS STNWX", seed);
Sequence.fromStatement("repeat 2,1,2,1 AS STNWY", seed);

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);
  //AbstractShape.defaultStyle.strokeThickness = 0;
  const rect = new Rectangle(new Ray(w / 2, h / 2, 0), 100, 200);
  const arch = new Arch(new Ray(w / 2, h / 2, 0), 100, 50);

  const stamp = new Stamp(new Ray(w / 2, h / 2, 0), ShapeAlignment.CENTER)
    .rectangle({ width: 100, height: 10 })
    .arch({ width: 100, sweepAngle: 30, divisions: 16, offsetY: 100 });

  // draw as single shape
  drawShape(ctx, rect);
  drawShape(ctx, arch);
  //drawShape(ctx, stamp);

  // draw children
  //city.children().forEach((child) => drawShape(ctx, child));
};

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    // draw the boundary
    //ctx2.backgroundColor = "#000";

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
  draw(ctx);
  console.log(`${new Date().getTime() - now}ms`);
}

main();
