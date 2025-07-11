import * as C2S from "canvas2svg";
import { drawHatchPattern, drawShape } from "../src/lib/draw";
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Hatch } from "../src/lib/hatch";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { HatchBooleanType, HatchPatternType } from "../src/geom/hatch-patterns";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ratio = 2;
canvas.width = 768 * ratio;
canvas.height = 768 * ratio;
canvas.style.width = "768px";
canvas.style.height = "768px";
const ctx = canvas.getContext("2d")!;
ctx.scale(ratio, ratio);
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = "white";

Sequence.seed = 0;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[79];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 137.508 AS RANGLE", 0, 5);
Sequence.fromStatement("repeat 0.5 LOG2 AS RSCALE", 0);
Sequence.fromStatement("repeat 0.7 LOG2 AS ROFFSET", 1);
Sequence.fromStatement("repeat 1.02 ADD AS RLA");
Sequence.fromStatement("repeat 100,60 AS BERRY");

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  // compound leaf
  const leaf = new Stamp(new Ray(0, 0)).rotate({ rotation: 90 }).ellipse({
    radiusX: "1.3 * RSCALE() * RSCALE()",
    radiusY: "12 * RSCALE()",
    divisions: 64,
  });

  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 1,
      fillAlpha: 0,
    })
    .circle({
      radius: 56,
      outlineThickness: 10,
      style: {
        fillAlpha: 0,
        hatchStrokeThickness: 0.5,
        hatchPattern: HatchPatternType.SINEWAVE,
        hatchInset: 2,
        hatchScale: 0.5,
      },
    })
    // 48
    // 67
    // 210
    .rotate({ rotation: 137.508 })
    .forward({ distance: "40 * ROFFSET()" })
    .stamp({
      subStamp: leaf,
      outlineThickness: "8 + ROFFSET * 1.2",
      style: {
        fillAlpha: 0,
        hatchStrokeThickness: 0.5,
        hatchPattern: HatchPatternType.SINEWAVE,
        hatchInset: 2,
        hatchScale: 0.5,
      },
    })
    .stepBack({ steps: 1 })
    .repeatLast({ steps: 4, times: 100 })
    .flip();

  tree.children().forEach((child) => {
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

  tree.children().forEach((child) => {
    if (child.style.hatchPattern) {
      const fillPattern = Hatch.applyHatchToShape(child);
      if (fillPattern) drawHatchPattern(ctx, fillPattern);
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
