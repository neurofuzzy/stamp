import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Point, Segment, Path } from "../src/geom/core";
import { ClipperHelpers } from "../src/lib/clipper-helpers";
import { Sequence } from "../src/lib/sequence";
import "../src/style.css";
import { LinkedCell, LinkedGrid, Direction } from "../src/lib/linkedgrid";
import { Optimize } from "../src/lib/optimize";
import { Hatch } from "../src/lib/hatch";
import { HatchPatternType } from "../src/geom/hatch-patterns";

const backgroundColor = "black";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: ${backgroundColor};"></canvas>
  </div>
`;

const pageWidth = 9.5 * 96;
const pageHeight = 8.5 * 96;
const w = pageWidth;
const h = pageHeight;

let cachedSVG = '';

// --

const scale = 20;
const hatchScale = "HS()"; //20 / 5.5;//20 / 4.5;//20 / 3.5;//3.08;//4.45;//5.75;
const nx = 6;
const ny = 2;
const nspacing = 40;
const gw = 6;
const gh = 18;
const maxDist = 2; //gw + gh;
const maxBranch = "BRANCH()"; //gw + gh;
const maxSearch = "SEARCH()"; //gw + gh;
const maxIter = gw * gh;
const lineThickness = 4;
const strokeThickness = 1;
const miterJoins = true;
const miterEnds = true;

Sequence.seed = 3;
Sequence.seed = 10;
Sequence.seed = 14;
Sequence.seed = 17;

Sequence.seed = 19;
Sequence.seed = 22;
Sequence.seed = 29;
Sequence.seed = 31;

Sequence.seed = 34;
Sequence.seed = 36;
Sequence.seed = 38;
Sequence.seed = 40;

const seedValues = [3, 10, 14, 17, 19, 22, 29, 31, 34, 36, 38, 40];

Sequence.fromStatement("random 1,2,3,4,4,3,2,1 AS MV");
Sequence.fromStatement("random 0,1,2,3 AS SORT");
Sequence.fromStatement(
  `shuffle ${lineThickness / 3.5},${lineThickness / 4.5},${lineThickness / 5.5},${lineThickness / 6.5},${lineThickness / 8.5} AS HS`,
);
// random hex colors
// Sequence.fromStatement(
//   "shuffle 0x882222,0x223388,0x006699,0x663399,0x996600,0x597600,0x006633,0x663300,0x993366,0x557799,0x667055 AS COL",
// );
Sequence.fromStatement("shuffle 0x999999,0x999999 AS COL");
// Sequence.fromStatement("shuffle 0x990099,0x009999,0x000000 AS COL");
Sequence.fromStatement("shuffle 2,3,4 AS SEARCH");
Sequence.fromStatement("shuffle 2,3,4 AS BRANCH");
Sequence.fromStatement("shuffle 3,4,5 AS DIST");

const $ = (arg: unknown) =>
  typeof arg === "string"
    ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
      ? parseInt(arg.replace("#", "0x"), 16)
      : Sequence.resolve(arg)
    : typeof arg === "number"
      ? arg
      : 0;

function trapped(c: LinkedCell<any>) {
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

function createTree(grid: LinkedGrid<any>) {
  grid.cells.forEach((cell) => (cell.values[0] = 0));

  let growCells: LinkedCell<any>[] = [];

  const grow = (cell?: LinkedCell<any>) => {
    if (!cell) {
      return;
    }

    if (cell.values[1] >= $(maxDist)) {
      return;
    }

    let next = null;
    let i = 0;

    const branch = $(maxBranch);
    const search = $(maxSearch);

    for (let n = 0; n < branch; n++) {
      while (!next && i < search) {
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

    growCells.sort((a, b) => (a.values[1] - b.values[1] ? 1 : -1));
  };

  let iter = 0;

  while (grid.cells.filter((c) => !c.values[1]).length && iter < maxIter) {
    const empties = grid.cells.filter((c) => !c.values[1] && !trapped(c));
    // shuffle
    empties.sort(() => (Sequence.resolve("SORT()") - 2 > 0 ? 1 : -1));
    growCells = [];
    grow(empties[0] ?? undefined);
    while (growCells.length) {
      grow(growCells.shift() ?? undefined);
    }
    iter++;
  }

  const empties = grid.cells.filter((c) => !c.values[1] && !c.values[3]);
  empties.forEach((c) => {
    for (let i = 1; i <= 4; i++) {
      let c2 = c.move(i, 1);
      if (c2 && !c2.values[2] && !c2.values[3]) {
        c.setValue(0, c2);
        c.setValue(1, c2.values[1] + 1);
        return;
      }
    }
  });

  // console.log(grid.print(1));
}

const draw = (): IShape[] => {
  const segs: Segment[] = [];
  const ox = w / 2 - ((gw - 1) * scale * nx + nspacing * (nx - 1)) / 2;
  const oy = h / 2 - ((gh - 1) * scale * ny + nspacing * (ny - 1)) / 2;

  let n = 0;

  for (let yy = 0; yy < ny; yy++) {
    for (let xx = 0; xx < nx; xx++) {
      let oxx = xx * scale * (gw - 1) + nspacing * xx;
      let oyy = yy * scale * (gh - 1) + nspacing * yy;

      Sequence.resetAll();
      Sequence.updateSeedAll(seedValues[n % seedValues.length]);
      n++;

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
              segs.push(
                new Segment(
                  new Point(x * scale + ox + oxx, y * scale + oy + oyy),
                  new Point(
                    coords.x * scale + ox + oxx,
                    coords.y * scale + oy + oyy,
                  ),
                ),
              );
            }
          }
          // draw branches
        }
      }
    }
  }

  // Convert segments to paths
  const paths = segs.map(seg => new Path([seg.a, seg.b]));
  let segments = Optimize.paths(paths, miterJoins, miterEnds);

  // Convert segments to shapes
  const shapes: IShape[] = [];
  
  let offsetShapes = ClipperHelpers.offsetPathsToShape(segments, lineThickness, 1, miterJoins, miterEnds);
  offsetShapes.forEach((shape) => {
    shape.style.fillAlpha = 0;
    shape.style.hatchStrokeColor = $(Sequence.resolve("COL()"));
    shape.style.strokeColor = $(Sequence.resolve("COL()"));
    shape.style.strokeThickness = strokeThickness;
    shape.style.hatchStrokeThickness = strokeThickness;
    shape.style.hatchScale = $(hatchScale);
    shape.style.hatchPattern = HatchPatternType.OFFSETLOOP;
    shapes.push(shape);
  });

  return shapes;
};

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    // draw the shapes
    const shapes = draw();
    cachedSVG = DrawSVG.renderSVG(shapes, {
      width: w,
      height: h,
      margin: 48,
      backgroundColor: backgroundColor
    });
    // download the SVG
    const blob = new Blob([cachedSVG], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

async function main() {
  await ClipperHelpers.init();

  const now = new Date().getTime();
  const shapes = draw();
  cachedSVG = DrawSVG.renderSVG(shapes, {
    width: w,
    height: h,
    margin: 48,
    backgroundColor: backgroundColor
  });
  
  // Display the SVG
  const canvasElement = document.getElementById('canvas');
  if (canvasElement) {
    canvasElement.outerHTML = cachedSVG;
  }
  
  console.log(`${new Date().getTime() - now}ms`);
}

main();
