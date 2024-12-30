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
import { GridStampLayout } from "../src/lib/stamp-layout";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 8.5 * 96;
const pageHeight = 8.5 * 96;
const ratio = 2;
canvas.width = pageWidth * ratio;
canvas.height = pageHeight * ratio;
canvas.style.width = pageWidth + "px";
canvas.style.height = pageHeight + "px";
const ctx = canvas.getContext("2d")!;
ctx.scale(ratio, ratio);
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = "white";

Sequence.seed = 2;

Sequence.fromStatement(
  "shuffle 11,4,5,8,9, 10,14,15,16,18, 19,20,21,22,23, 24,25,26,27,28, 29,33,34,35,41 AS HATCH",
);
Sequence.fromStatement(
  "shuffle 1,1,1,1,1, 1,1,1,0.85,0.85, 1,1,0.85,0.85,0.75, 0.75,0.85,0.75,0.85,0.75, 1,1,1,1.2,1.2 AS HATCHSCALE",
);

Sequence.fromStatement("repeat 144,72,60,30,45 AS HATCHANGLE");

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  const style: IStyle = {
    strokeThickness: 0,
    fillAlpha: 0,
    hatchPattern: "HATCH()",
    hatchAngle: "HATCHANGLE()",
    hatchScale: "HATCHSCALE()",
    hatchStrokeColor: "0x999999",
    hatchStrokeThickness: 2,
    hatchOffsetX: 0,
    hatchOffsetY: 0,
    hatchOverflow: 0,
    hatchSpherify: true,
  };

  // compound leaf
  const child = new Stamp(new Ray(0, 0)).defaultStyle(style).circle({
    radius: 96 * 0.75,
  });

  const parent = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: child,
    permutationSequence: Sequence.fromStatement("REPEAT 6"),
    columns: 5,
    rows: 5,
    rowSpacing: 96 * 1.5,
    columnSpacing: 96 * 1.5,
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
