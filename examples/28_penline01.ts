import * as C2S from 'canvas2svg';
import { drawShape } from '../src/lib/draw';
import { Ray } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { Circle } from '../src/geom/shapes';
import { PenLine } from '../src/lib/penline';

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
const palette = colors[8];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.seed = 2;

const draw = (ctx: CanvasRenderingContext2D) => {

//let penline = new PenLine().line(0, 50).line("-30,30 as AA", 45).repeatLast(1, 2).line("20,-20 as AB", 45).repeatLast(1, 2);
  let penline = new PenLine(new Ray(w / 2, h / 2)).line(0, 1).lines(0, 0, 1)
    .lines("repeat 0,120,240 as AA", 130, 3)
    .lines("repeat 60, -60 as AB", "repeat 120,40", 3).repeatLast(1, 2).style(PenLine.STYLE_CIRCLE).line(0,40)
    .style(PenLine.STYLE_DEFAULT)
    .lines(0, 40, 1)
    .lines("repeat 60, -60 as AB", "repeat 30,10", 3).repeatLast(1, 2).style(PenLine.STYLE_CIRCLE).line(0,18);
  penline.bake();
  let endPts = penline.getEndPoints(7);
  let ends = [];
  endPts.forEach(pt => {
    ends.push(new Circle(pt.toRay(), 5, 16));
  })

  let shapes = ClipperHelpers.offsetPathsToShape(penline.result(), 3, 4);
  shapes.forEach(shape => {
    drawShape(ctx, shape, 0);
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