import { drawShape } from '../src/lib/draw';
import { IStyle, Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import { Sequence } from '../src/lib/sequence';
import colors from 'nice-color-palettes';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ratio = 2;
canvas.width = 768 * ratio
canvas.height = 1024 * ratio
canvas.style.width = '768px'
canvas.style.height = '1024px'
const ctx = canvas.getContext('2d')!
ctx.scale(ratio, ratio)
const w = canvas.width / ratio;
const h = canvas.height / ratio;

const palette = colors[83];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 3);

Sequence.fromStatement("repeat 15,20,25 AS SIZE");


function draw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, w, h);

  const style: IStyle = {
    strokeThickness: 0,
    fillColor: "COLOR()",
  }

  const distrib0 = new Stamp(new Ray(w/2, h/2, 0))
    .roundedRectangle({ 
      width: 30,
      height: 30,
      cornerRadius: 5,
      divisions: 3,
      align: ShapeAlignment.CENTER,
      style: {
        fillColor: "#ff0000",
        strokeColor: "#000000",
        strokeThickness: 2,
      }
    }).move({ x: 0, y: 40 })
    .repeatLast({ steps: 2, times: 5 });

  const distrib1 = new Stamp(new Ray(w/2 - 200, h/2 -300, 0))
    .defaultStyle(style)
    .circle({ 
      radius: 10,
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: "grid",
        columns: 10,
        rows: 10,
        columnSpacing: 30,
        rowSpacing: 30,
        itemScaleFalloff: 1.5,
      }
    });

  const distrib2 = new Stamp(new Ray(w/2 + 200, h/2 -300, 0))
    .circle({ 
      radius: 12,
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: "phyllotaxis",
        count: 70,
        scaleFactor: 16,
        itemScaleFalloff: 1.5,
        skipFirst: 10,
      }
    });

  const distrib3 = new Stamp(new Ray(w/2 - 200, h/2 +0, 0))
    .circle({ 
      radius: "SIZE()",
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: "attractor",
        particleCount: 42,
        initialRadius: 200,
        simulationSteps: 1000,
        hexSpacing: 40,
        strength: 1,
        damping: 0,
        padding: 6,
        itemScaleFalloff: 1,
      }
    });
    
  const distrib4 = new Stamp(new Ray(w/2 + 200, h/2 +0, 0))
    .circle({ 
      radius: 10,
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: 'poisson-disk',
        maxPoints: 100,
        minDistance: 25,
        width: 200,
        height: 200,
        seed: 121,
        itemScaleFalloff: 1.0,
      }
    });

  const distrib5 = new Stamp(new Ray(w/2 - 200, h/2 + 300, 0))
    .circle({ 
      radius: 12,
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: "poincare",
        count: 60,
        radius: 130,
        density: 0.76,
        seed: 120,
        itemScaleFalloff: 1.0,
      }
    });
    
  const distrib6 = new Stamp(new Ray(w/2 + 200, h/2 + 300, 0))
    .circle({ 
      radius: 10,
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: 'hexagonal',
        columns: 10,
        rows: 10,
        spacing: 30,
        itemScaleFalloff: 1.5,
      }
    });

  drawShape(ctx, distrib0);
  drawShape(ctx, distrib1);
  drawShape(ctx, distrib2);
  drawShape(ctx, distrib3);
  drawShape(ctx, distrib4);
  drawShape(ctx, distrib5);
  drawShape(ctx, distrib6);
}

async function main() {
  await ClipperHelpers.init();

  const now = new Date().getTime();
  draw(ctx);
  console.log(`${new Date().getTime() - now}ms`);
}

main();
