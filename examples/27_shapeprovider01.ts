import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { IStyle, Ray } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import "../src/style.css";
import colors from "nice-color-palettes";
import { GridShapeLayout } from "../src/lib/layout/layout-shape";
import { ShapeProvider } from "../src/lib/shape-provider";
import { Circle } from "../src/geom/shapes";
import { Donut } from "../src/geom/compoundshapes";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const w = 768;
const h = 768;

let cachedSVG = '';

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[8];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);
Sequence.fromStatement("shuffle 0,1,2,3,4 AS SHAPE", 1);

Sequence.seed = 2;

const draw = (): IShape[] => {
  const style: IStyle = {
    fillColor: "COLOR()",
    strokeColor: "COLOR()",
    strokeThickness: 8,
  };

  const shapeProvider = new ShapeProvider(
    [
      new Circle(),
      // new Rectangle(),
      // new Circle(new Ray(0, 0, 0), 50, 4),
      // new Circle(new Ray(0, 0, 0 - Math.PI / 4), 50, 5),
      new Donut(new Ray(0, 0, 0), 30, 50, 32),
    ],
    "SHAPE()"
  );

  const grid = new GridShapeLayout(new Ray(w / 2, h / 2, 0), {
    type: "grid",
    shape: shapeProvider.clone(),
    style: style,
    rows: 6,
    columns: 6,
    columnSpacing: 140,
    rowSpacing: 140,
    columnPadding: 40,
  });

  return grid.children();
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
