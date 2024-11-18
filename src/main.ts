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
const pageWidth = 11 * 96;
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

let seed = 27;

Sequence.fromStatement("repeat 2,1 AS BOOL", seed);
Sequence.fromStatement("repeat 2,1 AS BOOL2", seed);
Sequence.fromStatement("random 40,70,70,100,130 AS BW", seed);
Sequence.fromStatement("repeat 80,130,80,130,80 AS BH", seed);
Sequence.fromStatement("repeat 18,24,18,24,18 AS WH", seed);
Sequence.fromStatement("random 1,2,2,3,4 AS NWX", seed);
Sequence.fromStatement("repeat 2,3,2,3,2 AS NWY", seed);
Sequence.fromStatement("random 0,0,1 AS DOFF", seed);
Sequence.fromStatement("random 0,15,15,0,45 AS DX", seed);

Sequence.fromStatement("repeat 35,50,40,45 AS TH", seed);
Sequence.fromStatement("repeat -30,0,30 AS STEEPLEX", seed);
Sequence.fromStatement("repeat 70,60,50 AS STEEPLEH", seed);

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  // building
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
      offsetY: "BH * 0.5",
    })
    // door
    .rectangle({
      width: 16,
      height: "WH",
      spacingX: 30,
      spacingY: "WH + 10",
      offsetX: "DX",
      offsetY: 10,
      align: ShapeAlignment.TOP,
      skip: "DOFF | BW < 61",
    })
    .boolean("BOOL2()");

  // church
  const church = new Stamp(new Ray(0, 0, 0))
    .set("STEEPLEH")
    .set("STEEPLEX")
    // building shape
    .rectangle({
      width: 100,
      height: 60,
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    .rectangle({
      width: 60,
      height: 60,
      offsetX: "STEEPLEX",
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    .ellipse({
      radiusX: 50,
      radiusY: 30,
      divisions: 4,
      offsetY: 60,
    })
    // windows
    .boolean("BOOL2()")
    .rectangle({
      width: 16,
      height: 20,
      numX: 3,
      numY: 1,
      spacingX: 30,
      spacingY: 30,
      offsetY: 25,
    })
    .leafShape({
      radius: 8,
      splitAngle: 60,
      splitAngle2: 78,
      divisions: 8,
      numX: 3,
      numY: 1,
      spacingX: 30,
      spacingY: 30,
      offsetY: 35,
    })
    .boolean("BOOL2()")
    // steeple
    .rectangle({
      width: 40,
      height: "STEEPLEH",
      offsetX: "STEEPLEX",
      offsetY: 60,
      align: ShapeAlignment.TOP,
    })
    .ellipse({
      radiusX: 20,
      radiusY: 20,
      divisions: 4,
      offsetX: "STEEPLEX",
      offsetY: "STEEPLEH + 60",
    })
    .boolean("BOOL2()")
    .rectangle({
      width: 10,
      height: 20,
      offsetX: "STEEPLEX",
      offsetY: "STEEPLEH + 35",
      align: ShapeAlignment.TOP,
    })
    .boolean("BOOL2()");

  // tree
  const tree = new Stamp(new Ray(0, 0, 0))
    // trunk shape
    .rectangle({
      width: 10,
      height: "TH()",
      align: ShapeAlignment.TOP,
    })
    // canopy shape
    .roundedRectangle({
      width: 30,
      height: 20,
      cornerRadius: 10,
      offsetY: "TH - 20",
      divisions: 36,
    })
    .leafShape({
      radius: 12,
      splitAngle: 70,
      splitAngle2: 120,
      divisions: 8,
      offsetY: "TH - 7",
    });

  // city objects
  const blocks = new StampsProvider(
    [tree, bldg, bldg, tree, church],
    Sequence.fromStatement("random 1,2,2,3,4,3,3", seed),
  );

  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    .setCursorBounds(0, 0, 900, 900)
    .markBoundsStart()
    .stamp({
      subStamp: blocks,
      outlineThickness: 10,
      align: ShapeAlignment.TOP,
    })
    .markBoundsEnd()
    .moveOver(Heading.RIGHT, 0.5)
    .setCursorBounds(0, 0, 1100, 900)
    // ground shape
    .rectangle({
      width: "BW + 80",
      height: 160,
      align: ShapeAlignment.BOTTOM,
    })
    .moveOver(Heading.RIGHT, 0.5)
    .move(15, 0)
    .repeatLast(9, 12)
    .moveTo(0)
    .move(0, 160)
    .boolean("BOOL()")
    .repeatLast(13, 5)
    .crop(-40, -200, 1000, 1100);

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
