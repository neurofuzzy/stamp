import * as C2S from 'canvas2svg';
import { drawHatchPattern, drawShape } from '../src/lib/draw';
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Hatch } from '../src/lib/hatch';
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


function draw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, w, h);

  // Compose the face using Stamp's composition API
  const face = new Stamp(new Ray(w/2, h/2, 0))
  .defaultStyle({
    // fillColor: "COLOR()",
    strokeThickness: 1,
    fillColor: 0,
  })
    // Head
    .circle({ radius: 120 })
    // Left eye
    .subtract()
    .moveTo(-45, -40)
    .circle({ radius: 18 })
    .circle({ radius: 7 })
    // Right eye
    .subtract()
    .moveTo(45, -40)
    .circle({ radius: 18 })
    .circle({ radius: 7 })
    // Smile (simple arc/ellipse for mouth)
    .subtract()
    .moveTo(0, 50)
    .rectangle({ width: 60, height: 28, align: ShapeAlignment.BOTTOM })
    
  
  face.children().forEach(child => drawShape(ctx, child));
}


async function main() {
  
  await ClipperHelpers.init();

  const now = new Date().getTime();
  draw(ctx);
  console.log(`${new Date().getTime() - now}ms`);

}


main();