import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray, ShapeAlignment } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType, HatchPatternType } from '../src/geom/hatch-patterns';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="svg-container"></div>
`;

const w = 900;
const h = 900;
let svgContent = '';

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[83];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.seed = 256;
Sequence.seed = 512;
Sequence.seed = 123;
Sequence.seed = 316;
//Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60 AS RANGLE");
Sequence.fromStatement("shuffle -72,-72,-72,-72,-72,-72,-72,-72,72,72,72,72,72,72,72,72,72,72,-36 AS RANGLE");
//Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60,30 AS RANGLE");
Sequence.fromStatement("shuffle 0,1,0,1,0,1 AS BSKIP")
Sequence.fromStatement("repeat 10,10 AS BERRY")

const len = 133;
const weight = 4;

const draw = () => {
  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      hatchPattern: HatchPatternType.OFFSET,
      hatchScale: 0.27,
      strokeThickness: 1,
      hatchStrokeThickness: 1,
      fillColor: "#333333",
    })
    .bone({
      length: len,
      bottomRadius: weight,
      topRadius: weight,
      divisions: 12,
      align: ShapeAlignment.TOP,
      outlineThickness: 0
    })
    /*
    .circle({
      radius: 8,
      divisions: 6,
      offsetX: Math.cos(30 * Math.PI / 180) * len,
      offsetY: -12,
      angle: 15,
      skip: "repeat 0,1,0"
    })
    */
    .forward({ distance: len })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 4, times: 180 })

  const tree = lattice;
  const tree2 = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      fillColor: "COLOR()",
      strokeThickness: 0,
    })
    .circle({
      radius: 420,
      divisions: 6,
      angle: 15,
    })
    .subtract()
    .stamp({
      subStamp: lattice,
    })
    .breakApart();

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