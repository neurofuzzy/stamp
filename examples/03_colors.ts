import * as C2S from 'canvas2svg';
import { drawHatchPattern, drawShape, drawShapeWithChildren } from '../src/lib/draw';
import { IStyle, Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';

import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';

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

Sequence.seed = 2112;
console.log(colors)

Sequence.fromStatement("random 30,60,60,90,90,120 AS RW")
Sequence.fromStatement("random 0[2],1[7] AS SKIP")
Sequence.fromStatement("random 5,RW-25 AS OFFSET")

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[83];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 3);


const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const style: IStyle = {
    strokeThickness: 0,
    fillColor: "COLOR()",
  }

  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .add()
    .roundedRectangle({ width: "RW()", height: 30, cornerRadius: 15, divisions: 3, align: ShapeAlignment.RIGHT, style })
    .subtract()
    .circle({ radius: 10, divisions: 32, align: ShapeAlignment.RIGHT, offsetX: "OFFSET()", skip: "SKIP()", style })
    .move({ x: "RW + 10", y: 0 })
    .repeatLast({ steps: 5, times: 5 })
    .move({ x: -510, y: 40 })
    .repeatLast({ steps: 7, times: 11 })

  
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


  // draw children with automatic hatch handling
  drawShapeWithChildren(ctx, grid);

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