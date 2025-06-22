/**
 * FlowEditor - True FlowBuilderArea port with contentEditable and inline completion
 * 
 * Features:
 * - Real-time syntax highlighting in contentEditable
 * - Inline completion with gray text preview
 * - Tab/Space/Arrow key completion
 * - Floating hint boxes
 * - Smart caret management
 */

import { FlowTokenizer } from './flow-tokenizer';

export class FlowEditor {
  private tokenizer: FlowTokenizer;
  private codeElem: HTMLElement;
  private hintBox: HTMLElement;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.tokenizer = new FlowTokenizer();
    this.container = container;
    this.setupEditor();
    this.setupEventListeners();
  }

  private setupEditor(): void {
    // Create the contentEditable code element
    this.codeElem = document.createElement('code');
    this.codeElem.contentEditable = 'true';
    this.codeElem.className = 'flow-code-editor';
    this.codeElem.innerHTML = 'ON';
    
    // Create hint box
    this.hintBox = document.createElement('div');
    this.hintBox.className = 'hint-box';
    this.hintBox.style.display = 'none';
    
    this.container.appendChild(this.codeElem);
    this.container.appendChild(this.hintBox);
    
    // Initial render
    this.onCodeChanged();
  }

  private setupEventListeners(): void {
    this.codeElem.addEventListener('keyup', (e) => this.onCodeChanged(e));
    this.codeElem.addEventListener('mouseup', () => this.onCodeChanged());
    this.codeElem.addEventListener('touchend', () => this.onCodeChanged());
  }

  private getCaretOffset(editableDiv: HTMLElement): number {
    let caretPos = 0;
    const sel = window.getSelection();
    if (sel) {
      caretPos += sel.focusOffset;
      let node = sel.anchorNode;
      while (node && node !== editableDiv) {
        if (node.previousSibling) {
          node = node.previousSibling;
          if (node.nodeType === 3) {
            caretPos += (node as Text).nodeValue?.length || 0;
          } else if ((node as HTMLElement).innerText !== undefined) {
            caretPos += (node as HTMLElement).innerText.length;
          }
        } else {
          node = node.parentNode;
        }
        if (node === editableDiv) break;
      }
    }
    return caretPos;
  }

  private setCaretOffset(element: HTMLElement, offset: number, context: number, subContext: number, targetType: number, e?: KeyboardEvent): boolean {
    const originalOffset = offset;
    let autocompleted = false;
    const range = document.createRange();
    const sel = window.getSelection();
    let childNum = 0;
    let len = 0;

    // Find the correct child node for cursor position
    for (let i = 0; i < element.childNodes.length; i++) {
      const n = element.childNodes[i];
      let clen = 0;
      if (n.nodeType === 3) {
        clen = (n as Text).nodeValue?.length || 0;
      } else if ((n as HTMLElement).innerText) {
        clen = (n as HTMLElement).innerText.length;
      }
      
      if (offset > clen) {
        childNum++;
        offset -= clen;
      } else {
        break;
      }
    }

    childNum = Math.min(childNum, element.childNodes.length - 1);
    let selectedElem = element.childNodes[childNum];
    let isSpan = false;

    if (!selectedElem) return false;

    if (selectedElem.nodeType !== 3) {
      selectedElem = selectedElem.firstChild!;
      isSpan = true;
    }
    
    const textNode = selectedElem as Text;
    offset = Math.min(offset, textNode.nodeValue?.length || 0);

    // Handle auto-completion on Tab/Space/Arrow keys
    if (e && (e.keyCode === 39 || e.keyCode === 32 || (e.keyCode === 13 && this.codeElem.getAttribute('data-after') !== ''))) {
      autocompleted = true;
      const dataAfter = this.codeElem.getAttribute('data-after');
      if (dataAfter) {
        const currentValue = textNode.nodeValue || '';
        textNode.nodeValue = ' ' + currentValue.trim() + dataAfter + ' ';
        offset = textNode.nodeValue.length - 1;
      } else if (context === -1) {
        const currentValue = (textNode.nodeValue || '').toLowerCase();
        if (currentValue.charAt(0) === 't') {
          textNode.nodeValue = ' then';
          offset = textNode.nodeValue.length - 1;
        } else if (currentValue.charAt(0) === 'e') {
          textNode.nodeValue = ' else';
          offset = textNode.nodeValue.length - 1;
        }
      }
    }

    // Set cursor position
    if (sel) {
      range.setStart(textNode, offset);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Clear completion preview
    this.codeElem.setAttribute('data-after', '');

    // Handle context highlighting and completion previews
    if (isSpan && !autocompleted) {
      this.handleSpanContext(selectedElem as Text);
    } else {
      this.handleCompletionPreview(selectedElem as Text, context);
    }

    this.setHinting(selectedElem as Text, offset, context, subContext, originalOffset);
    return autocompleted;
  }

  private handleSpanContext(textNode: Text): void {
    const span = textNode.parentNode as HTMLElement;
    if (!span?.dataset) return;

    const pcontext = span.dataset.context;
    span.classList.add('caretWithin');

    // Highlight previous siblings with same context
    let pp = span.previousSibling as HTMLElement;
    while (pp && (!pp.dataset || pp.dataset.context === pcontext)) {
      if (pp.classList) pp.classList.add('caretWithin');
      pp = pp.previousSibling as HTMLElement;
    }

    // Highlight next siblings with same context  
    let pn = span.nextSibling as HTMLElement;
    while (pn && (!pn.dataset || pn.dataset.context === pcontext)) {
      if (pn.classList) pn.classList.add('caretWithin');
      pn = pn.nextSibling as HTMLElement;
    }

    // Special case for ELSE highlighting
    if (span.innerText.toLowerCase().trim() === 'else') {
      let pp = span.previousSibling as HTMLElement;
      while (pp) {
        if (pp.innerText && pp.innerText.toLowerCase() === 'if') {
          pp.style.textDecoration = 'underline';
          break;
        }
        pp = pp.previousSibling as HTMLElement;
      }
    }
  }

  private handleCompletionPreview(textNode: Text, context: number): void {
    const prevSibling = textNode.previousSibling?.previousSibling as HTMLElement;
    if (!prevSibling?.dataset || !textNode.nextSibling) return;

    const autocompleteContext = parseInt(prevSibling.dataset.context);
    const currentText = (textNode.nodeValue || '').trim();
    
    if (autocompleteContext >= 0 && currentText.length > 1) {
      const contextKey = this.tokenizer.getReservedWordTypes()[autocompleteContext];
      const subtypes = this.tokenizer.getSubtypes()[contextKey];
      
      if (subtypes) {
        const search = currentText.toLowerCase();
        for (const subtype of subtypes) {
          if (subtype.toLowerCase().startsWith(search)) {
            // Set completion preview (gray text)
            const completion = subtype.substr(search.length);
            this.codeElem.setAttribute('data-after', completion);
            break;
          }
        }
      }
    }
  }

  private setHinting(elem: Text, offset: number, context: number, subContext: number, originalOffset: number): void {
    this.hintBox.style.display = 'none';
    
    const codeText = this.codeElem.innerText.toLowerCase();
    if (originalOffset < codeText.length - 2) return;

    const hasRewind = codeText.includes('rewind');
    const span = elem.parentNode as HTMLElement;
    
    if (span && context === -1 && subContext === -1) {
      // Position hint box
      const rect = span.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      this.hintBox.style.left = (rect.left - containerRect.left + offset * 9) + 'px';
      this.hintBox.style.top = (rect.bottom - containerRect.top + 10) + 'px';
      
      // Set hint content based on context
      const prevText = span.previousSibling?.textContent;
      if (prevText === 'THEN' || prevText === 'ELSE') {
        this.hintBox.innerHTML = '<pre>IF \nDO \nWITH \nWAIT \nREWIND</pre>';
      } else {
        if (this.codeElem.innerText.includes('IF ')) {
          if (hasRewind) {
            this.hintBox.innerHTML = '<pre>\nELSE \nENDELSE</pre>';
          } else {
            this.hintBox.innerHTML = '<pre>THEN \nENDIF \nELSE \nENDELSE</pre>';
          }
        } else {
          this.hintBox.innerHTML = '<pre>THEN</pre>';
        }
      }
      
      this.hintBox.style.display = 'block';
    }
  }

  private onCodeChanged(e?: KeyboardEvent): void {
    let hasError = false;
    let errorInfo = '';

    const caretOffset = this.getCaretOffset(this.codeElem);
    let rawText = this.codeElem.innerText.trim();
    
    while (rawText.length < caretOffset) rawText += ' ';
    if (!rawText) {
      rawText = 'ON';
    }

    const addNonBreakingSpace = rawText.endsWith('\xa0') || rawText.endsWith(' ');
    const tokens = this.tokenizer.getTokens(rawText);
    
    let context = -1;
    let subContext = -1;
    let targetType = -1;
    let codeLen = 0;
    let hasRewind = false;

    // Process tokens with syntax highlighting
    for (let i = 0; i < tokens.length; i++) {
      const word = tokens[i];
      if (!word) continue;

      const startContext = context;
      const word2 = word.toLowerCase().trim();

      if (word2 === 'else') hasRewind = false;

      let color: string | false;
      if (hasRewind && context === -1 && (isNaN(parseInt(word)) || word2 !== 'repeat')) {
        color = false;
      } else if (this.isConnectorWord(word)) {
        context = subContext = targetType = -1;
        if (['endif', 'else', 'endelse'].includes(word2)) {
          color = '#cccc00'; // condition color
        } else {
          color = '#0099cc'; // connector color
        }
      } else {
        color = this.getColorForWord(word2, context, targetType);
      }

      if (color) {
        const displayWord = context === -1 ? word.toUpperCase() : word;
        const targetTypeClass = this.getTargetTypeClass(word, context, subContext, targetType);
        
        tokens[i] = `<span style="color:${color}" class="${targetTypeClass}" data-context="${context}" data-targettype="${targetType}">${this.getMatchedWord(word, context)}</span>`;
      } else {
        if (caretOffset < codeLen || caretOffset > codeLen + word.length) {
          hasError = true;
          errorInfo = word;
        }
      }

      // Update context
      if (color && context === -1) {
        context = this.getContextForWord(word2, context);
      }

      // Handle subcontext transitions
      if (startContext >= 0 && subContext === -1) {
        if (startContext === 0) {
          context = subContext = targetType = -1;
        } else {
          subContext = this.getContextForWord(word, startContext);
          if (subContext >= 0) {
            targetType = this.getTargetTypeForContext(startContext, subContext);
          }
        }
      }

      if (this.getTargetTypeClass(word, context, subContext, targetType)) {
        context = subContext = targetType = -1;
      }

      if (context === 3) targetType = 3;
      if (context === 5) hasRewind = true;

      codeLen += word.trim().length + 1;
    }

    if (addNonBreakingSpace) tokens.push('\xa0');

    // Update DOM
    this.codeElem.innerHTML = tokens.join('<span> </span>');
    this.joinSpaces();

    // Handle auto-completion
    let autocompleted = false;
    if (e) {
      autocompleted = this.setCaretOffset(this.codeElem, caretOffset, context, subContext, targetType, e);
    }

    if (autocompleted) {
      this.onCodeChanged();
      return;
    }

    // Handle errors
    if (hasError) {
      this.codeElem.classList.add('error');
    } else {
      this.codeElem.classList.remove('error');
    }
  }

  private joinSpaces(): void {
    let elem = this.codeElem.firstChild;
    while (elem?.nextSibling) {
      const p = elem.previousSibling as HTMLElement;
      const n = elem.nextSibling as HTMLElement;

      if (p?.dataset && n?.dataset && (elem as HTMLElement).innerText === ' ') {
        if (p.dataset.context === n.dataset.context) {
          (elem as HTMLElement).setAttribute('data-context', p.dataset.context);
        }
      }
      elem = elem.nextSibling;
    }
  }

  // Helper methods from tokenizer
  private isConnectorWord(word: string): boolean {
    const connectorWords = ['then', 'else', 'endif', 'endelse'];
    return connectorWords.includes(word.trim().toLowerCase());
  }

  private getColorForWord(word: string, context: number, targetType: number): string | false {
    // Implementation would use tokenizer color logic
    return this.tokenizer.getWordType(word) !== 'unknown' ? '#dd8866' : false;
  }

  private getMatchedWord(word: string, context: number): string {
    return context === -1 ? word.toUpperCase() : word;
  }

  private getContextForWord(word: string, context: number): number {
    // Implementation would use tokenizer context logic
    return -1;
  }

  private getTargetTypeClass(word: string, context: number, subContext: number, targetType: number): string {
    if (!isNaN(parseInt(word)) && (subContext || context === 3)) {
      return `target-type-${targetType}`;
    }
    return '';
  }

  private getTargetTypeForContext(startContext: number, subContext: number): number {
    return startContext === 1 ? 1 : 2;
  }
} 