import { drawShape } from '../src/lib/draw';
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
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


function draw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, w, h);

  const distrib = new Stamp(new Ray(w/2, h/2, 0))
    .circle({ 
      radius: 24,
      align: ShapeAlignment.CENTER,
      distribute: {
        type: "grid2",
        columns: 5,
        rows: 5,
        columnSpacing: 56,
        rowSpacing: 56,
        itemScaleFalloff: 1
      }
    });
    
  drawShape(ctx, distrib, 0);
}

async function main() {
  await ClipperHelpers.init();

  const now = new Date().getTime();
  draw(ctx);
  console.log(`${new Date().getTime() - now}ms`);
}

main();
