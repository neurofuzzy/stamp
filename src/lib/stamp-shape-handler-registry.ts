import { IShapeHandler, IShapeHandlerRegistry } from './stamp-interfaces';

/**
 * Registry for managing shape handlers
 */
export class StampShapeHandlerRegistry implements IShapeHandlerRegistry {
  private handlers: Map<string, IShapeHandler> = new Map();

  register(shapeName: string, handler: IShapeHandler): void {
    this.handlers.set(shapeName, handler);
  }

  getHandler(shapeName: string): IShapeHandler | undefined {
    if (this.hasHandler(shapeName)) {
      return this.handlers.get(shapeName);
    }
    //console.warn(`Shape handler for ${shapeName} not found in registry`);
    return undefined;
  }

  hasHandler(shapeName: string): boolean {
    return this.handlers.has(shapeName);
  }

  /**
   * Get all registered shape names
   */
  getRegisteredShapes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all registered handlers
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Unregister a specific handler
   */
  unregister(shapeName: string): boolean {
    return this.handlers.delete(shapeName);
  }
} 