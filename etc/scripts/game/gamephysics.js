/**
 * Created by ggaudrea on 5/10/15.
 */


SPLODER.GamePhysics = {

};

SPLODER.GamePhysics.dispatcher = new signals.Signal();

SPLODER.GamePhysics.posBuffer = new THREE.Vector3(0, 0, 0);
SPLODER.GamePhysics.ptBuffer = new THREE.Vector2(0, 0);
SPLODER.GamePhysics.elevationBuffer = [];
SPLODER.GamePhysics.floorCeilBuffer = [];
SPLODER.GamePhysics.collisionBuffer = { x: 0, y: 0, z: 0, p: 0 };
SPLODER.GamePhysics.cposABuffer = { x: 0, y: 0 };
SPLODER.GamePhysics.cposBBuffer = { x: 0, y: 0 };
SPLODER.GamePhysics.pposBuffer = { x: 0, y: 0 };

SPLODER.GamePhysics.GRAVITY_STANDARD = 0;
SPLODER.GamePhysics.GRAVITY_WADE = 1;
SPLODER.GamePhysics.GRAVITY_FLOAT = 2;
SPLODER.GamePhysics.GRAVITY_SWIM = 3;


SPLODER.GamePhysics.rayCast2d = function (model, sourcePt, targetPt, ptScale, typeFilter, endTarget) {

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


SPLODER.GamePhysics.rayCast3d = function (model, source, target, tilesize) {

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

        var hits = SPLODER.GamePhysics.checkHitAtGridPoint(hit.x, hit.y, hitDepth, nearRects);

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

    }

    //console.log(hits3d);

    return hits3d;

};

SPLODER.GamePhysics.checkHitAtGridPoint = function (x, y, hitDepth, items) {

    var hits = [];
    var floorDepth;
    var ceilDepth;

    var wallHit, platformHit, liquidHit, panelHit;

    if (items) {

        SPLODER.ShapeUtils.sortByAreaDesc(items);
        var i = items.length;
        var item;
        var ix, iy, iw, ih;

        while (i--) {

            item = items[i];
            ix = item.x;
            iy = item.y;
            iw = item.width;
            ih = item.height;

            if (item.type == SPLODER.Item.TYPE_PANEL) {

                if (item.gameProps.getProp(SPLODER.GameProps.PROPERTY_SOLID) == 0) {
                    continue;
                }
            
                if (iw != ih) {

                    if (iw > ih) {
                        iy += ih * 0.5;
                        ih = 0.01;
                    } else {
                        ix += iw * 0.5;
                        iw = 0.01;
                    }

                }
                
            }

            //console.log(item.id, item.x > x, item.x + item.width <= x, item.y > y, item.y + item.height <= y);

            if (!(ix > x || ix + iw <= x || iy > y || iy + ih <= y)) {

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

                    case SPLODER.Item.TYPE_PANEL:

                        //console.log("PANEL HIT CHECK", item.id)

                        if (!panelHit && floorDepth < hitDepth && ceilDepth > hitDepth) {
                            hits.push(item);
                        }
                        panelHit = true;
                        break;



                }

            }

        }
    }

    return hits;

};

SPLODER.GamePhysics.checkHitOnBody = function (body, hitPt, roundBounds) {

    if (SPLODER.Geom.pointWithinRect(hitPt.x / 32, hitPt.z / 32, body.rect)) {
        console.log("2D HIT")
        if (roundBounds) {
            if (SPLODER.Geom.distanceBetween(hitPt.x, hitPt.z, body.positionWorld.x, body.positionWorld.z) > 64) {
                return false;
            }
        }
        if (body.rect.id == -1) {
            console.log(hitPt.y, body.boundingBox.y * 16, body.boundingBox.depth * 16)
        }
        return (hitPt.y >= body.boundingBox.y * 16 && hitPt.y <= body.boundingBox.y * 16 + body.boundingBox.depth * 16);
    }

    return false;

};

SPLODER.GamePhysics.getPointInFrontOfBody = function (body, frontDist, heightOffset) {

    frontDist = frontDist || 80;
    heightOffset = heightOffset || 0;

    var item = body.rect;

    var pos = SPLODER.GamePhysics.posBuffer;
    var offset = SPLODER.GamePhysics.ptBuffer;
    var biped_floor = body.positionWorld.y / 16;

    //pos.x = item.x * 32;
    //pos.y = biped_floor * 16;
    //pos.z = item.y * 32;

    pos.copy(body.positionWorld);

    offset.x = 0;
    offset.y = frontDist;

    SPLODER.Geom.rotatePointDeg(offset, item.rotation || 0);

    pos.x += offset.x;
    pos.y += heightOffset;
    pos.z += offset.y;

    return pos;

}


SPLODER.GamePhysics.pointInWallCheck = function (model, pos3d) {

    var elev = pos3d.y / 16;
    var rect = model.getItemsUnderPoint(Math.floor(pos3d.x / 32) + 0.5, Math.floor(pos3d.z / 32) + 0.5, 0, false, false, SPLODER.Item.TYPE_WALL);

    return (rect && (rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) > elev - 1 || rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) < elev + 1));

};

SPLODER.GamePhysics.gravityStateCheck = function (model, pos3d, resolve) {

    var th = 16;
    var local_liquid = model.getItemsUnderPoint(pos3d.x / 32, pos3d.z / 32, 0, model.items, false, SPLODER.Item.TYPE_LIQUID);

    if (local_liquid) {

        var liquidLevel = local_liquid.getAttrib(SPLODER.Item.PROPERTY_LIQUIDLEVEL);

        if (pos3d.y - th * 2 <= liquidLevel * th) {

            if (resolve && pos3d.y - 8 <= liquidLevel * th) {
                pos3d.y += 1;
            }
            return SPLODER.GamePhysics.GRAVITY_SWIM;

        } else if (pos3d.y - th * 3 <= liquidLevel * th) {

            return SPLODER.GamePhysics.GRAVITY_FLOAT;

        } else if (pos3d.y - th * 6 <= liquidLevel * th) {

            return SPLODER.GamePhysics.GRAVITY_WADE;

        }

    }

    return SPLODER.GamePhysics.GRAVITY_STANDARD;

};

SPLODER.GamePhysics.getFloorCeilLevels = function (model, currentElevation, pos3d, padding, bodyDepth) {

    padding = Math.ceil(padding);
    padding -= 0.01;

    bodyDepth = bodyDepth || 0;

    var position = SPLODER.GamePhysics.posBuffer;
    position.x = Math.round(pos3d.x / 32);
    position.y = pos3d.y / 16 + bodyDepth * 0.5;
    position.z = Math.round(pos3d.z / 32);

    var th = 16;
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

                if (currentElevation >= fCheck - th * 2) {

                    hits.push({
                        rect: rect,
                        f: fCheck,
                        c: 128 * th
                    });

                } else if (currentElevation + bodyDepth * 16 * 0.75 <= fCheck - cCheck) { // - th) {
// console.log("!!!", currentElevation + bodyDepth * 16, fCheck - cCheck, bodyDepth)
                    hits.push({
                        rect: rect,
                        f: 0,
                        c: fCheck - cCheck
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
                    if (!rect.getAttrib(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR)) {
                        continue;
                    }

                    cCheck = 10000;
                    var prect = rect.parentNode;

                    while (prect) {

                        if (prect.type != SPLODER.Item.TYPE_LIQUID && prect.getAttrib(SPLODER.Item.PROPERTY_CEIL)) {
                            cCheck = prect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) * th;
                            break;
                        }
                        prect = prect.parentNode;
                    }

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

    var res = SPLODER.GamePhysics.floorCeilBuffer;

    if (!hits.length) {
        res[0] = 0;
        res[1] = 128;
        return res;
    }

    hits.sort(function (a, b) {

        if (a.f > b.f) {
            return -1;
        } else if (a.f < b.f) {
            return 1;
        }

        return 0;

    });

    res[0] = hits[0].f;
    res[2] = hits[0].rect;

    hits.sort(function (a, b) {

        if (a.c > b.c) {
            return 1;
        } else if (a.c < b.c) {
            return -1;
        }

        return 0;

    });

    res[1] = hits[0].c;

    res[3] = hits[0].rect;

    return res;


};

SPLODER.GamePhysics.elevationCheck = function (model, currentElevation, pos3d, padding, floating, resolve) {

    var res = SPLODER.GamePhysics.getFloorCeilLevels(model, currentElevation, pos3d, padding);
    var floorLevel = res[0];
    var ceilLevel = res[1];

    var th = 16;

    if (floorLevel > ceilLevel) {
        console.log("OUCH");
        return -1;
    }

    if (floating) {

        if (currentElevation >= floorLevel + th * 6 && currentElevation < ceilLevel - th * 3) {

            //console.log("FLOATING FREE")
            return currentElevation;

        } else {

            //console.log("inside geometry!", floorLevel, currentElevation, ceilLevel, Math.min(floorLevel + th * 4, Math.max(ceilLevel - th * 3, floorLevel + (ceilLevel - floorLevel) * 0.5)))
            elev = Math.min(floorLevel + th * 10, Math.max(ceilLevel - th * 3, floorLevel + (ceilLevel - floorLevel) * 0.5));
            if (resolve) pos3d.y = elev;

            return elev;

        }

    }

    var elev = Math.max(floorLevel, Math.min(Math.max(floorLevel + th * 10, pos3d.y), ceilLevel - th * 3));

    if (!floating && elev > floorLevel + th * 10) {

        var dist = elev - (floorLevel + th * 10);

        if (resolve) {

            var hitting_ceiling = elev >= ceilLevel - th * 3;

            if (hitting_ceiling) {
                pos3d.y = ceilLevel - th * 3;
            }
/*
            console.log(position.x, position.z,
                position.x + padding, position.z + padding,
                position.x + padding, position.z - padding,
                position.x - padding, position.z + padding,
                position.x - padding, position.z - padding
            );

console.log("YO", elev, floorLevel, position,   hits, padding, wallRects)
            */
            var res = SPLODER.GamePhysics.elevationBuffer;
            res[0] = floorLevel + th * 10;
            res[1] = dist;
            res[2] = hitting_ceiling;
            return res;
        }

    }
    // console.log(elev);

    if (resolve) {
        //console.log(floorLevel + th * 10, elev);
        pos3d.y = elev;
    }

    return elev;


};




SPLODER.GamePhysics._getCollisionRect = function (rect, ipos, x, y) {

    var rx, ry, rw, rh;

    rx = x;
    ry = y;
    rw = 1;
    rh = 1;

    if (x < ipos.x) {
        rx -= 6;
        rw += 6;
    } else if (x > ipos.x) {
        rw += 6;
    }

    if (y < ipos.y) {
        ry -= 6;
        rh += 6;
    } else if (y > ipos.y) {
        rh += 6;
    }

    return {
        type: rect.type,
        id: rect.id,
        x: rx,
        y: ry,
        width: rw,
        height: rh
    };

};

SPLODER.GamePhysics.collisionCheck = function (model, pos3d, prevPos3d, floating, resolve, ignoreRectId, preventPenetration) {

    var pos = pos3d;
    var elev = pos.y / 16;
    var ipos = { x: Math.round(pos.x / 32), y: Math.round(pos.z / 32) };

    var cposA = SPLODER.GamePhysics.cposABuffer;
    cposA.x = pos.x / 32;
    cposA.y = pos.z / 32;

    var cposB = SPLODER.GamePhysics.cposBBuffer;
    cposB.x = cposA.x;
    cposB.y = cposA.y;

    var ppos = SPLODER.GamePhysics.pposBuffer;

    if (prevPos3d) {
        ppos.x = prevPos3d.x / 32;
        ppos.y = prevPos3d.z / 32;
    } else {
        ppos = cposB;
    }

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

            if (x == ipos.x && y == ipos.y) {
                
                continue;

            }

            // walls

            rect = model.getItemsUnderPoint(x + 0.5, y + 0.5, 0, items, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);

            floorDepth = 0;
            ceilDepth = 256;

            if (rect) {
                floorDepth = (rect.type == SPLODER.Item.TYPE_LIQUID && !rect.getAttrib(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR)) ? -1000 : rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                ceilDepth = (rect.type != SPLODER.Item.TYPE_LIQUID && rect.getAttrib(SPLODER.Item.PROPERTY_CEIL)) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 256;
            }

            if (rect && (floorDepth > elev - 3 || ceilDepth < elev + 1 || ceilDepth - floorDepth < 8) && rect != ignoreRect) {

                if (x == ipos.x || y == ipos.y) {
                    nearRects.unshift(SPLODER.GamePhysics._getCollisionRect(rect, ipos, x, y));
                } else {
                    nearRects.push(SPLODER.GamePhysics._getCollisionRect(rect, ipos, x, y));
                }

            }

            // platforms

            rect = model.getItemsUnderPoint(x + 0.5, y + 0.5, 0, items, false, SPLODER.Item.TYPE_PLATFORM);

            if (rect) {

                floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                ceilDepth = floorDepth - rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

            }

            if (rect && (floorDepth > elev - 1 && ceilDepth < elev)) {

                // only add if crush allowed (not movable by player)
                nearRects.push(SPLODER.GamePhysics._getCollisionRect(rect, ipos, x, y));

            }

        }

    }


    var panels = model.getItemsIntersectingRect(ipos.x - 3, ipos.y - 3, 6, 6, SPLODER.Item.TYPE_PANEL);
    var c_rect, rwh, rhh;
    i = panels.length;

    while (i--) {

        rect = panels[i];

        if (!rect.solid) continue;

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

        if (rect && rect.id != ignoreRectId) {

            res = SPLODER.Geom.resolvePenetrationCircleRect(cposA, 1.5, rect, 1);
            if (!resolve && res == 1) return rect;
            if (res == -1) {
                cposA.x = ppos.x;
                cposA.y = ppos.y;
            }

        }

    }

    if (!resolve) return false;

    var newPos = SPLODER.GamePhysics.collisionBuffer;

    newPos.x = NaN;
    newPos.y = pos.y;
    newPos.z = NaN;
    newPos.p = Math.max( Math.abs(cposA.x - cposB.x), Math.abs(cposA.y - cposB.y));

    // crush / penetration

    if (preventPenetration && newPos.p > 1.0) {
        console.log("WALL PENETRATION", newPos.p);
        newPos.x = prevPos3d.x;
        newPos.y = prevPos3d.y;
        newPos.z = prevPos3d.z;
        newPos.p = 0;
        return newPos;
    }

    if (cposA.x != cposB.x) newPos.x = cposA.x * 32;
    if (cposA.y != cposB.y) newPos.z = cposA.y * 32;

    return newPos;

};
