import * as C2S from 'canvas2svg';
import { drawShape } from '../src/lib/draw';
import { Point, Ray, Segment, ShapeAlignment } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import '../src/style.css';
import { LinkedCell, LinkedGrid } from '../src/lib/linkedgrid';
import { Optimize } from '../src/lib/optimize';
import { Circle } from '../src/geom/shapes';

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
ctx.scale(ratio, ratio);
const w = canvas.width / ratio;
const h = canvas.height / ratio;

ctx.fillStyle = 'white';

const gw = 8;
const gh = 8;
const startX = Math.floor(gw / 2);
const startY = Math.floor(gh / 2);
const midW = Math.floor(gw / 2);
const midH = Math.floor(gh / 2); 
const maxDist = 25;

Sequence.seed = 8;
Sequence.seed = 17
Sequence.seed = 33
Sequence.seed = 50
Sequence.seed = 67
Sequence.seed = 81
//Sequence.seed = 91
Sequence.fromStatement("random 1,2,3,4,1,2,3,4,1,2,3,4,1,2,3,4,1,2,3,4 AS MV");
Sequence.fromStatement("random -1,1,0,-1,1 AS SORT");


function createTree (grid: LinkedGrid<any>) {

  grid.cells.forEach(cell => cell.values[0] = 0);

  // mask out certain grid areas
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (Math.abs(x - midW) < 3 && Math.abs(y - midH) < 2) {
        //grid.cell(x, y)?.setValue(2, "x");
      }
    }
  }

  grid.cell(startX, startY)?.setValue(1, 1);
  
  const growCells: LinkedCell<any>[] = [];

  const grow = (cell?: LinkedCell<any>) => {

    if (!cell) {
      return;
    }

    if (cell.values[1] >= maxDist) return;

    let next = null;
    let i = 0;
    while (!next && i < 25) {
      next = cell.move(Sequence.resolve("MV()"), 1);
      if (!next){
        continue;
      }
      if (next.values[2] !== "x" && !next.values[1]) {
        break;
      }
      next = null;
      i++;
    }
    if (next) {
      next.setValue(0, cell);
      next.setValue(1, cell.values[1] + 1);
      growCells.push(next);
    }

    next = null;
    while (!next && i < 4) {
      next = cell.move(Sequence.resolve("MV()"), 1);
      if (!next){
        continue;
      }
      if (next.values[2] !== "x" && !next.values[1]) {
        break;
      }
      next = null;
      i++;
    }
    if (next) {
      next.setValue(0, cell);
      next.setValue(1, cell.values[1] + 1);
      growCells.push(next);
    }

    growCells.sort((a, b) => a.values[1] - b.values[1] ? 1 : -1);
    growCells.sort((a, b) => Sequence.resolve("SORT()"));
    if (growCells.length) {
      grow(growCells.shift());
    }

  }

  grow(grid.cell(startX, startY) ?? undefined);

  console.log(grid.print(1));

}

const draw = (ctx: CanvasRenderingContext2D) => {

  let grid: LinkedGrid<any> = new LinkedGrid(gw, gh);

  createTree(grid);

  let scale = 50;
  let segs: Segment[] = [];

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.cell(x, y);
      if (!cell) {
        continue;
      }
      const parent = cell.values[0];
      // draw stem
      if (cell.values[0]) {
        let coords = grid.getCellCoordinates(parent);
        if (coords) {
          // let d = { offsetX: x - coords.x, offsetY: y - coords.y };
          segs.push(new Segment(
            new Point(x * scale + w / 2 - (gw - 1) * scale * 0.5, y * scale + h / 2 - (gh - 1) * scale * 0.5), 
            new Point(coords.x * scale + w / 2 - (gw - 1) * scale * 0.5, coords.y * scale + h / 2 - (gh - 1) * scale * 0.5)
          ));
        }
      }
      // draw branches
      
    }
  }

  //const bounds = new Circle(new Ray(w / 2 , h / 2), 200);
  //segs = GeomHelpers.cropSegsToShape(segs, bounds);
  const paths = Optimize.segments(segs);
  
  let shapes = ClipperHelpers.offsetPathsToShape(paths, 18, 4);
  const singleHole = new Circle(new Ray(w / 2 - scale * 4 + 18 + 7, h / 2 - scale * 4 + 18 + 7, 0), 7, 32, ShapeAlignment.CENTER, true);
  shapes.forEach(shape => {
    shape.addChild(singleHole);
  })
  shapes.forEach(shape => {
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