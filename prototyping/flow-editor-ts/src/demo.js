/**
 * Demo for FlowBuilder TypeScript Port
 * Interactive editor showing real-time syntax highlighting and validation
 */
import { FlowTokenizer } from './flow-tokenizer';
import { FlowRenderer } from './flow-renderer';
class FlowBuilderDemo {
    constructor() {
        this.tokenizer = new FlowTokenizer();
        this.renderer = new FlowRenderer(this.tokenizer);
        this.initializeElements();
        this.setupEventListeners();
        this.renderInitial();
    }
    initializeElements() {
        this.codeInput = document.getElementById('codeInput');
        this.renderedOutput = document.getElementById('renderedOutput');
        this.validStatus = document.getElementById('validStatus');
        this.errorWord = document.getElementById('errorWord');
        this.contextInfo = document.getElementById('contextInfo');
        if (!this.codeInput || !this.renderedOutput || !this.validStatus || !this.errorWord || !this.contextInfo) {
            throw new Error('Required DOM elements not found');
        }
    }
    setupEventListeners() {
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
    renderInitial() {
        this.renderCode();
    }
    renderCode() {
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
        }
        catch (error) {
            this.renderedOutput.innerHTML = `<span class="error">Rendering Error: ${error.message}</span>`;
            this.updateStatus(false, 'System Error', '');
        }
    }
    updateStatus(isValid, errorWord, context) {
        // Update validity status
        this.validStatus.textContent = isValid ? 'Yes' : 'No';
        this.validStatus.className = `status-value ${isValid ? 'success' : 'error'}`;
        // Update error word
        this.errorWord.textContent = errorWord || '-';
        this.errorWord.className = `status-value ${errorWord ? 'error' : ''}`;
        // Update context info
        this.contextInfo.textContent = context || '-';
    }
    getContextString(context) {
        if (context === undefined || context === -1)
            return 'Root';
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
}
else {
    new FlowBuilderDemo();
}
