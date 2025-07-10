import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray, ShapeAlignment } from '../src/geom/core';
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

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[79];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 137.508 AS RANGLE", 0, 5);
Sequence.fromStatement("repeat 200 AS RLENGTH")
Sequence.fromStatement("repeat 20,16,16,12,12,8,8,4,4,4 AS RWEIGHT")
Sequence.fromStatement("repeat 170 AS BERRY")

const draw = () => {
  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 2.5,
      fillColor: 0,
    })
    .forward({ distance: "RLENGTH()" })
    .rotate({ rotation: "RANGLE()" })
    .rotate({ rotation: 72 })
    .leafShape({
      radius: "BERRY()",
      outlineThickness: 12,
      divisions: 36,
      splitAngle: 50,
      splitAngle2: 80,
      serration: 0,
      align: ShapeAlignment.TOP
    })
    .circle({
      radius: 30,
      divisions: 36,
      outlineThickness: 12,
    })
    .repeatLast({ steps: 3, times: 5 })
    .repeatLast({ steps: 6, times: 6 })

  const tree2 = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 3.5,
      fillColor: 0,
    })
    .forward({ distance: "RLENGTH()" })
    .rotate({ rotation: "RANGLE()" })
    .rotate({ rotation: 72 })
    .leafShape({
      radius: 152,
      outlineThickness: 0,
      divisions: 36,
      splitAngle: 54,
      splitAngle2: 90,
      serration: 0,
      align: ShapeAlignment.TOP
    })
    .circle({
      radius: 30,
      divisions: 36,
      outlineThickness: 0,
    })
    .repeatLast({ steps: 3, times: 5 })
    .repeatLast({ steps: 6, times: 6 })

  // Return in original order: tree2 first, then tree
  return [...tree2.children(), ...tree.children()];
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
    Sequence.resetAll();
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};