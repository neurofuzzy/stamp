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
    .rectangle({ w: 50, h: "BH()"})
    .moveTo(0, "0 - BH / 2")
    .circle({
      r: 25,
      s: 4,
      a: ShapeAlignment.CENTER,
      skip: "BH - 41"
    })
    .moveTo(0, 0)
    .subtract()
    .rectangle({
      w: 10,
      h: 20,
      a: ShapeAlignment.CENTER,
      nx: 2,
      ny: "BNW()",
      spx: 20,
      spy: 30
    })
    .add()
    .moveTo(0, "0 - BH / 2")
    .rectangle({
      w: 20,
      h: 10,
      a: ShapeAlignment.TOP,
      skip: "41 - BH"
    });
  
  // city grid
  const city = new Stamp(new Ray(w / 2, h / 2 - 20, 0))
    //.stamp(building, 0, ShapeAlignment.TOP, 6, 6, 70, 70, 6, "BO()", 0, "BSK()");
    .stamp({
      subStamp: building,
      ang: 0,
      a: ShapeAlignment.TOP,
      nx: 6,
      ny: 6,
      spx: 70,
      spy: 70,
      outln: 6,
      ox: "BO()",
      oy: 0,
      skip: "BSK()"
    });
  
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