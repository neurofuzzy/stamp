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
const pageWidth = 8 * 96;
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

let seed = 12;

Sequence.fromStatement("repeat 2,1 AS BOOL", seed);
Sequence.fromStatement("shuffle 40,70,70,100,130 AS BW", seed);
Sequence.fromStatement("repeat 80,130 AS BH", seed);
Sequence.fromStatement("repeat 18,24 AS WH", seed);
Sequence.fromStatement("shuffle 1,2,2,3,4 AS NWX", seed);
Sequence.fromStatement("repeat 2,3 AS NWY", seed);

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  // city grid
  const bldg = new Stamp(new Ray(0, 0, 0))
    .set("BW")
    .set("BH")
    .set("WH")
    .set("NWX")
    .set("NWY")
    // building shape
    .rectangle({
      width: "BW",
      height: "BH",
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    // flat roof shape
    .rectangle({
      width: "BW - 20",
      height: "BH + 10",
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    // windows
    .boolean("BOOL()")
    .rectangle({
      width: 16,
      height: "WH",
      numX: "NWX",
      numY: "NWY",
      spacingX: 30,
      spacingY: "WH + 10",
      offsetY: 20,
      align: ShapeAlignment.TOP,
    })
    .boolean("BOOL()");

  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    .stamp({
      subStamp: bldg,
      outlineThickness: 10,
      align: ShapeAlignment.TOP,
    })
    .move("BW * 0.5", 0)
    // ground shape
    .rectangle({
      width: "BW + 80",
      height: 160,
      align: ShapeAlignment.BOTTOM,
    })
    .move("BW * 0.5", 0)
    .move(20, 0)
    .repeatLast(5, 4)
    .move(-20 * 5, 0)
    .move(0 - (40 + 70 + 70 + 100 + 130), 120)
    .boolean("BOOL()")
    .repeatLast(9, 5);

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
