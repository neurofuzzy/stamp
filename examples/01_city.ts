import * as C2S from 'canvas2svg';
import { drawHatchPattern, drawShape } from '../src/lib/draw';
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Hatch } from '../src/lib/hatch';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';

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

let seed = 10;

Sequence.fromStatement("repeat 40,70,100 AS BHEIGHT", seed)
Sequence.fromStatement("random 0,0,0,0 AS BANG", seed)
Sequence.fromStatement("repeat 1,2,3 AS STORIES", seed)
Sequence.fromStatement("repeat 1,4,5,6,7 AS HATCH", seed)
Sequence.fromStatement("repeat 45,90,45,90,45 AS HATCHANG", seed)
Sequence.fromStatement("repeat 35[6],0[6] AS BOFFSET")
Sequence.fromStatement("repeat 0[5],1,0[6] AS BSKIP")
Sequence.fromStatement("random 0x111111, 0x222222, 0x333333, 0x444444, 0x555555 AS BCOL", 12)

const draw = (ctx: CanvasRenderingContext2D) => {
 
  ctx.clearRect(0, 0, w, h);

  // building
  const building = new Stamp(new Ray(100, 100, 0))
    .rectangle({ width: 50, height: "BHEIGHT()"})
    .moveTo({ x: 0, y: "0 - BHEIGHT / 2" })
    .circle({
      radius: 25,
      divisions: 4,
      align: ShapeAlignment.CENTER,
      skip: "BHEIGHT - 41"
    })
    .moveTo({ x: 0, y: 0 })
    .subtract()
    .rectangle({
      width: 10,
      height: 20,
      align: ShapeAlignment.CENTER,
      numX: 2,
      numY: "STORIES()",
      spacingX: 20,
      spacingY: 30
    })
    .add()
    .moveTo({ x: 0, y: "0 - BHEIGHT / 2" })
    .rectangle({
      width: 20,
      height: 10,
      align: ShapeAlignment.TOP,
      skip: "41 - BHEIGHT"
    });
  
  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    //.stamp(building, 0, ShapeAlignment.TOP, 6, 6, 70, 70, 6, "BOFFSET()", 0, "BSKIP()");
    .stamp({
      subStamp: building,
      angle: "BANG()",
      align: ShapeAlignment.TOP,
      numX: 6,
      numY: 6,
      spacingX: 70,
      spacingY: 70,
      outlineThickness: 5,
      offsetX: "BOFFSET()",
      offsetY: 0,
      skip: "BSKIP()",
      style: {
        fillColor: "BCOL()",
        strokeColor: "#FFFFFF",
        strokeThickness: 1,
        hatchPattern: "HATCH()",
        hatchAngle: "HATCHANG()",
        hatchScale: 0.5
      }
    });
  
  // draw as single shape
  //drawShape(ctx, city);

  // draw children
  city.children().forEach(child => drawShape(ctx, child));
  city.children().forEach(child => {
    if (child.style.hatchPattern) {
      const fillPattern = Hatch.applyHatchToShape(child);
      if (fillPattern) drawHatchPattern(ctx, fillPattern);
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
    const blob = new Blob([svg], {type: "image/svg+xml"});
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