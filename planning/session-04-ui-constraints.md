# Session 4: UI Constraints & Screen Real Estate

## The Space Problem

We've planned amazing features but haven't considered how they all fit on screen:

### What We Want to Show
- ✅ Source code editor
- ✅ Live canvas (the art itself)
- ✅ Expanded instructions list
- ✅ Playback controls  
- ✅ Sequence context panel
- ✅ Shape metadata panel
- ✅ Parameter sliders
- ✅ Error messages/hints
- ✅ File browser/examples

### The Reality
- 🚨 **Too much stuff** for any reasonable screen size
- 🚨 **Context switching** between panels kills flow
- 🚨 **Mobile/laptop** constraints make it worse
- 🚨 **Cognitive overload** from too many UI elements

## Design Constraints to Consider

### Screen Sizes
- **Laptop**: 1366x768 (still common)
- **Desktop**: 1920x1080 (most common)  
- **Large**: 2560x1440+ (developer setups)
- **Mobile**: Forget it for now

### Priority Hierarchy
What's **essential** vs **nice-to-have**?

1. **Essential**: Source code + Live canvas (the core loop)
2. **High value**: Expanded instructions (the killer feature)
3. **Medium**: Playback controls, basic context
4. **Lower**: Detailed metadata, advanced debugging

## Potential UI Solutions

### Option 1: Tabbed Panels
- Main view: Code + Canvas
- Tabs: "Instructions", "Debug", "Settings"
- **Pro**: Clean, familiar
- **Con**: Context switching, hidden features

### Option 2: Modal/Overlay System
- Main view: Code + Canvas
- Click shape → overlay with debug info
- Expand button → overlay with instructions
- **Pro**: Keeps main view clean
- **Con**: Overlays can be jarring

### Option 3: Responsive Layout
- Laptop: Code + Canvas only
- Desktop: Add instructions panel
- Large screens: Add all the bells and whistles
- **Pro**: Adapts to available space
- **Con**: Feature disparity across devices

### Option 4: VS Code Style
- Main editor area for code
- Side panels that can be toggled/resized
- Bottom panel for expanded instructions
- **Pro**: Familiar to developers
- **Con**: Feels like IDE, not creative tool

## Questions for Tomorrow

1. **What's the minimum viable interface?** Just code + canvas + expand button?

2. **Progressive disclosure?** Start simple, reveal complexity as needed?

3. **Primary use case?** Learning tool vs production environment vs debugging aid?

4. **Inspiration from existing tools?** What works well in other creative software?

Sleep on it - we'll figure out the right balance between power and usability! 🌙 