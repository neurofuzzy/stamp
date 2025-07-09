import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="svg-container"></div>
`;

const w = 768;
const h = 768;
let svgContent = '';

Sequence.seed = 1795;

Sequence.fromStatement("random 1,2,3,4,5,6,7 AS HATCH")
Sequence.fromStatement("random 0.25,0.25,0.5 AS HATCHSCALE")
Sequence.fromStatement("random 45,90,45,90,45 AS HATCHANG")
Sequence.fromStatement("random 0x111111, 0x222222, 0x333333, 0x444444, 0x555555 AS COLOR")

const draw = () => {
  const gridSize = 10;

  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .tangram({
      width: 60,
      height: 60,
      type: 10,
      numX: gridSize,
      numY: gridSize,
      spacingX: 70,
      spacingY: 70,
      style: {
        hatchAngle: "HATCHANG()",
        hatchPattern: "HATCH()",
        hatchScale: "HATCHSCALE()",
        fillColor: "0x000000",
        fillAlpha: 0,
        strokeColor: "0xFFFFFF",
        hatchStrokeColor: "0xFFFFFF",
        hatchStrokeThickness: 0.5,
        hatchInset: 1,
        strokeThickness: 1
      }
    })
    .subtract()
    .circle({
      radius: 20,
      divisions: 64,
      numX: gridSize,
      numY: gridSize,
      spacingX: 70,
      spacingY: 70,
    });

  const grid2 = new Stamp(new Ray(w / 2, h / 2, 0))
    .circle({
      radius: 20,
      divisions: 64,
      numX: gridSize,
      numY: gridSize,
      spacingX: 70,
      spacingY: 70,
      style: {
        hatchAngle: "HATCHANG()",
        hatchPattern: "HATCH()",
        hatchScale: "HATCHSCALE()",
        fillColor: "0x000000",
        fillAlpha: 0,
        strokeColor: "0xFFFFFF",
        hatchStrokeColor: "0xFFFFFF",
        hatchStrokeThickness: 0.5,
        hatchInset: 0.5,
        strokeThickness: 0
      }
    });

  return [...grid.children(), ...grid2.children()];
}

async function main() {
  await ClipperHelpers.init();
  const shapes = draw();
  svgContent = DrawSVG.renderSVG(shapes, { 
    width: w,
    height: h,
    margin: 60,
    backgroundColor: '#000000',
  });
  
  const container = document.getElementById('svg-container');
  if (container) {
    container.innerHTML = svgContent;
  }
}

main();

document.onkeydown = function (e) {
  if (e.keyCode === 13) {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};