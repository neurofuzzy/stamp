import * as C2S from 'canvas2svg';
import { drawShapeWithChildren } from '../src/lib/draw';
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';

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

Sequence.seed = 1795;

Sequence.fromStatement("random 1,2,3,4,5,6,7 AS HATCH")
Sequence.fromStatement("random 0.25,0.25,0.5 AS HATCHSCALE")
Sequence.fromStatement("random 45,90,45,90,45 AS HATCHANG")
Sequence.fromStatement("random 0x111111, 0x222222, 0x333333, 0x444444, 0x555555 AS COLOR")

const draw = (ctx: CanvasRenderingContext2D) => {
 
  ctx.clearRect(0, 0, w, h);

  const gridSize = 10;

  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .tangram({
      width: 60,
      height: 60,
      type: 10,//"random 0,1,2,3,4,5,6,8",
      numX: gridSize,
      numY: gridSize,
      spacingX: 70,
      spacingY: 70,
      style: {
        hatchAngle: "HATCHANG()",
        hatchPattern: "HATCH()",
        hatchScale: "HATCHSCALE()",
        fillColor: "0x000000",//"COLOR()",
        fillAlpha: 0,
        strokeColor: "0xFFFFFF",
        hatchStrokeColor: "0xFFFFFF",
        hatchStrokeThickness: 0.5,
        hatchInset: 1,
        strokeThickness: 1
      }
    })
    .subtract()
    .circle({
      radius: 20,
      divisions: 64,
      numX: gridSize,
      numY: gridSize,
      spacingX: 70,
      spacingY: 70,
    });

  const grid2 = new Stamp(new Ray(w / 2, h / 2, 0))
    .circle({
      radius: 20,
      divisions: 64,
      numX: gridSize,
      numY: gridSize,
      spacingX: 70,
      spacingY: 70,
      style: {
        hatchAngle: "HATCHANG()",
        hatchPattern: "HATCH()",
        hatchScale: "HATCHSCALE()",
        fillColor: "0x000000",//"COLOR()","COLOR()",
        fillAlpha: 0,
        strokeColor: "0xFFFFFF",
        hatchStrokeColor: "0xFFFFFF",
        hatchStrokeThickness: 0.5,
        hatchInset: 0.5,
        strokeThickness: 0
      }
    });

  drawShapeWithChildren(ctx, grid);
  drawShapeWithChildren(ctx, grid2);
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
    const blob = new Blob([svg], {type: "image/svg+xml"});
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