import * as C2S from 'canvas2svg';
import { drawPath, drawShape } from './lib/draw';
import { Ray, ShapeAlignment } from './geom/core';
import { ClipperHelpers } from './lib/clipper-helpers';
import { Sequence } from './lib/sequence';
import { Stamp } from './lib/stamp';
import './style.css';
import colors from 'nice-color-palettes';
import { GridStampLayout } from './lib/stamp-layout';
import { GeomHelpers } from './geom/helpers';

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

Sequence.seed = 27;


const len = 50;
const weight = 16;

const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  Sequence.fromStatement("shuffle -72,72,72,72 AS RINGLE");
  Sequence.fromStatement("shuffle -72,-72,72,72,RINGLE() AS RANGLE");
  
  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      strokeThickness: 1,
      strokeColor: "#ffffff",
      fillColor: "#222222",
    })
    .forward(len)
    .bone({
      topRadius: weight / 2,
      bottomRadius: weight / 2,
      length: len,
      divisions: 3,
      align: ShapeAlignment.BOTTOM
    })
    .rotate("RANGLE()")
    .repeatLast(3, 240)

  let paths = lattice.path();
  let shapes = ClipperHelpers.offsetPathsToShape(paths, 4);
  lattice.children().forEach(shape => {
    drawShape(ctx, shape, 0);
  });
  shapes.forEach(shape => {
    drawShape(ctx, shape, 0);
  });
  paths.forEach(path => {
    drawPath(ctx, path, 0, "#cccccc");
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