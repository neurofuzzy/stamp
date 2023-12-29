import * as C2S from 'canvas2svg';
import { IShape } from './geom/shapes';
import { Stamp } from './stamp';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="512" height="512" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const ctx = canvas.getContext('2d')!

const w = canvas.width
const h = canvas.height

ctx.fillStyle = 'white';

let rot = 0;

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);
  const shapes = new Stamp()
    .moveTo(w / 2, h / 2)
    .rotate(rot)
    .roundedRectangle(60, 60, 8, 1, 5, 5, 20, 20)
    .subtract()
    //.add()
    .rectangle(40, 40, 1, 5, 5, 40, 40);//.circle(20, 16, 3, 4, 20, 20);//.rectangle(30, 30, 1, 10, 10, 20, 20);
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
    ctx.lineWidth = 0.25; 
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
    requestAnimationFrame(animate);
  }

  animate();

}


main();