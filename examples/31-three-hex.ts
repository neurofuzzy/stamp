import * as C2S from 'canvas2svg';
import { drawPath, drawShape } from '../src/lib/draw';
import { Ray } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { GridStampLayout } from '../src/lib/stamp-layout';
import { GeomHelpers } from '../src/geom/helpers';
import { GeomUtils } from '../src/geom/util';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ratio = 2;
canvas.width = 900 * ratio
canvas.height = 1600 * ratio
canvas.style.width = '900px'
canvas.style.height = '1600px'
const ctx = canvas.getContext('2d')!
ctx.scale(ratio, ratio)
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = 'white';

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
Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60 AS RANGLE");
//Sequence.fromStatement("shuffle -72,-72,-72,-72,-72,-72,-72,-72,72,72,72,72,72 AS RANGLE");
//Sequence.fromStatement("shuffle -72,-72,72,72,72,72,72 AS RANGLE");
//Sequence.fromStatement("shuffle -144,-144,-144,-144,-144,-144,-144,-144,144,144,144,144,144,144,144,144,144,144,-72,-72,-72,72 AS RANGLE");
//Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60,30 AS RANGLE");
Sequence.fromStatement("shuffle 0,1,0,1,0,1 AS BSKIP")
Sequence.fromStatement("repeat 10,10 AS BERRY")

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
    .forward(len)
    .circle({
      radius: 2,
      divisions: 3,
      skip: 1
    })
    .rotate("RANGLE()")
    .repeatLast(3, 240)

  //const seeds = Sequence.fromStatement("repeat 120347,18648,9847,72398,12030,1923", 12);
  //const seeds = Sequence.fromStatement("repeat 891274,23305972,12049842978,398085,851295,149899", 12);
  //const seeds = Sequence.fromStatement("shuffle 7,12,26,35,66,113,108,93,91,", 12);
  //const seeds = Sequence.fromStatement("repeat 45654245,6212575556,45618461976,86294281448,621286238642389462", 12);
  //const seeds = Sequence.fromStatement("repeat 57,5,43,4,49,42,33,26,47,56", 12);
  const seeds = Sequence.fromStatement("repeat 222,318,213,256,257,4,5,49,42,33", 12);

  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: lattice,
    seedSequence: seeds,
    rows: 3,
    columns: 1,
    rowSpacing: 480,
    columnSpacing: 420,
  });

  let pathSets = grid.children().map(x => {
    let path = x.path();
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = 200 / c.radius;
      return x.path(scale);
    }
    return path;
  });

  pathSets.forEach((paths) => {
    
    let shapes = ClipperHelpers.offsetPathsToShape(paths, 8, 4, true);
    shapes.forEach(shape => {
      drawShape(ctx, shape, 0);
      console.log("shape perimeter", GeomUtils.measureShapePerimeter(shape));
    });
    /*
    shapes = ClipperHelpers.offsetPathsToShape(paths, 4, 4, true);
    shapes.forEach(shape => {
      drawShape(ctx, shape, 0);
      console.log("shape perimeter", GeomUtils.measureShapePerimeter(shape));
    });
    */
    paths.forEach((path) => {
      //drawPath(ctx, path, 0, "0xFFFFFF");
    });
  });
  
}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    // draw the boundary
    ctx2.backgroundColor = '#000';
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