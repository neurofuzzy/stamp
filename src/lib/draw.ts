import { IHatchPattern } from "../geom/hatch-patterns";
import {
  BoundingBox,
  BoundingCircle,
  IShape,
  IStyle,
  Point,
  Ray,
  Path,
  SegmentGroup,
} from "../geom/core";
import { GeomHelpers } from "../geom/helpers";
import { Sequence } from "./sequence";
import { Optimize } from "./optimize";

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
      ? parseInt(arg.replace("#", "0x"), 16)
      : Sequence.resolve(arg)
    : typeof arg === "number"
      ? arg
      : 0;

const applyDefaults = (style: IStyle) => {
  const out = Object.assign({}, style);
  if (out.strokeColor === undefined) out.strokeColor = "#cccccc";
  if (out.fillColor === undefined) out.fillColor = "#cccccc";
  if (out.strokeThickness === undefined) out.strokeThickness = 1;
  return out;
};

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: IShape,
  shapeDepth = 0,
) {
  const rays = shape.generate();
  const children = shape.children();

  // If this shape is a pure container (no geometry, only children),
  // then draw its children individually and stop.
  if (rays.length === 0 && children.length > 0) {
    children.forEach((child) => drawShape(ctx, child, 0));
    return;
  }

  const style = applyDefaults(shape.style);
  if (style.fillAlpha === 0 && style.strokeThickness === 0) {
    return;
  }

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
  children.forEach((child) => drawShape(ctx, child, shapeDepth + 1));

  if (shapeDepth === 0) {
    if (style.fillAlpha === 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
    } else {
      const fs =
        style.fillColor !== undefined && !isNaN(parseInt(`${style.fillColor}`))
          ? `#${style.fillColor.toString(16).padStart(6, "0")}`
          : "#" + $(style.fillColor).toString(16).padStart(6, "0");
      ctx.fillStyle = fs || "rgba(0, 0, 0, 0)";
    }

    const ss =
      style.strokeColor !== undefined &&
      !isNaN(parseInt(`${style.strokeColor}`))
        ? `#${style.strokeColor.toString(16).padStart(6, "0")}`
        : "#" + $(style.strokeColor).toString(16).padStart(6, "0");
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
  hatch: IHatchPattern,
  optimize: boolean = false,
) {
  let segments = hatch.generate();

  if (optimize && hatch.doOptimize) {
    console.log("optimizing");
    segments = Optimize.paths(segments, true, true);
  }

  ctx.beginPath();

  segments.forEach((seg) => {
    ctx.moveTo(seg.points[0].x, seg.points[0].y);
    for (let i = 1; i < seg.points.length; i++) {
      ctx.lineTo(seg.points[i].x, seg.points[i].y);
    }
    if (
      GeomHelpers.pointsAreEqual(
        seg.points[0],
        seg.points[seg.points.length - 1],
      )
    ) {
      ctx.closePath();
    }
  });

  let hsc = $(hatch.style.hatchStrokeColor);
  let ss =
    hatch.style.hatchStrokeColor !== undefined && !isNaN(hsc)
      ? `#${hsc.toString(16).split("0x").join("").padStart(6, "0")}`
      : `${hatch.style.strokeColor}`;
  if (!hatch.style.hatchStrokeColor) ss = "#999999";
  if (ss === "#FFFFFF") ss = "#EEEEEE";
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.strokeStyle = ss ?? "#999999";

  const lw =
    parseFloat(
      `${hatch.style.hatchStrokeThickness || hatch.style.strokeThickness || 1}`,
    ) || 1;
  ctx.lineWidth = lw;

  ctx.stroke();
}

export function drawHatchPatternDebug(
  ctx: CanvasRenderingContext2D,
  hatch: IHatchPattern,
  optimize: boolean = false,
) {
  let segments = hatch.generate();

  if (optimize) {
    segments = Optimize.paths(segments, true, true);
  }

  ctx.beginPath();

  // give me a palette of 10 different colors
  let colors = [
    "#ff0022",
    "#33dd00",
    "#0099ff",
    "#6633ff",
    "#eecc00",
    "#ff00ff",
    "#7799cc",
    "#00ffcc",
    "#cc6600",
    "#33cc33",
    "#cc33cc",
    "#33cccc",
    "#cccc33",
  ];

  segments.forEach((seg, idx) => {
    ctx.beginPath();
    ctx.moveTo(seg.points[0].x, seg.points[0].y);
    for (let i = 1; i < seg.points.length; i++) {
      ctx.lineTo(seg.points[i].x, seg.points[i].y);
    }
    if (
      GeomHelpers.pointsAreEqual(
        seg.points[0],
        seg.points[seg.points.length - 1],
      )
    ) {
      ctx.closePath();
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.strokeStyle = colors[idx % colors.length];
    ctx.stroke();
  });
}

export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  bb: BoundingBox,
) {
  ctx.beginPath();
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);
}

export function drawBoundingCircle(
  ctx: CanvasRenderingContext2D,
  bc: BoundingCircle,
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
  ctx.fillStyle = "#39f";
  ctx.arc(r.x, r.y, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  ctx.beginPath();
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(
    r.x + 10 * Math.cos(r.direction),
    r.y + 10 * Math.sin(r.direction),
  );
  ctx.strokeStyle = "#39f";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawSegmentGroup(
  ctx: CanvasRenderingContext2D,
  group: SegmentGroup,
  color = "#999999",
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  group.segments.forEach((seg) => {
    ctx.moveTo(seg.a.x, seg.a.y);
    ctx.lineTo(seg.b.x, seg.b.y);
  });
  ctx.stroke();
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  path: Path,
  pointRadius = 0,
  color = "#0099ff",
  penIsUp: ((i: number) => boolean) | undefined = undefined,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(path.points[0].x, path.points[0].y);
  for (let i = 1; i < path.points.length; i++) {
    const r = path.points[i];
    if (penIsUp?.(i - 1)) {
      ctx.moveTo(r.x, r.y);
    } else {
      ctx.lineTo(r.x, r.y);
    }
  }
  ctx.stroke();
  if (pointRadius > 0) {
    for (let i = 1; i < path.points.length; i++) {
      const r = path.points[i];
      ctx.lineWidth = 0;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
  }
}

export function drawPathGhosted(
  ctx: CanvasRenderingContext2D,
  path: Path,
  pointRadius = 0,
) {
  ctx.strokeStyle = "cyan";
  ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(path.points[0].x, path.points[0].y);
  for (let i = 1; i < path.points.length; i++) {
    const r = path.points[i];
    ctx.beginPath();
    ctx.moveTo(path.points[i - 1].x, path.points[i - 1].y);
    ctx.lineTo(r.x, r.y);
    ctx.stroke();
  }
  ctx.stroke();
  if (pointRadius > 0) {
    for (let i = 1; i < path.points.length; i++) {
      const r = path.points[i];
      ctx.lineWidth = 0;
      ctx.fillStyle = "cyan";
      ctx.beginPath();
      ctx.arc(r.x, r.y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
  }
}
