import * as C2S from "canvas2svg";
import { drawHatchPattern, drawShape } from "../src/lib/draw";
import { IStyle, Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Hatch } from "../src/lib/hatch";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { HatchBooleanType } from "../src/geom/hatch-patterns";
import { GridStampLayout } from "../src/lib/layout-stamp";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 3.5 * 96;
const pageHeight = 11 * 96;
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

Sequence.seed = 8;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[79];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 137.508 AS RANGLE", 0, 5);
Sequence.fromStatement("repeat 1 LOG2 AS RSCALE", 0);
Sequence.fromStatement("repeat 0.5 LOG2 AS ROFFSET", 1);
Sequence.fromStatement("repeat 1.02 ADD AS RLA");
//Sequence.fromStatement("repeat 1-35 AS HATCH");
Sequence.fromStatement("repeat 13 AS HATCH");
Sequence.fromStatement("random -15,0,15 AS HANG");
Sequence.fromStatement("random 0.4,0.6,0.8 AS HS1");
Sequence.fromStatement("random 0.4,0.6,0.8,1 AS HS2");
Sequence.fromStatement("random 0.6,0.8,1,1.2 AS HS3");
Sequence.fromStatement("random 0.8,1,1.2,1.5 AS HS4");
Sequence.fromStatement("random 1,1.2,1.5,2 AS HS5");

const reps = 30;
Sequence.fromStatement(
  `repeat ${"HS5(),".repeat(reps)}${"HS4(),".repeat(reps)}${"HS3(),".repeat(reps)}${"HS2(),".repeat(reps)}${"HS1(),".repeat(reps + 10)}HS1() AS HS`,
);

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  const style: IStyle = {
    strokeThickness: 0,
    fillAlpha: 0,
    hatchPattern: "HATCH()",
    hatchAngle: "HANG()",
    hatchScale: "HS()",
    hatchStrokeColor: "0x999999",
    hatchStrokeThickness: 2,
    hatchOffsetX: 0,
    hatchOffsetY: 0,
    hatchOverflow: 0,
    hatchSpherify: true,
  };

  // compound leaf
  const child = new Stamp(new Ray(0, 0)).defaultStyle(style).circle({
    radius: 20,
  });

  const parent = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: child,
    permutationSequence: Sequence.fromStatement("RANDOM 1-25"),
    columns: 7,
    rows: 21,
    rowSpacing: 48,
    columnSpacing: 48,
    offsetAlternateRows: true,
  });

  parent.children().forEach((child) => {
    if (
      child.style.hatchBooleanType === HatchBooleanType.DIFFERENCE ||
      child.style.hatchBooleanType === HatchBooleanType.INTERSECT
    ) {
      const shape = Hatch.subtractHatchFromShape(child);
      if (shape) drawShape(ctx, shape);
    } else {
      drawShape(ctx, child);
    }
  });
  Sequence.resetAll();

  parent.children().forEach((child) => {
    if (child.style.hatchPattern) {
      const fillPattern = Hatch.applyHatchToShape(child);
      if (fillPattern) {
        drawHatchPattern(ctx, fillPattern, true);
      }
    }
  });

  /*
  const ang = Math.PI * 0.25;
  const ellipse = new Ellipse(new Ray(w / 2, h / 2 + 100, ang), 50, 70, 32, ShapeAlignment.TOP, false);

  drawShape(ctx, ellipse);
  drawRay(ctx, ellipse.center);

  const leafShape = new LeafShape(new Ray(w / 2, h / 2 + 100, ang), 100, 20, 60, 80, 0, ShapeAlignment.TOP);

  drawShape(ctx, leafShape);
  drawRay(ctx, leafShape.center);
  */

  //drawRay(ctx, tree.center)
};

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    // draw the boundary
    ctx2.backgroundColor = "#000";
    // draw the shapes
    draw(ctx2);
    // download the SVG

    const svg = ctx2.getSerializedSvg(false).split("#FFFFFF").join("#000000");
    const svgNoBackground = svg.replace(/\<rect.*?\>/g, "");
    const blob = new Blob([svgNoBackground], { type: "image/svg+xml" });
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
