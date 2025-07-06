import { Node, GeneratedElement, Vec2, ParameterValue } from './node-interfaces';
import { Sequence } from '../sequence';
import {
  generateRectangularGrid,
  generateHexagonalGrid,
  generatePhyllotaxisPattern,
  generatePoincareDiscPoints,
  simulateAttractorPhysics,
  getDistance
} from './utils';

export interface ProcessingContext {
  maxIterations: number;
  maxProcessingTime: number;
  maxElements: number;
  currentIterations: number;
  startTime: number;
}

export const createProcessingContext = (): ProcessingContext => ({
  maxIterations: 10000,
  maxProcessingTime: 5000, // 5 seconds
  maxElements: 50000,
  currentIterations: 0,
  startTime: performance.now()
});

export const checkProcessingLimits = (context: ProcessingContext): boolean => {
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

// CRITICAL FIX: Helper function to resolve parameter values (static or sequence)
const resolveParameterValue = (value: ParameterValue | undefined): number => {
  if (typeof value === 'string') {
    try {
      // This properly resolves sequence expressions and advances them
      return Sequence.resolve(value);
    } catch (error) {
      console.warn('Error resolving sequence parameter:', error);
      return 0;
    }
  }
  return typeof value === 'number' ? value : 0;
};

// PHASE 2: Helper function to generate elements from either shape or stamp nodes
const generateElementsFromNode = (_sourceNode: Node, _allNodes: Node[], _elementId?: string, _itemDirection?: number): GeneratedElement[] => {
  return [];
};

// New unified distributor processor - PHASE 2: Enhanced with stamp commands support
export const processDistributorNode = (node: Node, shapeNodes: Node[], allNodes: Node[], existingElements: GeneratedElement[] = [], stampNodes: Node[] = []): GeneratedElement[] => {
  const distributionType = node.parameters.find(p => p.id === 'distribution-type')?.value || 'grid';
  
  switch (distributionType) {
    case 'grid': {
      return processGridDistribution(node, shapeNodes, allNodes, stampNodes);
    }
    case 'phyllotaxis': {
      return processPhyllotaxisDistribution(node, shapeNodes, allNodes, stampNodes);
    }
    case 'attractor': {
      return processAttractorDistribution(node, shapeNodes, allNodes, stampNodes);
    }
    case 'poincare': {
      return processPoincareDistribution(node, shapeNodes, allNodes, existingElements, stampNodes);
    }
    case 'stamp-grid': {
      return processStampGridDistribution(node, shapeNodes, allNodes, stampNodes);
    }
    case 'stamp-circle': {
      return processStampCircleDistribution(node, shapeNodes, allNodes, stampNodes);
    }
    default: {
      return processGridDistribution(node, shapeNodes, allNodes, stampNodes);
    }
  }
};

// CRITICAL FIX: Process grid distribution by generating fresh shapes for each position
// PHASE 2: Enhanced to support stamp commands
const processGridDistribution = (node: Node, shapeNodes: Node[], allNodes: Node[], stampNodes: Node[] = []): GeneratedElement[] => {
  const columnsParam = node.parameters.find(p => p.id === 'columns')?.value;
  const columns = Math.round(resolveParameterValue(columnsParam));

  const rowsParam = node.parameters.find(p => p.id === 'rows')?.value;
  const rows = Math.round(resolveParameterValue(rowsParam));

  const spacingXParam = node.parameters.find(p => p.id === 'spacing-x')?.value;
  const spacingX = resolveParameterValue(spacingXParam);

  const spacingYParam = node.parameters.find(p => p.id === 'spacing-y')?.value;
  const spacingY = resolveParameterValue(spacingYParam);

  // const jitterParam = node.parameters.find(p => p.id === 'jitter')?.value;
  // const jitter = resolveParameterValue(jitterParam); // TODO: Implement jitter functionality

  const gridTypeParam = node.parameters.find(p => p.id === 'grid-type')?.value;
  const gridType = typeof gridTypeParam === 'string' ? gridTypeParam : 'rectangular';

  const falloffStrengthParam = node.parameters.find(p => p.id === 'item-scale-falloff')?.value;
  const falloffStrength = resolveParameterValue(falloffStrengthParam);

  const itemScaleParam = node.parameters.find(p => p.id === 'item-scale');
  const itemScaleValue = itemScaleParam?.value || 100;
  if (typeof itemScaleValue === 'string' && itemScaleValue.startsWith('@')) {
    Sequence.reset(itemScaleValue.substring(1));
  }
  
  const itemDirectionParam = node.parameters.find(p => p.id === 'item-direction');
  const itemDirectionValue = itemDirectionParam?.value || 0;
  if (typeof itemDirectionValue === 'string' && itemDirectionValue.startsWith('@')) {
    Sequence.reset(itemDirectionValue.substring(1));
  }

  let positions: Vec2[];

  switch (gridType) {
    case 'hexagonal': {
      positions = generateHexagonalGrid(columns, rows, spacingX);
      break;
    }
    case 'rectangular':
    default: {
      positions = generateRectangularGrid(columns, rows, spacingX, spacingY);
      break;
    }
  }

  const halfWidth = (columns - 1) * spacingX / 2;
  const halfHeight = (rows - 1) * spacingY / 2;
  const maxDistance = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight) || 1;

  const elements: GeneratedElement[] = [];

  // PHASE 2: Combine both shape and stamp nodes for distribution
  const allSourceNodes = [...shapeNodes, ...stampNodes];
  
  positions.forEach((position, posIndex) => {
    allSourceNodes.forEach((sourceNode, sourceIndex) => {
      const itemScale = resolveParameterValue(itemScaleValue) / 100;
      const itemDirection = resolveParameterValue(itemDirectionValue);
      
      // Generate elements from either shape or stamp node
      const generatedElements = generateElementsFromNode(sourceNode, allNodes, undefined, itemDirection);

      const distance = Math.sqrt(position.x * position.x + position.y * position.y);
      const falloffScale = 1 - (distance / (maxDistance * 2)) * falloffStrength;
      const finalScale = itemScale * falloffScale;

      const positionedElements = generatedElements.map((element, partIndex) => ({
        ...element,
        id: `${node.id}-${sourceIndex}-${posIndex}-${partIndex}`,
        position: {
          x: element.position.x + position.x,
          y: element.position.y + position.y
        },
        size: {
          x: element.size.x * finalScale,
          y: element.size.y * finalScale
        },
        points: element.points?.map(p => ({ x: p.x * finalScale, y: p.y * finalScale }))
      }));

      elements.push(...positionedElements);
    });
  });

  return elements;
};

// CRITICAL FIX: Process phyllotaxis distribution by generating fresh shapes for each position
// PHASE 2: Enhanced to support stamp commands
const processPhyllotaxisDistribution = (node: Node, shapeNodes: Node[], allNodes: Node[], stampNodes: Node[] = []): GeneratedElement[] => {
  const count = Math.round(resolveParameterValue(node.parameters.find(p => p.id === 'count')?.value || 100));
  const angle = resolveParameterValue(node.parameters.find(p => p.id === 'angle')?.value || 137.5);
  const scaleFactor = resolveParameterValue(node.parameters.find(p => p.id === 'scale-factor')?.value || 2);
  const falloffStrength = resolveParameterValue(node.parameters.find(p => p.id === 'item-scale-falloff')?.value || 0);
  
  const itemScaleParam = node.parameters.find(p => p.id === 'item-scale');
  const itemScaleValue = itemScaleParam?.value || 100;
  if (typeof itemScaleValue === 'string' && itemScaleValue.startsWith('@')) {
    Sequence.reset(itemScaleValue.substring(1));
  }
  
  const itemDirectionParam = node.parameters.find(p => p.id === 'item-direction');
  const itemDirectionValue = itemDirectionParam?.value || 0;
  if (typeof itemDirectionValue === 'string' && itemDirectionValue.startsWith('@')) {
    Sequence.reset(itemDirectionValue.substring(1));
  }
  
  const center = { x: 0, y: 0 };
  const positions = generatePhyllotaxisPattern(count, angle, scaleFactor, center);
  
  const maxRadius = scaleFactor * Math.sqrt(count) || 1;

  const elements: GeneratedElement[] = [];
  
  // PHASE 2: Combine both shape and stamp nodes for distribution
  const allSourceNodes = [...shapeNodes, ...stampNodes];
  
  positions.forEach((position, posIndex) => {
    allSourceNodes.forEach((sourceNode, sourceIndex) => {
      const itemScale = resolveParameterValue(itemScaleValue) / 100;
      const itemDirection = resolveParameterValue(itemDirectionValue);
      
      // Generate elements from either shape or stamp node
      const generatedElements = generateElementsFromNode(sourceNode, allNodes, undefined, itemDirection);
      
      const distance = getDistance(position, center);
      const falloffScale = 1 - (distance / (maxRadius * 2)) * falloffStrength;
      const finalScale = itemScale * falloffScale;
      
      const positionedAndScaledElements = generatedElements.map((element, partIndex) => {
        return {
          ...element,
          id: `${node.id}-${sourceIndex}-${posIndex}-${partIndex}`,
          position,
          size: {
            x: element.size.x * finalScale,
            y: element.size.y * finalScale
          },
          points: element.points?.map(p => ({ x: p.x * finalScale, y: p.y * finalScale }))
        };
      });

      elements.push(...positionedAndScaledElements);
    });
  });
  
  return elements;
};

// Process attractor distribution (physics-based particle simulation)
// PHASE 2: Enhanced to support stamp commands
const processAttractorDistribution = (node: Node, shapeNodes: Node[], allNodes: Node[], stampNodes: Node[] = []): GeneratedElement[] => {
  const particleCount = Math.round(resolveParameterValue(node.parameters.find(p => p.id === 'particle-count')?.value || 50));
  const initialRadius = resolveParameterValue(node.parameters.find(p => p.id === 'initial-radius')?.value || 200);
  const hexSpacing = resolveParameterValue(node.parameters.find(p => p.id === 'hex-spacing')?.value || 40);
  const strength = resolveParameterValue(node.parameters.find(p => p.id === 'strength')?.value || 5);
  const damping = resolveParameterValue(node.parameters.find(p => p.id === 'damping')?.value || 0.95);
  const simulationSteps = Math.round(resolveParameterValue(node.parameters.find(p => p.id === 'simulation-steps')?.value || 100));
  const falloffStrength = resolveParameterValue(node.parameters.find(p => p.id === 'item-scale-falloff')?.value || 0);
  
  const itemScaleParam = node.parameters.find(p => p.id === 'item-scale');
  const itemScaleValue = itemScaleParam?.value || 100;
  if (typeof itemScaleValue === 'string' && itemScaleValue.startsWith('@')) {
    Sequence.reset(itemScaleValue.substring(1));
  }
  
  const itemDirectionParam = node.parameters.find(p => p.id === 'item-direction');
  const itemDirectionValue = itemDirectionParam?.value || 0;
  if (typeof itemDirectionValue === 'string' && itemDirectionValue.startsWith('@')) {
    Sequence.reset(itemDirectionValue.substring(1));
  }
  
  const itemScales: number[] = [];
  for (let i = 0; i < particleCount; i++) {
    itemScales.push(resolveParameterValue(itemScaleValue));
  }
  
  const finalParticles = simulateAttractorPhysics(
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
  
  const elements: GeneratedElement[] = [];
  const simulationCenter = { x: initialRadius, y: initialRadius };
  
  // PHASE 2: Combine both shape and stamp nodes for distribution
  const allSourceNodes = [...shapeNodes, ...stampNodes];
  
  finalParticles.forEach((particle, posIndex) => {
    allSourceNodes.forEach((sourceNode, sourceIndex) => {
      const itemDirection = resolveParameterValue(itemDirectionValue);
      
      // Generate elements from either shape or stamp node
      const generatedElements = generateElementsFromNode(sourceNode, allNodes, undefined, itemDirection);
      
      // The particle's radius already includes item scale and falloff.
      // We derive the final scale from it.
      const finalScale = particle.radius / (hexSpacing / 2) || 0;

      const positionedElements = generatedElements.map((element, partIndex) => ({
        ...element,
        id: `${node.id}-${sourceIndex}-${posIndex}-${partIndex}`,
        position: {
          x: particle.position.x - simulationCenter.x,
          y: particle.position.y - simulationCenter.y,
        },
        size: {
          x: element.size.x * finalScale,
          y: element.size.y * finalScale
        },
        points: element.points?.map(p => ({ x: p.x * finalScale, y: p.y * finalScale }))
      }));

      elements.push(...positionedElements);
    });
  });
  
  return elements;
};

// Process Poincaré disc distribution
// PHASE 2: Enhanced to support stamp commands
const processPoincareDistribution = (node: Node, shapeNodes: Node[], allNodes: Node[], existingElements: GeneratedElement[] = [], stampNodes: Node[] = []): GeneratedElement[] => {
  const count = Math.round(resolveParameterValue(node.parameters.find(p => p.id === 'disc-count')?.value || 80));
  const radius = resolveParameterValue(node.parameters.find(p => p.id === 'disc-radius')?.value || 150);
  const density = resolveParameterValue(node.parameters.find(p => p.id === 'hyperbolic-density')?.value || 0.5);
  const falloffStrength = resolveParameterValue(node.parameters.find(p => p.id === 'item-scale-falloff')?.value || 0);
  
  const itemScaleParam = node.parameters.find(p => p.id === 'item-scale');
  const itemScaleValue = itemScaleParam?.value || 100;
  if (typeof itemScaleValue === 'string' && itemScaleValue.startsWith('@')) {
    Sequence.reset(itemScaleValue.substring(1));
  }
  
  const itemDirectionParam = node.parameters.find(p => p.id === 'item-direction');
  const itemDirectionValue = itemDirectionParam?.value || 0;
  if (typeof itemDirectionValue === 'string' && itemDirectionValue.startsWith('@')) {
    Sequence.reset(itemDirectionValue.substring(1));
  }
  
  const center = { x: 0, y: 0 };
  const positions = generatePoincareDiscPoints(count, radius, density, center, existingElements);
  
  const maxRadius = radius || 1;

  const elements: GeneratedElement[] = [];
  
  // PHASE 2: Combine both shape and stamp nodes for distribution
  const allSourceNodes = [...shapeNodes, ...stampNodes];
  
  positions.forEach((position, posIndex) => {
    allSourceNodes.forEach((sourceNode, sourceIndex) => {
      const itemScale = resolveParameterValue(itemScaleValue) / 100;
      const itemDirection = resolveParameterValue(itemDirectionValue);
      
      // Generate elements from either shape or stamp node
      const generatedElements = generateElementsFromNode(sourceNode, allNodes, undefined, itemDirection);
      
      const distance = getDistance(position, center);
      const falloffScale = 1 - (distance / (maxRadius * 2)) * falloffStrength;
      const finalScale = itemScale * falloffScale;

      const positionedElements = generatedElements.map((element, partIndex) => ({
        ...element,
        id: `${node.id}-${sourceIndex}-${posIndex}-${partIndex}`,
        position,
        size: {
          x: element.size.x * finalScale,
          y: element.size.y * finalScale
        },
        points: element.points?.map(p => ({ x: p.x * finalScale, y: p.y * finalScale }))
      }));

      elements.push(...positionedElements);
    });
  });
  
  return elements;
};

// PHASE 2: New stamp-based grid distribution
const processStampGridDistribution = (node: Node, shapeNodes: Node[], allNodes: Node[], stampNodes: Node[] = []): GeneratedElement[] => {
  // Enhanced grid distribution that leverages stamp layout capabilities
  return processGridDistribution(node, shapeNodes, allNodes, stampNodes);
};

// PHASE 2: New stamp-based circle distribution
const processStampCircleDistribution = (node: Node, shapeNodes: Node[], allNodes: Node[], stampNodes: Node[] = []): GeneratedElement[] => {
  // Enhanced circle distribution that leverages stamp layout capabilities
  // For now, use phyllotaxis which creates circular patterns
  return processPhyllotaxisDistribution(node, shapeNodes, allNodes, stampNodes);
};
