import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { IStyle, Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Hatch } from "../src/lib/hatch";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { HatchBooleanType } from "../src/geom/hatch-patterns";
import { GridStampLayout } from "../src/lib/layout/layout-stamp";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const pageWidth = 8.5 * 96;
const pageHeight = 8.5 * 96;
const w = pageWidth;
const h = pageHeight;

let cachedSVG = '';

Sequence.seed = 2;

Sequence.fromStatement(
  "shuffle 11,4,5,8,9, 10,14,15,16,18, 19,20,21,22,23, 24,25,26,27,28, 29,33,34,35,41 AS HATCH",
);
Sequence.fromStatement(
  "shuffle 1,1,1,1,1, 1,1,1,0.85,0.85, 1,1,0.85,0.85,0.75, 0.75,0.85,0.75,0.85,0.75, 1,1,1,1.2,1.2 AS HATCHSCALE",
);

Sequence.fromStatement("repeat 144,72,60,30,45 AS HATCHANGLE");

const draw = (): IShape[] => {
  const style: IStyle = {
    strokeThickness: 0,
    fillAlpha: 0,
    hatchPattern: "HATCH()",
    hatchAngle: "HATCHANGLE()",
    hatchScale: "HATCHSCALE()",
    hatchStrokeColor: "0x999999",
    hatchStrokeThickness: 2,
    hatchOffsetX: 0,
    hatchOffsetY: 0,
    hatchOverflow: 0,
    hatchSpherify: true,
  };

  // compound leaf
  const child = new Stamp(new Ray(0, 0)).defaultStyle(style).circle({
    radius: 96 * 0.75,
  });

  const parent = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    type: "grid",
    stamp: child,
    columns: 5,
    rows: 5,
    rowSpacing: 96 * 1.5,
    columnSpacing: 96 * 1.5,
  });

  const shapes: IShape[] = [];

  // Process parent children with hatch logic
  parent.children().forEach((child) => {
    if (
      child.style.hatchBooleanType === HatchBooleanType.DIFFERENCE ||
      child.style.hatchBooleanType === HatchBooleanType.INTERSECT
    ) {
      const shape = Hatch.subtractHatchFromShape(child);
      if (shape) shapes.push(shape);
    } else {
      shapes.push(child);
    }
  });

  Sequence.resetAll();

  return shapes;
};

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // draw the shapes
    const shapes = draw();
    cachedSVG = DrawSVG.renderSVG(shapes, {
      width: w,
      height: h,
      margin: 48,
      backgroundColor: '#000000'
    });
    // download the SVG
    const blob = new Blob([cachedSVG], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

async function main() {
  await ClipperHelpers.init();

  const now = new Date().getTime();
  const shapes = draw();
  cachedSVG = DrawSVG.renderSVG(shapes, {
    width: w,
    height: h,
    margin: 48,
    backgroundColor: '#000000'
  });
  
  // Display the SVG
  const canvasElement = document.getElementById('canvas');
  if (canvasElement) {
    canvasElement.outerHTML = cachedSVG;
  }
  
  console.log(`${new Date().getTime() - now}ms`);
}

main();
