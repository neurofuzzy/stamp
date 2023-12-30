import * as C2S from 'canvas2svg';
import { IShape, Ray, ShapeAlignment } from './geom/shapes';
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
Sequence.fromStatement("random 10,5,-5,0 as ARC", 14)

const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, w, h);
  const shapes = new Stamp(new Ray(w / 2, h / 2, 0))
    .rotate(rot)
    .rectangle("AA()", "AA", 0, 1, ShapeAlignment.TOP, 5, 5, 80, 80)
    //.rectangle(120, 20, "ARB()", 1, 9, 9, 80, 80)
   // .subtract()
   // .rectangle("AB()", "AB", 0, 1, ShapeAlignment.TOP, 5, 5, 80, 80);
  //shapes.bake();
  drawShape(ctx, shapes);
  //drawBoundingBox(ctx, shapes);
  drawBoundingCircle(ctx, shapes);
  drawCenter(ctx, shapes);
  drawBoundingBox(ctx, shapes);
  shapes.children().forEach(child => drawBoundingCircle(ctx, child));
  shapes.children().forEach(child => drawCenter(ctx, child));
  //shapes.polys().forEach(s => drawShape(ctx, s));
  shapes.children().forEach(s => drawBoundingBox(ctx, s));
}

function drawShape(ctx: CanvasRenderingContext2D, shape: IShape, shapeDepth = 0) {

  const rays = shape.generate();

  if (shapeDepth === 0) {
    ctx.beginPath();
  }
  if (rays.length) {
    ctx.moveTo(rays[0].x, rays[0].y);
    for (let i = 1; i < rays.length; i++) {
      ctx.lineTo(rays[i].x, rays[i].y);
    }
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

function drawBoundingBox(ctx: CanvasRenderingContext2D, shape: IShape) {

  const bb = shape.boundingBox();

  ctx.beginPath();
  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 0.5; 
  ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);

}

function drawBoundingCircle(ctx: CanvasRenderingContext2D, shape: IShape) {

  const bc = shape.boundingCircle();

  ctx.beginPath();
  ctx.strokeStyle = 'magenta';
  ctx.lineWidth = 0.5;
  ctx.arc(bc.x, bc.y, bc.radius, 0, 2 * Math.PI);
  ctx.stroke();

}

function drawCenter(ctx: CanvasRenderingContext2D, shape: IShape) {

  const c = shape.center;
  ctx.beginPath();
  ctx.fillStyle = 'yellow';
  ctx.arc(c.x, c.y, 2, 0, 2 * Math.PI);
  ctx.fill();

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
  
  await Stamp.init();

  function animate() {
    rot += Math.PI / 180 * 0.5;
    draw(ctx);
    //requestAnimationFrame(animate);
  }

  animate();

}


main();