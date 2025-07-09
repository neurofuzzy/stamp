import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { IStyle, Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType } from '../src/geom/hatch-patterns';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="svg-container"></div>
`;

const w = 768;
const h = 768;
let svgContent = '';

Sequence.seed = 2112;

Sequence.fromStatement("random 30,60,60,90,90,120 AS RW")
Sequence.fromStatement("random 0[2],1[7] AS SKIP")
Sequence.fromStatement("random 5,RW-25 AS OFFSET")

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[83];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 3);
Sequence.fromStatement("random 1-9 as TT");
Sequence.fromStatement("random 0-6 as HATCH");

const draw = () => {
  const style: IStyle = {
    strokeThickness: 0,
    fillColor: "COLOR()",
    hatchPattern: "HATCH()",
    hatchAngle: 45,
    hatchScale: 1,
    hatchStrokeColor: "0xffffff",
    hatchStrokeThickness: 2,
    hatchBooleanType: HatchBooleanType.DIFFERENCE,
  }

  const gridSize = 6;
  const divisions = 64;
  const size = 100;
  const spacing = 100;

  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle(style)
    .add()
    .roundedTangram({
      type: "TT()",
      numX: gridSize,
      numY: gridSize,
      spacingX: spacing,
      spacingY: spacing,
      width: size,
      height: size,
      divisions,
      style,
    })
    .subtract()
    .circle({
      numX: gridSize,
      numY: gridSize,
      spacingX: spacing,
      spacingY: spacing,
      radius: size * 0.2,
      divisions
    })

  return grid.children();
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