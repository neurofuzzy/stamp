import * as C2S from 'canvas2svg';
import { drawShape } from '../src/lib/draw';
import { Ray, ShapeAlignment } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Hatch } from '../src/lib/hatch';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType } from '../src/geom/hatch-patterns';

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
const palette = colors[86];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 60,-60 AS RANGLE");
Sequence.fromStatement("repeat 40,60 AS RLENGTH")
Sequence.fromStatement("9,9,6 AS RSTEP")


const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      fillColor: "COLOR()",
      strokeThickness: 0
    })
    .bone({
      length: "RLENGTH()",
      bottomRadius: 5,
      topRadius: 5,
      divisions: 2,
      align: ShapeAlignment.TOP,
    })
    .forward({ distance: "RLENGTH" })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 3, times: 4 })
    .circle({
      radius: 20,
      outlineThickness: 6
    })
    .subtract()
    .circle({
      radius: 10
    })
    .add()
    .stepBack({ steps: "RSTEP()" })
    .repeatLast({ steps: 9, times: 3 });
    
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