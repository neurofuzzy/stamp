import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Hatch } from "../src/lib/hatch";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import colors from "nice-color-palettes";
import { HatchBooleanType, HatchPatternType } from "../src/geom/hatch-patterns";

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
Sequence.fromStatement("repeat 0.5 LOG2 AS RSCALE", 0);
Sequence.fromStatement("repeat 0.7 LOG2 AS ROFFSET", 1);
Sequence.fromStatement("repeat 1.02 ADD AS RLA");
Sequence.fromStatement("repeat 100,60 AS BERRY");

const draw = (): IShape[] => {
  // compound leaf
  const leaf = new Stamp(new Ray(0, 0)).rotate({ rotation: 90 }).ellipse({
    radiusX: "1.3 * RSCALE() * RSCALE()",
    radiusY: "12 * RSCALE()",
    divisions: 64,
  });

  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 1,
      fillAlpha: 0,
    })
    .circle({
      radius: 56,
      outlineThickness: 10,
      style: {
        fillAlpha: 0,
        hatchStrokeThickness: 0.5,
        hatchPattern: HatchPatternType.SINEWAVE,
        hatchInset: 2,
        hatchScale: 0.5,
      },
    })
    // 48
    // 67
    // 210
    .rotate({ rotation: 137.508 })
    .forward({ distance: "40 * ROFFSET()" })
    .stamp({
      subStamp: leaf,
      outlineThickness: "8 + ROFFSET * 1.2",
      style: {
        fillAlpha: 0,
        hatchStrokeThickness: 0.5,
        hatchPattern: HatchPatternType.SINEWAVE,
        hatchInset: 2,
        hatchScale: 0.5,
      },
    })
    .stepBack({ steps: 1 })
    .repeatLast({ steps: 4, times: 100 })
    .flip();

  const shapes: IShape[] = [];

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
