#!/usr/bin/env python3
import inkex

class StampExtension(inkex.EffectExtension):
    def effect(self):
        # Insert a simple rectangle at (10, 10) with size 100x50
        rect = inkex.elements.Rect(x=10, y=10, width=100, height=50)
        self.svg.get_current_layer().add(rect)

if __name__ == '__main__':
    StampExtension().run()
