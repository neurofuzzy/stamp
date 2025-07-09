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
const palette = colors[86];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.fromStatement("repeat 60,-60 AS RANGLE");
Sequence.fromStatement("repeat 40,60 AS RLENGTH")
Sequence.fromStatement("9,9,6 AS RSTEP")

const draw = () => {
  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      fillColor: "COLOR()",
      strokeThickness: 0
    })
    .bone({
      length: "RLENGTH()",
      bottomRadius: 5,
      topRadius: 5,
      divisions: 2,
      align: ShapeAlignment.TOP,
    })
    .forward({ distance: "RLENGTH" })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 3, times: 4 })
    .circle({
      radius: 20,
      outlineThickness: 6
    })
    .subtract()
    .circle({
      radius: 10
    })
    .add()
    .stepBack({ steps: "RSTEP()" })
    .repeatLast({ steps: 9, times: 3 });
    
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