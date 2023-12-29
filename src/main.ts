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

async function main() {
  
  await Stamp.init();

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const shapes = new Stamp()
      .moveTo(w / 2, h / 2)
      .rotate(rot)
      .roundedRectangle(60, 60, 8, 1, 3, 3, 40, 40)
      .subtract()
      //.add()
      .rectangle(40, 40, 1, 3, 3, 60, 60);//.circle(20, 16, 3, 4, 20, 20);//.rectangle(30, 30, 1, 10, 10, 20, 20);
    shapes.bake();
    shapes.polys().forEach(s => drawShape(s));
    
  }

  function drawShape(shape: IShape, shapeDepth = 0) {

    const rays = shape.flatten();

    if (shapeDepth === 0) {
      ctx.beginPath();
    }
    ctx.moveTo(rays[0][0], rays[0][1]);
    for (let i = 1; i < rays.length; i++) {
      ctx.lineTo(rays[i][0], rays[i][1]);
    }
    shape.children().forEach(child => drawShape(child, shapeDepth + 1));
    ctx.closePath();

    if (shapeDepth === 0) {
      ctx.strokeStyle = 'white';
      ctx.fillStyle = '#333';
      ctx.lineWidth = 0.25; 
      ctx.fill('evenodd');
      ctx.stroke();
    }
    

    rays.forEach(r => {
      //drawRay(r);
    });
  }

  function animate() {
    rot += Math.PI / 180 * 0.5;
    draw();
    //requestAnimationFrame(animate);
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

}

main();