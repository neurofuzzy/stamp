import React, { useEffect, useState, useRef } from 'react';
import { createStampEngine } from 'stamp.ts';

type CanvasProps = {
  width: number;
  height: number;
  onSelectionChange: (selectedIds: string[]) => void;
};

const Canvas: React.FC<CanvasProps> = ({ width, height, onSelectionChange }) => {
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initialize stamp engine
    const engine = createStampEngine({
      canvas,
      selectionCallback: onSelectionChange
    });
    
    // Initial render
    engine.render();
    
    return () => {
      engine.cleanup();
    };
  }, [width, height, onSelectionChange]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render objects
    renderObjects(ctx);
    
    // Render selection indicators
    if (selectedObjects.length > 0) {
      renderSelection(ctx, selectedObjects);
    }
  }, [selectedObjects]);

  const renderSelection = (ctx: CanvasRenderingContext2D, selectedIds: string[]) => {
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    selectedIds.forEach(id => {
      const obj = getObjectById(id);
      if (obj) {
        // Draw selection rectangle
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        
        // Draw resize handles
        drawHandles(ctx, obj);
      }
    });
    
    ctx.setLineDash([]);
  };

  const drawHandles = (ctx: CanvasRenderingContext2D, obj: any) => {
    const HANDLE_SIZE = 6;
    const HALF_HANDLE = HANDLE_SIZE / 2;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    // Define handle positions
    const handles = [
      { x: obj.x - HALF_HANDLE, y: obj.y - HALF_HANDLE }, // top-left
      { x: obj.x + obj.width - HALF_HANDLE, y: obj.y - HALF_HANDLE }, // top-right
      { x: obj.x - HALF_HANDLE, y: obj.y + obj.height - HALF_HANDLE }, // bottom-left
      { x: obj.x + obj.width - HALF_HANDLE, y: obj.y + obj.height - HALF_HANDLE } // bottom-right
    ];
    
    // Draw handles
    handles.forEach(handle => {
      ctx.beginPath();
      ctx.rect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
      ctx.fill();
      ctx.stroke();
    });
  };

  const getObjectById = (id: string) => {
    const objects = getObjects();
    return objects.find(obj => obj.id === id);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedObject = findObjectAtPosition(x, y);
    
    if (clickedObject) {
      if (e.shiftKey) {
        // Toggle selection
        setSelectedObjects(prev => 
          prev.includes(clickedObject.id)
            ? prev.filter(id => id !== clickedObject.id)
            : [...prev, clickedObject.id]
        );
      } else {
        // Replace selection
        setSelectedObjects([clickedObject.id]);
      }
    } else if (!e.shiftKey) {
      // Clear selection if not holding shift
      setSelectedObjects([]);
    }
  };

  const findObjectAtPosition = (x: number, y: number) => {
    // Actual hit testing implementation
    const objects = getObjects();
    return objects.find(obj => {
      return x >= obj.x && x <= obj.x + obj.width && 
             y >= obj.y && y <= obj.y + obj.height;
    });
  };

  const getObjects = () => {
    // Mock objects
    return [
      { id: 'obj1', x: 50, y: 50, width: 100, height: 100 },
      { id: 'obj2', x: 200, y: 200, width: 80, height: 80 }
    ];
  };

  const renderObjects = (ctx: CanvasRenderingContext2D) => {
    const objects = getObjects();
    objects.forEach(obj => {
      ctx.fillStyle = '#6366F1';
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });
  };

  return (
    <canvas 
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      className="bg-gray-900 touch-manipulation"
      aria-label="Generative art canvas"
    />
  );
};

export default Canvas;
