import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Hatch } from "../src/lib/hatch";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { HatchBooleanType } from "../src/geom/hatch-patterns";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const w = 768;
const h = 768;

let cachedSVG = '';

Sequence.seed = 0;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[79];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 137.508 AS RANGLE", 0, 5);
Sequence.fromStatement("repeat 0 LOG2 AS RSCALE", 2);
Sequence.fromStatement("repeat 90 LOG10 AS ROFFSET", 0);
Sequence.fromStatement("repeat 1 ADD AS RLA");
Sequence.fromStatement("repeat 100 AS BERRY");

const draw = (): IShape[] => {
  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 1,
      fillAlpha: 0,
    })
    .circle({
      radius: 24,
      divisions: 64,
      outlineThickness: 10,
    })
    .rotate({ rotation: 67 })
    .leafShape({
      radius: "60 + RSCALE() * 12",
      outlineThickness: 10,
      divisions: 32,
      splitAngle: "40 + RLA() * 1.4",
      splitAngle2: 80,
      serration: 0,
      angle: 0,
      align: ShapeAlignment.TOP,
      offsetY: "20 * ROFFSET()",
    })
    .repeatLast({ steps: 2, times: 30 })
    .flip();

  const tree2 = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 1.5,
      fillColor: 0,
      fillAlpha: 0,
    })
    .circle({
      radius: 84,
      divisions: 32,
      outlineThickness: 8,
    })
    .rotate({ rotation: 67 })
    .leafShape({
      radius: "60 + RSCALE() * 12",
      outlineThickness: -10,
      divisions: 32,
      splitAngle: "40 + RLA() * 1.4",
      splitAngle2: 80,
      serration: 0,
      angle: 0,
      align: ShapeAlignment.TOP,
      offsetY: "20 * ROFFSET()",
    })
    .repeatLast({ steps: 2, times: 30 });

  const shapes: IShape[] = [];

  // Process tree2 children with hatch logic
  tree2.children().forEach((child) => {
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

  // Process tree children with hatch logic
  tree.children().forEach((child) => {
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
    margin: 40,
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
