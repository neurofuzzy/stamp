import * as C2S from "canvas2svg";
import { drawPath, drawShape } from "../src/lib/draw";
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { GridStampLayout } from "../src/lib/layout/layout-stamp";
import { GeomHelpers } from "../src/geom/helpers";
import { GeomUtils } from "../src/geom/util";
import { Rectangle } from "../src/geom/shapes";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ratio = 2;
canvas.width = 850 * ratio;
canvas.height = 2200 * ratio;
canvas.style.width = "850px";
canvas.style.height = "2200px";
const ctx = canvas.getContext("2d")!;
ctx.scale(ratio, ratio);
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = "white";

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[83];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 125);

Sequence.seed = 2;
Sequence.seed = 500;
Sequence.seed = 503;
Sequence.seed = 506;
Sequence.seed = 518;
Sequence.seed = 18;
Sequence.seed = 17;
Sequence.seed = 199;
Sequence.seed = 198;
Sequence.seed = 197;
Sequence.seed = 193;
Sequence.seed = 316;
//Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60 AS RANGLE");
//Sequence.fromStatement("shuffle -72,-72,-144,72,-72 AS RANGLE");
//Sequence.fromStatement("shuffle -120,-120,60,60,-60,-60,0 AS RANGLE");
//Sequence.fromStatement("shuffle -60,-60,60,0,180,0,-60,-60,60,0,180,0 AS RANGLE");
//Sequence.fromStatement("shuffle -72,-72,-72,-72,-72,72,72,180,0,0 AS RANGLE");
//Sequence.fromStatement("shuffle -90,-90,90,-90,0,-90,-90,90,0,0 AS RANGLE");
//Sequence.fromStatement("shuffle -72,-72,72,72,72,72,72 AS RANGLE");
//Sequence.fromStatement("shuffle -144,-144,-144,-144,-144,-144,-144,-144,144,144,144,144,144,144,144,144,144,144,-72,-72,-72,72 AS RANGLE");

Sequence.fromStatement(
  "shuffle -60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60,120 AS RANGLE",
);
//Sequence.fromStatement("shuffle -60,-60,-60,60,60,60,60,60,120 AS RANGLE");

Sequence.fromStatement("shuffle 0,1,0,1,0,1 AS BSKIP");
Sequence.fromStatement("repeat 10,10 AS BERRY");

const len = 30;
const weight = 2;

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .noBoolean()
    .defaultStyle({
      strokeThickness: 0,
      fillColor: "cyan",
    })
    .forward({ distance: len })
    .circle({
      radius: 2,
      divisions: 3,
      skip: 1,
    })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 3, times: 240 });

  //Sequence.fromStatement("repeat 120347,18648,9847,72398,12030,1923 AS SEEDS", 12);
  //Sequence.fromStatement("repeat 891274,23305972,12049842978,398085,851295,149899 AS SEEDS", 12);
  //Sequence.fromStatement("shuffle 7,12,26,35,66,113,108,93,91, AS SEEDS", 12);
  //Sequence.fromStatement("repeat 45654245,6212575556,45618461976,86294281448,621286238642389462 AS SEEDS", 12);
  Sequence.fromStatement(
    "shuffle 2,3,4,10, 11,13,16,19, 22,23,110,31, 34,37,87,44, 45,47,118,60, 62,63,65,71 AS SEEDS",
    17,
  );
  //Sequence.fromStatement("shuffle 2,3,4,102, 11,13,16,141, 104,23,29,31, 149,105,110,44, 45,115,57,120, 122,169,128,129 AS SEEDS", 11);

  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: lattice,
    stampSeed: "SEEDS()",
    rows: 8,
    columns: 3,
    rowSpacing: 200,
    columnSpacing: 200,
  });

  let pathSets = grid.children().map((x) => {
    let path = x.path({});
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = 60 / c.radius;
      return x.path({ scale: scale });
    }
    return path;
  });

  const border = new Rectangle(new Ray(w / 2, h / 2), w, h);
  border.style.fillAlpha = 0;
  drawShape(ctx, border);

  pathSets.forEach((paths) => {
    let shapes = ClipperHelpers.offsetPathsToShape(paths, 0.001, 4);
    shapes.forEach((shape) => {
      drawShape(ctx, shape, 0);
      console.log("shape perimeter", GeomUtils.measureShapePerimeter(shape));
    });
    paths.forEach((path) => {
      //drawPath(ctx, path, 0);
    });
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
