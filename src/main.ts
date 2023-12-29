import * as C2S from 'canvas2svg';
import { IShape } from './geom/shapes';
import { Stamp } from './stamp';
import './style.css';
import { Sequence } from './sequence';

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

Sequence.fromStatement("random 40,50,60,70 as AA", 14)
Sequence.fromStatement("random 20,30,40,50 as AB", 14)
Sequence.fromStatement("random 5,10,15,20 as AC", 14)
Sequence.fromStatement("random 10,5,-5,0 as ARA", 14)
Sequence.fromStatement("random 10,5,-5,0 as ARB", 14)

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);
  const shapes = new Stamp()
    .moveTo(w / 2, h / 2)
    .rotate(rot)
    .roundedRectangle("AA()", "AA", "ARA()", 8, 1, 9, 9, 80, 80)
    .subtract()
    .rectangle("AB()", "AB", "ARB()", 1, 9, 9, 80, 80)
    .add()
    .circle("AC()", 64, 9, 9, 80, 80);
  shapes.bake();
  shapes.polys().forEach(s => drawShape(ctx, s));
}

function drawShape(ctx: CanvasRenderingContext2D, shape: IShape, shapeDepth = 0) {

  const rays = shape.flatten();

  if (shapeDepth === 0) {
    ctx.beginPath();
  }
  ctx.moveTo(rays[0][0], rays[0][1]);
  for (let i = 1; i < rays.length; i++) {
    ctx.lineTo(rays[i][0], rays[i][1]);
  }
  shape.children().forEach(child => drawShape(ctx, child, shapeDepth + 1));
  ctx.closePath();

  if (shapeDepth === 0) {
    ctx.strokeStyle = 'white';
    ctx.fillStyle = '#333';
    ctx.lineWidth = 0.5; 
    ctx.fill('evenodd');
    ctx.stroke();
  }

}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width, canvas.height);
    // draw the boundary
    // draw the shapes
    draw(ctx2);
    // download the SVG
    const svg = ctx2.getSerializedSvg(true);
    const blob = new Blob([svg], {type: "image/svg+xml"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

async function main() {
  
  await Stamp.init();

  function animate() {
    rot += Math.PI / 180 * 0.5;
    draw(ctx);
    //requestAnimationFrame(animate);
  }

  animate();

}


main();