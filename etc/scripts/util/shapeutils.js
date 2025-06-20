/**
 * Created by ggaudrea on 3/5/15.
 */

SPLODER.ShapeUtils = {};

SPLODER.ShapeUtils.errorOccured = new signals.Signal();

SPLODER.ShapeUtils._compare = function (a, b) {

    var aa = a.area(), ba = b.area();

    if (aa < ba) {
        return 1;
    } else if (aa > ba) {
        return -1;
    } else {
        if (a.type > b.type) {
            return 1;
        } else if (a.type < b.type) {
            return -1;
        }
    }
    return 0;
};

SPLODER.ShapeUtils.sortByAreaDesc = function (rects) {

    if (rects instanceof Array) {
        rects.sort(SPLODER.ShapeUtils._compare);
    }

};


SPLODER.ShapeUtils.getBounds = function (rects) {

    if (rects instanceof Array) {

        var i = rects.length;

        var b = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            size: 0,
            depth: 0
        };

        if (i) {

            var minX = 10000;
            var minY = 10000;
            var maxX = -10000;
            var maxY = -10000;
            var avgDepth = 0;

            var rect;

            while (i--) {

                rect = rects[i];

                if (rect) {

                    minX = Math.min(minX, rect.x);
                    minY = Math.min(minY, rect.y);
                    maxX = Math.max(maxX, rect.x + rect.width);
                    maxY = Math.max(maxY, rect.y + rect.height);
                    avgDepth += rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);

                }

            }

            avgDepth /= rects.length;

            b.x = minX;
            b.y = minY;
            b.width = maxX - minX;
            b.height = maxY - minY;

            b.size = Math.max(
                0 - minX,
                0 - minY,
                maxX,
                maxY
            );

            b.depth = avgDepth;

        }

        return b;

    }

};

SPLODER.ShapeUtils.scaleRect = function (rect, scale) {

    rect.x *= scale;
    rect.y *= scale;
    rect.width *= scale;
    rect.height *= scale;

};


SPLODER.ShapeUtils.getFilledGrid = function (parentNode, children)
{
    var grid = [];
    var w = parentNode.width + 2;
    var h = parentNode.height + 2;
    var child, x1, y1, x2, y2, i;

    // fill around perimeter with -1

    i = w * h;

    while (i--) {
        x1 = i % w;
        y1 = Math.floor(i / w);
        if (x1 == 0 || x1 == w - 1 || y1 == 0 || y1 == h - 1) {
            grid.unshift(-1);
        } else {
            grid.unshift(0);
        }
    }

    // fill all children with -1

    i = children.length;

    while (i--) {

        child = children[i];

        for (y1 = 0; y1 < child.height; y1++) {

            for (x1 = 0; x1 < child.width; x1++) {

                x2 = (child.x - parentNode.x) + x1 + 1;
                y2 = (child.y - parentNode.y) + y1 + 1;

                grid[y2 * w + x2] = -1;

            }

        }

    }

    var search_tile = function (x, y, searchValue, floodValue, allowDiagonals, visitedTiles) {

        if (!visitedTiles) {
            visitedTiles = [];
        }

        // if tile already checked, exit
        if (visitedTiles[y * w + x] > 0) {
            return;
        }

        // return if bounds hit
        if (x < 0 || y < 0 || x > w - 1 || y > h - 1) {
            return;
        }

        visitedTiles[y * w + x] = 1;

        var pass = (searchValue == 'g') ? grid[y * w + x] > 0 : grid[y * w + x] == searchValue;

        if (pass) {

            grid[y * w + x] = floodValue;

            search_tile(x, y - 1, searchValue, floodValue, allowDiagonals, visitedTiles);
            search_tile(x + 1, y, searchValue, floodValue, allowDiagonals, visitedTiles);
            search_tile(x, y + 1, searchValue, floodValue, allowDiagonals, visitedTiles);
            search_tile(x - 1, y, searchValue, floodValue, allowDiagonals, visitedTiles);

            if (allowDiagonals) {

                search_tile(x - 1, y - 1, searchValue, floodValue, allowDiagonals, visitedTiles);
                search_tile(x + 1, y - 1, searchValue, floodValue, allowDiagonals, visitedTiles);
                search_tile(x - 1, y + 1, searchValue, floodValue, allowDiagonals, visitedTiles);
                search_tile(x + 1, y + 1, searchValue, floodValue, allowDiagonals, visitedTiles);

            }

        }

    };

    // fill around perimeter (now -1) with 1
    // adjacent children (now -1) will also fill with 1

    search_tile(0, 0, -1, 1, true);

    // fill remaining 0s with poly numbering, starting with 2
    // in most cases there will only be one poly

    var idx;
    var maxPoly = 2;
    var polyNum = 2;

    while (grid.indexOf(0) != -1) {

        idx = grid.indexOf(0);
        x1 = idx % w;
        y1 = Math.floor(idx / w);
        search_tile(x1, y1, 0, polyNum);
        polyNum++;
        maxPoly++;

    }

    // fill -1s with poly (hole) numbering, starting with -2
    // there may be more than 1 hole!

    polyNum = -2;

    while (grid.indexOf(-1) != -1) {

        idx = grid.indexOf(-1);
        x1 = idx % w;
        y1 = Math.floor(idx / w);
        search_tile(x1, y1, -1, polyNum);
        polyNum--;

    }

    var tmp = grid.concat();

    search_tile(0, 0, 'g', 0);

    i = grid.length;

    var error = false;
    while (i--) {
        if (grid[i] > 0) {
            error = true;
            if (w < 16 || h < 16) {
                tmp[i] = -2;
            } else {
                break;
            }
        }
    }

    grid = tmp;

    if (error) {

        console.log("PROBABLE TRIANGULATION ERROR");

        SPLODER.ShapeUtils.errorOccured.dispatch(parentNode);

        if (w >= 16 && h >= 16) {

            var shimStart = Math.floor(grid.indexOf(-2) / w) * w;
            var shimEnd = shimStart + Math.floor(w / 2);

            if (shimStart >= 0) {

                shimStart += w;
                shimEnd += w;

                for (i = shimStart; i < shimEnd; i++) {

                    if (grid[i] == 2) grid[i] = maxPoly;

                }

            }

        }


    }


    // debug print
/*
    for (y1 = 1; y1 <= parentNode.height; y1++) {

        var line = "";

        for (x1 = 1; x1 <= parentNode.width; x1++) {

            if (grid[y1 * w + x1] < 0) {
                line += grid[y1 * w + x1] + " ";
            } else {
                line += " " + grid[y1 * w + x1] + " ";
            }

        }

        console.log(y1 + " => " + line);

    }

    console.log(' ');
*/
    // end debug print

    return { grid: grid, w: w };
};

SPLODER.ShapeUtils.getSegments = function (grid, parentNodeRect, polyNum, w) {

    var segs = [];
    var idx, x1, y1, px = 0, py = 0;
    w = w || 0;
    var search_total = 0;
    var max_search = grid.length * 2;

    if (parentNodeRect) {
        px = parentNodeRect.x - 1;
        py = parentNodeRect.y - 1;
        w = parentNodeRect.width + 2;
    }

    idx = grid.indexOf(polyNum);

    if (idx != -1) {

        x1 = idx % w;
        y1 = Math.floor(idx / w);

        var seg_search_tile = function (x, y, polyNum, dir, len) {

            len = len || 1;
            search_total++;

            if (search_total >= max_search) return;

            if (dir === undefined) {
                seg_search_tile(x + 1, y, polyNum, 1, 1);
                return;
            }

            if (x == x1 && y == y1) {
                segs.push(px + x, py + y);
                return;
            }

            var idx = function (x, y) {
                return y * w + x;
            };

            switch (dir) {

                case 0:

                    if (grid[idx(x, y - 1)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x + 1, y, polyNum, 1);
                        return;

                    } else if (grid[idx(x - 1, y - 1)] != polyNum) {

                        seg_search_tile(x, y - 1, polyNum, 0, len + 1);
                        return;

                    } else if (grid[idx(x - 1, y)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x - 1, y, polyNum, 3);

                    }
                    break;

                case 1:

                    if (grid[idx(x, y)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x, y + 1, polyNum, 2);
                        return;

                    } else if (grid[idx(x, y - 1)] != polyNum) {

                        seg_search_tile(x + 1, y, polyNum, 1, len + 1);
                        return;

                    } else if (grid[idx(x - 1, y - 1)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x, y - 1, polyNum, 0);

                    }

                    break;

                case 2:

                    if (grid[idx(x - 1, y)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x - 1, y, polyNum, 3);
                        return;

                    } else if (grid[idx(x, y)] != polyNum) {

                        seg_search_tile(x, y + 1, polyNum, 2, len + 1);
                        return;

                    } else if (grid[idx(x, y - 1)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x + 1, y, polyNum, 1);

                    }

                    break;

                case 3:

                    if (grid[idx(x - 1, y - 1)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x, y - 1, polyNum, 0);
                        return;

                    } else if (grid[idx(x - 1, y)] != polyNum) {

                        seg_search_tile(x - 1, y, polyNum, 3, len + 1);
                        return;

                    } else if (grid[idx(x, y)] != polyNum) {

                        segs.push(px + x, py + y);
                        seg_search_tile(x, y + 1, polyNum, 2);

                    }

                    break;


            }

        };

        seg_search_tile(x1, y1, polyNum);

    }

    return segs;

};

SPLODER.ShapeUtils.getCoordsFromSegments = function (segments, doOptimize, scale, reverse, padding) {

    if (!segments) return segments;

    segments = segments.concat();

    padding = padding || 0;

    var points = [];
    var nib = 0.001;

    var i, j, ptX, ptY, aX, aY;
    // check for duplicate points

    var dupes = [];
    j = segments.length;

    while (j >= 0) {

        i = segments.length;

        while (i >= 0) {

            if (i != j && segments[i] == segments[j] && segments[i + 1] == segments[j + 1]) {

                dupes.unshift(j);

            }

            i -= 2;

        }

        j -= 2;
    }

    // broken nib any dupes

    i = dupes.length;

    var idx;

    while (i--) {

        idx = dupes[i];

        if (idx > 0 && idx < segments.length - 1) {

            ptX = segments[idx];
            ptY = segments[idx + 1];
            aX = (segments[idx - 2] + ptX + segments[idx + 2]) / 3 - ptX;
            aY = (segments[idx - 1] + ptY + segments[idx + 3]) / 3 - ptY;

            if (aX < 0) {

                if (aY < 0) {

                    segments[idx + 1] -= nib;
                    segments.splice(idx + 2, 0, ptX - nib, ptY);

                } else {

                    segments[idx] -= nib;
                    segments.splice(idx + 2, 0, ptX, ptY + nib);

                }

            } else {

                if (aY < 0) {

                    segments[idx] += nib;
                    segments.splice(idx + 2, 0, ptX, ptY - nib);

                } else {

                    segments[idx + 1] += nib;
                    segments.splice(idx + 2, 0, ptX + nib, ptY);
                }

            }

        } else {

            console.log("ERROR: UNHANDLED TRACE CONDITION. END POINT OF POLY IS DUPE!");
        }

    }

    // export

    var fn;

    var needsReverse = (reverse == SPLODER.Geom.polygonIsClockwise(segments));


    for (i = 0; i < segments.length; i += 2) {

        ptX = segments[i];
        ptY = segments[i + 1];

        fn = (!needsReverse) ? points.push : points.unshift;

        fn.call(points, ptX * scale, ptY * scale);

    }

    SPLODER.Geom.closePolygon(points);

    // add padding

    if (padding != 0) {

        var minX = 10000, maxX = -10000, minY = 10000, maxY = -10000;

        for (i = 0; i < points.length; i += 2) {

            ptX = points[i];
            ptY = points[i + 1];

            minX = Math.min(minX, ptX);
            maxX = Math.max(maxX, ptX);

            minY = Math.min(minY, ptY);
            maxY = Math.max(maxY, ptY);

        }

        for (i = 0; i < points.length; i += 2) {

            ptX = points[i];
            ptY = points[i + 1];

            if (ptX == minX) {
                points[i] -= padding;
            } else if (ptX == maxX) {
                points[i] += padding;
            }

            if (ptY == minY) {
                points[i + 1] -= padding;
            } else if (ptY == maxY) {
                points[i + 1] += padding;
            }

        }

    }

    return points;

};


SPLODER.ShapeUtils.buildTree = function (rects) {

    var i, j, k;
    var rect, parentNode;

    SPLODER.ShapeUtils.sortByAreaDesc(rects);

    var rects_typed = [[], [], []];

    i = rects.length;

    while (i--) {

        rect = rects[i];
        rect.removeAllChildren();
        rect.parentNode = null;

        if (rect.type < 3) {
            rects_typed[rect.type].unshift(rect);
            if (rect.type == 2 && rect.getAttrib(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR) == 1) {
                rects_typed[0].unshift(rect);
            }
        }
    }

    for (k = 0; k < 3; k++) {

        rects = rects_typed[k];
        j = rects.length;

        // find each rect's immediate parentNode, and save children to array of parentNode ids

        while (j--) {

            rect = rects[j];

            if (j > 0) {

                i = j;

                while (i--) {

                    parentNode = rects[i];

                    if (parentNode.baseX <= rect.baseX && parentNode.baseY <= rect.baseY &&
                        parentNode.baseX + parentNode.width >= rect.baseX + rect.width && parentNode.baseY + parentNode.height >= rect.baseY + rect.height) {

                        parentNode.addChild(rect);
                        break;

                    }

                }

            }

        }

    }

};

SPLODER.ShapeUtils.getDescendants = function (node) {

    var getBranch = function (node) {

        var a = [];

        var children = node.children;

        for (var i = 0; i < children.length; i++) {

            a = a.concat(getBranch(children[i]));

        }

        a = a.concat(children);

        return a;

    };

    var descendants = getBranch(node);

    SPLODER.ShapeUtils.sortByAreaDesc(descendants);

    return descendants;

};



SPLODER.ShapeUtils.getShapes = function (rects, forCeiling, scale, treeRects) {

    var i, j, k;
    var rect, prect, parentNode, children;

    treeRects = treeRects || rects;

    SPLODER.ShapeUtils.buildTree(treeRects);

    var rects_typed = [[], [], []];

    i = rects.length;

    var hasChildCeils = function (rect) {

        if (!rect) return false;

        if (rect.getAttrib(SPLODER.Item.PROPERTY_CEIL)) return true;

        if (rect.children) {

            var i = rect.children.length;

            while (i--) {
                if (hasChildCeils(rect.children[i])) return true;
            }
        }

    };

    while (i--) {

        rect = rects[i];

        if (forCeiling) {

            if (!rect.getAttrib(SPLODER.Item.PROPERTY_CEIL)) {

                if (!hasChildCeils(rect)) continue;

            }

        }

        // the ceiling shapes set only includes the wall type rects

        if (rect.type < 3) {
            if (!(forCeiling && rect.type != SPLODER.Item.TYPE_WALL)) {
                rects_typed[rect.type].unshift(rect);
            }
        }

    }

    if (!forCeiling) {

      //  rects_typed[0] = rects_typed[0].concat(rects_typed[2]);

    }

    var shapes = [];

    // TODO
    perimSegments = [];
    holeSegments = [];

    for (k = 0; k < 3; k++) {

        rects = rects_typed[k];

        // evaluate rects and create shapes from intersections with children

        j = rects.length;

        var res, grid, w, polyNum, segs, pX, pY, coords, shape;



        while (j--) {

            parentNode = rects[j];

            pX = parentNode.x * scale;
            pY = parentNode.y * scale;
            children = parentNode.children;

            // if shape set represents the ceiling, remove any children that have the ceiling turned off

            if (forCeiling) {

                i = children.length;

                while (i--) {

                    if (!children[i].getAttrib(SPLODER.Item.PROPERTY_CEIL) && !hasChildCeils(children[i])) {
                        children.splice(i, 1);
                    } else if (k == 0 && children[i].type == SPLODER.Item.TYPE_LIQUID) {
                        var liquid = children[i];
                        children.splice(i, 1);
                        for (var c = 0; c < liquid.children.length; c++) {
                            if (hasChildCeils(liquid.children[c])) {
                                children = children.concat(liquid.children[c]);
                            }
                        }
                    }

                }

            }

            var path = THREE.ShapePath ? new THREE.ShapePath() : new THREE.Path();
            var pathLen = 0;

            grid = null;

            if (children) {

                res = SPLODER.ShapeUtils.getFilledGrid(parentNode, children);
                grid = res.grid;
                w = grid.w;

                // outline polygons by number, starting with 2

                polyNum = 2;

                while (grid.indexOf(polyNum) != -1) {

                    segs = SPLODER.ShapeUtils.getSegments(grid, parentNode, polyNum, w);

                    if (segs.length) {

                        coords = SPLODER.ShapeUtils.getCoordsFromSegments(segs, true, scale);

                        if (coords.length) {

                            perimSegments.push(coords);

                            path.moveTo(coords[0] - pX, coords[1] - pY);

                            for (i = 2; i < coords.length; i += 2) {

                                path.lineTo(coords[i] - pX, coords[i + 1] - pY);
                                pathLen++;

                            }

                        }

                    }

                    polyNum++;

                }

                // outline holes by number, starting with -2, and decreasing

                polyNum = -2;

                while (grid.indexOf(polyNum) != -1) {

                    segs = SPLODER.ShapeUtils.getSegments(grid, parentNode, polyNum, w);

                    if (segs.length) {

                        coords = SPLODER.ShapeUtils.getCoordsFromSegments(segs, false, scale, true, -0.001);

                        if (coords.length) {

                            holeSegments.push(coords);
                            path.moveTo(coords[0] - pX, coords[1] - pY);

                            for (i = 2; i < coords.length; i += 2) {

                                path.lineTo(coords[i] - pX, coords[i + 1] - pY);
                                pathLen++;

                            }

                        }

                    }

                    polyNum--;

                }

            } else {

                coords = [
                    0, 0,
                    parentNode.width * scale, 0,
                    parentNode.width * scale, parentNode.height * scale,
                    0, parentNode.height * scale,
                    0, 0
                ];

                path.moveTo(coords[0], coords[1]);

                for (i = 2; i < coords.length; i += 2) {

                    path.lineTo(coords[i], coords[i + 1]);

                }

            }

            shape = path.toShapes(true, false);
            shape.userData = {parentNode: parentNode, grid: grid};
            shapes.push(shape);

        }

    }

    // create THREE shape geometries from polygons

    return shapes;

};

SPLODER.ShapeUtils.getPaddedGrid = function (grid, w, h, padding) {

    var newGrid = [];

    var p2 = padding * 2;
    var idx, o_idx;

    for (var y = 0; y < h + p2; y++) {

        for (var x = 0; x < w + p2; x++) {

            idx = y * (h + p2) + x;
            o_idx = (y - padding) * h + (x - padding);

            if (x < padding || y < padding || x >= w + padding || y >= h + padding) {

                newGrid[idx] = 0;

            } else {

                newGrid[idx] = grid[o_idx];

            }

        }

    }

    return newGrid;

};

SPLODER.ShapeUtils.getGeometryFromTexture = function (texture, frame, scale, extrudeAmount) {

    var x, y, idx;
    var t = frame[1];
    var l = frame[0];
    var w = frame[2];
    var h = frame[3];

    scale = scale || 1;
    extrudeAmount = extrudeAmount || scale;

    var canvas = document.createElement('canvas');
    canvas.width = w + 2;
    canvas.height = h + 2;

    var ctx = canvas.getContext('2d');

    try {

        ctx.drawImage(texture, l, t, w, h, 1, 1, canvas.width - 2, canvas.height - 2);

        w += 2;
        h += 2;

        var grid = [];

        var imgd = ctx.getImageData(0, 0, w, h);
        var data = imgd.data;

        var minX = 10000;
        var minY = 10000;
        var maxX = -10000;
        var maxY = -10000;


        for (y = 0; y < h; y++) {

            for (x = 0; x < w; x++) {

                idx = y * w + x;

                if (data[idx * 4 + 3] > 128) {
                    grid[idx] = 1;
                    minX = Math.min(x, minX);
                    maxX = Math.max(x, maxX);
                    minY = Math.min(y, minY);
                    maxY = Math.max(y, maxY);
                } else {
                    grid[idx] = 0;
                }

            }

        }

        var pX = w * 0.5 * scale;
        var pY = h * 0.5 * scale;

        var segs = SPLODER.ShapeUtils.getSegments(grid, null, 1, w);

        if (segs.length) {

            var coords = SPLODER.ShapeUtils.getCoordsFromSegments(segs, true, scale, true, 0.01);

            if (coords.length) {

                var path = THREE.ShapePath ? new THREE.ShapePath() : new THREE.Path();
                path.moveTo(coords[0] - pX, 0 - coords[1] + pY);

                for (var i = 2; i < coords.length; i += 2) {

                    path.lineTo(coords[i] - pX, 0 - coords[i + 1] + pY);

                }

            }

        }

        try {

            var shape = path.toShapes(true, true);

            var options = {
                bevelEnabled: false,
                amount: extrudeAmount
            };


            var geom = new THREE.ExtrudeGeometry(shape, options);
            SPLODER.MeshUtils.applyVoxelMapping(geom, w - 2, h - 2, scale, minX, minY, maxX - minX, maxY - minY);
            return {
                geometry: geom,
                bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
            }
        } catch (err) {
            console.log(err.stack);
            return {};
        }

    } catch (err) {

        console.log("SHAPE GEN ERROR:", err.stack, "TEXTURE SOURCE:", texture);

    }

};
