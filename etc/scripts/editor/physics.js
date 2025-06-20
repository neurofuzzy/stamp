/**
 * Created by ggaudrea on 5/10/15.
 */


SPLODER.Physics = {

};


SPLODER.Physics.rayCast2d = function (model, sourcePt, targetPt, ptScale, typeFilter, endTarget) {

    var sX = sourcePt.x / ptScale;
    var sY = sourcePt.y / ptScale;
    var tX = targetPt.x / ptScale;
    var tY = targetPt.y / ptScale;

    var x = Math.min(sX, tX);
    var y = Math.min(sY, tY);
    var w = Math.abs(sX - tX);
    var h = Math.abs(sY - tY);

    var nearItems = model.getItemsIntersectingRect(x, y, w, h);
    var item;
    var hits = [];
    var recthits, hit;

    var i = nearItems.length;

    var endTargetHit = false;

    while (i--) {

        item = nearItems[i];

        if (typeFilter && item.type != typeFilter) {
            continue;
        }

        recthits = SPLODER.Geom.rectIntersectsLine(item, sX, sY, tX, tY);

        if (recthits) {

            for (var j = 0; j < recthits.length; j++) {

                hit = recthits[j];

                hits.push({
                    rect: item,
                    pt: hit,
                    dist: Math.floor(SPLODER.Geom.distanceBetween(sX, sY, hit.x, hit.y) * 10) / 10,
                    area: item.area()
                });

                if (endTarget && item == endTarget) {
                    endTargetHit = true;
                }

            }

        }

    }

    hits.sort(function (a, b) {

        if (a.dist > b.dist) {

            return 1;

        } else if (a.dist < b.dist) {

            return -1;

        } else {

            if (a.area > b.area) {
                return -1;
            } else if (a.area < b.area) {
                return 1;
            }

        }
        return 0;

    });

    // if end target is specified, trim off all rects beyond end target

    if (endTarget && endTargetHit) {

        i = hits.length;

        while (i--) {

            if (hits[i].rect == endTarget) {

                hits.splice(i + 1, hits.length - i);
                break;

            }

        }

    }

    return hits;

};


SPLODER.Physics.rayCast3d = function (model, source, target, tilesize, typeFilter, endTarget) {

    tilesize = tilesize || 32;

    var sPt = { x: source.x / tilesize, y: source.z / tilesize };
    var tPt = { x: target.x / tilesize, y: target.z / tilesize };


    var gridPts = SPLODER.Geom.gridPointsAlongLine(Math.floor(sPt.x), Math.floor(sPt.y), Math.floor(tPt.x), Math.floor(tPt.y));
    var nearRects = model.getItemsIntersectingRect(Math.min(sPt.x, tPt.x), Math.min(sPt.y, tPt.y), Math.abs(tPt.x - sPt.x), Math.abs(tPt.y - sPt.y));

    var rayPt = new THREE.Vector3();
    var rayLen = SPLODER.Geom.distanceBetweenXZ(source, target);
    var hit;
    var hitDepth;

    var hits3d = [];
    var dist;

    var offsetX = 0.5;
    var offsetY = 0.5;

    if (sPt.x > tPt.x) offsetX = -0.5;
    if (sPt.y > tPt.y) offsetY = -0.5;


    for (var i = 0; i < gridPts.length; i += 2) {

        hit = { x: gridPts[i], y: gridPts[i + 1] };
        dist = SPLODER.Geom.distanceBetween(sPt.x, sPt.y, hit.x + 0.5, hit.y + 0.5);
        rayPt.copy(source);
        rayPt.lerp(target, (dist * tilesize) / rayLen);

        hitDepth = rayPt.y / (tilesize * 0.5);

        var hits = SPLODER.Physics.checkHitAtGridPoint(hit.x, hit.y, hitDepth, nearRects);

        //console.log(hits.length);

        if (hits && hits.length) {
            hits3d.push({
                rect: hits[0],
                pt: hit,
                dist: dist,
                area: hits[0].area(),
                offsetX: offsetX,
                offsetY: offsetY
            });
        }

/*
        // debug

        var g = editor.drawingArea.debugDraw;
        var t = editor.drawingArea.tilesize;

        g.lineStyle(2, (hits && hits.length) ? 0xff0000 : 0x00ff00);
        g.drawRect(hit.x * t, hit.y * t, t, t);

        // end debug
*/



    }

    //console.log(hits3d);

    return hits3d;

};

SPLODER.Physics.checkHitAtGridPoint = function (x, y, hitDepth, items) {

    var hits = [];
    var floorDepth;
    var ceilDepth;

    var wallHit, platformHit, liquidHit;

    if (items) {

        SPLODER.ShapeUtils.sortByAreaDesc(items);
        var i = items.length;
        var item;

        while (i--) {

            item = items[i];
            //console.log(item.id, item.x > x, item.x + item.width <= x, item.y > y, item.y + item.height <= y);

            if (!(item.x > x || item.x + item.width <= x || item.y > y || item.y + item.height <= y)) {

                floorDepth = item.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                ceilDepth = item.getAttrib(SPLODER.Item.PROPERTY_CEIL) ? item.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 128;

                switch (item.type) {

                    case SPLODER.Item.TYPE_WALL:

                        if (!wallHit && (floorDepth >= hitDepth || ceilDepth <= hitDepth)) {
                            hits.push(item);
                        }
                        wallHit = true;
                        break;

                    case SPLODER.Item.TYPE_PLATFORM:
                    case SPLODER.Item.TYPE_PARTICLE:

                        if (!platformHit && floorDepth < hitDepth && ceilDepth > hitDepth) {
                            hits.push(item);
                        }
                        platformHit = true;
                        break;

                    case SPLODER.Item.TYPE_LIQUID:

                        if (!liquidHit && item.getAttrib(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR) && floorDepth >= hitDepth) {
                            hits.push(item);
                        }
                        liquidHit = true;
                        break;

                }

            }

        }
    }

    return hits;

};



SPLODER.Physics.pointInWallCheck = function (model, pos3d) {

    var elev = pos3d.y / 16;
    var rect = model.getItemsUnderPoint(Math.floor(pos3d.x / 32) + 0.5, Math.floor(pos3d.z / 32) + 0.5, 0, false, false, SPLODER.Item.TYPE_WALL);

    return (rect && (rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) > elev - 1 || rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) < elev + 1));

};


SPLODER.Physics.elevationCheck = function (model, currentElevation, pos3d, padding, floating, resolve) {

    var position = pos3d.clone().divideScalar(32);

    var th = 16;
    var floorLevel, ceilLevel;
    var rect, fCheck, cCheck, i;

    var nearRects = model.getItemsIntersectingRect(position.x - padding - 1, position.z - padding - 1, padding * 2 + 2, padding * 2 + 2);
    SPLODER.ShapeUtils.sortByAreaDesc(nearRects);

    var platformRects = [model.getItemsUnderPoint(position.x, position.z, 0, nearRects, false, SPLODER.Item.TYPE_PLATFORM)];

    if (padding > 0) {

        platformRects.push(
            model.getItemsUnderPoint(position.x + padding, position.z + padding, 0, nearRects, false, SPLODER.Item.TYPE_PLATFORM),
            model.getItemsUnderPoint(position.x + padding, position.z - padding, 0, nearRects, false, SPLODER.Item.TYPE_PLATFORM),
            model.getItemsUnderPoint(position.x - padding, position.z + padding, 0, nearRects, false, SPLODER.Item.TYPE_PLATFORM),
            model.getItemsUnderPoint(position.x - padding, position.z - padding, 0, nearRects, false, SPLODER.Item.TYPE_PLATFORM)
        );

    }

    var hits = [];

    if (platformRects) {

        i = platformRects.length;

        while (i--) {

            rect = platformRects[i];

            if (rect) {

                fCheck = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * th;
                cCheck = rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) * th;

                if (currentElevation >= fCheck - th) {

                    hits.push({
                        rect: rect,
                        f: fCheck,
                        c: 128 * th
                    });

                } else if (currentElevation <= fCheck - cCheck - th) {

                    hits.push({
                        rect: rect,
                        f: 0,
                        c: cCheck
                    });

                }

            }

        }

    }

    var wallRects = [model.getItemsUnderPoint(position.x, position.z, 0, nearRects, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID)];

    if (padding > 0) {

        wallRects.push(
            model.getItemsUnderPoint(position.x + padding, position.z + padding, 0, nearRects, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID),
            model.getItemsUnderPoint(position.x + padding, position.z - padding, 0, nearRects, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID),
            model.getItemsUnderPoint(position.x - padding, position.z + padding, 0, nearRects, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID),
            model.getItemsUnderPoint(position.x - padding, position.z - padding, 0, nearRects, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID)
        );

    }

    if (wallRects) {

        i = wallRects.length;

        while (i--) {

            rect = wallRects[i];

            if (rect) {
                fCheck = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * th;
                cCheck = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) * th : 10000;

                if (rect.type == SPLODER.Item.TYPE_LIQUID) {
                    if (!rect.getAttrib(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR)) continue;
                    cCheck = 10000;
                }

                //if (fCheck < currentElevation + th * 2 && cCheck > currentElevation - th * 4 && fCheck < cCheck - th * 2) {

                    hits.push({
                        rect: rect,
                        f: fCheck,
                        c: cCheck
                    });

                //}

            }

        }

    }


    if (!hits.length) {
        // console.log("NO HITS", wallRects.length);
        return -1;
    }

    hits.sort(function (a, b) {

        if (a.f > b.f) {
           return -1;
        } else if (a.f < b.f) {
           return 1;
        }

        return 0;

    });

    floorLevel = hits[0].f;

    hits.sort(function (a, b) {

        if (a.c > b.c) {
            return 1;
        } else if (a.c < b.c) {
            return -1;
        }

        return 0;

    });

    ceilLevel = hits[0].c;

    if (floorLevel > ceilLevel) {
        return -1;
    }


    if (floating) {
        if (currentElevation >= floorLevel + th * 8 && currentElevation < ceilLevel - th * 4) {
            return currentElevation;
        } else {
            // console.log("inside geometry!")
            return Math.min(floorLevel + th * 10, Math.max(ceilLevel - th * 3, floorLevel + (ceilLevel - floorLevel) * 0.5));
        }
    }

    var elev = Math.max(floorLevel, Math.min(floorLevel + th * 10, ceilLevel - th * 3));
    // console.log(elev);

    if (resolve) {
        pos3d.y = elev;
    }

    return elev;


};


SPLODER.Physics._getCollisionRect = function (rect, ipos, x, y) {

    var rx, ry, rw, rh;

    rx = x;
    ry = y;
    rw = 1;
    rh = 1;

    if (x < ipos.x) {
        rx -= 3;
        rw += 3;
    } else if (x > ipos.x) {
        rw += 3;
    }

    if (y < ipos.y) {
        ry -= 3;
        rh += 3;
    } else if (y > ipos.y) {
        rh += 3;
    }

    /*
    // debug

    var g = editor.drawingArea.debugDraw;
    var t = editor.drawingArea.tilesize;

    if (rect.type == SPLODER.Item.TYPE_PANEL) {
        g.clear();
    }

    g.lineStyle(2, 0xff0000);

    switch (rect.type) {

        case SPLODER.Item.TYPE_WALL:
            g.lineStyle(2, 0xff0000);
            break;

        case SPLODER.Item.TYPE_PLATFORM:
            g.lineStyle(2, 0x00ff00);
            break;

        case SPLODER.Item.TYPE_PANEL:
            g.lineStyle(2, 0x00ffff);
            break;

    }

    g.drawRect(rx * t, ry * t, rw * t, rh * t);

    // end debug
    */

    return {
        type: rect.type,
        id: rect.id,
        x: rx,
        y: ry,
        width: rw,
        height: rh
    };

};

SPLODER.Physics.collisionCheck = function (model, pos3d, floating, resolve) {

    SPLODER.Physics.elevationCheck(model, pos3d.y, pos3d, 1, floating, true);

    var pos = pos3d;
    var elev = pos.y / 16;
    var ipos = { x: Math.floor(pos.x / 32), y: Math.floor(pos.z / 32) };
    var cposA = { x: pos.x / 32, y: pos.z / 32 };
    var cposB = { x: pos.x / 32, y: pos.z / 32 };
    var floorDepth, ceilDepth;

    var items = model.getItemsIntersectingRect(ipos.x - 2, ipos.y - 2, 4, 4);
    SPLODER.ShapeUtils.sortByAreaDesc(items);

    var i, rect, rfloor, res, x, y;
    var nearRects = [];

    //editor.drawingArea.debugDraw.clear();

    var ignoreRect;

    rect = model.getItemsUnderPoint(ipos.x + 0.5, ipos.y + 0.5, 0, items, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);

    if (rect) {
        floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
        ceilDepth = (rect.type != SPLODER.Item.TYPE_LIQUID) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 1000;

        if (floorDepth > elev - 1 || ceilDepth < elev + 1) {

            ignoreRect = rect;

        }
    }

    for (y = ipos.y - 2; y <= ipos.y + 2; y++) {

        for (x = ipos.x - 2; x <= ipos.x + 2; x++) {

            rect = model.getItemsUnderPoint(x + 0.5, y + 0.5, 0, items, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);

            floorDepth = 0;
            ceilDepth = 256;

            if (rect) {
                floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                ceilDepth = (rect.type != SPLODER.Item.TYPE_LIQUID && rect.getAttrib(SPLODER.Item.PROPERTY_CEIL)) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 256;
            }

            if (x == ipos.x && y == ipos.y) continue;

            if (rect && (floorDepth > elev - 2 || ceilDepth < elev + 1) && rect != ignoreRect) {

                nearRects.push(SPLODER.Physics._getCollisionRect(rect, ipos, x, y));

            } else {

                rect = model.getItemsUnderPoint(x + 0.5, y + 0.5, 0, items, false, SPLODER.Item.TYPE_PLATFORM);

                if (rect) {
                    floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                    ceilDepth = floorDepth - rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);
                }

                if (rect && (floorDepth > elev - 2 && ceilDepth < elev + 2)) {

                    nearRects.push(SPLODER.Physics._getCollisionRect(rect, ipos, x, y));

                }

            }

        }

    }

    var panels = model.getItemsIntersectingRect(ipos.x - 3, ipos.y - 3, 6, 6, SPLODER.Item.TYPE_PANEL);
    var c_rect, rwh, rhh;
    i = panels.length;

    while (i--) {

        rect = panels[i];

        floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
        ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

        rfloor = floorDepth;

        if (rfloor < elev + 1 && (rfloor + Math.max(rect.width * 2, rect.height * 2)) > elev - 6) {

            c_rect = {
                type: rect.type,
                id: rect.id,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            };

            if (rect.width > rect.height) {

                rhh = Math.floor(rect.height * 0.5);

                if (ipos.y <= rect.y + rhh) {
                    c_rect.y += rhh;
                } else {
                    c_rect.y -= rhh;
                }

            } else if (rect.width < rect.height) {

                rwh = Math.floor(rect.width * 0.5);

                if (ipos.x <= rect.x + rwh) {
                    c_rect.x += rwh;
                } else {
                    c_rect.x -= rwh;
                }

            } else {

                c_rect.x += 1;
                c_rect.y += 1;
                c_rect.width -= 2;
                c_rect.height -= 2;

            }

            nearRects.push(c_rect);

        }

    }

    i = nearRects.length;

    while (i--) {

        rect = nearRects[i];

        res = SPLODER.Geom.resolvePenetrationCircleRect(cposA, 1.5, rect, 1);

        if (!resolve && res) return true;

    }

    if (!resolve) return false;

    var newPos = {
        x: NaN,
        y: pos.y,
        z: NaN
    };

    if (cposA.x != cposB.x) newPos.x = cposA.x * 32;
    if (cposA.y != cposB.y) newPos.z = cposA.y * 32;

    return newPos;

};
