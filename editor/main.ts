// Import necessary modules
import { ClipperHelpers } from '../src/lib/clipper-helpers';
import { Stamp } from '../src/lib/stamp';
import { Sequence } from '../src/lib/sequence';
import { drawShape, drawHatchPattern } from '../src/lib/draw';
import { Hatch } from '../src/lib/hatch';
import { Ray, ShapeAlignment } from "../src/geom/core";
import * as C2S from 'canvas2svg';

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
  declare class Stamp {
    constructor(center?: Ray, alignment?: number, reverse?: boolean);
    rectangle(params: any): Stamp;
    circle(params: any): Stamp;
    ellipse(params: any): Stamp;
    polygon(params: any): Stamp;
    arch(params: any): Stamp;
    leafShape(params: any): Stamp;
    trapezoid(params: any): Stamp;
    roundedRectangle(params: any): Stamp;
    stamp(params: any): Stamp;
    tangram(params: any): Stamp;
    roundedTangram(params: any): Stamp;
    bone(params: any): Stamp;
    moveTo(x: number | string, y: number | string): Stamp;
    move(x: number | string, y: number | string): Stamp;
    rotateTo(angle: number | string): Stamp;
    rotate(angle: number | string): Stamp;
    add(): Stamp;
    subtract(): Stamp;
    intersect(): Stamp;
    boolean(type: number | string): Stamp;
    breakApart(): Stamp;
    children(): any[];
    boundingBox(): any;
    boundingCircle(): any;
    clone(): Stamp;
  }
  
  declare class Sequence {
    static fromStatement(stmt: string, seed?: number, binaryLength?: number): Sequence | null;
    static resetAll(seed?: number, skipSequeces?: (Sequence | null | undefined)[]): void;
    current(forceRefNext?: boolean): number;
    next(): number;
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

// Load example files
loadExamples();

// Function to run the code
async function runCode() {
  try {
    currentCode = editor.getValue();
    
    // Clear the canvas
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
document.getElementById('save-button').addEventListener('click', function() {
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

// Function to load examples
async function loadExamples() {
  try {
    // Get the list of example files using Vite's import.meta.glob
    const exampleModules = import.meta.glob('/examples/*.ts', { as: 'raw' });
    
    // Populate the dropdown
    const selector = document.getElementById('example-selector');
    
    // Sort the file paths
    const filePaths = Object.keys(exampleModules).sort();
    
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
    selector.addEventListener('change', async function() {
      if (this.value) {
        try {
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

// Function to convert TypeScript code to JavaScript
function convertTsToJs(tsCode) {
  // Simple conversion - remove imports and convert to our format
  let jsCode = tsCode
    .replace(/import.*?;/g, '') // Remove import statements
    .replace(/export default/g, '') // Remove export statements
    .replace(/const canvas.*?ctx\.scale.*?\n/gs, '') // Remove canvas setup
    .replace(/document\.onkeydown.*?};/gs, ''); // Remove SVG export code
  
  // Extract the draw function
  const drawMatch = jsCode.match(/const draw.*?\n}/s);
  if (drawMatch) {
    jsCode = drawMatch[0];
  }
  
  // Extract sequence definitions
  const sequenceMatches = tsCode.match(/Sequence\.fromStatement\(.*?\)/g) || [];
  const sequences = sequenceMatches.join('\n');
  
  // Combine everything
  return `// Extracted from example
let seed = 10;

${sequences}

${jsCode}`;
}

// Run button event listener
document.getElementById('run-button').addEventListener('click', runCode);

// Initialize the playground
window.onload = async function() {
  try {
    await ClipperHelpers.init();
    // Run the default code when the page loads
    setTimeout(runCode, 1000); // Give Monaco editor time to initialize
  } catch (error) {
    console.error('Error initializing playground:', error);
  }
};
