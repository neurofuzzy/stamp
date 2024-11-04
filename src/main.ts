import * as C2S from "canvas2svg";
import { drawHatchPattern, drawShape } from "../src/lib/draw";
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Hatch } from "../src/lib/hatch";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 6 * 96;
const pageHeight = 9 * 96;
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

let seed = 10;

Sequence.fromStatement("repeat 2,1 AS BOOL", seed);

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    // building shape
    .rectangle({
      width: 80,
      height: 100,
      align: ShapeAlignment.TOP,
      outlineThickness: 10,
    })
    // ground shape
    .rectangle({
      width: 120,
      height: 120,
      align: ShapeAlignment.BOTTOM,
    })
    // windows
    .boolean("BOOL()")
    .rectangle({
      width: 16,
      height: 24,
      numX: 2,
      numY: 3,
      spacingX: 30,
      spacingY: 40,
      offsetY: 20,
      align: ShapeAlignment.TOP,
    })
    .boolean("BOOL()")
    .move(100, 0)
    .repeatLast(6, 4)
    .move(-500, 120)
    .boolean("BOOL()")
    .repeatLast(9, 4);

  // draw as single shape
  drawShape(ctx, city);

  /*
  // draw children
  city.children().forEach((child) => drawShape(ctx, child));
  city.children().forEach((child) => {
    if (child.style.hatchPattern) {
      const fillPattern = Hatch.applyHatchToShape(child);
      if (fillPattern) drawHatchPattern(ctx, fillPattern);
    }
  });
  */
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
  draw(ctx);
  console.log(`${new Date().getTime() - now}ms`);
}

main();
