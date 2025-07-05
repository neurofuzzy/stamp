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
const palette = colors[79];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 137.508 AS RANGLE", 0, 5);
Sequence.fromStatement("repeat 200 AS RLENGTH")
Sequence.fromStatement("repeat 20,16,16,12,12,8,8,4,4,4 AS RWEIGHT")
Sequence.fromStatement("repeat 170 AS BERRY")


const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 2.5,
      fillColor: 0,
    })
    .forward({ distance: "RLENGTH()" })
    .rotate({ rotation: "RANGLE()" })
    .rotate({ rotation: 72 })
    .leafShape({
      radius: "BERRY()",
      outlineThickness: 12,
      divisions: 36,
      splitAngle: 50,
      splitAngle2: 80,
      serration: 0,
      align: ShapeAlignment.TOP
    }).
    circle({
      radius: 30,
      divisions: 36,
      outlineThickness: 12,
    })
    .repeatLast({ steps: 3, times: 5 })
    .repeatLast({ steps: 6, times: 6 })

  const tree2 = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 3.5,
      fillColor: 0,
    })
    .forward({ distance: "RLENGTH()" })
    .rotate({ rotation: "RANGLE()" })
    .rotate({ rotation: 72 })
    .leafShape({
      radius: 152,
      outlineThickness: 0,
      divisions: 36,
      splitAngle: 54,
      splitAngle2: 90,
      serration: 0,
      align: ShapeAlignment.TOP
    }).
    circle({
      radius: 30,
      divisions: 36,
      outlineThickness: 0,
    })
    .repeatLast({ steps: 3, times: 5 })
    .repeatLast({ steps: 6, times: 6 })

  // draw children
  tree2.children().forEach(child => {
    if (child.style.hatchBooleanType === HatchBooleanType.DIFFERENCE || child.style.hatchBooleanType === HatchBooleanType.INTERSECT) {
      const shape = Hatch.subtractHatchFromShape(child);
      if (shape) drawShape(ctx, shape)
    } else {
      drawShape(ctx, child)
    }
  });
  tree.children().forEach(child => {
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