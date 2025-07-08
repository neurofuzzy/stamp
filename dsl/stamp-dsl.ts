// Local type definition for CodeMirror completion (to avoid dependency requirement)
interface Completion {
  label: string;
  type?: string;
  detail?: string;
}

export const stampCommands = [
  'circle', 'rectangle', 'ellipse', 'polygon', 'roundedRectangle',
  'leafShape', 'arch', 'trapezoid', 'tangram', 'roundedTangram', 
  'bone', 'stamp', 'moveTo', 'move', 'forward', 'moveOver', 'offset',
  'rotateTo', 'rotate', 'add', 'subtract', 'intersect', 'noBoolean', 'boolean',
  'markBoundsStart', 'markBoundsEnd', 'setCursorBounds', 
  'setBounds', 'crop', 'reset', 'defaultStyle', 'set', 'next', 'stepBack', 
  'breakApart', 'flip', 'repeatLast', 'removeTag', 'skipTag', 
  'replaceVariable', 'extends'
];

// Base parameters from IShapeParams interface
const baseShapeParams = [
  'angle', 'divisions', 'align', 'numX', 'numY', 'spacingX', 'spacingY', 
  'outlineThickness', 'scale', 'offsetX', 'offsetY', 'skip', 'style', 'distribute', 'tag'
];

// Shape-specific parameters (only the unique ones for each shape)
const shapeSpecificParams: Record<string, string[]> = {
  circle: ['radius', 'innerRadius'],
  rectangle: ['width', 'height'],
  ellipse: ['radiusX', 'radiusY'],
  polygon: ['rays'],
  roundedRectangle: ['width', 'height', 'cornerRadius'],
  leafShape: ['radius', 'splitAngle', 'splitAngle2', 'serration'],
  arch: ['width', 'sweepAngle'],
  trapezoid: ['width', 'height', 'taper'],
  tangram: ['width', 'height', 'type'],
  roundedTangram: ['width', 'height', 'type', 'cornerRadius'],
  bone: ['length', 'bottomRadius', 'topRadius'],
  stamp: ['subStamp'],
  // Non-shape commands (no base params)
  moveTo: ['x', 'y'],
  move: ['x', 'y'],
  forward: ['distance'],
  moveOver: ['direction', 'percentage'],
  offset: ['x', 'y'],
  rotateTo: ['rotation'],
  rotate: ['rotation'],
  add: ['otherStamp', 'tag'],
  subtract: ['otherStamp', 'tag'],
  intersect: ['otherStamp', 'tag'],
  noBoolean: [],
  boolean: ['type'],
  markBoundsStart: ['padding'],
  markBoundsEnd: [],
  setCursorBounds: ['x', 'y', 'width', 'height'],
  setBounds: ['width', 'height'],
  crop: ['x', 'y', 'width', 'height'],
  reset: [],
  defaultStyle: ['style'],
  set: ['sequenceCall'],
  next: [],
  stepBack: ['steps'],
  breakApart: [],
  flip: ['axis'],
  repeatLast: ['steps', 'times'],
  removeTag: ['tag'],
  skipTag: ['tag', 'condition'],
  replaceVariable: ['oldName', 'newName'],
  extends: ['sequenceCall']
};

// Shape commands that should inherit base params
const shapeCommands = [
  'circle', 'rectangle', 'ellipse', 'polygon', 'roundedRectangle',
  'leafShape', 'arch', 'trapezoid', 'tangram', 'roundedTangram', 'bone', 'stamp'
];

// Generate final parameter mappings by combining shape-specific params with base params
export const stampParameters: Record<string, string[]> = Object.keys(shapeSpecificParams).reduce((acc, command) => {
  const specific = shapeSpecificParams[command];
  // Shape commands get base params + specific params, others just get specific params
  acc[command] = shapeCommands.includes(command) 
    ? [...specific, ...baseShapeParams]
    : specific;
  return acc;
}, {} as Record<string, string[]>);

// All unique parameters across all commands
export const allStampParameters = Object.values(stampParameters).flat().reduce((acc, param) => {
  if (!acc.includes(param)) {
    acc.push(param);
  }
  return acc;
}, [] as string[]);

// IStyle properties for nested style completion
export const styleProperties = [
  'strokeColor',
  'strokeThickness', 
  'fillColor',
  'fillAlpha',
  'hatchPattern',
  'hatchScale',
  'hatchStrokeColor',
  'hatchStrokeThickness',
  'hatchAngle',
  'hatchInset',
  'hatchBooleanType',
  'hatchOverflow',
  'hatchOffsetX',
  'hatchOffsetY',
  'hatchSpherify'
];

// Distribution types for distribute parameter
export const distributionTypes = [
  'grid',
  'phyllotaxis', 
  'hexagonal',
  'attractor',
  'poincare',
  'poisson-disk',
  'triangular'
];

// Distribution parameters for each type
export const distributionParameters: Record<string, string[]> = {
  grid: ['type', 'columns', 'rows', 'columnSpacing', 'rowSpacing', 'columnPadding', 'rowPadding', 'offsetAlternateRows', 'negateOffsetX', 'itemScaleFalloff'],
  phyllotaxis: ['type', 'count', 'angle', 'scaleFactor', 'skipFirst', 'itemScaleFalloff'],
  hexagonal: ['type', 'columns', 'rows', 'spacing', 'itemScaleFalloff'],
  attractor: ['type', 'count', 'initialRadius', 'hexSpacing', 'strength', 'damping', 'simulationSteps', 'padding', 'itemScaleFalloff'],
  poincare: ['type', 'count', 'radius', 'density', 'seed', 'itemScaleFalloff'],
  'poisson-disk': ['type', 'width', 'height', 'minDistance', 'count', 'seed', 'itemScaleFalloff'],
  triangular: ['type', 'columns', 'rows', 'spacing', 'itemScaleFalloff']
};

// Custom token patterns
export const customTokens = {
  sequence: /@[a-zA-Z0-9\-,]+/,
  alignment: /\b(CENTER|TOP|BOTTOM|LEFT|RIGHT|TOP_LEFT|TOP_RIGHT|BOTTOM_LEFT|BOTTOM_RIGHT)\b/,
  heading: /\b(UP|RIGHT|DOWN|LEFT)\b/,
  boolean: /\b(NONE|UNION|SUBTRACT|INTERSECT)\b/,
  distributionType: /\b(grid|phyllotaxis|hexagonal|attractor|poincare|poisson-disk|triangular)\b/,
};

// CodeMirror completions for commands
export const stampCommandCompletions: Completion[] = stampCommands.map(cmd => ({
  label: cmd,
  type: 'function',
  detail: `Stamp command: ${cmd}`
}));

// CodeMirror completions for parameters  
export const stampParameterCompletions: Completion[] = allStampParameters.map(param => ({
  label: param,
  type: 'property',
  detail: `Parameter: ${param}`
}));

// CodeMirror completions for style properties
export const stylePropertyCompletions: Completion[] = styleProperties.map(prop => ({
  label: prop,
  type: 'property', 
  detail: `Style property: ${prop}`
}));

// CodeMirror completions for distribution types
export const distributionTypeCompletions: Completion[] = distributionTypes.map(type => ({
  label: type,
  type: 'keyword',
  detail: `Distribution type: ${type}`
}));

// Get distribution parameters for a specific type
export const getDistributionParameterCompletions = (distributionType: string): Completion[] => {
  const params = distributionParameters[distributionType] || [];
  return params.map(param => ({
    label: param,
    type: 'property',
    detail: `Distribution parameter: ${param}`
  }));
};

// Enum value completions
export const alignmentCompletions: Completion[] = [
  { label: 'CENTER', type: 'keyword', detail: 'Center alignment' },
  { label: 'TOP', type: 'keyword', detail: 'Top alignment' },
  { label: 'BOTTOM', type: 'keyword', detail: 'Bottom alignment' },
  { label: 'LEFT', type: 'keyword', detail: 'Left alignment' },
  { label: 'RIGHT', type: 'keyword', detail: 'Right alignment' },
  { label: 'TOP_LEFT', type: 'keyword', detail: 'Top-left alignment' },
  { label: 'TOP_RIGHT', type: 'keyword', detail: 'Top-right alignment' },
  { label: 'BOTTOM_LEFT', type: 'keyword', detail: 'Bottom-left alignment' },
  { label: 'BOTTOM_RIGHT', type: 'keyword', detail: 'Bottom-right alignment' }
];

export const headingCompletions: Completion[] = [
  { label: 'UP', type: 'keyword', detail: 'Up direction' },
  { label: 'RIGHT', type: 'keyword', detail: 'Right direction' },
  { label: 'DOWN', type: 'keyword', detail: 'Down direction' },
  { label: 'LEFT', type: 'keyword', detail: 'Left direction' }
];

export const booleanCompletions: Completion[] = [
  { label: 'NONE', type: 'keyword', detail: 'No boolean operation' },
  { label: 'UNION', type: 'keyword', detail: 'Union boolean operation' },
  { label: 'SUBTRACT', type: 'keyword', detail: 'Subtract boolean operation' },
  { label: 'INTERSECT', type: 'keyword', detail: 'Intersect boolean operation' }
];
