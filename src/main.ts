import { IShape } from './geom/shapes';
import { Stamp } from './stamp';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="256" height="256" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const ctx = canvas.getContext('2d')!

const w = canvas.width
const h = canvas.height

ctx.fillStyle = 'white';

let rot = 0;

const draw = () => {
  ctx.clearRect(0, 0, w, h);
  const shapes = new Stamp().moveTo(w / 2, h / 2).rotate(rot).rectangle(30, 30, 1, 2, 3, 50, 50);
  shapes.bake();
  shapes.bsp().forEach(drawShape);
}

function drawShape(shape: IShape) {
  const rays = shape.flatten();
  ctx.beginPath();
  ctx.moveTo(rays[0][0], rays[0][1]);
  for (let i = 1; i < rays.length; i++) {
    ctx.lineTo(rays[i][0], rays[i][1]);
  }
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.fill();

  rays.forEach(r => {
    drawRay(r);
  });
}

function animate() {
  rot += Math.PI / 180 * 0.5;
  draw();
  requestAnimationFrame(animate);
}

animate();

function drawRay(r: number[]) {
  ctx.beginPath();
  ctx.moveTo(r[0], r[1]);
  ctx.lineWidth = 0;
  ctx.fillStyle = '#39f';
  ctx.arc(r[0], r[1], 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  ctx.beginPath();
  ctx.moveTo(r[0], r[1]);
  ctx.lineTo(r[0] + 10 * Math.cos(r[2]), r[1] + 10 * Math.sin(r[2]));
  ctx.strokeStyle = '#39f';
  ctx.lineWidth = 2;
  ctx.stroke();
}
