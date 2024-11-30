import * as C2S from "canvas2svg";
import { drawHatchPattern, drawPath, drawShape } from "../src/lib/draw";
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import { CirclePackingStampLayout } from "../src/lib/stamp-layout";
import { HatchPatternType } from "./geom/hatch-patterns";
import { Hatch } from "./lib/hatch";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 8 * 96;
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

ctx.fillStyle = "white";

Sequence.seed = 1;

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  Sequence.fromStatement("repeat 3,4,5 AS S");
  Sequence.fromStatement("repeat 1,2,2 AS B");
  Sequence.fromStatement("repeat 2,1,1 AS B2");
  Sequence.fromStatement("random 10,-20,30,40 AS R");

  const circle = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      strokeThickness: 0,
      strokeColor: "#cccccc",
      fillColor: "0",
      fillAlpha: 0,
      hatchPattern: HatchPatternType.FLOWER,
      hatchStrokeThickness: 1,
      hatchStrokeColor: "#cccccc",
      hatchScale: 0.4,
      hatchInset: 0.5,
    })
    .circle({
      radius: 18,
    });

  const grid = new CirclePackingStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: circle,
    permutationSequence: Sequence.fromStatement("repeat 4,6,40,9"),
    scaleSequence: Sequence.fromStatement("repeat 3,4,5"),
    seed: 512,
    radius: 300,
    count: 22,
    padding: 18,
    spherify: 98.2,
  });

  grid.children().forEach((child) => {
    drawShape(ctx, child);
    if (child.style.hatchPattern) {
      const fillPattern = Hatch.applyHatchToShape(child);
      if (fillPattern) {
        drawHatchPattern(ctx, fillPattern, true);
      }
    }
  });
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
