# Geometry module for Stamp Python port
# Provides Point, Ray, Polygon, BoundingBox, and basic geometric operations
import math
from typing import List, Optional

class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Point(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        return Point(self.x - other.x, self.y - other.y)

    def distance_to(self, other) -> float:
        return math.hypot(self.x - other.x, self.y - other.y)

    def rotate(self, angle_rad: float, origin=None):
        if origin is None:
            origin = Point(0, 0)
        ox, oy = origin.x, origin.y
        px, py = self.x - ox, self.y - oy
        qx = ox + math.cos(angle_rad) * px - math.sin(angle_rad) * py
        qy = oy + math.sin(angle_rad) * px + math.cos(angle_rad) * py
        return Point(qx, qy)

    def as_tuple(self):
        return (self.x, self.y)

class Ray:
    def __init__(self, x: float, y: float, direction: float = 0):
        self.x = x
        self.y = y
        self.direction = direction  # radians

    def to_point(self):
        return Point(self.x, self.y)

    def move(self, distance: float):
        self.x += math.cos(self.direction) * distance
        self.y += math.sin(self.direction) * distance
        return self

    def rotate(self, angle_rad: float):
        self.direction += angle_rad
        return self

class BoundingBox:
    def __init__(self, x: float, y: float, width: float, height: float):
        self.x = x
        self.y = y
        self.width = width
        self.height = height

    def contains(self, pt: Point) -> bool:
        return (self.x <= pt.x <= self.x + self.width and
                self.y <= pt.y <= self.y + self.height)

    def as_tuple(self):
        return (self.x, self.y, self.width, self.height)

class Polygon:
    def __init__(self, points: List[Point]):
        self.points = points

    def area(self) -> float:
        # Shoelace formula
        n = len(self.points)
        if n < 3:
            return 0.0
        area = 0.0
        for i in range(n):
            j = (i + 1) % n
            area += self.points[i].x * self.points[j].y
            area -= self.points[j].x * self.points[i].y
        return abs(area) / 2.0

    def centroid(self) -> Point:
        n = len(self.points)
        if n == 0:
            return Point(0, 0)
        x = sum(p.x for p in self.points) / n
        y = sum(p.y for p in self.points) / n
        return Point(x, y)

    def bounds(self) -> BoundingBox:
        xs = [p.x for p in self.points]
        ys = [p.y for p in self.points]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        return BoundingBox(min_x, min_y, max_x - min_x, max_y - min_y)

    def translate(self, dx: float, dy: float):
        self.points = [Point(p.x + dx, p.y + dy) for p in self.points]
        return self

    def rotate(self, angle_rad: float, origin: Optional[Point] = None):
        self.points = [p.rotate(angle_rad, origin) for p in self.points]
        return self

# Additional geometry helpers can be added as needed
