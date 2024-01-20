import * as C2S from 'canvas2svg';
import { drawCenter, drawHatchPattern, drawRay, drawShape } from './lib/draw';
import { IStyle, Ray, ShapeAlignment } from './geom/core';
import { ClipperHelpers } from './lib/clipper-helpers';
import { Hatch } from './lib/hatch';
import { Sequence } from './lib/sequence';
import { Stamp } from './lib/stamp';
import './style.css';
import colors from 'nice-color-palettes';
import { HatchBooleanType } from './geom/hatch-patterns';
import { Bone } from './geom/shapes';

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

const gridSizeX = 5;
const gridSizeY = 5;

Sequence.fromStatement(`random 140-200 AS RHEIGHT`);
Sequence.fromStatement(`repeat 60 add AS RANGLE`);

Sequence.fromStatement(`repeat 31[${gridSizeX}],0[${gridSizeX}] AS BOFFSET`);
Sequence.fromStatement(`repeat 0[${gridSizeX - 1}],1,0[${gridSizeX}] AS BSKIP`);

const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const style: IStyle = {
    strokeThickness: 0,
    fillColor: "COLOR()",
  }

  const divisions = 32;
  const spacingX = 62;
  const spacingY = 70;

  const bone = new Bone(new Ray(w / 2, h / 2, 0), 200, 50, 120, 3, ShapeAlignment.TOP, false);

  drawShape(ctx, bone, 0);
  drawCenter(ctx, bone.center);
  bone.generate().forEach(r => drawRay(ctx, r));

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