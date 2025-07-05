import * as C2S from "canvas2svg";
import { drawPath } from "../src/lib/draw";
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { GridStampLayout } from "../src/lib/stamp-layout";
import { GeomHelpers } from "../src/geom/helpers";
import { GeomUtils } from "../src/geom/util";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const pageWidth = 16 * 96;
const pageHeight = 8 * 96;
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

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[83];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 125);

Sequence.fromStatement("shuffle 72,72,72,72,72,72,72,72,72,72,-36 AS IB");
Sequence.fromStatement("shuffle 72, 72, -72, IB() AS IA");
Sequence.fromStatement("shuffle 72, 72, 72, 72, 72, IA() AS RANGLE");

Sequence.fromStatement("shuffle 90,90 AS RLEN");

// 26,30,37,58,69,70,102,112,131
const seeds = Sequence.fromStatement("repeat 26,30,37,58,69,70,112,131");

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .noBoolean()
    .rotate({ rotation: 18 })
    .defaultStyle({
      strokeThickness: 0,
      fillColor: "cyan",
    })
    .forward({ distance: "RLEN()" })
    .circle({
      radius: 2,
      divisions: 3,
      skip: 1,
    })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 3, times: 4080 });

  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: lattice,
    permutationSequence: seeds,
    rows: 2,
    columns: 4,
    rowSpacing: 350,
    columnSpacing: 350,
  });

  let pathSets = grid.children().map((x) => {
    let path = x.path({});
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = 140 / c.radius;
      return x.path({ scale: scale });
    }
    return path;
  });

  pathSets.forEach((paths) => {
    let shapes = ClipperHelpers.offsetPathsToShape(paths, 0.5, 4);
    shapes.forEach((shape) => {
      //drawShape(ctx, shape, 0);
      console.log("shape perimeter", GeomUtils.measureShapePerimeter(shape));
    });
    paths.forEach((path) => {
      drawPath(ctx, path, 0);
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
