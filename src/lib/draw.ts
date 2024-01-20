import { IHatchPattern } from "../geom/hatch-patterns";
import { BoundingBox, BoundingCircle, IShape, IStyle, Point, Ray } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";

const applyDefaults = (style: IStyle) => {
  const out = Object.assign({}, style);
  if (out.strokeColor === undefined) out.strokeColor = "#cccccc";
  if (out.fillColor === undefined) out.fillColor = "#cccccc";
  if (out.strokeThickness === undefined) out.strokeThickness = 1;
  return out;
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: IShape,
  shapeDepth = 0
) {
  const style = applyDefaults(shape.style);
  if (style.fillAlpha === 0 && style.strokeThickness === 0) {
    return;
  }

  const rays = shape.generate();

  if (shapeDepth === 0) {
    ctx.beginPath();
  }
  if (rays.length) {
    ctx.moveTo(rays[0].x, rays[0].y);
    for (let i = 1; i < rays.length - 1; i++) {
      ctx.lineTo(rays[i].x, rays[i].y);
    }
    if (!GeomHelpers.pointsAreEqual(rays[0], rays[rays.length - 1])) {
      ctx.lineTo(rays[rays.length - 1].x, rays[rays.length - 1].y);
    }
    ctx.closePath();
  }
  shape.children().forEach((child) => drawShape(ctx, child, shapeDepth + 1));
  
  if (shapeDepth === 0) {
    if (style.fillAlpha === 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
    } else {
      const fs =
        style.fillColor !== undefined &&
        !isNaN(parseInt(`${style.fillColor}`))
          ? `#${style.fillColor.toString(16).padStart(6, "0")}`
          : `${style.fillColor}`;
      ctx.fillStyle = fs || "rgba(0, 0, 0, 0)";
    }

    const ss =
      style.strokeColor !== undefined &&
      !isNaN(parseInt(`${style.strokeColor}`))
        ? `#${style.strokeColor.toString(16).split("0x").join("").padStart(6, "0")}`
        : `${style.strokeColor}`;
    ctx.strokeStyle = ss || "rgba(0, 0, 0, 0)";
    const lw = parseFloat(`${style.strokeThickness}`) || 0;
    ctx.lineWidth = lw;
    if (!lw) ctx.strokeStyle = "rgba(0, 0, 0, 0)";

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

  let ss =
    hatch.style.hatchStrokeColor !== undefined &&
    !isNaN(parseInt(`${hatch.style.hatchStrokeColor}`))
      ? `#${hatch.style.hatchStrokeColor.toString(16).split("0x").join("").padStart(6, "0")}`
      : `${hatch.style.strokeColor}`;
  if (ss === "#FFFFFF") ss = "#EEEEEE";
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.strokeStyle = ss || "#999999";
  const lw = parseFloat(`${hatch.style.hatchStrokeThickness}`) || 0.5;
  ctx.lineWidth = lw;
  //if (!lw) ctx.strokeStyle = "rgba(0, 0, 0, 0)";
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

export function drawRay(ctx: CanvasRenderingContext2D, r: Ray) {
  ctx.beginPath();
  ctx.moveTo(r.x, r.y);
  ctx.lineWidth = 0;
  ctx.fillStyle = '#39f';
  ctx.arc(r.x, r.y, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  ctx.beginPath();
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(r.x + 10 * Math.cos(r.direction), r.y + 10 * Math.sin(r.direction));
  ctx.strokeStyle = '#39f';
  ctx.lineWidth = 2;
  ctx.stroke();
}