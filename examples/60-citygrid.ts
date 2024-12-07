import * as C2S from "canvas2svg";
import { drawShape } from "../src/lib/draw";
import { Heading, Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import { StampsProvider } from "../src/lib/stamps-provider";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 16 * 96;
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
Sequence.fromStatement("repeat 2,1 AS BOOL3", seed);
Sequence.fromStatement("random 40,70,70,100,130 AS BW", seed);
Sequence.fromStatement("repeat 80,130,80,130,80 AS BH", seed);
Sequence.fromStatement("repeat 80,80,80,80,80 AS BH2", seed);
Sequence.fromStatement("repeat 16,22,16,22,16 AS WH", seed);
Sequence.fromStatement("random 0,0,0,30,50 AS WA", seed);
Sequence.fromStatement("random 1,2,2,3,4 AS NWX", seed);
Sequence.fromStatement("repeat 2,3,2,3,2 AS NWY", seed);
Sequence.fromStatement("repeat 0,0,1 AS DOFF", seed);
Sequence.fromStatement("random 0,15,15,0,45 AS DX", seed);

Sequence.fromStatement("repeat 35,50,40,45 AS TH", 22);
Sequence.fromStatement("random 70,100,100 AS CW", seed);
Sequence.fromStatement("random 2,3,3 AS CNWX", seed);
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

  // building
  const bldg = new Stamp(new Ray(0, 0, 0))
    .set("BW")
    .set("BH")
    .set("WH")
    .set("WA")
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
      tag: "roof",
      width: "BW - 20",
      height: "BH + 10",
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
      skip: "BW < 101 & BH < 81",
    })
    // pitched roof shape
    .ellipse({
      tag: "pitchroof",
      radiusX: "BW / 2",
      radiusY: "BW / 3",
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
      spacingY: "WH + 14",
      offsetY: "BH / 2",
    })
    .arch({
      width: 16,
      sweepAngle: "WA",
      numX: "NWX",
      numY: "NWY",
      spacingX: 30,
      spacingY: "WH + 14",
      divisions: 8,
      offsetY: "BH / 2 + WH / 2",
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

  // building2
  const bldg2 = new Stamp(new Ray(0, 0, 0))
    .extends(bldg)
    .skipTag("pitchroof", "T1() | BW > 100 | BH > 80")
    .trapezoid({
      tag: "roof",
      taper: 10,
      width: "BW + 10",
      offsetY: "BH - 15",
      height: "30",
      align: ShapeAlignment.TOP,
      skip: "T2() | BH > 80",
    });

  // church
  const church = new Stamp(new Ray(0, 0, 0))
    .set("STEEPLEH")
    .set("STEEPLEX")
    .set("CH")
    .set("CW")
    .set("CNWX")
    // building shape
    .rectangle({
      width: "CW",
      height: 60,
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    .rectangle({
      width: 60,
      height: 50,
      offsetX: "STEEPLEX",
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    .ellipse({
      radiusX: "CW / 2",
      radiusY: "CH",
      divisions: 4,
      offsetY: 60,
    })
    // windows
    .boolean("BOOL2()")
    .rectangle({
      width: 16,
      height: 17,
      numX: "CNWX",
      numY: 1,
      spacingX: 25,
      spacingY: 30,
      offsetY: 25,
    })
    .leafShape({
      radius: 8,
      splitAngle: 60,
      splitAngle2: 78,
      divisions: 8,
      numX: "CNWX",
      numY: 1,
      spacingX: 25,
      spacingY: 30,
      offsetY: 32,
    })
    .boolean("BOOL2()")
    // steeple
    .rectangle({
      width: 40,
      height: "STEEPLEH + 10",
      offsetX: "STEEPLEX",
      offsetY: 50,
      align: ShapeAlignment.TOP,
    })
    .ellipse({
      radiusX: 20,
      radiusY: 20,
      divisions: 4,
      offsetX: "STEEPLEX",
      offsetY: "STEEPLEH + 60",
      skip: "STEEPLEH > 59",
    })
    .circle({
      radius: 10,
      offsetX: "STEEPLEX",
      offsetY: "STEEPLEH + 60",
      skip: "STEEPLEH < 60",
    })
    .boolean("BOOL2()")
    .rectangle({
      width: 10,
      height: 20,
      offsetX: "STEEPLEX",
      offsetY: "STEEPLEH + 30",
      align: ShapeAlignment.TOP,
    })
    .boolean("BOOL2()");

  // tree
  const tree = new Stamp(new Ray(0, 0, 0))
    .set("TH")
    // trunk shape
    .rectangle({
      width: 10,
      height: "TH",
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

  // store
  const store = new Stamp(new Ray(0, 0, 0))
    .set("STH")
    .set("STW")
    .set("STNWX")
    .set("STNWY")
    // store shape
    .rectangle({
      width: "STW",
      height: "STH",
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    .boolean("BOOL3()")
    // store windows
    .rectangle({
      width: "STW / 2 - 30",
      height: 30,
      numX: 2,
      numY: 1,
      spacingX: "STW / 2 + 6",
      spacingY: 30,
      offsetY: 20,
    })
    // door
    .rectangle({
      width: 16,
      height: 50,
      offsetY: 10,
    })
    // higher floor windows
    .rectangle({
      width: 20,
      height: 20,
      numX: "STNWX",
      numY: "STNWY",
      spacingX: 32,
      spacingY: 34,
      offsetY: "STH / 2 + 14",
    })
    .arch({
      width: 20,
      numX: "STNWX",
      numY: "STNWY",
      spacingX: 32,
      spacingY: 34,
      sweepAngle: "WA",
      divisions: 8,
      offsetY: "STH / 2 + 24",
    })
    .boolean("BOOL3()")
    // roof
    .rectangle({
      width: "STW - 20",
      height: 10,
      offsetY: "STH",
      align: ShapeAlignment.TOP,
      outlineThickness: 0,
    })
    .circle({
      radius: 10,
      offsetY: "STH + 10",
    })
    // canopy
    .trapezoid({
      width: "STW + 20",
      height: 16,
      taper: 6,
      offsetY: 24,
      align: ShapeAlignment.TOP,
    });

  Sequence.fromStatement("random 0,1,2,0,1,2,0,1,2,3 as BLDGS", seed);
  Sequence.fromStatement("random 4,4,4,0 as TREES", seed);
  // city objects
  const blocks = new StampsProvider(
    [bldg, bldg2, store, church, tree],
    Sequence.fromStatement("random BLDGS(),TREES(),BLDGS(),TREES()", seed),
  );

  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    .setCursorBounds(0, 0, 1200, 900)
    .markBoundsStart()
    .stamp({
      subStamp: blocks,
      outlineThickness: 10,
      align: ShapeAlignment.TOP,
    })
    .markBoundsEnd()
    .moveOver(Heading.RIGHT, 0.5)
    .setCursorBounds(0, 0, 1400, 900)
    // ground shape
    .rectangle({
      width: "BW + 100",
      height: 160,
      align: ShapeAlignment.BOTTOM,
    })
    .moveOver(Heading.RIGHT, 0.5)
    .move(15, 0)
    .repeatLast(9, 16)
    .moveTo(0)
    .move(0, 160)
    .boolean("BOOL()")
    .repeatLast(13, 5)
    .crop(-40, -200, 1340, 1100);

  // draw as single shape
  //drawShape(ctx, city);

  // draw children
  city.children().forEach((child) => drawShape(ctx, child));
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
