import { IDistributeHandler, IPhyllotaxisDistributeParams, IHexagonalDistributeParams, IAttractorDistributeParams, IPoincareDistributeParams, IPoissonDiskDistributeParams, ITriangularDistributeParams } from "./distribute-interfaces";
import { Ray, IShape, Point } from "../../geom/core";
import { resolveStringOrNumber } from "../stamp-helpers";
import { IShapeContext, IShapeParams } from "../stamp-interfaces";
import { GeomHelpers } from "../../geom/helpers";
import * as arbit from "arbit";

const $ = resolveStringOrNumber;

// Helper functions adapted from utils.ts
interface Vec2 {
  x: number;
  y: number;
}

interface Particle {
  position: Vec2;
  velocity: Vec2;
  mass: number;
  radius: number;
}

const generatePhyllotaxisPattern = (
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

const generateHexagonalGrid = (
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

const generateTriangularGrid = (
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

const generatePoissonDisk = (
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
    
    for (let i = 0; i < 90; i++) {
      const angle = prng.nextFloat(0, Math.PI * 2);
      const distance = minDistance + prng.nextFloat(0, minDistance) * (300 / (i + 1));
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

const generatePoincareDiscPoints = (
  count: number,
  radius: number,
  density: number = 0.5,
  center: Vec2 = { x: 0, y: 0 },
  seed: number = 1234
): Vec2[] => {
  const points: Vec2[] = [];
  const maxCandidates = 20;
  const maxIterations = Math.min(count * 10, 500);
  const prng = arbit(seed);
  
  for (let i = 0; i < count && i < maxIterations; i++) {
    let bestPoint: Vec2 | null = null;
    let maxMinDistance = -1;
    
    for (let candidate = 0; candidate < maxCandidates; candidate++) {
      const angle = prng.nextFloat(0, 2 * Math.PI);
      
      let r: number;
      if (density < 0.5) {
        const power = 1 + (0.5 - density) * 4;
        r = Math.pow(prng.nextFloat(0, 1), power) * radius;
      } else if (density > 0.5) {
        const power = 1 + (density - 0.5) * 4;
        r = (1 - Math.pow(1 - prng.nextFloat(0, 1), power)) * radius;
      } else {
        r = Math.sqrt(prng.nextFloat(0, 1)) * radius;
      }
      
      const candidatePoint = {
        x: center.x + r * Math.cos(angle),
        y: center.y + r * Math.sin(angle)
      };
      
      let minDistance = Infinity;
      for (const point of points) {
        const dist = Math.sqrt(
          Math.pow(candidatePoint.x - point.x, 2) + Math.pow(candidatePoint.y - point.y, 2)
        );
        minDistance = Math.min(minDistance, dist);
      }
      
      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance;
        bestPoint = candidatePoint;
      }
    }
    
    if (bestPoint) {
      points.push(bestPoint);
    }
  }
  
  return points;
};

const simulateAttractorPhysics = (
  particleCount: number,
  initialRadius: number,
  hexSpacing: number,
  strength: number,
  damping: number,
  steps: number,
  itemScales: number[],
  falloffStrength: number = 0,
  bounds: { width: number; height: number } = { width: 800, height: 600 }
): Particle[] => {
  const center = { x: bounds.width / 2, y: bounds.height / 2 };
  
  const rows = Math.ceil((initialRadius * 2) / (hexSpacing * Math.sqrt(3) / 2));
  const cols = Math.ceil((initialRadius * 2) / hexSpacing);
  
  const allHexPoints: { point: Vec2; distance: number }[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexSpacing + (row % 2) * (hexSpacing / 2) - initialRadius;
      const y = row * (hexSpacing * Math.sqrt(3) / 2) - initialRadius;
      
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
  
  allHexPoints.sort((a, b) => a.distance - b.distance);
  const selectedPoints = allHexPoints.slice(0, particleCount).map(item => item.point);
  
  // Initialize particles with hexagonal positions and variable radius
  const particles: Particle[] = selectedPoints.map((point, index) => {
    // itemScales now contains actual world-unit diameters, so radius = diameter / 2
    const baseRadius = (itemScales[index % itemScales.length] || 40) / 2;
    
    // Calculate falloff based on initial position
    const distance = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
    const falloffScale = 1 - (distance / initialRadius) * falloffStrength;
    const finalRadius = Math.max(0, baseRadius * falloffScale);

    return {
      position: { ...point },
      velocity: { x: 0, y: 0 },
      mass: 1 * finalRadius * finalRadius, // Mass proportional to area
      radius: finalRadius // Use the actual collision radius in world units
    };
  });
  
  // Run physics simulation
  for (let step = 0; step < steps; step++) {
    // Apply gravity forces
    particles.forEach(particle => {
      const dx = center.x - particle.position.x;
      const dy = center.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 1) {
        const forceStrength = strength / distance;
        const force = {
          x: (dx / distance) * forceStrength,
          y: (dy / distance) * forceStrength
        };
        
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
        
        if (distance < collisionDistance && distance > 0) {
          const overlap = collisionDistance - distance;
          const separationX = (dx / distance) * (overlap / 2);
          const separationY = (dy / distance) * (overlap / 2);
          
          p1.position.x -= separationX;
          p1.position.y -= separationY;
          p2.position.x += separationX;
          p2.position.y += separationY;
          
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
      particle.velocity.x *= damping;
      particle.velocity.y *= damping;
      
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      
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

// Phyllotaxis (spiral) distribution handler
export class PhyllotaxisDistributeHandler implements IDistributeHandler {
  private _resolvedParams: IPhyllotaxisDistributeParams;
  private _positions: Vec2[] = [];

  constructor(params: IPhyllotaxisDistributeParams) {
    this._resolvedParams = {
      ...params,
      count: $(params?.count) || 100,
      angle: $(params?.angle) || 137.5,
      scaleFactor: $(params?.scaleFactor) || 2,
      itemScaleFalloff: $(params?.itemScaleFalloff) || 0,
      skipFirst: $(params?.skipFirst) || 0,
    };
  }

  getCenters(): Ray[] {
    const count = Math.round(this._resolvedParams.count as number);
    const angle = this._resolvedParams.angle as number;
    const scaleFactor = this._resolvedParams.scaleFactor as number;
    const skipFirst = Math.round(this._resolvedParams.skipFirst as number);
    
    // Generate the pattern with skipFirst built in
    this._positions = generatePhyllotaxisPattern(count, angle, scaleFactor, { x: 0, y: 0 }, skipFirst);
    
    return this._positions.map(() => new Ray(0, 0, 0));
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    const falloffStrength = this._resolvedParams.itemScaleFalloff as number;
    const maxRadius = (this._resolvedParams.scaleFactor as number) * Math.sqrt(this._resolvedParams.count as number) || 1;
    
    shapes.forEach((shape, index) => {
      if (index < this._positions.length) {
        const position = this._positions[index];
        const distance = Math.sqrt(position.x * position.x + position.y * position.y);
        const falloffScale = 1 - (distance / (maxRadius * 2)) * falloffStrength;
        
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as any).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = shape.center;
        center.x = position.x + offset.x;
        center.y = position.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;
        
        // Always apply falloff scaling (even if it's 1.0)
        shape.rescale(falloffScale);
        
        if ($(params.skip || 0) > 0) {
          shape.hidden = true;
        }
      }
    });
  }
}

// Hexagonal grid distribution handler
export class HexagonalDistributeHandler implements IDistributeHandler {
  private _resolvedParams: IHexagonalDistributeParams;
  private _positions: Vec2[] = [];

  constructor(params: IHexagonalDistributeParams) {
    this._resolvedParams = {
      ...params,
      columns: $(params?.columns) || 5,
      rows: $(params?.rows) || 5,
      spacing: $(params?.spacing) || 50,
      itemScaleFalloff: $(params?.itemScaleFalloff) || 0,
    };
  }

  getCenters(): Ray[] {
    const columns = Math.round(this._resolvedParams.columns as number);
    const rows = Math.round(this._resolvedParams.rows as number);
    const spacing = this._resolvedParams.spacing as number;
    
    this._positions = generateHexagonalGrid(columns, rows, spacing);
    
    return this._positions.map(() => new Ray(0, 0, 0));
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    const falloffStrength = this._resolvedParams.itemScaleFalloff as number;
    const spacing = this._resolvedParams.spacing as number;
    const maxDistance = spacing * Math.max(this._resolvedParams.columns as number, this._resolvedParams.rows as number) || 1;
    const bb = GeomHelpers.pointsBoundingBox(this._positions as Point[]);
    shapes.forEach((shape, index) => {
      if (index < this._positions.length) {
        const position = { x: this._positions[index].x - bb.width / 2, y: this._positions[index].y - bb.height / 2 };
        
        const distance = Math.sqrt(position.x * position.x + position.y * position.y);
        const falloffScale = 1 - (distance / maxDistance) * falloffStrength;
        
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as any).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = shape.center;
        center.x = position.x + offset.x;
        center.y = position.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;
        
        // Always apply falloff scaling
        shape.rescale(falloffScale);
        
        if ($(params.skip || 0) > 0) {
          shape.hidden = true;
        }
      }
    });
  }
}

// Triangular grid distribution handler
export class TriangularDistributeHandler implements IDistributeHandler {
  private _resolvedParams: ITriangularDistributeParams;
  private _positions: Vec2[] = [];

  constructor(params: ITriangularDistributeParams) {
    this._resolvedParams = {
      ...params,
      columns: $(params?.columns) || 5,
      rows: $(params?.rows) || 5,
      spacing: $(params?.spacing) || 50,
      itemScaleFalloff: $(params?.itemScaleFalloff) || 0,
    };
  }

  getCenters(): Ray[] {
    const columns = Math.round(this._resolvedParams.columns as number);
    const rows = Math.round(this._resolvedParams.rows as number);
    const spacing = this._resolvedParams.spacing as number;
    
    this._positions = generateTriangularGrid(columns, rows, spacing);
    
    return this._positions.map(() => new Ray(0, 0, 0));
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    const falloffStrength = this._resolvedParams.itemScaleFalloff as number;
    const spacing = this._resolvedParams.spacing as number;
    const maxDistance = spacing * Math.max(this._resolvedParams.columns as number, this._resolvedParams.rows as number) || 1;
    const bb = GeomHelpers.pointsBoundingBox(this._positions as Point[]);
    shapes.forEach((shape, index) => {
      if (index < this._positions.length) {
        const position = { x: this._positions[index].x - bb.width / 2, y: this._positions[index].y - bb.height / 2 };
        const distance = Math.sqrt(position.x * position.x + position.y * position.y);
        const falloffScale = 1 - (distance / maxDistance) * falloffStrength;
        
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as any).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = shape.center;
        center.x = position.x + offset.x;
        center.y = position.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;
        
        // Always apply falloff scaling
        shape.rescale(falloffScale);
        
        if ($(params.skip || 0) > 0) {
          shape.hidden = true;
        }
      }
    });
  }
}

// Attractor physics distribution handler
export class AttractorDistributeHandler implements IDistributeHandler {
  private _resolvedParams: IAttractorDistributeParams;
  private _particles: Particle[] = [];

  constructor(params: IAttractorDistributeParams) {
    this._resolvedParams = {
      ...params,
      particleCount: $(params?.particleCount) || 50,
      initialRadius: $(params?.initialRadius) || 200,
      hexSpacing: $(params?.hexSpacing) || 40,
      strength: $(params?.strength) || 5,
      damping: $(params?.damping) || 0.95,
      simulationSteps: $(params?.simulationSteps) || 100,
      itemScaleFalloff: $(params?.itemScaleFalloff) || 0,
      padding: $(params?.padding) || 0
    };
  }

  getCenters(): Ray[] {
    const particleCount = Math.round(this._resolvedParams.particleCount as number);
    
    return Array(particleCount).fill(0).map(() => new Ray(0, 0, 0));
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    const particleCount = Math.round(this._resolvedParams.particleCount as number);
    const initialRadius = this._resolvedParams.initialRadius as number;
    const hexSpacing = this._resolvedParams.hexSpacing as number;
    const strength = this._resolvedParams.strength as number;
    const damping = this._resolvedParams.damping as number;
    const simulationSteps = Math.round(this._resolvedParams.simulationSteps as number);
    const falloffStrength = this._resolvedParams.itemScaleFalloff as number;
    const padding = this._resolvedParams.padding as number;

    // Reset sequences with seed for deterministic behavior (following nodeProcessor pattern)
    //Sequence.resetAll(seed);
    
    // FIXED: Calculate proper item scales for collision detection without hexSpacing feedback loop
    // The key insight: itemScales should represent the actual collision radius in world units, not relative to hexSpacing
    const itemScales: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      if (i < shapes.length) {
        const shape = shapes[i];
        // Get the actual size from the shape's bounding circle
        const boundingCircle = shape.boundingCircle();
        let effectiveRadius = boundingCircle.radius;
        
        // Apply any scaling that might be present
        if ((shape as any).scale) {
          effectiveRadius *= (shape as any).scale;
        }
        
        // Add padding to the effective radius for collision detection
        effectiveRadius += padding;
        
        // Store the actual world radius (not relative to hexSpacing!)
        // This prevents the feedback loop while giving proper collision detection
        itemScales.push(effectiveRadius * 2); // diameter for collision detection
      } else {
        // Default size for extra particles
        const defaultRadius = 20 + padding; // reasonable default size in world units
        itemScales.push(defaultRadius * 2);
      }
    }
    
    // Run physics simulation with pre-calculated item scales and seed for determinism
    // The falloffStrength is applied within the physics simulation to the initial hex grid
    this._particles = simulateAttractorPhysics(
      particleCount,
      initialRadius,
      hexSpacing,
      strength,
      damping,
      simulationSteps,
      itemScales,
      falloffStrength,
      { width: initialRadius * 2, height: initialRadius * 2 }
    );
    
    const simulationCenter = { x: initialRadius, y: initialRadius };
    
    shapes.forEach((shape, index) => {
      if (index < this._particles.length) {
        const particle = this._particles[index];
        
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as any).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = shape.center;
        center.x = particle.position.x - simulationCenter.x + offset.x;
        center.y = particle.position.y - simulationCenter.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;
        
        // FIXED: Calculate visual scale from actual collision radius back to shape's original size
        // particle.radius now contains the actual collision radius in world units (including padding)
        // We need to scale the shape to match this collision radius
        const originalBoundingCircle = shape.boundingCircle();
        let originalRadius = originalBoundingCircle.radius;
        
        // Apply any existing scaling
        if ((shape as any).scale) {
          originalRadius *= (shape as any).scale;
        }
        
        // Calculate scale factor: target collision radius / (original radius + padding)
        const targetVisualRadius = Math.max(0, particle.radius - padding);
        const finalScale = originalRadius > 0 ? targetVisualRadius / originalRadius : 0;
        shape.rescale(finalScale);
        
        if ($(params.skip || 0) > 0) {
          shape.hidden = true;
        }
      }
    });
  }
}

// Poincaré disc distribution handler
export class PoincareDistributeHandler implements IDistributeHandler {
  private _resolvedParams: IPoincareDistributeParams;
  private _positions: Vec2[] = [];

  constructor(params: IPoincareDistributeParams) {
    this._resolvedParams = {
      ...params,
      count: $(params?.count) || 80,
      radius: $(params?.radius) || 150,
      density: $(params?.density) || 0.5,
      seed: $(params?.seed) || 1234,
      itemScaleFalloff: $(params?.itemScaleFalloff) || 0,
    };
  }

  getCenters(): Ray[] {
    const count = Math.round(this._resolvedParams.count as number);
    const radius = this._resolvedParams.radius as number;
    const density = this._resolvedParams.density as number;
    const seed = this._resolvedParams.seed as number;
    
    this._positions = generatePoincareDiscPoints(count, radius, density, { x: 0, y: 0 }, seed);
    
    return this._positions.map(() => new Ray(0, 0, 0));
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    const falloffStrength = this._resolvedParams.itemScaleFalloff as number;
    const maxRadius = this._resolvedParams.radius as number || 1;
    
    shapes.forEach((shape, index) => {
      if (index < this._positions.length) {
        const position = this._positions[index];
        const distance = Math.sqrt(position.x * position.x + position.y * position.y);
        const falloffScale = 1 - (distance / (maxRadius * 2)) * falloffStrength;
        
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as any).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = shape.center;
        center.x = position.x + offset.x;
        center.y = position.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;
        
        // Always apply falloff scaling
        shape.rescale(falloffScale);
        
        if ($(params.skip || 0) > 0) {
          shape.hidden = true;
        }
      }
    });
  }
}

// Poisson disk distribution handler
export class PoissonDiskDistributeHandler implements IDistributeHandler {
  private _resolvedParams: IPoissonDiskDistributeParams;
  private _positions: Vec2[] = [];

  constructor(params: IPoissonDiskDistributeParams) {
    this._resolvedParams = {
      ...params,
      width: $(params?.width) || 400,
      height: $(params?.height) || 400,
      minDistance: $(params?.minDistance) || 30,
      maxPoints: $(params?.maxPoints) || 100,
      seed: $(params?.seed) || 1234,
    };
  }

  getCenters(): Ray[] {
    const width = this._resolvedParams.width as number;
    const height = this._resolvedParams.height as number;
    const minDistance = this._resolvedParams.minDistance as number;
    const maxPoints = Math.round(this._resolvedParams.maxPoints as number);
    const seed = this._resolvedParams.seed as number;
    
    this._positions = generatePoissonDisk(width, height, minDistance, maxPoints, seed);
    
    // Center the positions
    this._positions = this._positions.map(pos => ({
      x: pos.x - width / 2,
      y: pos.y - height / 2
    }));
    
    return this._positions.map(() => new Ray(0, 0, 0));
  }

  arrangeShapes(shapes: IShape[], params: IShapeParams, context: IShapeContext): void {
    shapes.forEach((shape, index) => {
      if (index < this._positions.length) {
        const position = this._positions[index];
        
        const offsetX = $(params.offsetX || 0);
        const offset = new Point(
          (this._resolvedParams as any).negateOffsetX ? -offsetX : offsetX,
          $(params.offsetY || 0),
        );
        GeomHelpers.rotatePoint(offset, Math.PI - context.getCursorDirection());
        
        const center = shape.center;
        center.x = position.x + offset.x;
        center.y = position.y + offset.y;
        center.direction = params.angle ? ($(params.angle) * Math.PI) / 180 : 0;
        
        if ($(params.skip || 0) > 0) {
          shape.hidden = true;
        }
      }
    });
  }
} 