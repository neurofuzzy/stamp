import { IShape } from './geom/shapes';

export function drawShape(ctx: CanvasRenderingContext2D, shape: IShape, shapeDepth = 0) {

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
