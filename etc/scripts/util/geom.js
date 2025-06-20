/**
 * Created by ggaudrea on 3/18/15.
 */


SPLODER.Geom = {};

SPLODER.Geom.dummyRectA = { x: 0, y: 0, width: 4, height: 4 };
SPLODER.Geom.dummyRectB = { x: 0, y: 0, width: 4, height: 4 };

SPLODER.Geom.rectByType = function (rect, useB) {

    if (rect.width == 0 || rect.height == 0) {

        var r = useB ? SPLODER.Geom.dummyRectB : SPLODER.Geom.dummyRectA;
        r.x = rect.x - 2;
        r.y = rect.y - 2;

        return r;
    }

    return rect;

};

SPLODER.Geom.pointWithinRect = function (x, y, rect, tilescale) {

    tilescale = tilescale || 1;

    rect = SPLODER.Geom.rectByType(rect);

    return (
        x >= rect.x * tilescale &&
        y >= rect.y * tilescale &&
        x <= (rect.x + rect.width) * tilescale &&
        y <= (rect.y + rect.height) * tilescale
    );

};

SPLODER.Geom.rectWithinRect = function (rectA, rectB) {

    rectA = SPLODER.Geom.rectByType(rectA);
    rectB = SPLODER.Geom.rectByType(rectB, true);

    return (
        rectA.x >= rectB.x &&
        rectA.y >= rectB.y &&
        rectA.x + rectA.width <= rectB.x + rectB.width &&
        rectA.y + rectA.height <= rectB.y + rectB.height
    );

};

SPLODER.Geom.rectIntersectsRect = function (rectA, rectB) {

    rectA = SPLODER.Geom.rectByType(rectA);
    rectB = SPLODER.Geom.rectByType(rectB, true);

    return (
        rectA.x + rectA.width >= rectB.x &&
        rectA.y + rectA.height >= rectB.y &&
        rectA.x <= rectB.x + rectB.width &&
        rectA.y <= rectB.y + rectB.height
    );

};

SPLODER.Geom.distanceBetweenXY = function (v1, v2) {

    var dx = v1.x - v2.x, dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);

};

SPLODER.Geom.distanceBetweenXZ = function (v1, v2) {

    return Math.sqrt(SPLODER.Geom.distanceBetweenSquaredXZ(v1, v2));

};

SPLODER.Geom.distanceBetween = function (x1, y1, x2, y2) {

    return Math.sqrt(SPLODER.Geom.distanceBetweenSquared(x1, y1, x2, y2));

};

SPLODER.Geom.distanceBetweenSquared = function (x1, y1, x2, y2) {

    var dx = x2 - x1, dy = y2 - y1;
    return dx * dx + dy * dy;

};

SPLODER.Geom.distanceBetweenSquaredXZ = function (v1, v2) {

    var dx = v1.x - v2.x, dz = v1.z - v2.z;
    return dx * dx + dz * dz;

};

SPLODER.Geom.angleBetween = function (x1, y1, x2, y2) {

    return Math.atan2(y2 - y1, x2 - x1);

};

SPLODER.Geom.rotatePointDeg = function (pt, deg) {

    SPLODER.Geom.rotatePoint(pt, deg * Math.PI / 180);

};

SPLODER.Geom.rotatePoint = function (pt, angle) {

    angle = 0 - SPLODER.Geom.normalizeAngle(angle);

    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var oldX = pt.x;
    var oldY = pt.y;

    pt.x = cos * oldX - sin * oldY;
    pt.y = sin * oldX + cos * oldY;

};

SPLODER.Geom.lerp = function (a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
};

SPLODER.Geom.lerpDist = function (x1, y1, x2, y2, dist) {

    var len = SPLODER.Geom.distanceBetween(x1, y1, x2, y2);
    var perc = dist / len;

    return {
        x: SPLODER.Geom.lerp(x2, x1, perc),
        y: SPLODER.Geom.lerp(y2, y1, perc)
    }

};

SPLODER.Geom.normalizeAngle = function (ang) {

    while (ang < 0 - Math.PI) {
        ang += Math.PI * 2;
    }

    while (ang > Math.PI) {
        ang -= Math.PI * 2;
    }

    return ang;

};

SPLODER.Geom.normalizeAngleDeg = function (ang) {

    while (ang < -180) {
        ang += 360;
    }

    while (ang > 180) {
        ang -= 360;
    }

    return ang;

};

SPLODER.Geom.closestPtPointSegment = function (c, a, b) {

    var ab = b.clone().sub(a);
    var t = c.clone().sub(a).dot(ab);
    t /= ab.dot(ab);
    return a.clone().add(ab.multiplyScalar(t));

};

SPLODER.Geom.ccw = function (p1x, p1y, p2x, p2y, p3x, p3y) {
    return (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x);
};

SPLODER.Geom.lineIntersectsLine = function (p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
    var fn = SPLODER.Geom.ccw;
    return (fn(p1x, p1y, p3x, p3y, p4x, p4y) != fn(p2x, p2y, p3x, p3y, p4x, p4y)) && (fn(p1x, p1y, p2x, p2y, p3x, p3y) != fn(p1x, p1y, p2x, p2y, p4x, p4y));
};

SPLODER.Geom.lineLineIntersect = function (x1, y1, x2, y2, x3, y3, x4, y4) {

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = x2 - x1;
    s1_y = y2 - y1;
    s2_x = x4 - x3;
    s2_y = y4 - y3;

    var s, t;
    s = (-s1_y * (x1 - x3) + s1_x * (y1 - y3)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (y1 - y3) - s2_y * (x1 - x3)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        var atX = x1 + (t * s1_x);
        var atY = y1 + (t * s1_y);
        return { x: atX, y: atY };
    }

    return false;

};

SPLODER.Geom.lineSide = function (x, y, x1, y1, x2, y2) {
    return (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0 ? 1 : -1;
};

SPLODER.Geom.rectIntersectsLine = function (rect, ax, ay, bx, by, side) {

    var rx = rect.x;
    var ry = rect.y;
    var rx2 = rx + rect.width;
    var ry2 = ry + rect.height;

    // bounds check, early out

    if ((rx > ax && rx > bx) || (ry > ay && ry > by)) {
        return false;
    }

    if ((rx2 < ax && rx2 < bx) || (ry2 < ay && ry2 < by)) {
        return false;
    }

    // edge check

    var fn = SPLODER.Geom.lineIntersectsLine;
    var fn2 = SPLODER.Geom.lineSide;

    var hits = [];


    if (fn(ax, ay, bx, by, rx, ry, rx2, ry)) {

        if (isNaN(side) || fn2(ax, ay, rx, ry, rx2, ry) == side) {
            hits.push(SPLODER.Geom.lineLineIntersect(ax, ay, bx, by, rx, ry, rx2, ry));
        }

    }

    if (fn(ax, ay, bx, by, rx2, ry, rx2, ry2)) {

        if (isNaN(side) || fn2(ax, ay, rx2, ry, rx2, ry2) == side) {
            hits.push(SPLODER.Geom.lineLineIntersect(ax, ay, bx, by, rx2, ry, rx2, ry2));
        }

    }

    if (fn(ax, ay, bx, by, rx2, ry2, rx, ry2)) {

        if (isNaN(side) || fn2(ax, ay, rx2, ry2, rx, ry2) == side) {
            hits.push(SPLODER.Geom.lineLineIntersect(ax, ay, bx, by, rx2, ry2, rx, ry2));
        }

    }

    if (fn(ax, ay, bx, by, rx, ry2, rx, ry)) {

        if (isNaN(side) || fn2(ax, ay, rx, ry2, rx, ry) == side) {
            hits.push(SPLODER.Geom.lineLineIntersect(ax, ay, bx, by, rx, ry2, rx, ry));
        }

    }

    return hits;

};

SPLODER.Geom.gridPointsAlongLine = function (x0, y0, x1, y1) {

    var a = [];

    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    var err = (dx>dy ? dx : -dy)/2;

    var i = 0;

    while (true)
    {
        a.push(x0);
        a.push(y0);
        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
        i++;
        if (i > 512) {
            console.log(a);
            break;
        }
    }

    return a;
};


SPLODER.Geom.resolvePenetrationCircleRect = function (centerPt, radius, rect, tilescale) {

    var cx = centerPt.x;
    var cy = centerPt.y;
    var cx1 = cx - radius;
    var cy1 = cy - radius;
    var cx2 = cx + radius;
    var cy2 = cy + radius;

    tilescale = tilescale || 1;

    var rx1 = rect.x;
    var ry1 = rect.y;
    var rx2 = rx1 + rect.width;
    var ry2 = ry1 + rect.height;
    var rx = (rx1 + rx2) * 0.5;
    var ry = (ry1 + ry2) * 0.5;


    // bounds check, early out

    if (rx2 < cx1 || ry2 < cy1 || rx1 > cx2 || ry1 > cy2) {
        return 0;
    }

    // if inside rect

    if (rx2 > cx && ry2 > cy && rx1 < cx && ry1 < cy) {

        console.log("INSIDE");
        return -1;
/*
        if (Math.abs(rx - cx) > Math.abs(ry - cy)) {
            if (cx > rx) {
                cx = centerPt.x = rx2 + radius;
            } else {
                cx = centerPt.x = rx1 - radius;
            }
        } else {
            if (cy > ry) {
                cy = centerPt.y = ry2 + radius;
            } else {
                cy = centerPt.y = ry1 - radius;
            }
        }
*/

        //return false;
    }


    var delta, angle;

    if (cx >= rx1 && cx <= rx2) {

        if (cy <= ry) {
            centerPt.y = ry1 - radius;
        } else {
            centerPt.y = ry2 + radius;
        }
        return 1;

    } else if (cy >= ry1 && cy <= ry2) {

        if (cx <= rx) {
            centerPt.x = rx1 - radius;
        } else {
            centerPt.x = rx2 + radius;
        }
        return 1;

    } else if (cx < rx1 && cy < ry1) {

        delta = SPLODER.Geom.distanceBetween(cx, cy, rx1, ry1);
        angle = SPLODER.Geom.angleBetween(cx, cy, rx1, ry1);

    } else if (cx > rx2 && cy < ry1) {

        delta = SPLODER.Geom.distanceBetween(cx, cy, rx2, ry1);
        angle = SPLODER.Geom.angleBetween(cx, cy, rx2, ry1);

    } else if (cx > rx2 && cy > ry2) {

        delta = SPLODER.Geom.distanceBetween(cx, cy, rx2, ry2);
        angle = SPLODER.Geom.angleBetween(cx, cy, rx2, ry2);

    } else {

        delta = SPLODER.Geom.distanceBetween(cx, cy, rx1, ry2);
        angle = SPLODER.Geom.angleBetween(cx, cy, rx1, ry2);

    }

    if (angle < 0) angle += Math.PI * 2;

    if (delta < radius) {

        delta -= radius;

        centerPt.x += delta * Math.cos(angle);
        centerPt.y += delta * Math.sin(angle);

        return 1;

    }

    return 0;

};




SPLODER.Geom.polygonArea = function (pts) {

    var area = 0;

    for (var i = 0; i < pts.length; i += 2) {
        j = (i + 2) % pts.length;
        area += pts[i] * pts[j + 1];
        area -= pts[j] * pts[i + 1];
    }

    return area / 2;

};


SPLODER.Geom.polygonIsClockwise = function (pts) {

    return SPLODER.Geom.polygonArea(pts) > 0;

};


SPLODER.Geom.polygonIsClosed = function (pts) {

    return pts.length >= 6 && pts[0] == pts[pts.length - 2] && pts[1] == pts[pts.length - 1];

};


SPLODER.Geom.closePolygon = function (pts) {

    if (pts.length >= 4 && !SPLODER.Geom.polygonIsClosed(pts)) {
        pts.push(pts[0], pts[1]);
    }

};
