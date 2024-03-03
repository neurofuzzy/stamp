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
canvas.width = 1200 * ratio
canvas.height = 1600 * ratio
canvas.style.width = '1200px'
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

  //Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,60,-60,-60,60,60,60,60,-60,60,60,60,-60,60,-60,-60,60,60,60,60,60,60 AS RANGLE");
  //const seeds = Sequence.fromStatement("repeat 257,4,5,6,9,122,101,127,115", 12);

  //Sequence.fromStatement("shuffle -72,-72,-72,-72,-72,-72,72,72,72,180 AS RANGLE");
  //const seeds = Sequence.fromStatement("repeat 122,128,157,170,191,202,278,368,297", 12);

  Sequence.fromStatement("shuffle -90,180,180,0,90,-90,-90,90,90,90 AS RANGLE");
  //const seeds = Sequence.fromStatement("repeat 122,128,157,170,191,202,278,368,297", 12);
  const seeds = Sequence.fromStatement("repeat 80-100", 12);

  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: lattice,
    seedSequence: seeds,
    rows: 4,
    columns: 3,
    rowSpacing: 380,
    columnSpacing: 380,
  });

  let pathSets = grid.children().map(x => {
    let path = x.path();
    let c = GeomHelpers.boundingCircleFromPaths(path);
    if (c) {
      let scale = 150 / c.radius;
      return x.path(scale);
    }
    return path;
  });

  pathSets.forEach((paths) => {
    
    let shapes = ClipperHelpers.offsetPathsToShape(paths, 10, 4, true, true);
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