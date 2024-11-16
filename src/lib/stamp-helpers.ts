import { IStyle, ShapeAlignment } from "../geom/core";
import { Sequence } from "./sequence";
import { IShapeParams } from "./stamp-interfaces";

export function paramsWithDefaults<T extends IShapeParams>(
  params: IShapeParams,
): T {
  params = Object.assign({}, params);
  params.angle = params.angle ?? 0;
  params.divisions = params.divisions ?? 1;
  params.align = params.align ?? ShapeAlignment.CENTER;
  params.numX = params.numX ?? 1;
  params.numY = params.numY ?? 1;
  params.spacingX = params.spacingX ?? 0;
  params.spacingY = params.spacingY ?? 0;
  params.outlineThickness = params.outlineThickness ?? 0;
  params.offsetX = params.offsetX ?? 0;
  params.offsetY = params.offsetY ?? 0;
  params.skip = params.skip ?? 0;
  return params as T;
}

export const resolveStringOrNumber = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
      ? parseInt(arg.replace("#", "0x"), 16)
      : Sequence.resolve(arg)
    : typeof arg === "number"
      ? arg
      : 0;

const $ = resolveStringOrNumber;

export function resolveStyle(style: IStyle) {
  const out = Object.assign({}, style);
  if (out.strokeColor !== undefined) out.strokeColor = $(out.strokeColor);
  if (out.fillColor !== undefined) out.fillColor = $(out.fillColor);
  if (out.hatchPattern !== undefined) out.hatchPattern = $(out.hatchPattern);
  if (out.hatchScale !== undefined) out.hatchScale = $(out.hatchScale);
  if (out.hatchAngle !== undefined) out.hatchAngle = $(out.hatchAngle);
  return out;
}
