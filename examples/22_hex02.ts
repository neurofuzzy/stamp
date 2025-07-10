import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray, ShapeAlignment } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import colors from 'nice-color-palettes';

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
Sequence.fromStatement(colorSeq, 125);

const draw = () => {
  const len = 30;
  const weight = len / 3;
  Sequence.seed = 256;
  Sequence.seed = 519;
  Sequence.fromStatement("shuffle -60,-60,-60,-60,-60,-60,-60,-60,60,60,60,60,60,60,60,60,60,60  AS RANGLE");
  Sequence.fromStatement("shuffle 0,1,0,1,0,1 AS BSKIP")
  
  const lattice = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle({
      strokeThickness: 1,
      strokeColor: "#ffffff",
      fillColor: "#222222",
    })
    
    .bone({
      topRadius: weight / 2,
      bottomRadius: weight / 2,
      length: len,
      divisions: 6,
      align: ShapeAlignment.TOP
    })
    .circle({
      radius: weight * 1.25,
      divisions: 6,
      offsetX: Math.cos(30 * Math.PI / 180) * len,
      offsetY: 0 - len / 2,
      angle: 15,
      skip: "RANGLE"
    })
    .forward({ distance: len })
    .rotate({ rotation: "RANGLE()" })
    .repeatLast({ steps: 4, times: 120 })

  let paths = lattice.path({});
  let shapes = ClipperHelpers.offsetPathsToShape(paths, len / 12, 2);
  
  return [...lattice.children(), ...shapes];
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