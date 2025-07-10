import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { GridStampLayout } from "../src/lib/layout/layout-stamp";
import { GeomHelpers } from "../src/geom/helpers";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const w = 768;
const h = 768;

let cachedSVG = '';

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

const draw = (): IShape[] => {
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

  Sequence.fromStatement(
    "shuffle -72,-72,-72,-72,-72,-72,-72,-72,72,72,72,72,72,-72,-72,-72 AS RANGLE",
  );
  Sequence.fromStatement(
    "repeat 77763,836736,988787,988769,987636,987650 AS SEEDS",
    12,
  );

  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    type: "grid",
    stamp: lattice,
    stampSeed: "SEEDS()",
    rows: 2,
    columns: 2,
    rowSpacing: 420,
    columnSpacing: 420,
  });

  let pathSets = grid.children().map((x) => {
    let path = x.path({});
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = 200 / c.radius;
      return x.path({ scale: scale });
    }
    return path;
  });

  const shapes: IShape[] = [];
  pathSets.forEach((paths) => {
    let offsetShapes = ClipperHelpers.offsetPathsToShape(paths, 6, 4);
    shapes.push(...offsetShapes);
  });

  return shapes;
};

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // draw the shapes
    const shapes = draw();
    cachedSVG = DrawSVG.renderSVG(shapes, {
      width: w,
      height: h,
      backgroundColor: '#000000'
    });
    // download the SVG
    const blob = new Blob([cachedSVG], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

async function main() {
  await ClipperHelpers.init();

  const now = new Date().getTime();
  const shapes = draw();
  cachedSVG = DrawSVG.renderSVG(shapes, {
    width: w,
    height: h,
    backgroundColor: '#000000'
  });
  
  // Display the SVG
  const canvasElement = document.getElementById('canvas');
  if (canvasElement) {
    canvasElement.outerHTML = cachedSVG;
  }
  
  console.log(`${new Date().getTime() - now}ms`);
}

main();
