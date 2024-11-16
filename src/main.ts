import * as C2S from "canvas2svg";
import { drawShape } from "../src/lib/draw";
import { Heading, Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import { StampsProvider } from "./lib/stamps-provider";

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

let seed = 24;

Sequence.fromStatement("repeat 2,1 AS BOOL", seed);
Sequence.fromStatement("repeat 2,1 AS BOOL2", seed);
Sequence.fromStatement("random 40,70,70,100,130 AS BW", seed);
Sequence.fromStatement("repeat 80,130,80,130,80 AS BH", seed);
Sequence.fromStatement("repeat 18,24,18,24,18 AS WH", seed);
Sequence.fromStatement("random 1,2,2,3,4 AS NWX", seed);
Sequence.fromStatement("repeat 2,3,2,3,2 AS NWY", seed);
Sequence.fromStatement("random 0,0,1 AS DOFF", seed);
Sequence.fromStatement("random 0,15,15,0,45 AS DX", seed);

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  // city grid
  const bldg = new Stamp(new Ray(0, 0, 0))
    .set("BW")
    .set("BH")
    .set("WH")
    .set("NWX")
    .set("NWY")
    .set("DX")
    .set("DOFF")
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
      skip: "BW < 101 & BH < 81",
    })
    .ellipse({
      radiusX: "BW * 0.5",
      radiusY: "BW * 0.35",
      divisions: 4,
      offsetY: "BH",
      skip: "BW > 100 | BH > 80",
    })
    // windows
    .boolean("BOOL2()")
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
    // door
    .rectangle({
      width: 16,
      height: "WH + 10",
      spacingX: 30,
      spacingY: "WH + 10",
      offsetX: "DX",
      offsetY: 10,
      align: ShapeAlignment.TOP,
      skip: "DOFF | BW < 61",
    })
    .boolean("BOOL2()");

  const tree = new Stamp(new Ray(0, 0, 0))
    .rectangle({
      width: 10,
      height: 50,
      align: ShapeAlignment.TOP,
    })
    .circle({
      radius: 20,
      offsetY: -50,
      divisions: 6,
    });

  const stuff = new StampsProvider([tree, bldg]);

  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    .markBoundsStart()
    .stamp({
      subStamp: stuff,
      outlineThickness: 10,
      align: ShapeAlignment.TOP,
    })
    .markBoundsEnd()
    .moveOver(Heading.RIGHT, 0.5)
    // ground shape
    .rectangle({
      width: "BW + 80",
      height: 160,
      align: ShapeAlignment.BOTTOM,
    })
    .moveOver(Heading.RIGHT, 0.5)
    .move(20, 0)
    .repeatLast(7, 4)
    .moveTo(0, undefined)
    .move(0, 160)
    .boolean("BOOL()")
    .repeatLast(11, 5);

  // draw as single shape
  drawShape(ctx, city);

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
