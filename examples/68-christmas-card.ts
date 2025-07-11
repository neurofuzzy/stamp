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

const pageWidth = 5 * 96;
const pageHeight = 7 * 96;
const w = pageWidth;
const h = pageHeight;

let cachedSVG = '';

Sequence.seed = 0;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[79];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 137.508 AS RANGLE", 0, 5);
Sequence.fromStatement("repeat 1 LOG2 AS RSCALE", 0);
Sequence.fromStatement("repeat 0.5 LOG2 AS ROFFSET", 1);
Sequence.fromStatement("repeat 1.02 ADD AS RLA");
//Sequence.fromStatement("repeat 1-35 AS HATCH");
Sequence.fromStatement("repeat 16,11,10,15,14,12 AS HATCH");
Sequence.fromStatement("shuffle 30,0,60,45 AS HANG");

const draw = (): IShape[] => {
  const style: IStyle = {
    strokeThickness: 0,
    fillAlpha: 0,
    hatchPattern: "HATCH()",
    hatchAngle: "HANG()",
    hatchScale: 0.9,
    hatchStrokeColor: "0x999999",
    hatchStrokeThickness: 2,
    hatchOffsetX: 0,
    hatchOffsetY: 1,
    hatchOverflow: 0,
    hatchSpherify: true,
  };

  // compound leaf
  const child = new Stamp(new Ray(0, 0)).defaultStyle(style).circle({
    radius: 85,
  });

  const parent = new GridStampLayout(new Ray(w / 2, h / 2, 0), {
    type: "grid",
    stamp: child,
    columns: 2,
    rows: 3,
    rowSpacing: 190,
    columnSpacing: 190,
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
