import * as C2S from 'canvas2svg';
import { drawPath, drawShape } from '../src/lib/draw';
import { Ray } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { Optimize } from '../src/lib/optimize';

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

Sequence.seed = 256;
Sequence.seed = 512;
Sequence.seed = 123;
Sequence.seed = 316;
Sequence.seed = 322;
Sequence.seed = 327;
Sequence.seed = 334;
//Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60 AS RANGLE");
//Sequence.fromStatement("shuffle -72,-72,-72,-72,-72,-72,-72,-72,72,72,72,72,72,72,72,72,72,72,-36 AS RANGLE");
Sequence.fromStatement("shuffle -144,-144,-144,-144,-144,-144,-144,-144,144,144,144,144,144,144,144,144,144,144,-72 AS RANGLE");
//Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60,30 AS RANGLE");
Sequence.fromStatement("shuffle 0,1,0,1,0,1 AS BSKIP")
Sequence.fromStatement("repeat 10,10 AS BERRY")

const len = 200;
const weight = 2;

const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      strokeThickness: 0,
      fillColor: "cyan",
    })
    .circle({
      radius: 2,
      divisions: 6,
      skip: "repeat 0,1,0"
    })
    .forward(len)
    .circle({
      radius: 2,
      divisions: 6,
      skip: "repeat 0,1,0"
    })
    .rotate("RANGLE()")
    .repeatLast(4, 200)

  const tree = lattice;

  let path = tree.path();

  let segs = Optimize.segments([path]);

  segs.forEach(seg => {
    drawPath(ctx, seg, 0);
    //drawPathGhosted(ctx, seg, 0);
  });

  drawShape(ctx, lattice)
  
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