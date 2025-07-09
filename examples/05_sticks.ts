import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { IStyle, Ray, ShapeAlignment } from '../src/geom/core';
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
const palette = colors[96];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 3);

const gridSizeX = 12;
const gridSizeY = 3;

Sequence.fromStatement(`random 140-200 AS RHEIGHT`)

Sequence.fromStatement(`repeat 25[${gridSizeX}],0[${gridSizeX}] AS BOFFSET`)
Sequence.fromStatement(`repeat 0[${gridSizeX - 1}],1,0[${gridSizeX}] AS BSKIP`)

const draw = () => {
  const style: IStyle = {
    strokeThickness: 1,
    fillColor: "COLOR()",
  }

  const divisions = 3;
  const spacingX = 50;
  const spacingY = 80;

  const stalk = new Stamp(new Ray(w / 2, h / 2, 0))
    .roundedRectangle({
      height: "RHEIGHT()",
      width: 40,
      cornerRadius: 20,
      style,
      divisions,
    })
    .subtract()
    .rectangle({
      height: 120,
      width: 60,
      align: ShapeAlignment.BOTTOM,
      offsetY: 20,
    })
    .circle({ 
      radius: 10,
      offsetY: "RHEIGHT / 2 - 20",
    });

  const grid = new Stamp(new Ray(w / 2, h / 2, 0))
    .defaultStyle(style)
    .add()
    .stamp({
      subStamp: stalk,
      numX: gridSizeX,
      numY: gridSizeY,
      spacingX,
      spacingY,
      divisions,
      offsetX: "BOFFSET()",
      skip: "BSKIP()",
      outlineThickness: 5,
      align: ShapeAlignment.TOP,
      style: style
    });

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