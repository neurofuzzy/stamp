import * as C2S from 'canvas2svg';
import { drawShape } from '../src/lib/draw';
import { IStyle, Ray } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import '../src/style.css';
import colors from 'nice-color-palettes';
import { GridShapeLayout, ScatterShapeLayout } from '../src/lib/shapes-layout';
import { ShapesProvider } from '../src/lib/shapes-provider';
import { Circle, Ellipse, Rectangle } from '../src/geom/shapes';
import { Donut } from '../src/geom/compoundshapes';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ratio = 2;
canvas.width = 900 * ratio
canvas.height = 900 * ratio
canvas.style.width = '900px'
canvas.style.height = '900px'
const ctx = canvas.getContext('2d')!
ctx.scale(ratio, ratio)
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = 'white';

Sequence.seed = 1;

// 2,7,24,29,32,39,69,78,83,94,96
const palette = colors[8];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 122);

Sequence.seed = 2;

const draw = (ctx: CanvasRenderingContext2D) => {

  ctx.clearRect(0, 0, w, h);

  const style: IStyle = {
    fillColor: "COLOR()",
    strokeColor: "COLOR()",
    strokeThickness: 8
  }

  const shapeProvider = new ShapesProvider([
    new Circle(),
   // new Rectangle(),
   // new Circle(new Ray(0, 0, 0), 50, 4),
   // new Circle(new Ray(0, 0, 0 - Math.PI / 4), 50, 5),
    new Donut(new Ray(0, 0, 0), 30, 50, 32),
  ], Sequence.fromStatement("shuffle 0,1,2,3,4", 1))

  const grid = new GridShapeLayout(new Ray(w / 2, h / 2, 0), {
    shape: shapeProvider,
    style: style,
    rows: 6,
    columns: 6,
    columnSpacing: 140,
    columnPadding: 40,
  });
  

  grid.children().forEach(shape => {
   drawShape(ctx, shape, 0);
  });

}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    // draw the boundary
    ctx2.backgroundColor = '#000';
    // draw the shapes
    draw(ctx2);
    // download the SVG
    const svg = ctx2.getSerializedSvg(false).split("#FFFFFF").join("#000000");
    const svgNoBackground = svg.replace(/\<rect.*?\>/g, "");
    const blob = new Blob([svgNoBackground], { type: "image/svg+xml" });
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