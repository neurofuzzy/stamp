
export interface Vec2 {
  x: number;
  y: number;
}

export type ParameterValue = 
  | number // for 'slider' and 'number' types
  | string // for 'color', 'text', and 'select' types
  | boolean // for 'boolean' type
  | Vec2 // for 'vector2' type

export interface NodeParameter {
  id: string;
  label: string;
  type: 'slider' | 'number' | 'color' | 'select' | 'boolean' | 'vector2' | 'text' | 'seed' | 'stamp-commands';
  value: ParameterValue;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
  conditional?: {
    parameter: string;
    value: ParameterValue;
  };
}

export interface Node {
  id: string;
  type: string;
  category: 'generator' | 'distribution' | 'modifier' | 'filter' | 'utility' | 'spawner' | 'replication' | 'arrangement';
  label: string;
  position: Vec2;
  size: Vec2;
  inputs: Port[];
  outputs: Port[];
  parameters: NodeParameter[];
  collapsed: boolean;
  selected: boolean;
  enabled: boolean;
  visible: boolean;
  locked: boolean;
  parentId?: string;
  children: string[];
  order: number;
  processingTime?: number;
  iterationCount?: number;
  maxIterations?: number;
}

export interface GeneratedElement {
  id: string;
  type: 'circle' | 'rect' | 'path' | 'polygon' | 'line' | 'bezier' | 'ellipse' | 'compound' | 'stamp-group';
  position: Vec2;
  size: Vec2;
  rotation: number;
  color: string;
  opacity: number;
  strokeColor?: string;
  strokeWidth?: number;
  path?: string;
  points?: Vec2[];
  children?: GeneratedElement[]; // For compound elements
  layer?: number;
  metadata?: {
    layerId?: string;
    nodeId?: string;
    stampPaths?: Vec2[][]; // For stamp boolean operations
    fillRule?: 'nonzero' | 'evenodd'; // SVG fill rule
    [key: string]: string | number | boolean | undefined | Vec2[][];
  };
}

export interface NoiseConfig {
  seed: number;
  octaves: number;
  frequency: number;
  amplitude: number;
  persistence: number;
  lacunarity: number;
}
