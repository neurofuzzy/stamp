import { drawShape } from '../src/lib/draw';
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import { Sequence } from './lib/sequence';

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

Sequence.fromStatement("random 6,10,14 AS SIZE");


function draw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, w, h);

  const distrib1 = new Stamp(new Ray(w/2 - 200, h/2 -200, 0))
    .circle({ 
      radius: 6,
      align: ShapeAlignment.CENTER,
      distribute: {
        type: "phyllotaxis",
        count: 70,
        scaleFactor: 10,
        itemScaleFalloff: 1,
      }
    });

  const distrib2 = new Stamp(new Ray(w/2 + 200, h/2 -200, 0))
    .circle({ 
      radius: "SIZE()",
      align: ShapeAlignment.CENTER,
      distribute: {
        type: "attractor",
        particleCount: 20,
        initialRadius: 100,
        simulationSteps: 200,
        hexSpacing: 20,
        strength: 1,
        damping: 0.5,
      }
    });
    
    
  drawShape(ctx, distrib1, 0);
  drawShape(ctx, distrib2, 0);
}

async function main() {
  await ClipperHelpers.init();

  const now = new Date().getTime();
  draw(ctx);
  console.log(`${new Date().getTime() - now}ms`);
}

main();
