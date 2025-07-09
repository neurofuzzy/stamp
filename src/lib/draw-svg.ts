import {
  IShape,
  IStyle,
  Point,
  BoundingBox,
  Path,
} from '../geom/core';
import {
  IHatchPattern,
  HatchBooleanType
} from '../geom/hatch-patterns';
import { GeomHelpers } from '../geom/helpers';
import { Hatch } from './hatch';
import { Optimize } from './optimize';

const combineBoundingBoxes = (boxes: BoundingBox[]): BoundingBox => {
  if (boxes.length === 0) {
    return new BoundingBox(0, 0, 0, 0);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  boxes.forEach(box => {
    if (box.x < minX) minX = box.x;
    if (box.y < minY) minY = box.y;
    if (box.x + box.width > maxX) maxX = box.x + box.width;
    if (box.y + box.height > maxY) maxY = box.y + box.height;
  });

  return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
};

const normalizeColor = (colorValue: string | number): string => {
  if (typeof colorValue === 'number') {
    return `#${colorValue.toString(16).padStart(6, '0')}`;
  }
  
  if (typeof colorValue === 'string') {
    const colorStr = colorValue.trim().toLowerCase();
    if (colorStr.startsWith('0x')) {
      return `#${colorStr.substring(2).padStart(6, '0')}`;
    }
    if (colorStr.startsWith('#')) {
      return colorStr;
    }
    // Potentially a hex string without a prefix.
    if (/^[0-9a-f]{6}$/.test(colorStr)) {
      return `#${colorStr}`;
    }
  }

  // Assume a named color (e.g., 'red') or return as is.
  return String(colorValue);
};

const applyDefaults = (style: IStyle) => {
  const out = Object.assign({}, style);
  if (out.strokeColor === undefined) out.strokeColor = "#cccccc";
  if (out.fillColor === undefined) out.fillColor = "#cccccc";
  if (out.strokeThickness === undefined) out.strokeThickness = 1;
  return out;
};

// SVG Path builder class to accumulate paths like Canvas2D does
class SVGPathBuilder {
  private paths: string[] = [];
  private transform: ((p: Point) => Point) | undefined;
  
  constructor(transform?: (p: Point) => Point) {
    this.transform = transform;
  }

  moveTo(x: number, y: number) {
    let p: Point = new Point(x, y);
    if (this.transform) {
      p = this.transform(p);
    }
    this.paths.push(`M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  
  lineTo(x: number, y: number) {
    let p: Point = new Point(x, y);
    if (this.transform) {
      p = this.transform(p);
    }
    this.paths.push(`L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  
  closePath() {
    this.paths.push('Z');
  }
  
  getPath(): string {
    return this.paths.join(' ');
  }
  
  clear() {
    this.paths = [];
  }
}

// Convert shape to SVG path data with recursive boolean operations (adapted from drawShape)
export function shapeToSVGPath(
  shape: IShape,
  pathBuilder: SVGPathBuilder,
  shapeDepth = 0,
): void {
  const style = applyDefaults(shape.style);
  
  // Skip if no fill and no stroke
  if ((style.fillAlpha === 0 || !style.fillColor) && 
      (style.strokeThickness === 0 || !style.strokeColor)) {
    return;
  }

  const rays = shape.generate();

  if (rays.length) {
    pathBuilder.moveTo(rays[0].x, rays[0].y);
    for (let i = 1; i < rays.length - 1; i++) {
      pathBuilder.lineTo(rays[i].x, rays[i].y);
    }
    if (!GeomHelpers.pointsAreEqual(rays[0], rays[rays.length - 1])) {
      pathBuilder.lineTo(rays[rays.length - 1].x, rays[rays.length - 1].y);
    }
    pathBuilder.closePath();
  }

  // Recursively add all children (this handles boolean operations like subtract)
  shape.children().forEach((child: IShape) => shapeToSVGPath(child, pathBuilder, shapeDepth + 1));
}

// Create SVG element from shape with proper boolean operations (adapted from drawShape)
export function createSVGFromShape(shape: IShape, transform?: (p: Point) => Point): {
  path: string;
  style: {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    fillRule: 'evenodd' | 'nonzero';
  };
} {
  const style = applyDefaults(shape.style);
  const pathBuilder = new SVGPathBuilder(transform);
  
  // Build the complete path with all boolean operations (like Canvas2D beginPath/fill cycle)
  shapeToSVGPath(shape, pathBuilder, 0);
  
  // Convert colors (adapted from drawShape)
  let fillColor = 'transparent';
  if (style.fillAlpha !== 0 && style.fillColor !== undefined) {
    fillColor = normalizeColor(style.fillColor);
  }

  let strokeColor = 'transparent';
  const strokeWidth = typeof style.strokeThickness === 'number' ? style.strokeThickness : parseFloat(String(style.strokeThickness)) || 0;
  
  if (strokeWidth > 0 && style.strokeColor !== undefined) {
    strokeColor = normalizeColor(style.strokeColor);
  }

  const fillOpacity = typeof style.fillAlpha === 'number' ? style.fillAlpha : 1;

  return {
    path: pathBuilder.getPath(),
    style: {
      fill: fillColor,
      fillOpacity: fillOpacity,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fillRule: 'evenodd' // Use evenodd for proper boolean operations (like Canvas2D)
    }
  };
}

export function createSVGFromHatchPattern(
  hatch: IHatchPattern,
  optimize: boolean = false,
  transform?: (p: Point) => Point
): { path: string; style: { stroke: string; strokeWidth: number } } | null {
  let segments = hatch.generate();

  if (optimize && hatch.doOptimize) {
    segments = Optimize.paths(segments, true, true);
  }

  if (segments.length === 0) {
    return null;
  }

  const pathData = segments
    .map(seg => {
      let points = seg.points;
      if (transform) {
        points = points.map(p => transform(p));
      }
      if (points.length === 0) return '';
      const start = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
      const rest = points.slice(1).map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
      return `${start} ${rest}`;
    })
    .join(' ');

  let strokeColor = '#999999';
  if (hatch.style.hatchStrokeColor) {
    strokeColor = normalizeColor(hatch.style.hatchStrokeColor);
  }

  const strokeWidth = hatch.style.hatchStrokeThickness || hatch.style.strokeThickness || 1;

  return {
    path: pathData,
    style: {
      stroke: strokeColor,
      strokeWidth: parseFloat(String(strokeWidth)),
    },
  };
}

export function createSVGFromShapeComplete(
  shape: IShape,
  optimize: boolean = false,
  transform?: (p: Point) => Point
) {
  const elements = [];

  if (
    shape.style.hatchBooleanType === HatchBooleanType.DIFFERENCE ||
    shape.style.hatchBooleanType === HatchBooleanType.INTERSECT
  ) {
    const modifiedShape = Hatch.subtractHatchFromShape(shape);
    if (modifiedShape) {
      elements.push(createSVGFromShape(modifiedShape, transform));
    }
  } else {
    elements.push(createSVGFromShape(shape, transform));
  }

  if (
    shape.style.hatchPattern &&
    shape.style.hatchBooleanType !== HatchBooleanType.DIFFERENCE &&
    shape.style.hatchBooleanType !== HatchBooleanType.INTERSECT
  ) {
    const fillPattern = Hatch.applyHatchToShape(shape);
    if (fillPattern) {
      const hatchElement = createSVGFromHatchPattern(fillPattern, optimize, transform);
      if (hatchElement) {
        elements.push(hatchElement);
      }
    }
  }

  return elements;
}

export interface SvgElement {
  path: string;
  style: {
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    fillRule?: 'evenodd' | 'nonzero';
  };
}

export interface RenderOptions {
  width: number;
  height: number;
  margin?: number;
  optimize?: boolean;
  backgroundColor?: string;
}

export function renderSVG(shapes: IShape[], options: RenderOptions): string {
  const { width, height, margin = 0, optimize = false, backgroundColor = 'transparent' } = options;

  const contentBB = combineBoundingBoxes(shapes.map(s => s.boundingBox()));

  const docBB = new BoundingBox(margin, margin, width - margin * 2, height - margin * 2);
  
  const contentAspect = contentBB.width / contentBB.height;
  const docAspect = docBB.width / docBB.height;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (contentAspect > docAspect) {
    scale = docBB.width / contentBB.width;
    offsetY = (docBB.height - contentBB.height * scale) / 2;
  } else {
    scale = docBB.height / contentBB.height;
    offsetX = (docBB.width - contentBB.width * scale) / 2;
  }

  const transform = (p: Point): Point => {
    return new Point(
      (p.x - contentBB.x) * scale + offsetX + margin,
      (p.y - contentBB.y) * scale + offsetY + margin,
    );
  };

  const elements: SvgElement[] = [];
  shapes.forEach(shape => {
    elements.push(...createSVGFromShapeComplete(shape, optimize, transform));
  });

  return renderSVGElements(elements, width, height, backgroundColor);
}

export function renderSVGElements(elements: SvgElement[], width: number, height: number, backgroundColor: string = 'transparent'): string {
  const svgPaths = elements
    .map(el => {
      if (!el) return '';
      const styleParts: string[] = [];
      if (el.style.fill) styleParts.push(`fill:${el.style.fill}`);
      if (el.style.fillOpacity !== undefined) styleParts.push(`fill-opacity:${el.style.fillOpacity}`);
      if (el.style.stroke) styleParts.push(`stroke:${el.style.stroke}`);
      if (el.style.strokeWidth) styleParts.push(`stroke-width:${el.style.strokeWidth}`);
      if (el.style.fillRule) styleParts.push(`fill-rule:${el.style.fillRule}`);
      
      return `<path d="${el.path}" style="${styleParts.join(';')}" />`;
    })
    .join('\n  ');

  const backgroundRect = backgroundColor !== 'transparent' ? `<rect width="100%" height="100%" fill="${backgroundColor}" />` : '';

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${backgroundRect}
  ${svgPaths}
</svg>`;
}

export function createSVGFromPath(
  path: Path,
  style: {
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
  },
  transform?: (p: Point) => Point,
): SvgElement | null {
  if (path.points.length === 0) {
    return null;
  }

  let points = path.points;
  if (transform) {
    points = points.map(p => transform(p));
  }

  const pathData = points.map((p, i) => {
    const command = i === 0 ? 'M' : 'L';
    return `${command} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ');

  const finalStyle = {
    fill: style.fill ?? 'none',
    stroke: style.stroke ?? '#000000',
    strokeWidth: style.strokeWidth ?? 1,
  };

  return {
    path: pathData,
    style: finalStyle,
  };
} 