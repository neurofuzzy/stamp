import * as C2S from "canvas2svg";
import { drawPath, drawShape } from "../src/lib/draw";
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import {
  CircleFillStampLayout,
  GridStampLayout,
} from "../src/lib/stamp-layout";
import { GeomHelpers } from "../src/geom/helpers";
import { GeomUtils } from "../src/geom/util";
import { Rectangle } from "./geom/shapes";

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

Sequence.fromStatement("shuffle 72,72,72,72,-36 AS IB");
Sequence.fromStatement("shuffle 72, 72, -72, IB() AS IA");
Sequence.fromStatement("shuffle 72, 72, -72, -72, -72, -36 AS RANGLE");

Sequence.fromStatement("shuffle 1,1 AS RLEN");

// 1,4,6,12,26,30,91,117,127
const seeds = Sequence.fromStatement("repeat 1,6,12,26,30,91,117,127");

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .noBoolean()
    .rotate(18)
    .defaultStyle({
      strokeThickness: 0,
      fillColor: "cyan",
    })
    .forward("RLEN()")
    .circle({
      radius: 2,
      divisions: 3,
      skip: 1,
    })
    .rotate("RANGLE()")
    .repeatLast(3, 60);

  const circle = new Stamp(new Ray(w / 2, h / 2, 0))
    .noBoolean()
    .defaultStyle({
      strokeThickness: 1,
      strokeColor: "cyan",
      fillColor: "#0066cc",
      fillAlpha: 0.5,
    })
    .circle({
      radius: 10,
    });

  const grid = new CircleFillStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: circle,
    permutationSequence: Sequence.fromStatement("repeat 4,6,40,9"),
    scaleSequence: Sequence.fromStatement("repeat 2,3,4"),
    seed: 65,
    radius: 300,
    count: 40,
  });

  grid.children().forEach((x) => {
    drawShape(ctx, x);
  });

  let pathSets = grid.children().map((x) => {
    let path = x.path();
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = (10 / c.radius) * x.scale;
      return x.path(scale);
    }
    return path;
  });

  pathSets.forEach((paths) => {
    let shapes = ClipperHelpers.offsetPathsToShape(paths, 0.5, 4);
    shapes.forEach((shape) => {
      //drawShape(ctx, shape, 0);
      // console.log("shape perimeter", GeomUtils.measureShapePerimeter(shape));
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
