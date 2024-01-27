import * as C2S from 'canvas2svg';
import { drawCenter, drawHatchPattern, drawRay, drawShape } from './lib/draw';
import { IStyle, Ray, ShapeAlignment } from './geom/core';
import { ClipperHelpers } from './lib/clipper-helpers';
import { Hatch } from './lib/hatch';
import { Sequence } from './lib/sequence';
import { Stamp } from './lib/stamp';
import './style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType, HatchPatternType } from './geom/hatch-patterns';
import { Bone } from './geom/shapes';

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
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("binary 60,-60 AS RANGLE", 2, 4);
Sequence.fromStatement("repeat 8,12 AS MLENGTH");
Sequence.fromStatement("repeat 120,100,70,40,MLENGTH() AS RLENGTH")
Sequence.fromStatement("repeat 20,16,16,12,12,8,8,4,4,4 AS RWEIGHT")
Sequence.fromStatement("repeat 10,10 AS BERRY")


const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      hatchPattern: HatchPatternType.OFFSET,
      hatchScale: 0.199,
      strokeThickness: 1,
      hatchStrokeThickness: 1,
      fillColor: "#333333",
    })
    .bone({
      length: 24,
      bottomRadius: 4,
      topRadius: 4,
      divisions: 6,
      align: ShapeAlignment.TOP,
      outlineThickness: 0
    })
    .circle({
      radius: 8,
      divisions: 6,
      offsetY: 24,
      angle: 15,
    })
    .forward(24)
    .rotate("RANGLE()")
    .repeatLast(4, 400)

  // draw children
  tree.children().forEach(child => {
    if (child.style.hatchBooleanType === HatchBooleanType.DIFFERENCE || child.style.hatchBooleanType === HatchBooleanType.INTERSECT) {
      const shape = Hatch.subtractHatchFromShape(child);
      if (shape) drawShape(ctx, shape)
    } else {
      drawShape(ctx, child)
    }
  });
  tree.children().forEach(child => {
    if (child.style.hatchPattern && child.style.hatchBooleanType !== HatchBooleanType.DIFFERENCE && child.style.hatchBooleanType !== HatchBooleanType.INTERSECT) {
      const fillPattern = Hatch.applyHatchToShape(child, false);
      if (fillPattern)
        drawHatchPattern(ctx, fillPattern);
    }
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