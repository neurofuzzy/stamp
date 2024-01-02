import { IHatchPattern } from "../geom/hatch-patterns";
import { BoundingBox, BoundingCircle, IShape, Point } from "../geom/core";

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: IShape,
  shapeDepth = 0
) {
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
  shape.children().forEach((child) => drawShape(ctx, child, shapeDepth + 1));
  ctx.closePath();

  if (shapeDepth === 0) {
    const fs =
      shape.style.fillColor !== undefined &&
      !isNaN(parseInt(`${shape.style.fillColor}`))
        ? `#${shape.style.fillColor.toString(16).padStart(6, "0")}`
        : `${shape.style.fillColor}`;
    ctx.fillStyle = fs || "transparent";
    const ss =
      shape.style.strokeColor !== undefined &&
      !isNaN(parseInt(`${shape.style.strokeColor}`))
        ? `#${shape.style.strokeColor.toString(16).padStart(6, "0")}`
        : `${shape.style.strokeColor}`;
    ctx.strokeStyle = ss || "transparent";
    const lw = parseFloat(`${shape.style.strokeThickness}`) || 0;
    ctx.lineWidth = lw;
    if (!lw) ctx.strokeStyle = "transparent";

    ctx.fill("evenodd");
    ctx.stroke();
  }
}

export function drawHatchPattern(
  ctx: CanvasRenderingContext2D,
  hatch: IHatchPattern
) {
  const segments = hatch.generate();

  ctx.beginPath();
  segments.forEach((seg) => {
    ctx.moveTo(seg.points[0].x, seg.points[0].y);
    for (let i = 1; i < seg.points.length; i++) {
      ctx.lineTo(seg.points[i].x, seg.points[i].y);
    }
  });

  const ss =
    hatch.style.hatchStrokeColor !== undefined &&
    !isNaN(parseInt(`${hatch.style.hatchStrokeColor}`))
      ? `#${hatch.style.hatchStrokeColor.toString(16).padStart(6, "0")}`
      : `${hatch.style.strokeColor}`;

  ctx.strokeStyle = ss || "transparent";
  const lw = parseFloat(`${hatch.style.hatchStrokeThickness}`) || 0.5;
  ctx.lineWidth = lw;
  if (!lw) ctx.strokeStyle = "transparent";
  ctx.stroke();
}

export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  bb: BoundingBox
) {
  ctx.beginPath();
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);
}

export function drawBoundingCircle(
  ctx: CanvasRenderingContext2D,
  bc: BoundingCircle
) {
  ctx.beginPath();
  ctx.strokeStyle = "magenta";
  ctx.lineWidth = 0.5;
  ctx.arc(bc.x, bc.y, bc.radius, 0, 2 * Math.PI);
  ctx.stroke();
}

export function drawCenter(ctx: CanvasRenderingContext2D, c: Point) {
  ctx.beginPath();
  ctx.fillStyle = "yellow";
  ctx.arc(c.x, c.y, 2, 0, 2 * Math.PI);
  ctx.fill();
}
