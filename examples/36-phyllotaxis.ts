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
Sequence.fromStatement("repeat 1.9 add AS RSCALE");
Sequence.fromStatement("repeat 1.03 multiply AS ROFFSET");
Sequence.fromStatement("repeat 100 AS BERRY")

const draw = () => {
  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 2.5,
      fillColor: 0,
      fillAlpha: 0,
    })
    .rotate({ rotation: 137.508 })
    .leafShape({
      radius: "180 - RSCALE()",
      outlineThickness: 15,
      divisions: 24,
      splitAngle: 40,
      splitAngle2: 70,
      serration: 0,
      angle: 90,
      align: ShapeAlignment.TOP,
      offsetX: "180 - 20 * ROFFSET()",
    })
    .repeatLast({ steps: 2, times: 59 })
    .circle({
      radius: 42,
      outlineThickness: 15,
    })
    .subtract()
    .circle({
      radius: 27,
    })
    .add()
    .circle({
      radius: 12,
    });
    
  const tree2 = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      // fillColor: "COLOR()",
      strokeThickness: 2.5,
      fillColor: 0,
      fillAlpha: 0,
    })
    .rotate({ rotation: 137.508 })
    .leafShape({
      radius: "180 - RSCALE()",
      outlineThickness: 0,
      divisions: 24,
      splitAngle: 45,
      splitAngle2: 75,
      serration: 0,
      angle: 90,
      align: ShapeAlignment.TOP,
      offsetX: "180 - 20 * ROFFSET()",
    })
    .repeatLast({ steps: 2, times: 59 })
    .circle({
      radius: 180,
    });

  // First get tree2 children
  const tree2Children = tree2.children();
  
  // Reset sequences (important for dynamic values)
  Sequence.resetAll();
  
  // Then get tree children
  const treeChildren = tree.children();

  // Return in original order: tree2 first, then tree
  return [...tree2Children, ...treeChildren];
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