import random
from typing import Any, Callable, List, Optional, Union

class Sequence:
    """
    Sequence: Value generator for generative art parameters.
    Supports various picker modes (once, repeat, shuffle, etc.).
    """
    def __init__(self, values: Union[List[Any], Callable[[], Any]], picker: str = 'cycle', seed: Optional[int] = None):
        self.values = values
        self.picker = picker
        self.index = 0
        self.random = random.Random(seed)
        self._shuffled = None
        if picker == 'shuffle' and isinstance(values, list):
            self._shuffled = values[:]
            self.random.shuffle(self._shuffled)

    def next(self) -> Any:
        if callable(self.values):
            return self.values()
        if self.picker == 'cycle':
            val = self.values[self.index % len(self.values)]
            self.index += 1
            return val
        elif self.picker == 'once':
            if self.index < len(self.values):
                val = self.values[self.index]
                self.index += 1
                return val
            else:
                return self.values[-1]
        elif self.picker == 'shuffle' and self._shuffled:
            val = self._shuffled[self.index % len(self._shuffled)]
            self.index += 1
            return val
        elif self.picker == 'random':
            return self.random.choice(self.values)
        else:
            raise ValueError(f"Unknown picker mode: {self.picker}")

    def reset(self):
        self.index = 0
        if self.picker == 'shuffle' and isinstance(self.values, list):
            self._shuffled = self.values[:]
            self.random.shuffle(self._shuffled)
        return self

    def copy(self):
        return Sequence(self.values, self.picker)
