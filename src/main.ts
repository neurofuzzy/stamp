import * as C2S from 'canvas2svg';
import { drawCenter, drawHatchPattern, drawRay, drawShape } from './lib/draw';
import { IStyle, Ray, ShapeAlignment } from './geom/core';
import { ClipperHelpers } from './lib/clipper-helpers';
import { Hatch } from './lib/hatch';
import { Sequence } from './lib/sequence';
import { Stamp } from './lib/stamp';
import './style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType } from './geom/hatch-patterns';
import { Bone } from './geom/shapes';

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

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[96];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 3);

Sequence.fromStatement("repeat 60,-60 AS RANGLE");
Sequence.fromStatement("repeat 40,60 AS RLENGTH")
Sequence.fromStatement("9,9,6 AS RSTEP")


const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .bone({
      length: "RLENGTH()",
      bottomRadius: 5,
      topRadius: 5,
      divisions: 2,
      align: ShapeAlignment.TOP,
    })
    .forward("RLENGTH")
    .rotate("RANGLE()")
    .repeatLast(3, 4)
    .circle({
      radius: 20,
      outlineThickness: 6
    })
    .subtract()
    .circle({
      radius: 10
    })
    .add()
    .stepBack("RSTEP()")
    .repeatLast(9, 3);
    

  console.log(grid.generate())
  // draw children
  grid.children().forEach(child => {
    if (child.style.hatchBooleanType === HatchBooleanType.DIFFERENCE || child.style.hatchBooleanType === HatchBooleanType.INTERSECT) {
      const shape = Hatch.subtractHatchFromShape(child);
      if (shape) drawShape(ctx, shape)
    } else {
      drawShape(ctx, child)
    }
  });
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