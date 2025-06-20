/**
 * Created by ggaudrea on 8/12/15.
 */

SPLODER.ContactPenetration = function () {

    this.axis = 0;
    this.orientation = 0;
    this.depth = 0;
    this.rectId = 0;

};

SPLODER.SimulationContacts = {
    bufferBody: new SPLODER.SimulationBody(),
    noPenetration: { axis: 0, orientation: 0, depth: 0, rectId: 0 },
    bufferPenetrations: [
        new SPLODER.ContactPenetration(),
        new SPLODER.ContactPenetration(),
        new SPLODER.ContactPenetration(),
        new SPLODER.ContactPenetration()
    ]
};

SPLODER.SimulationContacts.AXIS_X = 0;
SPLODER.SimulationContacts.AXIS_Y = 1;
SPLODER.SimulationContacts.AXIS_Z = 2;
SPLODER.SimulationContacts.AXIS_XZ = 3;




SPLODER.SimulationContacts.bodyIntersectsRect = function (body, rect) {

    return (
        body.boundingBox.x + body.boundingBox.width >= rect.x &&
        body.boundingBox.z + body.boundingBox.height >= rect.y &&
        body.boundingBox.x <= rect.x + rect.width &&
        body.boundingBox.z <= rect.y + rect.height
    );

};

SPLODER.SimulationContacts.bodyWithinRect = function (body, rect) {

    return (
        body.boundingBox.x >= rect.x &&
        body.boundingBox.z >= rect.y &&
        body.boundingBox.x + body.boundingBox.width <= rect.x + rect.width &&
        body.boundingBox.z + body.boundingBox.height <= rect.y + rect.height
    );

};

SPLODER.SimulationContacts.itemIntersectsRect = function (item, rect, padding) {

    padding = padding || 0;

    var x, y, w, h;

    x = item.x;
    y = item.y;
    w = item.width;
    h = item.height;

    if (item.type > SPLODER.Item.TYPE_PLATFORM) {

        x -= 2;
        y -= 2;
        w = 4;
        h = 4;

    }

    return (
        x + w + padding >= rect.x &&
        y + h + padding >= rect.y &&
        x - padding <= rect.x + rect.width &&
        y - padding <= rect.y + rect.height
    );

};


SPLODER.SimulationContacts.itemWithinRect = function (item, rect, padding) {

    padding = padding || 0;

    var x, y, w, h, rx, ry, rw, rh;

    x = item.x;
    y = item.y;
    w = item.width;
    h = item.height;

    if (item.type != SPLODER.Item.TYPE_PLATFORM) {

        x -= 2;
        y -= 2;
        w = 4;
        h = 4;

    }

    rx = rect.x;
    ry = rect.y;
    rw = rect.width;
    rh = rect.height;

    if (rw < w) {
        rx -= (w - rw) * 0.5;
        rw = w;
    }

    if (rh < h) {
        ry -= (h - rh) * 0.5;
        rh = h;
    }

    return (
        x + padding >= rx &&
        y + padding >= ry &&
        x + w - padding <= rect.x + rw &&
        y + h - padding <= rect.y + rh
    );

};

SPLODER.SimulationContacts.getItemsIntersectingRect = function (x, y, width, height, items, ignoreItem, classFilter) {

    var results = [];
    if (!items) return results;
    var i = items.length;
    var item;

    var ix, iy, iw, ih;

    while (i--) {

        item = items[i];
        if (item.type == SPLODER.Item.TYPE_LIGHT) continue;

        if (classFilter !== undefined && !(item instanceof classFilter)) continue;

        ix = item.x;
        iy = item.y;
        iw = item.width;
        ih = item.height;

        if (item.type >= SPLODER.Item.TYPE_ITEM) {
            iw = ih = 4;
            ix -= 2;
            iy -= 2;
        }

        if (!(ix > x + width || ix + iw < x || iy > y + height || iy + ih < y)) {
            if (item != ignoreItem) results.push(item);
        }
    }

    return results;

};


SPLODER.SimulationContacts.getItemsNear = function (body, items, dist, classFilter) {

    dist = dist || 1;

    var x, y, w, h;

    x = body.boundingBox.x;
    y = body.boundingBox.z;
    w = body.boundingBox.width;
    h = body.boundingBox.height;

    return SPLODER.SimulationContacts.getItemsIntersectingRect(x - dist, y - dist, w + dist * 2, h + dist * 2, items, body.rect, classFilter, true);

};


SPLODER.SimulationContacts.getBodiesNear = function (body, bodies, items, itemsNear, dist, classFilter) {

    dist = dist || 1;

    var bodiesNear = [];

    if (!bodies) return bodiesNear;

    var bufferBody = SPLODER.SimulationContacts.bufferBody;

    if (itemsNear == undefined) itemsNear = SPLODER.SimulationContacts.getItemsNear(body, items, dist, classFilter);

    if (!itemsNear) return bodiesNear;

    var i = itemsNear.length;
    var otherItem, otherBody;

    while (i--) {

        otherItem = itemsNear[i];

        if (otherItem.type == SPLODER.Item.TYPE_LIGHT) continue;

        if (otherItem && otherItem.type != SPLODER.Item.TYPE_WALL && otherItem.type != SPLODER.Item.TYPE_LIQUID) {

            otherBody = bodies[otherItem.id];

            if (!otherBody) {
                otherBody = bufferBody.initWithRect(otherItem);
            }

            if (body && otherBody && SPLODER.SimulationContacts.bodyNearBody(body, otherBody, dist)) {

                bodiesNear.push(otherBody);

            }

        }


    }

    return bodiesNear;

};


SPLODER.SimulationContacts.bodyNearBody = function (bodyA, bodyB, dist) {

    dist = dist || 0;

    var res = (
        bodyA.boundingBox.x + bodyA.boundingBox.width + dist >= bodyB.boundingBox.x &&
        bodyA.boundingBox.y + bodyA.boundingBox.depth + dist >= bodyB.boundingBox.y &&
        bodyA.boundingBox.z + bodyA.boundingBox.height + dist >= bodyB.boundingBox.z &&
        bodyA.boundingBox.x <= bodyB.boundingBox.x + bodyB.boundingBox.width + dist &&
        bodyA.boundingBox.y <= bodyB.boundingBox.y + bodyB.boundingBox.depth + dist &&
        bodyA.boundingBox.z <= bodyB.boundingBox.z + bodyB.boundingBox.height + dist
    );

    if (res) {
       // console.log(dist, true, bodyA.boundingBox.x, bodyA.boundingBox.z, bodyB.boundingBox.x, bodyB.boundingBox.z);
    }

    return res;

};


SPLODER.SimulationContacts.bodyWallPenetration = function (bodyA, wall) {

    if (!bodyA || !wall) return SPLODER.SimulationContacts.noPenetration;

    var bodyB = SPLODER.SimulationContacts.bufferBody;

    var floorPen = SPLODER.SimulationContacts.bodyBodyPenetration(bodyA, bodyB.initWithRect(wall));
    var ceilPen = SPLODER.SimulationContacts.bodyBodyPenetration(bodyA, bodyB.initWithRect(wall, true));

    if (ceilPen.depth > floorPen.depth) return ceilPen;
    return floorPen;

};


SPLODER.SimulationContacts.bodyBodyPenetration = function (bodyA, bodyB) {

    if (!bodyA || !bodyB) return SPLODER.SimulationContacts.noPenetration;

    if (bodyA.id != -1) {
        bodyA.update();
    }

    if (bodyB.id != -1) {
        bodyB.update();
    }

    /*
    if (SPLODER.Geom.distanceBetween(hitPt.x, hitPt.z, body.positionWorld.x, body.positionWorld.z) > 64) {
        return false;
    }
    */

    var pens;
    var dist;
    var useXZ = false;
    var res = SPLODER.SimulationContacts.bufferPenetrations[0];

    if (bodyA.type >= SPLODER.Item.TYPE_ITEM && bodyB.type >= SPLODER.Item.TYPE_ITEM) {

        var dist = 128 - SPLODER.Geom.distanceBetween(bodyA.positionWorld.x, bodyA.positionWorld.z, bodyB.positionWorld.x, bodyB.positionWorld.z);
        dist *= 0.03125;

        pens = [
            dist,
            (bodyA.boundingBox.y + bodyA.boundingBox.depth) - bodyB.boundingBox.y,
            dist,
            dist,
            (bodyB.boundingBox.y + bodyB.boundingBox.depth) - bodyA.boundingBox.y,
            dist
        ]

        useXZ = true;

    } else {

        pens = [
            (bodyA.boundingBox.x + bodyA.boundingBox.width) - bodyB.boundingBox.x,
            (bodyA.boundingBox.y + bodyA.boundingBox.depth) - bodyB.boundingBox.y,
            (bodyA.boundingBox.z + bodyA.boundingBox.height) - bodyB.boundingBox.z,
            (bodyB.boundingBox.x + bodyB.boundingBox.width) - bodyA.boundingBox.x,
            (bodyB.boundingBox.y + bodyB.boundingBox.depth) - bodyA.boundingBox.y,
            (bodyB.boundingBox.z + bodyB.boundingBox.height) - bodyA.boundingBox.z
        ];

    }

    res.depth = Math.min.apply(Math, pens);
    res.axis = pens.indexOf(res.depth);
    res.orientation = (res.axis >= 3) ? 1 : -1;
    res.axis %= 3;

    if (useXZ && res.depth != dist) useXZ = false;

    if (useXZ && res.axis != SPLODER.SimulationContacts.AXIS_Y) {
        res.orientation = 0;
        res.axis = SPLODER.SimulationContacts.AXIS_XZ;
    }

    return res;

};


SPLODER.SimulationContacts.bodyInWallNSWECheck = function (body, model) {

    var rect;
    var pen = null;
    var deepPen;
    var bb = body.boundingBox;

    var bottomElev = Math.ceil(body.boundingBox.y + 0.5) + 1.0;
    var topAllowance = body.rect.type == SPLODER.Item.TYPE_BIPED ? 4 : 0;
    var topElev = bottomElev + Math.floor(body.boundingBox.depth - topAllowance);

    var floorWall = model.getItemsUnderPoint(bb.x + bb.width * 0.5, bb.z + bb.height * 0.5, 0, null, false, SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID);
    var nearWalls = model.getItemsIntersectingRect(bb.x - 8, bb.z - 8, bb.width + 16, bb.height + 16, null, null, SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID);

    SPLODER.ShapeUtils.sortByAreaDesc(nearWalls);

    var pens = [];

    var elevCheck = function (rect) {

        if (rect && rect.type == SPLODER.Item.TYPE_PLATFORM) {

            var platTop = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
            var platBottom = platTop - rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

            return platTop > bottomElev && platBottom < topElev;


        } else {

            return rect && rect != floorWall && (rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) > bottomElev || (rect.type != SPLODER.Item.TYPE_LIQUID && rect.getAttrib(SPLODER.Item.PROPERTY_CEIL) == 1 && rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) < topElev));

        }

    };

    // NORTH

    pen = SPLODER.SimulationContacts.bufferPenetrations[0];
    deepPen = false;

    rect = model.getItemsUnderPoint(bb.x + bb.width * 0.5, bb.z + 1.01, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID);

    if (elevCheck(rect)) {

        pen.axis = SPLODER.SimulationContacts.AXIS_Z;
        pen.orientation = 1;
        pen.depth = 2.0 - SPLODER.modulo(bb.z, 1);
        pen.rectId = rect.id;

        if (pen.depth > 0) {
            pens.push(pen);
            deepPen = true;
        }

    }

    if (!deepPen) {

        rect = model.getItemsUnderPoint(bb.x + bb.width * 0.5, bb.z + 0.01, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID);

        if (elevCheck(rect)) {
            pen.axis = SPLODER.SimulationContacts.AXIS_Z;
            pen.orientation = 1;
            pen.depth = 1.0 - SPLODER.modulo(bb.z, 1);
            pen.rectId = rect.id;

            if (pen.depth > 0) pens.push(pen);

        }

    }

    // SOUTH

    pen = SPLODER.SimulationContacts.bufferPenetrations[1];
    deepPen = false;

    rect = model.getItemsUnderPoint(bb.x + bb.width * 0.5, bb.z + bb.height - 1.01, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID);

    if (elevCheck(rect)) {

        pen.axis = SPLODER.SimulationContacts.AXIS_Z;
        pen.orientation = -1;
        pen.depth = SPLODER.modulo(bb.z, 1) + 1.0;
        pen.rectId = rect.id;

        if (pen.depth > 0) {
            pens.push(pen);
            deepPen = true;
        }

    }

    if (!deepPen) {

        rect = model.getItemsUnderPoint(bb.x + bb.width * 0.5, bb.z + bb.height - 0.01, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID);

        if (elevCheck(rect)) {

            pen.axis = SPLODER.SimulationContacts.AXIS_Z;
            pen.orientation = -1;
            pen.depth = SPLODER.modulo(bb.z, 1);
            pen.rectId = rect.id;

            if (pen.depth > 0) pens.push(pen);

        }

    }
/*
    if (body.rect.id == 592) {
        console.log(pen.depth)
    }
*/
    // WEST

    pen = SPLODER.SimulationContacts.bufferPenetrations[2];
    deepPen = false;

    rect = model.getItemsUnderPoint(bb.x + 1.01, bb.z + bb.height * 0.5, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);

    if (elevCheck(rect)) {

        pen.axis = SPLODER.SimulationContacts.AXIS_X;
        pen.orientation = 1;
        pen.depth = 2.0 - SPLODER.modulo(bb.x, 1);
        pen.rectId = rect.id;

        if (pen.depth > 0) {
            pens.push(pen);
            deepPen = true;
        }

    }

    if (!deepPen) {

        rect = model.getItemsUnderPoint(bb.x + 0.01, bb.z + bb.height * 0.5, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);

        if (elevCheck(rect)) {

            pen.axis = SPLODER.SimulationContacts.AXIS_X;
            pen.orientation = 1;
            pen.depth = 1.0 - SPLODER.modulo(bb.x, 1);
            pen.rectId = rect.id;

            if (pen.depth > 0) pens.push(pen);

        }

    }

    // EAST

    pen = SPLODER.SimulationContacts.bufferPenetrations[3];
    deepPen = false;

    rect = model.getItemsUnderPoint(bb.x + bb.width - 1.01, bb.z + bb.height * 0.5, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);

    if (elevCheck(rect)) {

        pen.axis = SPLODER.SimulationContacts.AXIS_X;
        pen.orientation = -1;
        pen.depth = SPLODER.modulo(bb.x, 1) + 1.0;
        pen.rectId = rect.id;

        if (pen.depth > 0) {
            pens.push(pen);
            deepPen = true;
        }

    }

    if (!deepPen) {

        rect = model.getItemsUnderPoint(bb.x + bb.width - 0.01, bb.z + bb.height * 0.5, 0, nearWalls, false, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);

        if (elevCheck(rect)) {

            pen.axis = SPLODER.SimulationContacts.AXIS_X;
            pen.orientation = -1;
            pen.depth = SPLODER.modulo(bb.x, 1);
            pen.rectId = rect.id;

            if (pen.depth > 0) pens.push(pen);

        }

    }

    return pens;

};
