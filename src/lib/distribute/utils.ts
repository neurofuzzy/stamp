import * as arbit from "arbit";

import { Vec2, GeneratedElement, NoiseConfig } from './node-interfaces';
import { ProcessingContext } from './nodeProcessor';

// Geometry generation utilities
export const generateCirclePoints = (center: Vec2, radius: number, segments: number = 32): Vec2[] => {
  const points: Vec2[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return points;
};

export const generatePolygonPoints = (center: Vec2, radius: number, sides: number): Vec2[] => {
  const points: Vec2[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return points;
};

export const generateStarPoints = (center: Vec2, outerRadius: number, innerRadius: number, points: number): Vec2[] => {
  const vertices: Vec2[] = [];
  const angleStep = Math.PI / points;
  
  for (let i = 0; i < points * 2; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return vertices;
};

export const generateBezierPath = (controlPoints: Vec2[], steps: number = 100): Vec2[] => {
  if (controlPoints.length < 2) return [];
  
  const path: Vec2[] = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    const point = evaluateBezier(controlPoints, t);
    path.push(point);
  }
  return path;
};

const evaluateBezier = (points: Vec2[], t: number): Vec2 => {
  if (points.length === 1) return points[0];
  
  const newPoints: Vec2[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    newPoints.push({
      x: points[i].x * (1 - t) + points[i + 1].x * t,
      y: points[i].y * (1 - t) + points[i + 1].y * t
    });
  }
  return evaluateBezier(newPoints, t);
};

// Grid generation utilities
export const generateRectangularGrid = (
  columns: number,
  rows: number,
  spacingX: number,
  spacingY: number,
): Vec2[] => {
  const positions: Vec2[] = [];
  const startX = -(columns - 1) * spacingX / 2;
  const startY = -(rows - 1) * spacingY / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const baseX = startX + col * spacingX;
      const baseY = startY + row * spacingY;
      
      positions.push({
        x: baseX,
        y: baseY
      });
    }
  }
  return positions;
};

export const generateHexagonalGrid = (
  columns: number,
  rows: number,
  spacing: number
): Vec2[] => {
  const positions: Vec2[] = [];
  const hexWidth = spacing;
  const hexHeight = spacing * Math.sqrt(3) / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const offsetX = (row % 2) * hexWidth / 2;
      const x = col * hexWidth + offsetX;
      const y = row * hexHeight;
      
      positions.push({
        x: x,
        y: y
      });
    }
  }
  return positions;
};

export const generateTriangularGrid = (
  columns: number,
  rows: number,
  spacing: number,
): Vec2[] => {
  const positions: Vec2[] = [];
  const triHeight = spacing * Math.sqrt(3) / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const offsetX = (row % 2) * spacing / 2;
      const x = col * spacing + offsetX;
      const y = row * triHeight;
      
      positions.push({
        x: x,
        y: y
      });
    }
  }
  return positions;
};

export const generatePhyllotaxisPattern = (
  count: number,
  angle: number = 137.5,
  scaleFactor: number = 2,
  center: Vec2 = { x: 0, y: 0 },
  skipFirst: number = 0
): Vec2[] => {
  const positions: Vec2[] = [];
  const angleRad = (angle * Math.PI) / 180;
  
  // Generate positions starting from skipFirst index
  for (let i = skipFirst; i < count + skipFirst; i++) {
    const radius = scaleFactor * Math.sqrt(i);
    const theta = i * angleRad;
    
    positions.push({
      x: center.x + radius * Math.cos(theta),
      y: center.y + radius * Math.sin(theta)
    });
  }
  return positions;
};

export const generatePoissonDisk = (
  width: number,
  height: number,
  minDistance: number,
  maxPoints: number,
  seed: number = 1234
): Vec2[] => {
  const points: Vec2[] = [];
  const grid: (Vec2 | null)[][] = [];
  const cellSize = minDistance / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const prng = arbit(seed);
  
  // Initialize grid
  for (let i = 0; i < gridHeight; i++) {
    grid[i] = new Array(gridWidth).fill(null);
  }
  
  // Add first point
  const firstPoint = { x: prng.nextFloat(0, width), y: prng.nextFloat(0, height) };
  points.push(firstPoint);
  const gridX = Math.floor(firstPoint.x / cellSize);
  const gridY = Math.floor(firstPoint.y / cellSize);
  grid[gridY][gridX] = firstPoint;
  
  const activeList = [firstPoint];
  
  while (activeList.length > 0 && points.length < maxPoints) {
    const randomIndex = Math.floor(prng.nextFloat(0, activeList.length));
    const point = activeList[randomIndex];
    let found = false;
    
    for (let i = 0; i < 30; i++) { // Try 30 times to find a valid point
      const angle = prng.nextFloat(0, Math.PI * 2);
      const distance = minDistance + prng.nextFloat(0, minDistance);
      const newPoint = {
        x: point.x + Math.cos(angle) * distance,
        y: point.y + Math.sin(angle) * distance
      };
      
      if (newPoint.x >= 0 && newPoint.x < width && newPoint.y >= 0 && newPoint.y < height) {
        const newGridX = Math.floor(newPoint.x / cellSize);
        const newGridY = Math.floor(newPoint.y / cellSize);
        
        let valid = true;
        
        // Check surrounding cells
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const checkY = newGridY + dy;
            const checkX = newGridX + dx;
            
            if (checkY >= 0 && checkY < gridHeight && checkX >= 0 && checkX < gridWidth) {
              const neighbor = grid[checkY][checkX];
              if (neighbor) {
                const dist = Math.sqrt(
                  Math.pow(newPoint.x - neighbor.x, 2) + Math.pow(newPoint.y - neighbor.y, 2)
                );
                if (dist < minDistance) {
                  valid = false;
                  break;
                }
              }
            }
          }
          if (!valid) break;
        }
        
        if (valid) {
          points.push(newPoint);
          grid[newGridY][newGridX] = newPoint;
          activeList.push(newPoint);
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      activeList.splice(randomIndex, 1);
    }
  }
  
  return points;
};

export const generateVoronoiCells = (
  siteCount: number,
  bounds: Vec2,
  relaxationIterations: number = 0,
  seed: number = 1234
): Array<{ center: Vec2; vertices: Vec2[] }> => {
  const prng = arbit(seed);
  // Generate random sites
  let sites: Vec2[] = [];
  for (let i = 0; i < siteCount; i++) {
    sites.push({
      x: prng.nextFloat(0, bounds.x),
      y: prng.nextFloat(0, bounds.y)
    });
  }
  
  // Lloyd relaxation
  for (let iter = 0; iter < relaxationIterations; iter++) {
    const newSites: Vec2[] = [];
    
    for (let i = 0; i < sites.length; i++) {
      // Find centroid of Voronoi cell (simplified)
      let sumX = 0, sumY = 0, count = 0;
      
      // Sample points in the region
      for (let x = 0; x < bounds.x; x += 5) {
        for (let y = 0; y < bounds.y; y += 5) {
          let closestSite = 0;
          let minDist = Infinity;
          
          for (let j = 0; j < sites.length; j++) {
            const dist = Math.sqrt(
              Math.pow(x - sites[j].x, 2) + Math.pow(y - sites[j].y, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              closestSite = j;
            }
          }
          
          if (closestSite === i) {
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }
      
      if (count > 0) {
        newSites.push({ x: sumX / count, y: sumY / count });
      } else {
        newSites.push(sites[i]);
      }
    }
    
    sites = newSites;
  }
  
  // Generate simplified Voronoi cells (using rectangular approximation)
  const cells: Array<{ center: Vec2; vertices: Vec2[] }> = [];
  
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    
    // Create a simple rectangular cell around each site
    const cellSize = Math.sqrt((bounds.x * bounds.y) / siteCount) * 0.8;
    const vertices = [
      { x: site.x - cellSize/2, y: site.y - cellSize/2 },
      { x: site.x + cellSize/2, y: site.y - cellSize/2 },
      { x: site.x + cellSize/2, y: site.y + cellSize/2 },
      { x: site.x - cellSize/2, y: site.y + cellSize/2 }
    ];
    
    cells.push({ center: site, vertices });
  }
  
  return cells;
};

// Noise generation
export const generatePerlinNoise = (x: number, y: number, config: NoiseConfig): number => {
  // Simplified Perlin noise implementation
  let value = 0;
  let amplitude = config.amplitude;
  let frequency = config.frequency;
  
  for (let i = 0; i < config.octaves; i++) {
    const sampleX = x * frequency + config.seed;
    const sampleY = y * frequency + config.seed;
    
    // Simple noise function
    const noise = Math.sin(sampleX) * Math.cos(sampleY) + 
                  Math.sin(sampleX * 2.1) * Math.cos(sampleY * 2.3) * 0.5 +
                  Math.sin(sampleX * 4.7) * Math.cos(sampleY * 4.9) * 0.25;
    
    value += noise * amplitude;
    amplitude *= config.persistence || 0.5;
    frequency *= config.lacunarity || 2;
  }
  
  return Math.max(-1, Math.min(1, value));
};

// Transformation utilities
export const transformPoint = (
  point: Vec2,
  translation: Vec2,
  rotation: number,
  scale: Vec2,
  pivot: Vec2 = { x: 0, y: 0 }
): Vec2 => {
  // Translate to pivot
  let x = point.x - pivot.x;
  let y = point.y - pivot.y;
  
  // Scale
  x *= scale.x;
  y *= scale.y;
  
  // Rotate
  const cos = Math.cos((rotation * Math.PI) / 180);
  const sin = Math.sin((rotation * Math.PI) / 180);
  const rotatedX = x * cos - y * sin;
  const rotatedY = x * sin + y * cos;
  
  // Translate back and apply translation
  return {
    x: rotatedX + pivot.x + translation.x,
    y: rotatedY + pivot.y + translation.y
  };
};

export const transformElement = (
  element: GeneratedElement,
  translation: Vec2,
  rotation: number,
  scale: Vec2,
  pivot: Vec2 = { x: 0, y: 0 }
): GeneratedElement => {
  const transformedPosition = transformPoint(element.position, translation, rotation, scale, pivot);
  
  return {
    ...element,
    position: transformedPosition,
    rotation: element.rotation + rotation,
    size: {
      x: element.size.x * scale.x,
      y: element.size.y * scale.y
    },
    points: element.points?.map(point => 
      transformPoint(point, translation, rotation, scale, pivot)
    )
  };
};

// Advanced geometry functions
export const generateFractalTree = (
  baseElement: GeneratedElement,
  depth: number,
  scaleFactor: number,
  branchCount: number,
  angleOffset: number,
  context: ProcessingContext
): GeneratedElement[] => {
  const elements: GeneratedElement[] = [baseElement];
  
  if (depth <= 0 || !context || !checkProcessingLimits(context)) {
    return elements;
  }
  
  const angleStep = 360 / branchCount;
  
  for (let i = 0; i < branchCount; i++) {
    const angle = angleStep * i + angleOffset;
    const scale = { x: scaleFactor, y: scaleFactor };
    const translation = {
      x: Math.cos(angle * Math.PI / 180) * baseElement.size.x * 0.5,
      y: Math.sin(angle * Math.PI / 180) * baseElement.size.y * 0.5
    };
    
    const branchElement = transformElement(baseElement, translation, angle, scale, baseElement.position);
    branchElement.id = `${baseElement.id}-branch-${depth}-${i}`;
    
    const subBranches = generateFractalTree(
      branchElement,
      depth - 1,
      scaleFactor,
      branchCount,
      angleOffset,
      context
    );
    
    elements.push(...subBranches);
    context.currentIterations++;
  }
  
  return elements;
};

export const applyDeformation = (
  element: GeneratedElement,
  deformationType: string,
  strength: number,
  frequency: number
): GeneratedElement => {
  if (!element.points) return element;
  
  const deformedPoints = element.points.map(point => {
    const deformedPoint = { ...point };
    
    switch (deformationType) {
      case 'wave': {
        const waveOffset = Math.sin(point.x * frequency * 0.01) * strength;
        deformedPoint.y += waveOffset;
        break;
      }
      case 'twist': {
        const centerX = element.position.x;
        const centerY = element.position.y;
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const twistAngle = (distance * frequency * 0.01) * (strength * 0.01);
        const cos = Math.cos(twistAngle);
        const sin = Math.sin(twistAngle);
        deformedPoint.x = centerX + dx * cos - dy * sin;
        deformedPoint.y = centerY + dx * sin + dy * cos;
        break;
      }
      case 'noise': {
        const noiseX = generatePerlinNoise(point.x * 0.01, point.y * 0.01, {
          seed: 1234,
          octaves: 3,
          frequency: frequency * 0.1,
          amplitude: strength,
          persistence: 0.5,
          lacunarity: 2
        });
        const noiseY = generatePerlinNoise(point.x * 0.01 + 100, point.y * 0.01 + 100, {
          seed: 1234,
          octaves: 3,
          frequency: frequency * 0.1,
          amplitude: strength,
          persistence: 0.5,
          lacunarity: 2
        });
        deformedPoint.x += noiseX;
        deformedPoint.y += noiseY;
        break;
      }
    }
    
    return deformedPoint;
  });
  
  return {
    ...element,
    points: deformedPoints
  };
};

export const createMirrorCopy = (
  element: GeneratedElement,
  mirrorAxis: string,
  axisPosition: Vec2
): GeneratedElement => {
  const mirroredElement = { ...element };
  
  switch (mirrorAxis) {
    case 'horizontal': {
      mirroredElement.position.y = 2 * axisPosition.y - element.position.y;
      if (element.points) {
        mirroredElement.points = element.points.map(point => ({
          x: point.x,
          y: 2 * axisPosition.y - point.y
        }));
      }
      break;
    }
    case 'vertical': {
      mirroredElement.position.x = 2 * axisPosition.x - element.position.x;
      if (element.points) {
        mirroredElement.points = element.points.map(point => ({
          x: 2 * axisPosition.x - point.x,
          y: point.y
        }));
      }
      break;
    }
    case 'diagonal': {
      // Mirror across y = x line
      const tempX = element.position.x;
      mirroredElement.position.x = element.position.y;
      mirroredElement.position.y = tempX;
      if (element.points) {
        mirroredElement.points = element.points.map(point => ({
          x: point.y,
          y: point.x
        }));
      }
      break;
    }
  }
  
  return mirroredElement;
};

export const interpolateValue = (
  valueA: number,
  valueB: number,
  factor: number,
  interpolationType: string
): number => {
  factor = Math.max(0, Math.min(1, factor));
  
  switch (interpolationType) {
    case 'smooth': {
      factor = factor * factor * (3 - 2 * factor); // Smoothstep
      break;
    }
    case 'cosine': {
      factor = (1 - Math.cos(factor * Math.PI)) / 2;
      break;
    }
    case 'cubic': {
      factor = factor * factor * factor;
      break;
    }
    case 'linear':
    default: {
      // No modification needed
      break;
    }
  }
  
  return valueA + (valueB - valueA) * factor;
};

export const evaluateLogicGate = (
  inputA: boolean,
  inputB: boolean,
  gateType: string
): boolean => {
  switch (gateType) {
    case 'and': {
      return inputA && inputB;
    }
    case 'or': {
      return inputA || inputB;
    }
    case 'not': {
      return !inputA;
    }
    case 'xor': {
      return inputA !== inputB;
    }
    case 'nand': {
      return !(inputA && inputB);
    }
    case 'nor': {
      return !(inputA || inputB);
    }
    default: {
      return false;
    }
  }
};

// Spatial filtering utilities
export const isPointInCircle = (point: Vec2, center: Vec2, radius: number): boolean => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
};

export const isPointInRectangle = (
  point: Vec2,
  center: Vec2,
  width: number,
  height: number
): boolean => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return (
    point.x >= center.x - halfWidth &&
    point.x <= center.x + halfWidth &&
    point.y >= center.y - halfHeight &&
    point.y <= center.y + halfHeight
  );
};

export const getDistance = (point1: Vec2, point2: Vec2): number => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Performance monitoring
export const measurePerformance = <T>(fn: () => T, label: string): { result: T; time: number } => {
  const start = performance.now();
  const result = fn();
  const time = performance.now() - start;
  
  if (time > 100) {
    console.warn(`Performance warning: ${label} took ${time.toFixed(2)}ms`);
  }
  
  return { result, time };
};

// Helper function to check processing limits
const checkProcessingLimits = (context: ProcessingContext): boolean => {
  const currentTime = performance.now();
  const elapsed = currentTime - context.startTime;
  
  if (elapsed > context.maxProcessingTime) {
    console.warn('Processing time limit exceeded');
    return false;
  }
  
  if (context.currentIterations > context.maxIterations) {
    console.warn('Iteration limit exceeded');
    return false;
  }
  
  return true;
};

export const generatePoincareDiscPoints = (
  count: number,
  radius: number,
  density: number = 0.5,
  center: Vec2 = { x: 0, y: 0 },
  existingElements: GeneratedElement[] = [],
  seed: number = 1234
): Vec2[] => {
  const points: Vec2[] = [];
  const maxCandidates = 20; // Limit candidate generation for performance
  const maxIterations = Math.min(count * 10, 500); // Limit total iterations
  const prng = arbit(seed);
  
  for (let i = 0; i < count && i < maxIterations; i++) {
    let bestPoint: Vec2 | null = null;
    let maxMinDistance = -1;
    
    // Generate multiple candidates and pick the one farthest from existing elements
    for (let candidate = 0; candidate < maxCandidates; candidate++) {
      // Generate random angle
      const angle = prng.nextFloat(0, 2 * Math.PI);
      
      // Generate radius with hyperbolic distribution
      // density < 0.5 = bias towards center, > 0.5 = bias towards edge
      let r: number;
      if (density < 0.5) {
        // Bias towards center - use power function
        const power = 1 + (0.5 - density) * 4; // power range 1-3
        r = Math.pow(prng.nextFloat(0, 1), power) * radius;
      } else if (density > 0.5) {
        // Bias towards edge - use inverse power function
        const power = 1 + (density - 0.5) * 4; // power range 1-3
        r = (1 - Math.pow(1 - prng.nextFloat(0, 1), power)) * radius;
      } else {
        // Uniform distribution
        r = Math.sqrt(prng.nextFloat(0, 1)) * radius;
      }
      
      // Convert to Cartesian coordinates
      const candidatePoint = {
        x: center.x + r * Math.cos(angle),
        y: center.y + r * Math.sin(angle)
      };
      
      // Calculate minimum distance to existing elements and previously placed points
      let minDistance = Infinity;
      
      // Check distance to existing elements
      if (existingElements.length > 0) {
        for (const element of existingElements) {
          if (element.type === 'circle') {
            const elementCenter = element.position;
            const dist = getDistance(candidatePoint, elementCenter);
            minDistance = Math.min(minDistance, dist);
          } else if (element.type === 'polygon' && element.points) {
            // For polygons, check distance to center of bounding box
            const vertices = element.points;
            const centroid = {
              x: vertices.reduce((sum: number, v: Vec2) => sum + v.x, 0) / vertices.length,
              y: vertices.reduce((sum: number, v: Vec2) => sum + v.y, 0) / vertices.length
            };
            const dist = getDistance(candidatePoint, centroid);
            minDistance = Math.min(minDistance, dist);
          } else {
            // For other types, use the position as the reference point
            const dist = getDistance(candidatePoint, element.position);
            minDistance = Math.min(minDistance, dist);
          }
        }
      }
      
      // Check distance to previously placed points
      for (const point of points) {
        const dist = getDistance(candidatePoint, point);
        minDistance = Math.min(minDistance, dist);
      }
      
      // If this candidate has a better minimum distance, use it
      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance;
        bestPoint = candidatePoint;
      }
    }
    
    // Add the best point found (or fallback to first candidate if none found)
    if (bestPoint) {
      points.push(bestPoint);
    }
  }
  
  return points;
};

// Particle system for attractor physics simulation
interface Particle {
  position: Vec2;
  velocity: Vec2;
  mass: number;
  radius: number;
}

export const simulateAttractorPhysics = (
  particleCount: number,
  initialRadius: number,
  hexSpacing: number,
  strength: number,
  damping: number,
  steps: number,
  itemScales: number[],
  falloffStrength: number,
  bounds: { width: number; height: number } = { width: 800, height: 600 }
): Particle[] => {
  // Center of the simulation area
  const center = { x: bounds.width / 2, y: bounds.height / 2 };
  
  // Generate hexagonal grid points within the initial radius
  const rows = Math.ceil((initialRadius * 2) / (hexSpacing * Math.sqrt(3) / 2));
  const cols = Math.ceil((initialRadius * 2) / hexSpacing);
  
  // Generate all hex points first
  const allHexPoints: { point: Vec2; distance: number }[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexSpacing + (row % 2) * (hexSpacing / 2) - initialRadius;
      const y = row * (hexSpacing * Math.sqrt(3) / 2) - initialRadius;
      
      // Check if point is within the circular boundary
      const distance = Math.sqrt(x * x + y * y);
      if (distance <= initialRadius) {
        allHexPoints.push({
          point: {
            x: center.x + x,
            y: center.y + y
          },
          distance: distance
        });
      }
    }
  }
  
  // Sort by distance from center (spiral outward)
  allHexPoints.sort((a, b) => a.distance - b.distance);
  
  // Take only the requested number of particles (spiraling from center)
  const selectedPoints = allHexPoints.slice(0, particleCount).map(item => item.point);
  
  // Initialize particles with hexagonal positions and variable radius
  const particles: Particle[] = selectedPoints.map((point, index) => {
    const baseItemScale = (itemScales[index % itemScales.length] || 100) / 100;
    
    // Calculate falloff based on initial position
    const distance = getDistance(point, center);
    const falloffScale = 1 - (distance / initialRadius) * falloffStrength;
    const finalScale = Math.max(0, baseItemScale * falloffScale);

    return {
      position: { ...point },
      velocity: { x: 0, y: 0 },
      mass: 1 * finalScale * finalScale, // Mass proportional to area
      radius: (hexSpacing / 2) * finalScale
    };
  });
  
  // Collision radius is now per-particle and accounts for falloff
  
  // Run physics simulation
  for (let step = 0; step < steps; step++) {
    // Apply gravity forces
    particles.forEach(particle => {
      // Calculate gravity force towards center
      const dx = center.x - particle.position.x;
      const dy = center.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 1) { // Avoid division by zero
        // Simplified gravity: F = strength / distance
        const forceStrength = strength / distance;
        const force = {
          x: (dx / distance) * forceStrength,
          y: (dy / distance) * forceStrength
        };
        
        // Apply force to velocity (F = ma, assuming m = 1)
        particle.velocity.x += force.x;
        particle.velocity.y += force.y;
      }
    });
    
    // Collision detection and resolution
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionDistance = p1.radius + p2.radius;
        
        // Check for collision
        if (distance < collisionDistance && distance > 0) {
          // Calculate overlap
          const overlap = collisionDistance - distance;
          const separationX = (dx / distance) * (overlap / 2);
          const separationY = (dy / distance) * (overlap / 2);
          
          // Separate particles
          p1.position.x -= separationX;
          p1.position.y -= separationY;
          p2.position.x += separationX;
          p2.position.y += separationY;
          
          // Simple elastic collision response
          const velocityDampening = 0.8;
          const relativeVelocityX = p2.velocity.x - p1.velocity.x;
          const relativeVelocityY = p2.velocity.y - p1.velocity.y;
          
          const impulse = (relativeVelocityX * dx + relativeVelocityY * dy) / (distance * distance);
          
          p1.velocity.x += impulse * dx * velocityDampening;
          p1.velocity.y += impulse * dy * velocityDampening;
          p2.velocity.x -= impulse * dx * velocityDampening;
          p2.velocity.y -= impulse * dy * velocityDampening;
        }
      }
    }
    
    // Update positions and apply damping
    particles.forEach(particle => {
      // Apply damping
      particle.velocity.x *= damping;
      particle.velocity.y *= damping;
      
      // Update position
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      
      // Keep particles within bounds (soft boundary)
      const margin = 50;
      if (particle.position.x < margin) {
        particle.velocity.x += (margin - particle.position.x) * 0.1;
      }
      if (particle.position.x > bounds.width - margin) {
        particle.velocity.x -= (particle.position.x - (bounds.width - margin)) * 0.1;
      }
      if (particle.position.y < margin) {
        particle.velocity.y += (margin - particle.position.y) * 0.1;
      }
      if (particle.position.y > bounds.height - margin) {
        particle.velocity.y -= (particle.position.y - (bounds.height - margin)) * 0.1;
      }
    });
  }
  
  return particles;
};

export const generateGridPoints = (
  columns: number,
  rows: number,
  width: number,
  height: number,
  direction: string,
  seed: number = 1234
): Vec2[] => {
  switch (direction) {
    case 'horizontal': {
      const startX = -width / 2;
      const startY = -height / 2;
      const stepX = width / (columns - 1);
      const stepY = height / (rows - 1);
      const points: Vec2[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const x = startX + col * stepX;
          const y = startY + row * stepY;
          points.push({ x, y });
        }
      }
      return points;
    }

    case 'vertical': {
      const startX = -width / 2;
      const startY = -height / 2;
      const stepX = width / (columns - 1);
      const stepY = height / (rows - 1);
      const points: Vec2[] = [];

      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          const x = startX + col * stepX;
          const y = startY + row * stepY;
          points.push({ x, y });
        }
      }
      return points;
    }

    case 'diagonal': {
      const startX = -width / 2;
      const startY = -height / 2;
      const stepX = width / (columns - 1);
      const stepY = height / (rows - 1);
      const points: Vec2[] = [];

      for (let i = 0; i < rows * columns; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = startX + col * stepX;
        const y = startY + row * stepY;
        points.push({ x, y });
      }
      return points;
    }

    case 'spiral': {
      const points: Vec2[] = [];
      const centerX = 0;
      const centerY = 0;
      const radius = Math.min(width, height) / 2;
      const angleStep = (2 * Math.PI) / (rows * columns);

      for (let i = 0; i < rows * columns; i++) {
        const angle = i * angleStep;
        const r = (radius * i) / (rows * columns);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        points.push({ x, y });
      }
      return points;
    }

    case 'random': {
      const points: Vec2[] = [];
      const startX = -width / 2;
      const startY = -height / 2;
      const prng = arbit(seed)

      for (let i = 0; i < rows * columns; i++) {
        const x = startX + prng.random() * width;
        const y = startY + prng.random() * height;
        points.push({ x, y });
      }
      return points;
    }

    default:
      return [];
  }
};