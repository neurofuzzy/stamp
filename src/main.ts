import * as C2S from 'canvas2svg';
import { drawPath, drawShape } from '../src/lib/draw';
import { Point, Segment } from '../src/geom/core';
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import '../src/style.css';
import { LinkedCell, LinkedGrid, Direction } from '../src/lib/linkedgrid';
import { Optimize } from '../src/lib/optimize';

const scale = 30;
const nx = 1;
const ny = 1;
const gw = 12;
const gh = 21;
const maxDist = 4;//gw + gh;
const maxIter = 100;

Sequence.seed = 1;
Sequence.fromStatement("random 1,2,3,4,4,3,2,1 AS MV");
Sequence.fromStatement("random 0,1,2,3 AS SORT");

function trapped (c:LinkedCell<any>) {
  const up = c.move(Direction.UP, 1);
  const dn = c.move(Direction.DN, 1);
  const lt = c.move(Direction.LT, 1);
  const rt = c.move(Direction.RT, 1);
  const upOk = up && up.values[1] === undefined;
  const dnOk = dn && dn.values[1] === undefined;
  const ltOk = lt && lt.values[1] === undefined;
  const rtOk = rt && rt.values[1] === undefined;
  return !(upOk || dnOk || ltOk || rtOk);
}
function createTree (grid: LinkedGrid<any>) {

  grid.cells.forEach(cell => cell.values[0] = 0);

  let growCells: LinkedCell<any>[] = [];

  const grow = (cell?: LinkedCell<any>) => {

    if (!cell) {
      return;
    }

    if (cell.values[1] >= maxDist) {
      return;
    }

    let next = null;
    let i = 0;

    for (let n = 0; n < 2; n++) {
      while (!next && i < 2) {
        next = cell.move(Sequence.resolve("MV()"), 1);
        if (!next) continue;
        if (next.values[1] === undefined && !next.values[0]) {
          break;
        }
        next = null;
        i++;
      }
      if (next && !next.values[3]) {
        next.setValue(0, cell);
        cell.values[3] = next;
        next.setValue(1, (cell.values[1] ?? 0) + 1);
        if (cell.values[0]) {
          cell.values[2] = 1;
        }
        growCells.push(next);
        next = null;
      }
    }

    growCells.sort((a, b) => a.values[1] - b.values[1] ? 1 : -1);

  }

  let iter = 0;

  while(grid.cells.filter(c => !c.values[1]).length && iter < maxIter) {
    const empties = grid.cells.filter(c => !c.values[1] && !trapped(c));
    // shuffle
    empties.sort(() => Sequence.resolve("SORT()") - 2 > 0 ? 1 : -1);
    growCells = [];
    grow(empties[0] ?? undefined);
    while (growCells.length) {
      grow(growCells.shift() ?? undefined);
    }
    iter++;
  };

  const empties = grid.cells.filter(c => !c.values[1] && !c.values[3]);
  empties.forEach(c => {
    for (let i = 1; i <= 4; i++) {
      let c2 = c.move(i, 1);
      if (c2 && !c2.values[2] && !c2.values[3]) {
        c.setValue(0, c2);
        c.setValue(1, c2.values[1] + 1);
        return;
      }
    }
  });

  console.log(grid.print(1));

}


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

const draw = (ctx: CanvasRenderingContext2D) => {

  const segs: Segment[] = [];
  const ox = w / 2 - (gw * scale * nx) / 2;
  const oy = h / 2 - (gh * scale * ny) / 2;

  for (let yy = 0; yy < ny; yy++) {
    for (let xx = 0; xx < nx; xx++) {

      let oxx = xx * scale * gw;
      let oyy = yy * scale * gh;

      let grid: LinkedGrid<any> = new LinkedGrid(gw, gh);

      createTree(grid);
      
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
                new Point(x * scale + ox + oxx, y * scale + oy + oyy), 
                new Point(coords.x * scale + ox + oxx, coords.y * scale + oy + oyy)
              ));
            }
          }
          // draw branches
          
        }
      }

    }
  }

  const paths = Optimize.segments(segs);
  
  let shapes = ClipperHelpers.offsetPathsToShape(paths, 6, 1, true, true);
  shapes.forEach(shape => {
    drawShape(ctx, shape, 0);
  });
  paths.forEach((p) => {
    //drawPath(ctx, p, 0);
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