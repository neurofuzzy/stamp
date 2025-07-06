import * as C2S from "canvas2svg";
import { drawShape } from "../src/lib/draw";
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { GridStampLayout } from "../src/lib/stamp-layout";
import { GeomHelpers } from "../src/geom/helpers";
import { GeomUtils } from "../src/geom/util";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ratio = 2;
canvas.width = 900 * ratio;
canvas.height = 900 * ratio;
canvas.style.width = "900px";
canvas.style.height = "900px";
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

const len = 30;
const weight = 2;

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .noBoolean()
    .forward({ distance: len })
    .circle({
      radius: 20,
      divisions: 8,
      skip: "RANGLE - 100",
    })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 3, times: 340 });

  Sequence.fromStatement("shuffle 60,60,-60,-60 AS RINGLE");
  Sequence.fromStatement("shuffle -60,-60,-60,60,60,RINGLE() AS RANGLE");
  Sequence.fromStatement("repeat 10,28,3,4 AS SEEDS", 12);

  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: lattice,
    permutationSequenceStatement: "SEEDS()",
    rows: 2,
    columns: 2,
    rowSpacing: 620,
    columnSpacing: 620,
  });

  let pathSets = grid.children().map((x) => {
    let path = x.path({});
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = 300 / c.radius;
      return x.path({ scale: scale });
    }
    return path;
  });

  pathSets.forEach((paths) => {
    paths.forEach((seg) => {
      //drawPath(ctx, seg, 0);
    });
    let shapes = ClipperHelpers.offsetPathsToShape(paths, 10, 4, true);
    shapes.forEach((shape) => {
      drawShape(ctx, shape, 0);
      console.log("shape perimeter", GeomUtils.measureShapePerimeter(shape));
    });
  });

  grid.children().forEach((shape) => {
    // drawShape(ctx, shape, 0);
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
