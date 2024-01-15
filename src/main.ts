import * as C2S from 'canvas2svg';
import { drawHatchPattern, drawShape } from './lib/draw';
import { IStyle, Ray, ShapeAlignment } from "./geom/core";
import { ClipperHelpers } from './lib/clipper-helpers';
import { Hatch } from './lib/hatch';
import { Sequence } from './lib/sequence';
import { Stamp } from './lib/stamp';
import './style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType } from './geom/hatch-patterns';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ratio = 2;
canvas.width = 768 * ratio
canvas.height = 768 * ratio
canvas.style.width = '768px'
canvas.style.height = '768px'
const ctx = canvas.getContext('2d')!
ctx.scale(ratio, ratio)
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = 'white';

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[96];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 3);

const gridSizeX = 18;
const gridSizeY = 6;

Sequence.fromStatement(`random 140-200 AS RHEIGHT`)

Sequence.fromStatement(`repeat 25[${gridSizeX}],0[${gridSizeX}] AS BOFFSET`)
Sequence.fromStatement(`repeat 0[${gridSizeX - 1}],1,0[${gridSizeX}] AS BSKIP`)

const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const style: IStyle = {
    strokeThickness: 0,
    fillColor: "COLOR()",
  }

  const divisions = 64;
  const spacingX = 50;
  const spacingY = 80;

  const stalk = new Stamp(new Ray(w / 2, h / 2, 0))
    .roundedRectangle({
      height: "RHEIGHT()",
      width: 40,
      cornerRadius: 20,
      style,
      divisions: 4
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
      offsetY: "20 - RHEIGHT / 2",
    })

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

  // draw children
  grid.children().forEach(child => {
    if (child.style.hatchBooleanType === HatchBooleanType.DIFFERENCE || child.style.hatchBooleanType === HatchBooleanType.INTERSECT) {
      const shape = Hatch.subtractHatchFromShape(child);
      if (shape) drawShape(ctx, shape)
    } else {
      drawShape(ctx, child)
    }
  });
  grid.children().forEach(child => {
    if (child.style.hatchPattern && child.style.hatchBooleanType !== HatchBooleanType.DIFFERENCE && child.style.hatchBooleanType !== HatchBooleanType.INTERSECT) {
      const fillPattern = Hatch.applyHatchToShape(child);
      if (fillPattern)
        drawHatchPattern(ctx, fillPattern);
    }
  });

}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    // draw the boundary
    ctx2.backgroundColor = '#000';
    // draw the shapes
    draw(ctx2);
    // download the SVG
    const svg = ctx2.getSerializedSvg(true).split("#FFFFFF").join("#000000");
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

async function main() {

  await ClipperHelpers.init();

  const now = new Date().getTime();
  draw(ctx);
  console.log(`${new Date().getTime() - now}ms`);

}


main();