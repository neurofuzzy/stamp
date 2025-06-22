import { StampTokenizer } from './stamp-tokenizer';

export enum SuggestionType {
  METHOD = 'METHOD',
  PARAMETER = 'PARAMETER'
}

export interface Suggestion {
  type: SuggestionType;
  text: string;
  displayText: string;
  detail: string;
  insertText: string;
}

interface MethodDefinition {
  name: string;
  displayText: string;
  detail: string;
  insertText: string;
  parameters?: ParameterDefinition[];
}

interface ParameterDefinition {
  name: string;
  type: string;
  optional: boolean;
  detail: string;
  defaultValue: string;
}

/**
 * Provides context-aware autocomplete suggestions for Stamp API
 * Inspired by FlowBuilder's autocomplete system but adapted for TypeScript method chaining
 */
export class StampAutocomplete {
  private tokenizer: StampTokenizer;
  private methodDefinitions: MethodDefinition[];

  constructor() {
    this.tokenizer = new StampTokenizer();
    this.methodDefinitions = this.buildMethodDefinitions();
  }

  /**
   * Get autocomplete suggestions for the given code and cursor position
   */
  getSuggestions(code: string, cursorPosition: number): Suggestion[] {
    const context = this.tokenizer.getCursorContext(code, cursorPosition);
    
    switch (context.type) {
      case 'method-suggestion':
        return this.getMethodSuggestions(code, cursorPosition);
      case 'parameter-suggestion':
        return this.getParameterSuggections(context.methodName || '', code, cursorPosition);
      default:
        return [];
    }
  }

  private getMethodSuggestions(code: string, cursorPosition: number): Suggestion[] {
    const partial = this.getPartialText(code, cursorPosition);
    
    return this.methodDefinitions
      .filter(method => method.name.toLowerCase().startsWith(partial.toLowerCase()))
      .map(method => ({
        type: SuggestionType.METHOD,
        text: method.name,
        displayText: method.displayText,
        detail: method.detail,
        insertText: method.insertText
      }));
  }

  private getParameterSuggections(methodName: string, code: string, cursorPosition: number): Suggestion[] {
    const method = this.methodDefinitions.find(m => m.name === methodName);
    if (!method || !method.parameters) {
      return [];
    }

    const partial = this.getPartialText(code, cursorPosition);
    
    return method.parameters
      .filter(param => param.name.toLowerCase().startsWith(partial.toLowerCase()))
      .map(param => ({
        type: SuggestionType.PARAMETER,
        text: param.name,
        displayText: `${param.name}${param.optional ? '?' : ''}: ${param.type}`,
        detail: param.detail,
        insertText: `${param.name}: \${1:${param.defaultValue}}`
      }));
  }

  private getPartialText(code: string, cursorPosition: number): string {
    // Find the partial text being typed
    let start = cursorPosition - 1;
    while (start >= 0 && /[a-zA-Z_]/.test(code[start])) {
      start--;
    }
    return code.substring(start + 1, cursorPosition);
  }

  private buildMethodDefinitions(): MethodDefinition[] {
    return [
      // Shape methods
      {
        name: 'circle',
        displayText: 'circle()',
        detail: 'Create a circle shape',
        insertText: 'circle()',
        parameters: [
          { name: 'radius', type: 'number', optional: false, detail: 'Circle radius', defaultValue: '10' },
          { name: 'numX', type: 'number', optional: true, detail: 'Number of copies in X direction', defaultValue: '1' },
          { name: 'numY', type: 'number', optional: true, detail: 'Number of copies in Y direction', defaultValue: '1' },
          { name: 'spacingX', type: 'number', optional: true, detail: 'Spacing between copies in X', defaultValue: '0' },
          { name: 'spacingY', type: 'number', optional: true, detail: 'Spacing between copies in Y', defaultValue: '0' }
        ]
      },
      {
        name: 'rectangle',
        displayText: 'rectangle()',
        detail: 'Create a rectangle shape',
        insertText: 'rectangle()',
        parameters: [
          { name: 'width', type: 'number', optional: false, detail: 'Rectangle width', defaultValue: '100' },
          { name: 'height', type: 'number', optional: false, detail: 'Rectangle height', defaultValue: '100' },
          { name: 'numX', type: 'number', optional: true, detail: 'Number of copies in X direction', defaultValue: '1' },
          { name: 'numY', type: 'number', optional: true, detail: 'Number of copies in Y direction', defaultValue: '1' }
        ]
      },
      {
        name: 'ellipse',
        displayText: 'ellipse()',
        detail: 'Create an ellipse shape',
        insertText: 'ellipse()'
      },
      {
        name: 'polygon',
        displayText: 'polygon()',
        detail: 'Create a polygon shape',
        insertText: 'polygon()'
      },
      {
        name: 'arch',
        displayText: 'arch()',
        detail: 'Create an arch shape',
        insertText: 'arch()'
      },
      {
        name: 'leafShape',
        displayText: 'leafShape()',
        detail: 'Create a leaf shape',
        insertText: 'leafShape()'
      },
      {
        name: 'bone',
        displayText: 'bone()',
        detail: 'Create a bone shape',
        insertText: 'bone()'
      },
      {
        name: 'tangram',
        displayText: 'tangram()',
        detail: 'Create a tangram shape',
        insertText: 'tangram()'
      },
      {
        name: 'roundedTangram',
        displayText: 'roundedTangram()',
        detail: 'Create a rounded tangram shape',
        insertText: 'roundedTangram()'
      },
      {
        name: 'roundedRectangle',
        displayText: 'roundedRectangle()',
        detail: 'Create a rounded rectangle shape',
        insertText: 'roundedRectangle()'
      },
      {
        name: 'trapezoid',
        displayText: 'trapezoid()',
        detail: 'Create a trapezoid shape',
        insertText: 'trapezoid()'
      },
      // Movement methods
      {
        name: 'moveTo',
        displayText: 'moveTo(x, y)',
        detail: 'Move cursor to absolute position',
        insertText: 'moveTo(${1:x}, ${2:y})'
      },
      {
        name: 'move',
        displayText: 'move(x, y)',
        detail: 'Move cursor by relative amount',
        insertText: 'move(${1:x}, ${2:y})'
      },
      {
        name: 'forward',
        displayText: 'forward(distance)',
        detail: 'Move cursor forward by distance',
        insertText: 'forward(${1:distance})'
      },
      {
        name: 'rotate',
        displayText: 'rotate(angle)',
        detail: 'Rotate cursor by angle in degrees',
        insertText: 'rotate(${1:angle})'
      },
      {
        name: 'rotateTo',
        displayText: 'rotateTo(angle)',
        detail: 'Set cursor rotation to absolute angle',
        insertText: 'rotateTo(${1:angle})'
      },
      {
        name: 'stepBack',
        displayText: 'stepBack(steps)',
        detail: 'Step back in cursor history',
        insertText: 'stepBack(${1:steps})'
      },
      // Boolean operations
      {
        name: 'add',
        displayText: 'add()',
        detail: 'Set boolean operation to union',
        insertText: 'add()'
      },
      {
        name: 'subtract',
        displayText: 'subtract()',
        detail: 'Set boolean operation to subtract',
        insertText: 'subtract()'
      },
      {
        name: 'intersect',
        displayText: 'intersect()',
        detail: 'Set boolean operation to intersect',
        insertText: 'intersect()'
      },
      {
        name: 'boolean',
        displayText: 'boolean(type)',
        detail: 'Set boolean operation type',
        insertText: 'boolean(${1:type})'
      },
      {
        name: 'noBoolean',
        displayText: 'noBoolean()',
        detail: 'Disable boolean operations',
        insertText: 'noBoolean()'
      },
      // Control methods
      {
        name: 'set',
        displayText: 'set(sequence)',
        detail: 'Set sequence parameter',
        insertText: 'set(${1:sequence})'
      },
      {
        name: 'reset',
        displayText: 'reset()',
        detail: 'Reset the stamp',
        insertText: 'reset()'
      },
      {
        name: 'crop',
        displayText: 'crop(x, y, width, height)',
        detail: 'Crop the stamp to bounds',
        insertText: 'crop(${1:x}, ${2:y}, ${3:width}, ${4:height})'
      },
      {
        name: 'breakApart',
        displayText: 'breakApart()',
        detail: 'Break apart grouped shapes',
        insertText: 'breakApart()'
      },
      {
        name: 'flip',
        displayText: 'flip()',
        detail: 'Flip the order of shapes',
        insertText: 'flip()'
      },
      {
        name: 'bake',
        displayText: 'bake()',
        detail: 'Bake the stamp into final form',
        insertText: 'bake()'
      },
      // Bounds methods
      {
        name: 'setBounds',
        displayText: 'setBounds(width, height)',
        detail: 'Set explicit bounds for the stamp',
        insertText: 'setBounds(${1:width}, ${2:height})'
      },
      {
        name: 'setCursorBounds',
        displayText: 'setCursorBounds(x, y, width, height)',
        detail: 'Set cursor bounds for shape creation',
        insertText: 'setCursorBounds(${1:x}, ${2:y}, ${3:width}, ${4:height})'
      },
      {
        name: 'markBoundsStart',
        displayText: 'markBoundsStart()',
        detail: 'Mark the start of bounds calculation',
        insertText: 'markBoundsStart()'
      },
      {
        name: 'markBoundsEnd',
        displayText: 'markBoundsEnd()',
        detail: 'Mark the end of bounds calculation',
        insertText: 'markBoundsEnd()'
      }
    ];
  }
} 