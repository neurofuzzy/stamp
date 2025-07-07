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
    // Head
    .rectangle({ width: 250, height: 250, align: ShapeAlignment.CENTER })
    // Left eye
    .subtract()
    .moveTo(-45, -40)
    .rectangle({ width: 48, height: 48 })
    .add()
    .rectangle({ width: 20, height: 20 })
    // Right eye
    .subtract()
    .moveTo(45, -40)
    .rectangle({ width: 48, height: 48 })
    .add()
    .rectangle({ width: 20, height: 20 })
    // Smile (simple arc/ellipse for mouth)
    .subtract()
    .moveTo(0, 50)
    .rectangle({ width: 140, height: 20, align: ShapeAlignment.BOTTOM })
    .rotate(90)
    .forward(70)
    .rectangle({ width: 40, height: 20, align: ShapeAlignment.BOTTOM })
    .rotate(180)
    .forward(140)
    .rectangle({ width: 40, height: 20, align: ShapeAlignment.BOTTOM })
    
  drawShape(ctx, face, 0);
}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    // draw the boundary
    ctx2.backgroundColor = "#000";
    // draw the shapes
    draw(ctx2);
    // download the SVG
    const svg = ctx2.getSerializedSvg(false).split("#FFFFFF").join("#000000");
    const svgNoBackground = svg.replace(/\<rect.*?\>/g, "");
    const blob = new Blob([svgNoBackground], { type: "image/svg+xml" });
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
