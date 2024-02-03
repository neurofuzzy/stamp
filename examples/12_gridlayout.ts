import * as C2S from 'canvas2svg';
import { drawPath } from '../src/lib/draw';
import { Ray } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { GridStampLayout } from '../src/lib/stamp-layout';
import { GeomHelpers } from '../src/geom/helpers';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ratio = 2;
canvas.width = 900 * ratio
canvas.height = 900 * ratio
canvas.style.width = '900px'
canvas.style.height = '900px'
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
//Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60 AS RANGLE");
Sequence.fromStatement("shuffle -72,-72,-72,-72,-72,-72,-72,-72,72,72,72,72,72,72,72,72,72,72,-36 AS RANGLE");
//Sequence.fromStatement("shuffle -144,-144,-144,-144,-144,-144,-144,-144,144,144,144,144,144,144,144,144,144,144,-72,36 AS RANGLE");
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
      divisions: 6,
      skip: 1
    })
    .rotate("RANGLE()")
    .repeatLast(3, 240)

    // Sequence.fromStatement("repeat 181,270,254,17,316,778,759,266,62,29,7,2493251,238", 7),
  const grid = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    stamp: lattice,
    seedSequence: Sequence.fromStatement("repeat 755,316,251,1092,3043305,277,293,1202,305", 12),
    rows: 3,
    columns: 3,
    rowSpacing: 240,
    columnSpacing: 240
  });

  let pathSets = grid.children().map(x => {
    let path = x.path();
    let c = GeomHelpers.boundingCircleFromSegments(path);
    if (c) {
      let scale = 90 / c.radius;
      return x.path(scale);
    }
    return path;
  });

  pathSets.forEach(paths => {
    paths.forEach(seg => {
      drawPath(ctx, seg, 0);
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