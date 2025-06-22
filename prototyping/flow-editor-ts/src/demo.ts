/**
 * Demo for FlowBuilder TypeScript Port
 * Interactive editor showing real-time syntax highlighting and validation
 */

import { FlowTokenizer } from './flow-tokenizer';
import { FlowRenderer } from './flow-renderer';

class FlowBuilderDemo {
  private tokenizer: FlowTokenizer;
  private renderer: FlowRenderer;
  private codeInput: HTMLTextAreaElement;
  private renderedOutput: HTMLDivElement;
  private validStatus: HTMLSpanElement;
  private errorWord: HTMLSpanElement;
  private contextInfo: HTMLSpanElement;

  constructor() {
    this.tokenizer = new FlowTokenizer();
    this.renderer = new FlowRenderer(this.tokenizer);
    
    this.initializeElements();
    this.setupEventListeners();
    this.renderInitial();
  }

  private initializeElements(): void {
    this.codeInput = document.getElementById('codeInput') as HTMLTextAreaElement;
    this.renderedOutput = document.getElementById('renderedOutput') as HTMLDivElement;
    this.validStatus = document.getElementById('validStatus') as HTMLSpanElement;
    this.errorWord = document.getElementById('errorWord') as HTMLSpanElement;
    this.contextInfo = document.getElementById('contextInfo') as HTMLSpanElement;

    if (!this.codeInput || !this.renderedOutput || !this.validStatus || !this.errorWord || !this.contextInfo) {
      throw new Error('Required DOM elements not found');
    }
  }

  private setupEventListeners(): void {
    // Real-time rendering as user types
    this.codeInput.addEventListener('input', () => {
      this.renderCode();
    });

    // Example click handlers
    const examples = document.querySelectorAll('.example');
    examples.forEach(example => {
      example.addEventListener('click', () => {
        const code = example.getAttribute('data-code');
        if (code) {
          this.codeInput.value = code;
          this.renderCode();
        }
      });
    });
  }

  private renderInitial(): void {
    this.renderCode();
  }

  private renderCode(): void {
    const code = this.codeInput.value;
    
    if (!code.trim()) {
      this.renderedOutput.innerHTML = '<em style="color: #858585;">Start typing to see syntax highlighting...</em>';
      this.updateStatus(false, '', '');
      return;
    }

    try {
      // Render the code with syntax highlighting
      const result = this.renderer.render(code);
      
      // Update the rendered output
      this.renderedOutput.innerHTML = result.html || '<em style="color: #858585;">Empty result</em>';
      
      // Update status indicators
      this.updateStatus(!result.hasError, result.errorWord || '', this.getContextString(result.context));
      
    } catch (error) {
      this.renderedOutput.innerHTML = `<span class="error">Rendering Error: ${error.message}</span>`;
      this.updateStatus(false, 'System Error', '');
    }
  }

  private updateStatus(isValid: boolean, errorWord: string, context: string): void {
    // Update validity status
    this.validStatus.textContent = isValid ? 'Yes' : 'No';
    this.validStatus.className = `status-value ${isValid ? 'success' : 'error'}`;
    
    // Update error word
    this.errorWord.textContent = errorWord || '-';
    this.errorWord.className = `status-value ${errorWord ? 'error' : ''}`;
    
    // Update context info
    this.contextInfo.textContent = context || '-';
  }

  private getContextString(context: number | undefined): string {
    if (context === undefined || context === -1) return 'Root';
    
    const contextNames = ['Triggers', 'Conditions', 'Actions', 'Contexts', 'Delays', 'Flow Control'];
    return contextNames[context] || `Context ${context}`;
  }
}

// Initialize demo when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FlowBuilderDemo();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FlowBuilderDemo();
  });
} else {
  new FlowBuilderDemo();
} 