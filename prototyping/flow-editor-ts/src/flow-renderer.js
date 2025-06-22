/**
 * FlowRenderer - Direct TypeScript port of FlowBuilderArea rich text rendering
 *
 * Handles rendering flow language text into colored HTML spans with context tracking.
 * Based on the original FlowBuilderArea.js onCodeChanged implementation.
 */
import { TokenType } from './flow-tokenizer';
export class FlowRenderer {
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
        // Direct port of FlowBuilder color constants
        this.colors = {
            number: '#dddddd',
            string: '#dd8866',
            equation: '#dddddd',
            connector: '#0099cc',
            reservedWordColors: ['#ff3300', '#cccc00', '#dd8866', '#cc33cc', '#66aaee', '#00cc99'],
            subtypeColors: ['#cc0000', '#999900', '#aa5533', '#990099', '#3377bb', '#009966']
        };
        this.reservedWordTypes = ['triggers', 'conditions', 'actions', 'contexts', 'delays', 'flowcontrol'];
    }
    /**
     * Render flow text into colored HTML spans (port of onCodeChanged)
     */
    render(rawText) {
        if (!rawText) {
            return { html: '', hasError: false };
        }
        let hasError = false;
        let errorWord = '';
        // Normalize text - port of original logic
        rawText = rawText.trim();
        const addNonBreakingSpace = rawText.endsWith('\xa0') || rawText.endsWith(' ');
        const tokens = this.tokenizer.getTokens(rawText);
        let context = -1;
        let subContext = -1;
        let targetType = -1;
        let hasRewind = false;
        // Process each token similar to original FlowBuilderArea
        for (let i = 0; i < tokens.length; i++) {
            const word = tokens[i];
            if (!word)
                continue;
            const startContext = context;
            const word2 = word.toLowerCase().trim();
            if (word2 === 'else')
                hasRewind = false;
            let color;
            if (hasRewind && context === -1 && (!this.isNumber(word) || word2 !== 'repeat')) {
                color = false;
            }
            else if (this.isConnectorWord(word)) {
                context = subContext = targetType = -1;
                if (['endif', 'else', 'endelse'].includes(word2)) {
                    color = this.colors.reservedWordColors[1];
                }
                else {
                    color = this.colors.connector;
                }
            }
            else {
                color = this.getColorForWord(word2, context, targetType);
            }
            if (color) {
                const displayWord = context === -1 ? word.toUpperCase() : word;
                const targetTypeClass = this.getTargetTypeClass(word, context, subContext, targetType);
                tokens[i] = `<span style="color:${color}" class="${targetTypeClass}" data-context="{CONTEXT}" data-targettype="${targetType}">${this.getMatchedWord(word, context)}</span>`;
            }
            else {
                // Check if it's a valid target word before marking as error
                const specialTags = ['any', 'player', 'good', 'bad', 'hazard', 'projectile', 'key', 'powerup', 'shield', 'weapon'];
                if (this.isNumber(word) || specialTags.includes(word2) || word.startsWith('"')) {
                    // Valid target/value - use default color
                    tokens[i] = `<span style="color:${this.colors.number}" data-context="{CONTEXT}" data-targettype="${targetType}">${word}</span>`;
                }
                else {
                    hasError = true;
                    errorWord = word;
                    tokens[i] = `<span class="error">${word}</span>`;
                }
            }
            // Update context tracking
            if (color && context === -1) {
                context = this.getContextForWord(word2, context);
            }
            tokens[i] = tokens[i].replace('{CONTEXT}', String(context));
            // Handle subcontext transitions
            if (startContext >= 0 && subContext === -1) {
                if (startContext === 0) {
                    context = subContext = targetType = -1;
                }
                else {
                    subContext = this.getContextForWord(word, startContext);
                    if (subContext >= 0) {
                        // Would need FlowNode.subtypeTargetTypes equivalent
                        // For now, simplified logic
                        targetType = this.getTargetTypeForContext(startContext, subContext);
                    }
                }
            }
            if (this.getTargetTypeClass(word, context, subContext, targetType)) {
                context = subContext = targetType = -1;
            }
            if (context === 3) {
                targetType = 3;
            }
            if (context === 5) {
                hasRewind = true;
            }
        }
        // Add non-breaking space if needed
        if (addNonBreakingSpace) {
            tokens.push('\xa0');
        }
        // Join with space spans and handle space context joining
        const html = this.joinTokensWithSpaces(tokens);
        return {
            html,
            hasError,
            errorWord: hasError ? errorWord : undefined,
            context,
            subContext,
            targetType
        };
    }
    joinTokensWithSpaces(tokens) {
        if (tokens.length === 0)
            return '';
        const result = [];
        for (let i = 0; i < tokens.length; i++) {
            result.push(tokens[i]);
            // Add space span between tokens
            if (i < tokens.length - 1) {
                result.push('<span> </span>');
            }
        }
        return result.join('');
    }
    getColorForWord(word, context, targetType) {
        word = word.toLowerCase().trim();
        if (this.isNumber(word) || word === 'infinite') {
            return this.colors.number;
        }
        else if (['==', '!=', '>', '<'].includes(word)) {
            return this.colors.equation;
        }
        else if (word.startsWith('"') && word.endsWith('"')) {
            return this.colors.string;
        }
        const contextIndex = this.getContextForWord(word, context, targetType);
        if (contextIndex !== -1) {
            if (context < 0) {
                return this.colors.reservedWordColors[contextIndex];
            }
            else {
                return this.colors.subtypeColors[context];
            }
        }
        // Check if it's a valid subtype for any context when context is unknown
        if (context < 0) {
            // Find which category this subtype belongs to
            for (let i = 0; i < this.reservedWordTypes.length; i++) {
                const categoryName = this.reservedWordTypes[i];
                const categoryTokenType = this.tokenizer.getWordType(word, categoryName);
                if (categoryTokenType === TokenType.SUBTYPE) {
                    return this.colors.subtypeColors[i];
                }
            }
        }
        return false;
    }
    getContextForWord(word, context, targetType) {
        if (context === undefined)
            context = -1;
        word = word.toLowerCase();
        const word2 = word.trim();
        if (this.isNumber(word2) || ['==', '>', '<'].includes(word)) {
            return context;
        }
        else if (targetType === 3) {
            const specialTags = ['a', 'b', 'any', 'player', 'good', 'bad', 'hazard', 'projectile', 'key', 'powerup', 'shield', 'weapon'];
            if (specialTags.includes(word2)) {
                return context;
            }
        }
        const tokenType = this.tokenizer.getWordType(word);
        if (context < 0) {
            // Map token types to context indices
            switch (tokenType) {
                case TokenType.TRIGGER: return 0;
                case TokenType.CONDITION: return 1;
                case TokenType.ACTION: return 2;
                case TokenType.CONTEXT: return 3;
                case TokenType.DELAY: return 4;
                case TokenType.FLOW_CONTROL: return 5;
                default: return -1;
            }
        }
        else {
            // Check if word is valid subtype for current context
            const categoryName = this.reservedWordTypes[context];
            if (categoryName && tokenType === TokenType.SUBTYPE) {
                return context; // Valid subtype
            }
            return -1;
        }
    }
    getMatchedWord(word, context) {
        if (context === -1)
            return word.toUpperCase();
        // For subtypes, preserve original case but handle special cases
        const word2 = word.toLowerCase().trim();
        const categoryName = this.reservedWordTypes[context];
        // This would need the original subtypeWords mapping for proper case preservation
        // For now, return the word as-is for subtypes
        return word;
    }
    getTargetTypeClass(word, context, subContext, targetType) {
        if (this.isNumber(word) && (subContext || context === 3)) {
            return `target-type-${targetType}`;
        }
        else if (targetType === 3 && subContext) {
            return 'target-type-3s';
        }
        else if (context === 4 && word.startsWith('"')) {
            return 'target-type-4';
        }
        return '';
    }
    getTargetTypeForContext(startContext, subContext) {
        // Simplified target type mapping - would need full FlowNode.subtypeTargetTypes
        if (startContext === 1)
            return 1; // conditions typically use numbers
        if (startContext === 2)
            return 2; // actions typically use states
        return 0;
    }
    isConnectorWord(word) {
        const connectorWords = ['then', 'else', 'endif', 'endelse'];
        return connectorWords.includes(word.trim().toLowerCase());
    }
    isNumber(word) {
        return !isNaN(parseInt(word.trim()));
    }
}
