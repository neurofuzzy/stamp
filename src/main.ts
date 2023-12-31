import * as C2S from 'canvas2svg';
import { Ray, ShapeAlignment } from './geom/shapes';
import { Stamp } from './stamp';
import './style.css';
import { Sequence } from './sequence';
import { drawShape } from './draw';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="768" height="768" style="background-color: black;"></canvas>
  </div>
`;

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const ctx = canvas.getContext('2d')!

const w = canvas.width
const h = canvas.height

ctx.fillStyle = 'white';

let rot = 0;
let seed = 18;

Sequence.fromStatement("repeat 40,70,100 AS BH", seed)
Sequence.fromStatement("repeat 1,2,3 AS BNW", seed)
Sequence.fromStatement("repeat 1,1,1 AS BA", seed)
Sequence.fromStatement("repeat 35[6],0[6] AS BO")
Sequence.fromStatement("repeat 0[5],1,0[6] AS BSK")

const draw = (ctx: CanvasRenderingContext2D) => {
 
  ctx.clearRect(0, 0, w, h);

  // building
  const building = new Stamp(new Ray(100, 100, 0))
    .rectangle(50, "BH()")
    .moveTo(0, "0 - BH / 2")
    .circle(25, 4, ShapeAlignment.CENTER, 1, 1, 0, 0, 0, 0, 0, "BH - 41")
    .moveTo(0, 0)
    .subtract()
    .rectangle(10, 20, 0, 1, ShapeAlignment.CENTER, 2, "BNW()", 20, 30).moveTo(0, "0 - BH / 2")
    .add()
    .rectangle(20, 10, 0, 1, ShapeAlignment.TOP, 1, 1, 0, 0, 0, 0, 0, "41 - BH")
  
  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    .stamp(building, 0, ShapeAlignment.TOP, 6, 6, 70, 70, 6, "BO()", 0, "BSK()");
  
  // draw as single shape
  //drawShape(ctx, city);

  // draw children
  city.children().forEach(child => drawShape(ctx, child));

}

document.onkeydown = function (e) {
  // if enter
  if (e.keyCode === 13) {
    // export the canvas as SVG
    const ctx2 = new C2S(canvas.width, canvas.height);
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
  
  await Stamp.init();

  function animate() {
    rot += Math.PI / 180 * 0.5;
    draw(ctx);
    //requestAnimationFrame(animate);
  }

  animate();

}


main();