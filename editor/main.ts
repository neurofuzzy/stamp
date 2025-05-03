// Import necessary modules
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Stamp } from '../src/lib/stamp';
import { Sequence } from '../src/lib/sequence';
import { drawShape, drawHatchPattern } from '../src/lib/draw';
import { Hatch } from '../src/lib/hatch';
import { Ray, ShapeAlignment } from "../src/geom/core";
import * as C2S from 'canvas2svg';

// Add type declaration for Vite's import.meta.glob
declare global {
  interface ImportMeta {
    glob: (pattern: string, options?: { as: string }) => Record<string, () => Promise<string>>;
  }
}

// Initialize the Monaco editor
let editor;
let currentCode = '';
let exampleFiles = [];

// Initialize the canvas
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ratio = 2;
canvas.width = 768 * ratio;
canvas.height = 768 * ratio;
canvas.style.width = '768px';
canvas.style.height = '768px';
const ctx = canvas.getContext('2d')
ctx.scale(ratio, ratio);
const w = canvas.width / ratio;
const h = canvas.height / ratio;

// Setup the Monaco editor
import * as monaco from 'monaco-editor';

// Define TypeScript definitions for better autocomplete
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false
});

// Add custom library definitions
const libSource = `
  interface IShapeParams {
    angle?: number | string;
    divisions?: number | string;
    align?: number | string;
    numX?: number | string;
    numY?: number | string;
    spacingX?: number | string;
    spacingY?: number | string;
    outlineThickness?: number | string;
    scale?: number | string;
    offsetX?: number | string;
    offsetY?: number | string;
    skip?: number | string;
    style?: IStyle;
    tag?: string;
  }

  interface ICircleParams extends IShapeParams {
    radius: number | string;
    innerRadius?: number | string;
  }

  interface IArchParams extends IShapeParams {
    width: number | string;
    sweepAngle?: number | string;
  }

  interface IEllipseParams extends IShapeParams {
    radiusX: number | string;
    radiusY: number | string;
  }

  interface ILeafShapeParams extends IShapeParams {
    radius: number | string;
    splitAngle: number | string;
    splitAngle2?: number | string;
    serration?: number | string;
  }

  interface IRectangleParams extends IShapeParams {
    width: number | string;
    height: number | string;
  }

  interface IRoundedRectangleParams extends IShapeParams {
    width: number | string;
    height: number | string;
    cornerRadius: number | string;
  }

  interface IPolygonParams extends IShapeParams {
    rays: Ray[];
    rayStrings?: string[];
  }

  interface IStampParams extends IShapeParams {
    subStamp: Stamp | any;
    subStampString?: string;
    providerIndex?: number;
  }

  interface ITangramParams extends IShapeParams {
    width: number | string;
    height: number | string;
    type: number | string;
  }

  interface ITrapezoidParams extends IShapeParams {
    width: number | string;
    height: number | string;
    taper: number | string;
  }

  interface IBoneParams extends IShapeParams {
    length: number | string;
    bottomRadius: number | string;
    topRadius: number | string;
  }

  interface IStyle {
    fillColor?: string;
    strokeColor?: string;
    strokeThickness?: number;
    hatchPattern?: number;
    hatchAngle?: number;
    hatchScale?: number;
  }

  declare class Stamp {
    constructor(center?: Ray, alignment?: number, reverse?: boolean);
    
    // Shape methods
    rectangle(params: IRectangleParams): Stamp;
    circle(params: ICircleParams): Stamp;
    ellipse(params: IEllipseParams): Stamp;
    polygon(params: IPolygonParams): Stamp;
    arch(params: IArchParams): Stamp;
    leafShape(params: ILeafShapeParams): Stamp;
    trapezoid(params: ITrapezoidParams): Stamp;
    roundedRectangle(params: IRoundedRectangleParams): Stamp;
    stamp(params: IStampParams): Stamp;
    tangram(params: ITangramParams): Stamp;
    roundedTangram(params: ITangramParams): Stamp;
    bone(params: IBoneParams): Stamp;
    
    // Positioning methods
    moveTo(x: number | string, y: number | string): Stamp;
    move(x: number | string, y: number | string): Stamp;
    rotateTo(angle: number | string): Stamp;
    rotate(angle: number | string): Stamp;
    forward(distance: number): Stamp;
    
    // Boolean operations
    add(): Stamp;
    subtract(): Stamp;
    intersect(): Stamp;
    boolean(type: number | string): Stamp;
    breakApart(): Stamp;
    
    // Other methods
    children(): any[];
    boundingBox(): any;
    boundingCircle(): any;
    clone(): Stamp;
    bake(rebake?: boolean): Stamp;
    
    // Constants
    static readonly UNION: number;
    static readonly SUBTRACT: number;
    static readonly INTERSECT: number;
    static readonly NONE: number;
  }
  
  declare class Sequence {
    static fromStatement(stmt: string, seed?: number, binaryLength?: number): Sequence | null;
    static resetAll(seed?: number, skipSequeces?: (Sequence | null | undefined)[]): void;
    static reset(alias: string): void;
    static updateSeed(alias: string, seed: number): void;
    static updateSeedAll(seed: number): void;
    
    // Sequence types
    static readonly ONCE: string;
    static readonly REVERSE: string;
    static readonly REPEAT: string;
    static readonly YOYO: string;
    static readonly SHUFFLE: string;
    static readonly RANDOM: string;
    static readonly BINARY: string;
    
    // Accumulation types
    static readonly REPLACE: string;
    static readonly ADD: string;
    static readonly SUBTRACT: string;
    static readonly MULTIPLY: string;
    static readonly DIVIDE: string;
    
    // Instance methods
    current(forceRefNext?: boolean): number;
    next(): number;
    reset(): void;
    updateSeed(seed: number): void;
  }
  
  declare class Ray {
    constructor(x: number, y: number, direction?: number);
    x: number;
    y: number;
    direction: number;
    clone(): Ray;
  }
  
  declare const ShapeAlignment: {
    CENTER: number;
    TOP: number;
    BOTTOM: number;
    LEFT: number;
    RIGHT: number;
    TOP_LEFT: number;
    TOP_RIGHT: number;
    BOTTOM_LEFT: number;
    BOTTOM_RIGHT: number;
  };
  
  declare function drawShape(ctx: CanvasRenderingContext2D, shape: any): void;
  declare function drawHatchPattern(ctx: CanvasRenderingContext2D, pattern: any): void;
  
  declare class Hatch {
    static applyHatchToShape(shape: any): any;
  }
  
  declare class ClipperHelpers {
    static init(): Promise<void>;
  }
`;
  
monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, 'ts:stamp-lib.d.ts');

// Create the editor
editor = monaco.editor.create(document.getElementById('editor'), {
  value: getDefaultCode(),
  language: 'javascript',
  theme: 'vs-dark',
  automaticLayout: true,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  fontSize: 14,
  tabSize: 2
});

// Set up keyboard shortcut for running code (Ctrl+Enter)
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);

// Add Ctrl+S shortcut to run code as well
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, (e) => {
  e.preventDefault(); // Prevent the browser's save dialog
  runCode();
});

// Function to load examples
async function loadExamples() {
  try {
    // Use Vite's import.meta.glob to get example files
    const exampleModules = import.meta.glob('../examples/*.ts', { as: 'raw' });
    
    // Sort the file paths
    const filePaths = Object.keys(exampleModules).sort();
    
    // Populate the dropdown
    const selector = document.getElementById('example-selector') as HTMLSelectElement;
    if (!selector) return;
    
    // Clear existing options except the first one
    while (selector.options.length > 1) {
      selector.remove(1);
    }
    
    for (const path of filePaths) {
      const fileName = path.split('/').pop();
      if (fileName) {
        const option = document.createElement('option');
        option.value = path;
        option.textContent = fileName.replace('.ts', '');
        selector.appendChild(option);
      }
    }
    
    // Add event listener for example selection
    selector.addEventListener('change', async function(this: HTMLSelectElement) {
      if (this.value) {
        try {
          // Use the module loader function to get the content
          const code = await exampleModules[this.value]();
          editor.setValue(convertTsToJs(code));
          runCode();
        } catch (error) {
          console.error('Error loading example:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error loading examples:', error);
  }
}

// Function to run the code
async function runCode() {
  try {
    currentCode = editor.getValue();
    
    // Clear the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    ctx.clearRect(0, 0, w, h);
    
    // Reset sequences
    Sequence.resetAll();
    
    // Initialize Clipper if needed
    await ClipperHelpers.init();
    
    // Create a function from the code
    const drawFunction = new Function('ctx', 'w', 'h', 'Stamp', 'Sequence', 'Ray', 'ShapeAlignment', 'drawShape', 'drawHatchPattern', 'Hatch', `
      "use strict";
      ${currentCode}
      return { draw };
    `);
    
    // Execute the function
    const result = drawFunction(ctx, w, h, Stamp, Sequence, Ray, ShapeAlignment, drawShape, drawHatchPattern, Hatch);
    
    // Call the draw function
    if (result && typeof result.draw === 'function') {
      result.draw(ctx);
    } else {
      console.error('No draw function found in the code');
    }
  } catch (error) {
    console.error('Error executing code:', error);
  }
}

// Function to save the canvas as SVG
document.getElementById('save-button')?.addEventListener('click', function() {
  try {
    // Create a Canvas2SVG context
    const ctx2 = new C2S(canvas.width / ratio, canvas.height / ratio);
    
    // Set background color
    ctx2.fillStyle = 'black';
    ctx2.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    
    // Execute the draw function with the SVG context
    const drawFunction = new Function('ctx', 'w', 'h', 'Stamp', 'Sequence', 'Ray', 'ShapeAlignment', 'drawShape', 'drawHatchPattern', 'Hatch', `
      "use strict";
      ${currentCode}
      return { draw };
    `);
    
    const result = drawFunction(ctx2, w, h, Stamp, Sequence, Ray, ShapeAlignment, drawShape, drawHatchPattern, Hatch);
    
    if (result && typeof result.draw === 'function') {
      result.draw(ctx2);
    }
    
    // Get the SVG content
    const svg = ctx2.getSerializedSvg(true);
    
    // Create a blob and download
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stamp-design-${new Date().toISOString()}.svg`;
    link.click();
  } catch (error) {
    console.error('Error saving SVG:', error);
  }
});

// Function to convert TypeScript code to JavaScript
function convertTsToJs(tsCode: string): string {
  try {
    // Extract the draw function
    const drawFunctionMatch = tsCode.match(/const\s+draw\s*=\s*\(\s*ctx\s*:.*?\)\s*=>\s*{[\s\S]*?}/);
    let drawFunction = '';
    
    if (drawFunctionMatch) {
      drawFunction = drawFunctionMatch[0]
        // Remove TypeScript type annotations
        .replace(/:\s*\w+RenderingContext2D/g, '')
        .replace(/:\s*\w+/g, '')
        .replace(/\(\s*ctx\s*:.*?\)/g, '(ctx)');
    } else {
      console.error('Could not find draw function in example');
      return getDefaultCode();
    }
    
    // Extract sequence definitions
    const sequenceMatches = tsCode.match(/Sequence\.fromStatement\(.*?\)/g) || [];
    const sequences = sequenceMatches.join('\n');
    
    // Extract seed definition
    const seedMatch = tsCode.match(/let\s+seed\s*=\s*\d+/);
    const seedDefinition = seedMatch ? seedMatch[0] : 'let seed = 10;';
    
    // Combine everything
    return `// Converted from example
${seedDefinition}

// Sequence definitions
${sequences}

// Draw function
${drawFunction}`;
  } catch (error) {
    console.error('Error converting TypeScript to JavaScript:', error);
    return getDefaultCode();
  }
}

// Function to get default code
function getDefaultCode() {
  return `// Define seed for random sequences
let seed = 10;

// Define sequences
Sequence.fromStatement("repeat 40,70,100 AS BHEIGHT", seed);
Sequence.fromStatement("random 0,0,0,0 AS BANG", seed);
Sequence.fromStatement("repeat 1,2,3 AS STORIES", seed);
Sequence.fromStatement("repeat 1,4,5,6,7 AS HATCH", seed);
Sequence.fromStatement("repeat 45,90,45,90,45 AS HATCHANG", seed);

// Main draw function
function draw(ctx) {
  // Clear the canvas
  ctx.clearRect(0, 0, w, h);
  
  // Create a simple building
  const building = new Stamp(new Ray(100, 100, 0))
    .rectangle({ width: 50, height: "BHEIGHT()"})
    .moveTo(0, "0 - BHEIGHT / 2")
    .circle({
      radius: 25,
      divisions: 4,
      align: ShapeAlignment.CENTER,
      skip: "BHEIGHT - 41"
    })
    .moveTo(0, 0)
    .subtract()
    .rectangle({
      width: 10,
      height: 20,
      align: ShapeAlignment.CENTER,
      numX: 2,
      numY: "STORIES()",
      spacingX: 20,
      spacingY: 30
    });
  
  // Draw the building
  drawShape(ctx, building);
  
  // Apply hatch pattern if specified
  if (building.style && building.style.hatchPattern) {
    const fillPattern = Hatch.applyHatchToShape(building);
    if (fillPattern) drawHatchPattern(ctx, fillPattern);
  }
}`;
}

// Run button event listener
document.getElementById('run-button')?.addEventListener('click', runCode);

// Initialize the playground
window.onload = async function() {
  try {
    await ClipperHelpers.init();
    // Run the default code when the page loads
    setTimeout(runCode, 1000); // Give Monaco editor time to initialize
    await loadExamples();
  } catch (error) {
    console.error('Error initializing playground:', error);
  }
};
