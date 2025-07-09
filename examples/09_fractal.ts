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
const palette = colors[83];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 124);

Sequence.fromStatement("binary 60,-60 AS RANGLE", 2, 4);
Sequence.fromStatement("repeat 8,12 AS MLENGTH");
Sequence.fromStatement("repeat 120,100,70,40,MLENGTH() AS RLENGTH")
Sequence.fromStatement("repeat 20,16,16,12,12,8,8,4,4,4 AS RWEIGHT")
Sequence.fromStatement("repeat 10,10 AS BERRY")

const draw = () => {
  const tree = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      fillColor: "COLOR()",
      strokeThickness: 0,
    })
    .bone({
      length: 12,
      bottomRadius: 2,
      topRadius: 2,
      divisions: 6,
      align: ShapeAlignment.TOP,
      outlineThickness: 0
    })
    .circle({
      radius: 4,
      divisions: 6,
      offsetY: 12,
      angle: 15,
    })
    .forward({ distance: 12 })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 5, times: 400 })

  return tree.children();
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