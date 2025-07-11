import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import { Stamp } from "../src/lib/stamp";
import "../src/style.css";
import { CirclePackingStampLayout } from "../src/lib/layout/layout-stamp";
import { HatchPatternType } from "../src/geom/hatch-patterns";
import { Hatch } from "../src/lib/hatch";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const pageWidth = 8 * 96;
const pageHeight = 8 * 96;
const w = pageWidth;
const h = pageHeight;

let cachedSVG = '';

Sequence.seed = 1;

const draw = (): IShape[] => {
  Sequence.fromStatement("repeat 3,4,5 AS S");
  Sequence.fromStatement("repeat 1,2,2 AS B");
  Sequence.fromStatement("repeat 2,1,1 AS B2");
  Sequence.fromStatement("random 10,-20,30,40 AS R");

  const circle = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      strokeThickness: 0,
      strokeColor: "#cccccc",
      fillColor: "0",
      fillAlpha: 0,
      hatchPattern: HatchPatternType.FLOWER,
      hatchStrokeThickness: 1,
      hatchStrokeColor: "#cccccc",
      hatchScale: 0.4,
      hatchInset: 0.5,
    })
    .circle({
      radius: 18,
    });

  const grid = new CirclePackingStampLayout(new Ray(w / 2, h / 2, 0), {
    type: "circle-packing",
    stamp: circle,
    layoutSeed: 512,
    radius: 300,
    count: 22,
    padding: 18,
    spherify: 98.2,
  });

  const shapes: IShape[] = [];

  // Process grid children with hatch logic
  grid.children().forEach((child) => {
    shapes.push(child);
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
      backgroundColor: backgroundColor
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
    backgroundColor: backgroundColor
  });
  
  // Display the SVG
  const canvasElement = document.getElementById('canvas');
  if (canvasElement) {
    canvasElement.outerHTML = cachedSVG;
  }
  
  console.log(`${new Date().getTime() - now}ms`);
}

main();
