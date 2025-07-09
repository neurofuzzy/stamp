import { IShape } from '../src/geom/core';
import * as DrawSVG from '../src/lib/draw-svg';
import { Ray, ShapeAlignment } from "../src/geom/core";
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Sequence } from '../src/lib/sequence';
import { Stamp } from '../src/lib/stamp';
import '../src/style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="svg-container"></div>
`;

const w = 768;
const h = 768;
let svgContent = '';

function draw() {
  // Compose the face using Stamp's composition API
  const face = new Stamp(new Ray(w/2, h/2, 0))
    // Head
    .rectangle({ width: 250, height: 250, align: ShapeAlignment.CENTER })
    // Left eye
    .subtract()
    .moveTo({ x: -45, y: -40 })
    .rectangle({ width: 48, height: 48 })
    .add()
    .rectangle({ width: 20, height: 20 })
    // Right eye
    .subtract()
    .moveTo({ x: 45, y: -40 })
    .rectangle({ width: 48, height: 48 })
    .add()
    .rectangle({ width: 20, height: 20 })
    // Smile (simple arc/ellipse for mouth)
    .subtract()
    .moveTo({ x: 0, y: 50 })
    .rectangle({ width: 140, height: 20, align: ShapeAlignment.BOTTOM })
    .rotate({ rotation: 90 })
    .forward({ distance: 70 })
    .rectangle({ width: 40, height: 20, align: ShapeAlignment.BOTTOM })
    .rotate({ rotation: 180 })
    .forward({ distance: 140 })
    .rectangle({ width: 40, height: 20, align: ShapeAlignment.BOTTOM })
    
  return face.children();
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
