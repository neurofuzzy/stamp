import { IShape, Ray } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { Circle } from '../src/geom/shapes';
import { PenLine } from '../src/lib/penline';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="svg-container"></div>
`;

const w = 768;
const h = 768;
let svgContent = '';

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[8];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.seed = 2;

const draw = () => {
  let penline = new PenLine(new Ray(w / 2, h / 2 + 200)).line(0, 1).lines(180, 100, 1)
    .lines("repeat -20,40 as AA", 130, 2)
    .lines("repeat 30, -30 as AB", 80, 2, 1, 1, "shuffle 0,0,1 AS AC").repeatLast(1, 4).style(PenLine.STYLE_CIRCLE).line(0,32)
    .style(PenLine.STYLE_DEFAULT)

  penline.bake();
  let endPts = penline.getEndPoints(3, 6, true);
  let ends: IShape[] = [];
  endPts.forEach(pt => {
    console.log("YO")
    ends.push(new Circle(pt.toRay(), 8, 16));
  })

  let shapes = ClipperHelpers.offsetPathsToShape(penline.result(), 3, 4);
  
  return [...shapes, ...ends];
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