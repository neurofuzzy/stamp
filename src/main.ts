import * as DrawSVG from './lib/draw-svg';
import { IStyle, Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';
import { Sequence } from '../src/lib/sequence';
import colors from 'nice-color-palettes';
import { HatchPatternType } from './geom/hatch-patterns';
import { Hatch } from './lib/hatch';
import { IShape } from '../src/geom/core';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="svg-container"></div>
`;

const w = 768;
const h = 1024;

let svgContent = '';

const palette = colors[96];
const colorSeq = `random ${palette.join(",").split("#").join("0x")} AS COLOR`;
Sequence.fromStatement(colorSeq, 3);

Sequence.fromStatement("repeat 15,20,25 AS SIZE");


function draw() {
  const style: IStyle = {
    strokeThickness: 0,
    fillColor: "COLOR()",
  }

// test pattern

const distrib0 = new Stamp(new Ray(w/2, h/2, 0))
  .defaultStyle({
    fillColor: "COLOR()",
    hatchPattern: HatchPatternType.LINE,
    hatchAngle: 45,
    hatchScale: 1,
    hatchStrokeColor: "0x000000",
    hatchStrokeThickness: 2,
  })
    .roundedRectangle({ 
      width: 40,
      height: 40,
      cornerRadius: 5,
      divisions: 3,
      align: ShapeAlignment.CENTER,
      style: {
        fillColor: "COLOR()",
        hatchPattern: HatchPatternType.LINE,
        hatchAngle: 45,
        hatchScale: 0.5,
        hatchStrokeColor: "0x000000",
        hatchStrokeThickness: 1,
        hatchInset: 2,
      }
    }).move({ x: 0, y: 60 })
    .repeatLast({ steps: 2, times: 5 });

  // grid

  const distrib1 = new Stamp(new Ray(w/2 - 200, h/2 -300, 0))
    .defaultStyle(style)
    .circle({ 
      radius: 12,
      align: ShapeAlignment.CENTER,
      style,
      outlineThickness: 4,
      distribute: {
        type: "grid",
        columns: 10,
        rows: 10,
        columnSpacing: 30,
        rowSpacing: 30,
        itemScaleFalloff: 1.5,
      }
    });

  // phyllotaxis

  const distrib2 = new Stamp(new Ray(w/2 + 200, h/2 -300, 0))
    .circle({ 
      radius: 24,
      align: ShapeAlignment.CENTER,
      style,
      outlineThickness: 4,
      distribute: {
        type: "phyllotaxis",
        count: 70,
        scaleFactor: 16,
        itemScaleFalloff: 1.5,
        skipFirst: 10,
      }
    });

  // attractor

  const distrib3 = new Stamp(new Ray(w/2 - 200, h/2 +0, 0))
    .circle({ 
      radius: "SIZE()",
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: "attractor",
        count: 38,
        initialRadius: 200,
        simulationSteps: 1000,
        hexSpacing: 40,
        strength: 1,
        damping: 0,
        padding: 6,
        itemScaleFalloff: 1,
      }
    });

  // poisson-disk
  
  const distrib4 = new Stamp(new Ray(w/2 + 200, h/2 +0, 0))
    .circle({ 
      radius: 10,
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: 'poisson-disk',
        count: 100,
        minDistance: 25,
        width: 200,
        height: 200,
        seed: 121,
        itemScaleFalloff: 1.0,
      }
    });

  // poincare
  
  const distrib5 = new Stamp(new Ray(w/2 - 200, h/2 + 300, 0))
    .circle({ 
      radius: 16,
      align: ShapeAlignment.CENTER,
      style,
      outlineThickness: 4,
      distribute: {
        type: "poincare",
        count: 60,
        radius: 130,
        density: 0.76,
        seed: 120,
        itemScaleFalloff: 1.0,
      }
    });

  // hexagonal
  
  const distrib6 = new Stamp(new Ray(w/2 + 200, h/2 + 300, 0))
    .circle({ 
      radius: 10,
      align: ShapeAlignment.CENTER,
      style,
      distribute: {
        type: 'hexagonal',
        columns: 10,
        rows: 10,
        spacing: 30,
        itemScaleFalloff: 1.5,
      }
    });

  const stamps = [distrib0, distrib1, distrib2, distrib3, distrib4, distrib5, distrib6];
  const shapes: IShape[] = [];

  stamps.forEach(stamp => {
    // A stamp is a container, so we process each of its children
    stamp.children().forEach(shape => {
      shapes.push(shape)
    });
  });

  return shapes;
}

// export the canvas as SVG

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // reset Sequences
    Sequence.resetAll();
    
    // The svgContent is already generated, just download it.
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-${new Date().toISOString()}.svg`;
    link.click();
  }
};

// main function

async function main() {
  await ClipperHelpers.init();

  const now = new Date().getTime();
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
  
  console.log(`${new Date().getTime() - now}ms`);
}

main();
