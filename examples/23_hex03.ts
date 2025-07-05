import * as C2S from "canvas2svg";
import { drawPath, drawShape } from "../src/lib/draw";
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { GridStampLayout } from "../src/lib/stamp-layout";
import { GeomHelpers } from "../src/geom/helpers";

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

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);

  const len = 30;
  const weight = len / 3;
  Sequence.seed = 256;
  Sequence.seed = 26;
  Sequence.fromStatement(
    "shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,30  AS RANGLE",
  );
  Sequence.fromStatement("shuffle 0,1,0,1,0,1 AS BSKIP");
  const seeds = Sequence.fromStatement("repeat 4,30,7,8,12,16,17,18,19", 12);

  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      strokeThickness: 1,
      strokeColor: "#ffffff",
      fillColor: "#222222",
    })
    .bone({
      topRadius: weight / 2,
      bottomRadius: weight / 2,
      length: len,
      divisions: 6,
      align: ShapeAlignment.TOP,
    })
    .circle({
      radius: len + weight,
      divisions: 6,
      offsetX: Math.cos((30 * Math.PI) / 180) * len,
      offsetY: 0 - len / 2,
      angle: 15,
      skip: "RANGLE",
    })
    .forward({ distance: len })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 4, times: 180 });

  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: lattice,
    permutationSequence: seeds,
    rows: 3,
    columns: 3,
    rowSpacing: 260,
    columnSpacing: 260,
  });

  let pathSets = grid.children().map((x) => {
    let path = x.path({});
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = 100 / c.radius;
      return x.path({ scale: scale });
    }
    return path;
  });

  pathSets.forEach((paths) => {
    let shapes = ClipperHelpers.offsetPathsToShape(paths, 4, 4);
    shapes.forEach((shape) => {
      drawShape(ctx, shape, 0);
    });
    paths.forEach((seg) => {
      drawPath(ctx, seg, 0, "#cccccc");
    });
    /*
      shapes = ClipperHelpers.offsetPathsToShape(paths, 1);
      shapes.forEach(shape => {
        drawShape(ctx, shape, 0);
      });
      */
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
