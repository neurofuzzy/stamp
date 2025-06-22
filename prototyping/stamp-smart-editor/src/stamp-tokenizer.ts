export enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  DOT = 'DOT',
  METHOD = 'METHOD',
  PAREN_OPEN = 'PAREN_OPEN',
  PAREN_CLOSE = 'PAREN_CLOSE',
  BRACE_OPEN = 'BRACE_OPEN',
  BRACE_CLOSE = 'BRACE_CLOSE',
  PROPERTY = 'PROPERTY',
  COLON = 'COLON',
  WHITESPACE = 'WHITESPACE',
  NUMBER = 'NUMBER',
  STRING = 'STRING'
}

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export interface CursorContext {
  type: 'method-suggestion' | 'parameter-suggestion' | 'none';
  position: number;
  methodName?: string;
}

/**
 * Tokenizes Stamp API method chains for smart editing
 * Inspired by FlowBuilder's tokenization approach but adapted for TypeScript method chaining
 */
export class StampTokenizer {
  private readonly STAMP_METHODS = [
    // Movement methods
    'moveTo', 'move', 'forward', 'rotate', 'rotateTo', 'stepBack',
    // Shape methods  
    'circle', 'rectangle', 'ellipse', 'polygon', 'arch', 'leafShape', 'bone', 'tangram', 'roundedTangram', 'roundedRectangle', 'trapezoid',
    // Boolean operations
    'add', 'subtract', 'intersect', 'boolean', 'noBoolean',
    // Control methods
    'set', 'reset', 'crop', 'breakApart', 'flip', 'bake',
    // Bounds methods
    'setBounds', 'setCursorBounds', 'markBoundsStart', 'markBoundsEnd'
  ];

  /**
   * Tokenize Stamp API code into structured tokens
   */
  tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < code.length) {
      const char = code[position];

      if (this.isWhitespace(char)) {
        const token = this.consumeWhitespace(code, position);
        tokens.push(token);
        position = token.end;
      } else if (this.isAlpha(char)) {
        const token = this.consumeIdentifier(code, position);
        tokens.push(token);
        position = token.end;
      } else if (char === '.') {
        tokens.push({ type: TokenType.DOT, value: '.', start: position, end: position + 1 });
        position++;
      } else if (char === '(') {
        tokens.push({ type: TokenType.PAREN_OPEN, value: '(', start: position, end: position + 1 });
        position++;
      } else if (char === ')') {
        tokens.push({ type: TokenType.PAREN_CLOSE, value: ')', start: position, end: position + 1 });
        position++;
      } else if (char === '{') {
        tokens.push({ type: TokenType.BRACE_OPEN, value: '{', start: position, end: position + 1 });
        position++;
      } else if (char === '}') {
        tokens.push({ type: TokenType.BRACE_CLOSE, value: '}', start: position, end: position + 1 });
        position++;
      } else if (char === ':') {
        tokens.push({ type: TokenType.COLON, value: ':', start: position, end: position + 1 });
        position++;
      } else if (this.isDigit(char)) {
        const token = this.consumeNumber(code, position);
        tokens.push(token);
        position = token.end;
      } else {
        // Skip unknown characters for now
        position++;
      }
    }

    return this.classifyTokens(tokens);
  }

  /**
   * Analyze cursor position to determine what kind of autocomplete to show
   */
  getCursorContext(code: string, cursorPosition: number): CursorContext {
    const tokens = this.tokenize(code.substring(0, cursorPosition));
    
    if (tokens.length === 0) {
      return { type: 'none', position: cursorPosition };
    }

    const lastToken = tokens[tokens.length - 1];

    // Check if cursor is after a dot - suggest methods
    if (lastToken.type === TokenType.DOT) {
      return { type: 'method-suggestion', position: cursorPosition };
    }

    // Check if cursor is after a partial method name - also suggest methods
    if (lastToken.type === TokenType.METHOD) {
      return { type: 'method-suggestion', position: cursorPosition };
    }

    // Check if cursor is inside parameter object - suggest parameters
    if (this.isInsideParameterObject(tokens)) {
      const methodName = this.findMethodNameForParameters(tokens);
      return { 
        type: 'parameter-suggestion', 
        position: cursorPosition,
        methodName 
      };
    }

    return { type: 'none', position: cursorPosition };
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private consumeWhitespace(code: string, start: number): Token {
    let end = start;
    while (end < code.length && this.isWhitespace(code[end])) {
      end++;
    }
    return { type: TokenType.WHITESPACE, value: code.substring(start, end), start, end };
  }

  private consumeIdentifier(code: string, start: number): Token {
    let end = start;
    while (end < code.length && (this.isAlpha(code[end]) || this.isDigit(code[end]))) {
      end++;
    }
    return { type: TokenType.IDENTIFIER, value: code.substring(start, end), start, end };
  }

  private consumeNumber(code: string, start: number): Token {
    let end = start;
    while (end < code.length && (this.isDigit(code[end]) || code[end] === '.')) {
      end++;
    }
    return { type: TokenType.NUMBER, value: code.substring(start, end), start, end };
  }

  private classifyTokens(tokens: Token[]): Token[] {
    return tokens.map((token, index) => {
      // Classify identifiers as methods if they follow a dot 
      // (even if not in known methods list - could be partial)
      if (token.type === TokenType.IDENTIFIER) {
        const prevToken = tokens[index - 1];
        if (prevToken?.type === TokenType.DOT) {
          return { ...token, type: TokenType.METHOD };
        }
        // Classify as property if inside parameter object
        if (this.isTokenInsideParameterObject(tokens, index)) {
          return { ...token, type: TokenType.PROPERTY };
        }
      }
      return token;
    });
  }

  private isInsideParameterObject(tokens: Token[]): boolean {
    let braceDepth = 0;
    for (const token of tokens) {
      if (token.type === TokenType.BRACE_OPEN) braceDepth++;
      if (token.type === TokenType.BRACE_CLOSE) braceDepth--;
    }
    return braceDepth > 0;
  }

  private findMethodNameForParameters(tokens: Token[]): string | undefined {
    // Look backwards for the method that opened this parameter object
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].type === TokenType.METHOD) {
        return tokens[i].value;
      }
    }
    return undefined;
  }

  private isTokenInsideParameterObject(tokens: Token[], tokenIndex: number): boolean {
    let braceDepth = 0;
    for (let i = 0; i < tokenIndex; i++) {
      if (tokens[i].type === TokenType.BRACE_OPEN) braceDepth++;
      if (tokens[i].type === TokenType.BRACE_CLOSE) braceDepth--;
    }
    return braceDepth > 0;
  }
} 