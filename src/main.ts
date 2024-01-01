import * as C2S from 'canvas2svg';
import { drawHatchPattern, drawShape } from './lib/draw';
import { Ray, ShapeAlignment } from "./geom/core";
import { ClipperHelpers } from './lib/clipper-helpers';
import { Hatch } from './lib/hatch';
import { Sequence } from './lib/sequence';
import { Stamp } from './lib/stamp';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const ctx = canvas.getContext('2d')!

const w = canvas.width
const h = canvas.height

ctx.fillStyle = 'white';

let rot = 0;

Sequence.seed = 1793;

Sequence.fromStatement("repeat 1,4,5,6,7 AS HATCH")
Sequence.fromStatement("random 0.25,0.25,0.5 AS HATCHSCALE")
Sequence.fromStatement("repeat 45,90,45,90,45 AS HATCHANG")
Sequence.fromStatement("random 0x111111, 0x222222, 0x333333, 0x444444, 0x555555 AS COLOR")

const draw = (ctx: CanvasRenderingContext2D) => {
 
  ctx.clearRect(0, 0, w, h);

  const grid = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    .tangram({
      width: 60,
      height: 60,
      type: "random 0,1,2,3,4,5,6,8",
      numX: 6,
      numY: 6,
      spacingX: 70,
      spacingY: 70,
      style: {
        hatchAngle: "HATCHANG()",
        hatchPattern: "HATCH()",
        hatchScale: "HATCHSCALE()",
        fillColor: "COLOR()",
        strokeColor: "0xFFFFFF",
        strokeThickness: 0
      }
    })
    .subtract()
    .circle({
      radius: 20,
      divisions: 32,
      numX: 6,
      numY: 6,
      spacingX: 70,
      spacingY: 70,
    });

  const grid2 = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    .circle({
      radius: 20,
      divisions: 32,
      numX: 6,
      numY: 6,
      spacingX: 70,
      spacingY: 70,
      style: {
        hatchAngle: "HATCHANG()",
        hatchPattern: "HATCH()",
        hatchScale: "HATCHSCALE()",
        fillColor: "COLOR()",
        strokeColor: "0xFFFFFF",
        strokeThickness: 0
      }
    });

  // draw children
  grid.children().forEach(child => drawShape(ctx, child));
  grid.children().forEach(child => {
    if (child.style.hatchPattern) {
      const fillPattern = Hatch.applyHatchToShape(child);
      drawHatchPattern(ctx, fillPattern);
    }
  });

  grid2.children().forEach(child => drawShape(ctx, child));
  grid2.children().forEach(child => {
    if (child.style.hatchPattern) {
      const fillPattern = Hatch.applyHatchToShape(child);
      drawHatchPattern(ctx, fillPattern);
    }
  })
}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width, canvas.height);
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

  function animate() {
    rot += Math.PI / 180 * 0.5;
    draw(ctx);
    //requestAnimationFrame(animate);
  }

  animate();

}


main();