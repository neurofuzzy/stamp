# Stamp Live Coding Environment - Planning

## Project Goal
Create a browser-based live coding environment for the Stamp generative art library that enables:
- Real-time code editing with immediate visual feedback
- Click-to-source mapping (click shapes → highlight code)
- Interactive parameter controls (sliders for sequences, etc.)
- Visual debugging and shape hierarchy inspection

## Reference Materials

### Existing FlowBuilder System (Proof of Concept)
- **Location**: `etc/scripts/model/flowbuilder.js`, `etc/scripts/editor/flowbuilderarea.js`
- **Proven Concepts**:
  - Bidirectional code ↔ visual conversion
  - Live syntax highlighting with context awareness
  - Auto-completion and smart hints
  - Real-time parsing and error detection
- **Status**: Working proof of concept, but needs clean rewrite

### Current Stamp System
- **Location**: `src/lib/stamp.ts` (1,771 lines)
- **Strengths**: Excellent fluent API, powerful expression system
- **Challenges**: Performance, error handling, debugging experience
- **Status**: Preserve API completely, enhance internals

## Planning Sessions

- [Session 1: Initial Analysis](./session-01-initial-analysis.md)
- [Session 2: Architecture Planning](./session-02-architecture-planning.md) ← Next

## Key Principles

1. **Preserve Stamp API**: Zero breaking changes to existing fluent interface
2. **Learn from FlowBuilder**: Apply proven patterns but build clean
3. **Developer Experience First**: Fast iteration, visual debugging, interactive controls
4. **Progressive Enhancement**: Start simple, add features incrementally 