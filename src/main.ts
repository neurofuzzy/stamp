import * as C2S from 'canvas2svg';
import { drawRay, drawShape } from '../src/lib/draw';
import { Ray, ShapeAlignment } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Hatch } from '../src/lib/hatch';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType } from '../src/geom/hatch-patterns';
import { Circle, LeafShape, Rectangle } from './geom/shapes';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ratio = 2;
canvas.width = 768 * ratio
canvas.height = 768 * ratio
canvas.style.width = '768px'
canvas.style.height = '768px'
const ctx = canvas.getContext('2d')!
ctx.scale(ratio, ratio)
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = 'white';

Sequence.seed = 1;

const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const child = new Circle(new Ray(w / 2, h / 2, 0), 100, 24, ShapeAlignment.TOP);
  const child2 = new LeafShape(
    new Ray(w / 2, h / 2, 1), 300, 16, 50, 80, ShapeAlignment.TOP
  );

  console.log(child2.generate())
  // draw children
  drawShape(ctx, child)
  drawShape(ctx, child2)
  child2.generate().forEach((r, idx) => {
    if (idx < 7) drawRay(ctx, r)
  });
  child.generate().forEach((r, idx) => {
    if (idx < 8) drawRay(ctx, r)
  });
  drawRay(ctx, child2.center)

}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
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