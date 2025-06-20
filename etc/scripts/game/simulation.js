/**
 * Created by ggaudrea on 8/10/15.
 */


SPLODER.ItemContact = function (itemA, itemB, contactType) {
    this.itemA = itemA;
    this.itemB = itemB;
    this.contactType = contactType;
}

SPLODER.SimulationForce = function (body, vector) {
    this.body = body;
    this.vector = vector;
}


SPLODER.Simulation = function () {

    this.model = null;
    this.player = null;
    this.triggered = null;
    this.dispatcher = null;

    var _triggerable_items = [];
    var _currentContacts = {};
    var _nextContacts = {};
    var _near_contents = [];
    var _inrange_contents = [];
    var _sectors = [];
    var _sector_contents = [];
    var _moving_items = [];
    var _nonmoving_items = [];
    var _moving_walls = [];
    var _stateless_walls = [];
    var _forces = [];
    var _bodies = null;
    var _dying_items = null;
    var _bipeds = null;
    var _playerArray = null;
    var _playerBody = null;
    var _steps = 0;

    var _offsetVector = new THREE.Vector3(0, 0, 0);
    var _jumpVector = new THREE.Vector3(0, 0, 0);

    var _lastTeleportTime = 0;

    var _frame = 0;

    Object.defineProperty(this, "frame", {
        get: function () {
            return _frame;
        }
    })

    var _bodyProxy = new THREE.Vector3(0, 0, 0);
    var _ptProxy = new THREE.Vector2(0, 0);

    var scope = this;

    this.initWithModel = function (model, player) {

        this.model = model;
        this.player = player;

        _playerArray = [player];
        _playerBody = player;

        this.model.changed.add(onModelChanged, this);
        this.triggered = new signals.Signal();

        this.dispatcher = new signals.Signal();
        this.model.registerWithDispatcher(this.dispatcher);

        return this;

    };

    this.registerWithDispatcher = function (dispatcher) {

        if (dispatcher) {
            dispatcher.add(onAction, this);
        }

    };

    this.getBody = function (rect) {

        if (_bodies && rect) {
            return _bodies[rect.id];
        }

    };

    var reset = function (noUpdate) {

        var i, rect, body;

        _currentContacts = {};
        _nextContacts = {};
        _near_contents = [];
        _forces = [];

        _frame = 0;

        _sectors =  scope.model.getItemsByType(SPLODER.Item.TYPE_FILTER_WALL_LIQUID);
        _sectors = _sectors.concat(scope.model.getItemsByType(SPLODER.Item.TYPE_PLATFORM));
        _sector_contents = [];
        _inrange_contents = [];

        updateSectorContents();

        _bodies = [];
        _dying_items = [];

        _triggerable_items = scope.model.getMovableItems(true) || [];
        _stateless_walls = scope.model.getStatelessWallsWithTriggers();
        _triggerable_items = _triggerable_items.concat(_stateless_walls);
        _moving_items = scope.model.getMovableItems() || [];
        _moving_walls = scope.model.getMovableWalls() || [];

        _nonmoving_items = _triggerable_items.filter(function(elem) {
            return _moving_items.indexOf(elem) < 0;
        });

        _bipeds = scope.model.getItemsByType(SPLODER.Item.TYPE_BIPED);
        _bipeds = _bipeds.filter(function (biped) {
            return !biped.dying;
        });

        _dying_items = scope.model.getDyingItems();

        i = _bipeds.length;

        while (i--) {

            //if (_bipeds[i]) _bipeds[i].target = scope.player.rect;

        }

        i = _triggerable_items.length;

        while (i--) {

            rect = _triggerable_items[i];
            body = new SPLODER.SimulationBody().initWithRect(rect);
            if (rect.id == 496) {
                //console.log("REMOV ADDING BACK!")
            }
            _bodies[rect.id] = body;

        }

    };

    var addItem = function (rect) {

        if (rect && !_bodies[rect.id]) {

            _triggerable_items.push(rect);
            _moving_items.push(rect);

            if (rect.type == SPLODER.Item.TYPE_BIPED) {
                _bipeds.push(rect);
            }

            body = new SPLODER.SimulationBody().initWithRect(rect);
            _bodies[rect.id] = body;

        }

    };

    var removeFromArray = function (item, arr) {

        if (item && arr) {
            var i = arr.length;
            while (i--) {
                if (arr[i].id == item.id) {
                    arr.splice(i, 1);
                    return;
                }
            }
        }

    };

    var removeItem = function (rect) {

        if (rect) {

            removeFromArray(rect, _triggerable_items);
            removeFromArray(rect, _moving_items);
            removeFromArray(rect, _bipeds);
            _bodies[rect.id] = undefined;

        }

    };


    var updateModelStates = function () {

        var i = _moving_items.length;

        var item, oldX, oldY, x, y, oldF, oldC, f, c, f2, c2, mounted_items, mitem, j, deltaDepth, gravity;
        var changed_items = [];

        var playerPos = scope.player.positionWorld;
        var playerMovedXY = false;

        while (i--) {

            item = _moving_items[i];
            oldX = item.x;
            oldY = item.y;
            oldF = item.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
            oldC = item.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

            // update item position - if changed returns true

            if (scope.model.updateItem(item, _frame)) {

                changed_items.push(item);

                x = item.x;
                y = item.y;
                f = item.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                c = item.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);
                mounted_items = [];

                if (item.type == SPLODER.Item.TYPE_PLATFORM) {

                    // stop platform movement on crush

                    mounted_items = scope.model.getItemsIntersectingRect(item.x - 2, item.y - 2, item.width + 4, item.height + 4, null, null, item, SPLODER.MovableItem);



                    if (!item.getAttrib(SPLODER.GameProps.PROPERTY_CRUSH)) {

                        if (SPLODER.Geom.rectIntersectsRect(scope.player.rect, item)) {
                            // console.log("PLAYER INTERSECTS PLATFORM")
                            mounted_items.push(scope.player.rect);
                        }

                        j = mounted_items.length;

                        while (j--) {

                            mitem = mounted_items[j];

                            if (mitem.type == SPLODER.Item.TYPE_PARTICLE) continue;

                            var body2 = mitem.id == -1 ? _playerBody : _bodies[mitem.id];

                            if (body2) {

                                if (mitem.type == SPLODER.Item.TYPE_PLAYER || mitem.type >= SPLODER.Item.TYPE_ITEM) {

                                    f2 = body2.boundingBox.y;
                                    c2 = f2 + body2.boundingBox.depth + 2;

                                    // if player

                                    if (mitem.id == -1) {

                                        // if near same level as platform

                                        if (f2 < f + 2 && c2 > (f - c) - 2) {
                                                scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, item, oldX - x, oldY - y, f - oldF);
                                                x = oldX;
                                                y = oldY;
                                                f = oldF;
                                                c = oldC;
                                        }

                                    // if not player and beside or on platform

                                    } else if (f2 < f && c2 > (f - c) && Math.abs(f - f2) > 0.5 && Math.abs(c2 - (f - c)) > 0.5) {

                                        //console.log("OFFSET", oldX - x, oldY - y, oldF - f, oldC - c)

                                        scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, item, oldX - x, oldY - y, f - oldF);
                                        x = oldX;
                                        y = oldY;
                                        f = oldF;
                                        c = oldC;

                                    }

                                }

                            }

                        }

                    }



                    // move items on platforms

                    //f = item.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);

                    mounted_items = scope.model.getItemsIntersectingRect(item.x, item.y, item.width, item.height, null, mounted_items, item, SPLODER.MovableItem);

                    j = mounted_items.length;

                    while (j--) {

                        mitem = mounted_items[j];

                        if (mitem.type == SPLODER.Item.TYPE_PARTICLE) continue;

                        if (mitem.type >= SPLODER.Item.TYPE_ITEM) {

                            f2 = mitem.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);

                            if (Math.abs(f - f2) <= 2) {

                                var offsetFactor = 1;
                                if (oldF > f) offsetFactor = 1;

                                mitem.offset(x - oldX, y - oldY, (f - oldF) * offsetFactor);
                                //scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, mitem, x - oldX, y - oldY, (f - oldF) * offsetFactor);
                                changed_items.push(mitem);

                            }

                        }

                    }

                    // move player if on this platform
                    // TODO: figure out if this does something

                    if (!playerMovedXY && SPLODER.Geom.pointWithinRect(playerPos.x, playerPos.z, item, 32)) {

                        deltaDepth = playerPos.y / 16 - f;

                        if (deltaDepth <= 12 && deltaDepth >= -2) {

                            _offsetVector.x = (item.x - oldX) * 32;
                            _offsetVector.y = (f - oldF) * 16;
                            _offsetVector.z = (item.y - oldY) * 32;

                            scope.player.offsetBy(_offsetVector, true);
                            playerMovedXY = true;
                            // console.log("player moved", (item.y - oldY) * 32);

                        }

                    }

                }

            }

        }

        i = _moving_walls.length;

        while (i--) {

            item = _moving_walls[i];

            oldF = item.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
            oldC = item.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

            if (scope.model.updateItem(item, _frame)) {

                f = item.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                c = item.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

                changed_items.push(item);

                mounted_items = scope.model.getItemsIntersectingRect(item.x, item.y, item.width, item.height);

                if (SPLODER.Geom.rectIntersectsRect(scope.player.rect, item)) {
                    mounted_items.push(scope.player.rect);
                }

                j = mounted_items.length;

                f = item.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);

                while (j--) {

                    mitem = mounted_items[j];

                    if (mitem.type == SPLODER.Item.TYPE_PARTICLE) continue;

                    if (mitem.type >= SPLODER.Item.TYPE_ITEM || mitem.type == SPLODER.Item.TYPE_PLAYER) {

                        if (!(item.type == SPLODER.Item.TYPE_LIQUID) && !item.getAttrib(SPLODER.GameProps.PROPERTY_CRUSH) && (oldF < f || oldC > c)) {

                            // POTENTIAL SMOOSH

                            var body2 = mitem.id == -1 ? _playerBody : _bodies[mitem.id];

                            if (body2) {

                                if (c-f < body2.boundingBox.depth) {

                                    scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, item, 0, 0, oldF - f, oldC - c);
                                    f = oldF;
                                    c = oldC;
                                }

                            }

                        }

                        f2 = mitem.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);

                        if (Math.abs(f - f2) <= 1) {

                            mitem.offset(0, 0, f - oldF);
                            changed_items.push(mitem);

                        }

                    }

                }

                if (SPLODER.Geom.pointWithinRect(playerPos.x, playerPos.z, item, 32)) {

                    deltaDepth = playerPos.y / 16 - f;

                    if (deltaDepth <= 15 && deltaDepth >= -2) {

                        _offsetVector.x = 0;
                        _offsetVector.y = (f - oldF) * 16;
                        _offsetVector.z = 0;

                        scope.player.offsetBy(_offsetVector, true);

                    }

                }


            }

        }

        i = _nonmoving_items.length;

        while (i--) {

            item = _nonmoving_items[i];
            scope.model.updateItem(item, _frame);

        }


        if (changed_items.length) {
            scope.model.changed.dispatch(SPLODER.ACTION_CHANGE, changed_items);
        }

    };

    var addContact = function (itemA, itemB, contactType) {

        _nextContacts[itemA.id + '_' + itemB.id + '_' + contactType] = new SPLODER.ItemContact(itemA, itemB, contactType);

    }

    var updateSectorContents = function () {

        var i, j, f, f2, idx, rect, sector, slen, new_contents, old_child, new_child;

        i = _sectors.length;

        var body;

        while (i--) {

            rect = _sectors[i];

            if (rect) {
                f = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);

                sector = _sector_contents[rect.id] || [];
                new_contents = scope.model.getItemsWithinRect(rect.x - 1, rect.y - 1, rect.width + 2, rect.height + 2, null, null, rect, SPLODER.MovableItem);

                if (SPLODER.SimulationContacts.itemIntersectsRect(scope.player.rect, rect)) {
                    new_contents.push(scope.player.rect);
                }

                if (new_contents instanceof Array) {

                    slen = j = sector.length;

                    while (j--) {

                        old_child = sector[j];
                        idx = new_contents.indexOf(old_child);

                        if (idx == -1) {

                            if (!SPLODER.SimulationContacts.itemIntersectsRect(old_child, rect, 1)) {
                                sector.splice(j, 1);
                                dispatchEvent(SPLODER.FlowNode.TRIGGER_EXIT, rect, old_child);
                                // console.log(old_child.id, "EXITING", rect.id);
                            }

                        } else {

                            if (_frame % 15 == 0) {

                                body = old_child.id == -1 ? scope.player : _bodies[old_child.id];

                                if (body) {

                                    if (Math.abs(body.boundingBox.y - rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH)) < 2) {

                                        dispatchEvent(SPLODER.FlowNode.TRIGGER_STEPPED_ON, rect, old_child);

                                    }

                                }

                            }

                        }

                    }

                    j = new_contents.length;

                    while (j--) {

                        new_child = new_contents[j];
                        idx = sector.indexOf(new_child);

                        if (idx == -1 && SPLODER.SimulationContacts.itemWithinRect(new_child, rect, 1)) {

                            if (rect.type == SPLODER.Item.TYPE_PLATFORM) {

                                if (new_child.type == SPLODER.Item.TYPE_PLAYER) {
                                    f2 = scope.player.boundingBox.y;
                                } else {
                                    f2 = new_child.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                                }
                                if (f2 < f - 1 || f2 > f + 4) continue;

                            }

                            sector.push(new_child);

                            dispatchEvent(SPLODER.FlowNode.TRIGGER_ENTER, rect, new_child);
                            //console.log(new_child.id, "ENTERING", rect.id)

                        }

                    }

                    _sector_contents[rect.id] = sector;

                    if (slen > 0 && sector.length == 0) {
                        dispatchEvent(SPLODER.FlowNode.TRIGGER_EMPTY, rect);
                        // console.log(rect.id, "EMPTY")
                    }

                }

            }

        }

    };

    var wasNear = function (body, otherBody) {

        var prev_near_bodies = _near_contents[body.id];

        if (prev_near_bodies) {

            return (prev_near_bodies.indexOf(otherBody) != -1);

        }

        return false;

    };

    var wasInRange = function (body, otherBody) {

        var prev_inrange_bodies = _inrange_contents[body.id];

        if (prev_inrange_bodies) {

            return (prev_inrange_bodies.indexOf(otherBody) != -1);

        }

        return false;

    };


    var updateNearContents = function (body, nearBodies) {

        var prev_near_bodies = _near_contents[body.id];

        if (prev_near_bodies) {

            var far_bodies = prev_near_bodies.filter(function (elem) {
                if (nearBodies.indexOf(elem) == -1) return true;
            });

            if (far_bodies && far_bodies.length) {
                dispatchEvents(SPLODER.FlowNode.TRIGGER_NEAR_OUT, body, far_bodies);
            }

        }

        _near_contents[body.id] = nearBodies;

        if (nearBodies && nearBodies.length) {
            //if (body.id == 296) console.log("NEAR")
            dispatchEvents(SPLODER.FlowNode.TRIGGER_NEAR, body, nearBodies);
        }

    };

    var updateInRangeContents = function (body, inrangeBodies) {

        var prev_inrange_bodies = _inrange_contents[body.id];

        if (prev_inrange_bodies) {

            var out_of_range_bodies = prev_inrange_bodies.filter(function (elem) {
                if (inrangeBodies.indexOf(elem) == -1) return true;
            });

            if (out_of_range_bodies && out_of_range_bodies.length) {
                dispatchEvents(SPLODER.FlowNode.TRIGGER_RANGE_OUT, body, out_of_range_bodies);
            }

        }

        _inrange_contents[body.id] = inrangeBodies;

    };


    var updatePlayer = function (delta) {

        //if (_frame < 5) console.log("updatePlayer", _frame);
        var bodiesTouchingPlayer, wallsTouchingPlayer, statelessWallsTouchingPlayer;
        var pr = scope.player.rect;
        var pp = scope.player.boundingBox;

        // check for contacts between player and bodies

        bodiesTouchingPlayer = SPLODER.SimulationContacts.getBodiesNear(scope.player, _bodies, scope.model.items, null, 0.1);
        bodiesTouchingPlayer = bodiesTouchingPlayer.filter(function (body) {
            if (body.rect && body.rect.dying) {
                //console.log("DYING!!!")
            }
            return (!body.rect || !body.rect.dying);
        });

        dispatchEvents(SPLODER.FlowNode.TRIGGER_COLLISION, scope.player, bodiesTouchingPlayer, true);

        // check for contacts between player and moving walls

        wallsTouchingPlayer = SPLODER.SimulationContacts.getItemsIntersectingRect(pr.x - 2, pr.y - 2, 4, 4, _moving_walls, null, SPLODER.WallItem);
        wallsTouchingPlayer = SPLODER.Item.filterByType(wallsTouchingPlayer, null, SPLODER.Item.TYPE_LIQUID);
        dispatchEvents(SPLODER.FlowNode.TRIGGER_COLLISION, scope.player, wallsTouchingPlayer, true);

        handlePlayerPhysics(wallsTouchingPlayer);

        statelessWallsTouchingPlayer = SPLODER.SimulationContacts.getItemsIntersectingRect(pr.x - 2, pr.y - 2, 4, 4, _stateless_walls, null, SPLODER.WallItem);
        statelessWallsTouchingPlayer = SPLODER.Item.filterByType(statelessWallsTouchingPlayer, null, SPLODER.Item.TYPE_LIQUID);
        dispatchEvents(SPLODER.FlowNode.TRIGGER_COLLISION, scope.player, statelessWallsTouchingPlayer, true);

        var playerParentRect = scope.model.getItemUnderPoint(pp.x, pp.z, 0, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);
        scope.player.update(delta, _frame, playerParentRect);

        handlePlayerPhysics(wallsTouchingPlayer);

    };


    var handlePlayerPhysics = function (wallsTouchingPlayer) {

        var player = scope.player;

        if ((player.jumping && player.fallVelocity.y > 0) || player.falling) {

            player.camera.offsetBy(player.fallVelocity);
            player.fallVelocity.y -= 3;
            player.fallVelocity.y = Math.max(player.fallVelocity.y, -120);

        }

        var newPos = player.camera.destination;

        player.gravityState = SPLODER.GamePhysics.gravityStateCheck(scope.model, newPos, true);
        player.floating = player.gravityState > SPLODER.GamePhysics.GRAVITY_WADE;

        var elev = SPLODER.GamePhysics.elevationCheck(scope.model, newPos.y, newPos, 1, player.floating, true);

        var liquid = scope.model.getItemsUnderPoint(player.rect.x, player.rect.y, 0, null, false, SPLODER.Item.TYPE_LIQUID);

        if (liquid) {
            var pf = player.positionWorld.y / 16 - 10;
            if (pf <= liquid.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH)) {
                dispatchEvent(SPLODER.FlowNode.TRIGGER_COLLISION, liquid, player);
            }
        }

        if (!player.floating && elev instanceof Array) {

            if (elev[1] > 4) {
                player.falling = true;
            }

        } else {

            if (player.falling) {
                if (_frame > 30 && player.fallVelocity.y < -60) {
                    //console.log("FALL CRUSH")
                    dispatchEvent(SPLODER.FlowNode.TRIGGER_CRUSH, SPLODER.FlowNode.TAG_PLAYER, 0 - player.fallVelocity.y);
                }
            }
            player.falling = false;

        }

        checkPenetration(scope.player, null, wallsTouchingPlayer, true);

        newPos = SPLODER.GamePhysics.collisionCheck(scope.model, newPos, player.prevPosWorld, player.floating, true, null, true);

        player.camera.goto(newPos);

    };


    var handleBodyPhysics = function () {

        var i, body;

        i = _bodies.length;

        while (i--) {

            body = _bodies[i];

            if (!body || !body.rect) continue;

            if (body.rect.dying) continue;

            if (body.rect.type == SPLODER.Item.TYPE_BIPED || (body.rect.type == SPLODER.Item.TYPE_ITEM && body.rect.getAttrib(SPLODER.GameProps.PROPERTY_GRAVITY))) {

                var pos = _bodyProxy;
                var fallY = 0;
                var bodyDepth = body.boundingBox.depth;

                pos.x = body.rect.x * 32;
                pos.y = body.rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * 16 + (bodyDepth * 0.5) * 16;
                pos.z = body.rect.y * 32;

                body.gravityState = SPLODER.GamePhysics.gravityStateCheck(scope.model, pos, true);

                body.floating = body.gravityState > SPLODER.GamePhysics.GRAVITY_WADE;

                pos.y -= (bodyDepth * 0.5) * 16;


                var fc = SPLODER.GamePhysics.getFloorCeilLevels(scope.model, pos.y, pos, 1, bodyDepth);

                if (body.falling || body.floating) {

                    fallY = (body.jumping || !body.floating) ? body.fallVelocity.y / 16 : 0;
                    if (body.gravityState == SPLODER.GamePhysics.GRAVITY_SWIM) fallY = 1;

                    if (body.id == 348) {
                       // console.log("body depth", bodyDepth)
                       //console.log("falling", body.falling, body.fallVelocity.y, fallY)
                    }

                    scope.dispatcher.dispatch(SPLODER.ACTION_MOVE, body.rect, body.fallVelocity.x / 32, body.fallVelocity.z / 32, fallY);
                    body.falling = true;
                    //body.fallVelocity.x = body.fallVelocity.z = 0;
                    if (!body.floating) {
                        body.fallVelocity.y -= 3;
                        body.fallVelocity.y = Math.max(body.fallVelocity.y, -120);
                    } else {
                        body.fallVelocity.y = Math.max(body.fallVelocity.y, 0);
                    }

                }

                if (!body.floating) {

                    if (fc) {

                        if (fc[0] < pos.y) {

                            body.falling = true;
                            if (!body.floating) body.rect.setFloorDepth(Math.max(fc[0] / 16, pos.y + body.fallVelocity.y) / 16);

                        } else if (fc[0] >= pos.y && fc[0] <= pos.y + bodyDepth) {

                            if (!body.jumping) {
                                body.rect.setFloorDepth(fc[0] / 16);
                                body.falling = false;
                                body.fallVelocity.x = body.fallVelocity.y = body.fallVelocity.z = 0;
                            }

                        }

                    }

                    if (body.jumping && body.fallVelocity.y > 0) {
                        //console.log(body.boundingBox.y + body.boundingBox.depth, fc[1] / 16)
                        var top = body.boundingBox.y + body.boundingBox.depth;
                        if (top > fc[1] / 16) {
                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, 0, 0, fc[1] / 16 - top);
                        }
                    }

                    if (_frame > 5 && fc[1] - fc[0] - 1 < body.boundingBox.depth * 16) {
                        //console.log("SMOOSH", fc[2].id, _moving_walls.indexOf(fc[2]));//fc[1] - fc[0], body.boundingBox.depth * 16)
                        var pen = body.boundingBox.depth * 16 - (fc[1] - fc[0]);
                        body.rect.crushedAmount = pen;
                        //console.log("WALL CRUSH!");
                        dispatchEvent(SPLODER.FlowNode.TRIGGER_CRUSH, body, fc[2], pen, SPLODER.SimulationContacts.AXIS_Y, 0);
                        dispatchEvent(SPLODER.FlowNode.TRIGGER_CRUSH, fc[2], body, pen, SPLODER.SimulationContacts.AXIS_Y, 1);
                    }


                }

                if (fc && fc[0] > 0 && pos.y > 0) {
                    body.rect.setFloorDepth(Math.max(fc[0] / 16, pos.y / 16 + fallY));
                }

                body.update();

            }

        }

    };


    var checkPenetration = function (body, bodies, walls, resolve) {

        if (!body) return;

        var i, penetration, penA, penB, otherBody, wall, pd, pa, po;

        if (body.type == SPLODER.Item.TYPE_PARTICLE) return;

        if (body.solid && bodies) {

            i = bodies.length;

            while (i--) {

                otherBody = bodies[i];
                if (!otherBody.solid) continue;

                penetration = SPLODER.SimulationContacts.bodyBodyPenetration(body, otherBody);
                pd = penetration.depth;
                pa = penetration.axis;
                po = penetration.orientation;

                if (otherBody.type == SPLODER.Item.TYPE_PARTICLE) {
                    continue;
                }

                if (otherBody.type == SPLODER.Item.TYPE_PANEL && !otherBody.solid) {
                    continue;
                }

                if (_frame > 5 && pd > 1 && body.canCrush) {
                    // console.log("PEN CRUSH!");
                    //console.log("body body penetration", penetration, body.id, otherBody.id);
                    dispatchEvent(SPLODER.FlowNode.TRIGGER_CRUSH, body, otherBody, pd, pa, po);
                } else if (penetration.depth > 1) {
                    // console.log("NO CRUSH!", body.rect.id, body.canCrush, body.rect.getAttrib(SPLODER.GameProps.PROPERTY_CRUSH));
                }

                if (resolve && penetration.depth > 0) {

                    penA = body.movable ? 1.0 : 0;
                    penB = otherBody.movable ? 1.0 : 0;

                    if (penA && penB) penA = penB = 0.5;

                    if (body == scope.player && penA == 0.5) {
                        penA = 0.3;
                        penB = 0.7;
                    }

                    if (otherBody == scope.player && penB == 0.5) {
                        penA = 0.6;
                        penB = 0.3;
                    }

                    if (penA > 0 && body.type == SPLODER.Item.TYPE_PLATFORM && (!body.pushable || body.canCrush)) {
                        penA = 0;
                    }

                    if (penetration.depth > 1 && !body.canCrush && body.rect.moving) {
                        penA = 1.0;
                    }

                    if (penB > 0 && otherBody.type == SPLODER.Item.TYPE_PLATFORM && (!otherBody.pushable || otherBody.canCrush)) {
                        penB = 0;
                    }

                    if (penetration.depth > 1 && !otherBody.canCrush && otherBody.rect.moving) {
                        penB = 1.0;
                    }

                    if (penetration.axis == SPLODER.SimulationContacts.AXIS_Y) {

                        if (body.type == SPLODER.Item.TYPE_BIPED) penA = 0;
                        if (otherBody.type == SPLODER.Item.TYPE_BIPED) penB = 0;

                    }

                    switch (pa) {

                        case SPLODER.SimulationContacts.AXIS_X:

                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, pd * penA * po, 0);
                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, otherBody.rect, pd * penB * po * -1, 0);
                            break;


                        case SPLODER.SimulationContacts.AXIS_Y:

                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, 0, 0, pd * penA * po);
                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, otherBody.rect, 0, 0, pd * penB * po * -1);
                            break;


                        case SPLODER.SimulationContacts.AXIS_Z:

                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, 0, pd * penA * po);
                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, otherBody.rect, 0, pd * penB * po * -1);
                            break;

                        case SPLODER.SimulationContacts.AXIS_XZ:

                            var ang = Math.PI * 1.5 - SPLODER.Geom.angleBetween(body.positionWorld.x, body.positionWorld.z, otherBody.positionWorld.x, otherBody.positionWorld.z);
                            var sa = Math.sin(ang);
                            var ca = Math.cos(ang);

                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, pd * penA * sa, pd * penA * ca);
                            scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, otherBody.rect, 0 - pd * penB * sa, 0 - pd * penB * ca);
                            break;

                    }



                }

            }

        }

        if (walls) {

            i = walls.length;

            while (i--) {

                wall = walls[i];

                penetration = SPLODER.SimulationContacts.bodyWallPenetration(body, wall);

                if (_frame > 5) {

                    if (wall.canCrush) {

                        if (body.type == SPLODER.Item.TYPE_PLAYER) {

                            var fc = SPLODER.GamePhysics.getFloorCeilLevels(scope.model, scope.player.boundingBox.y, scope.player.positionWorld, 1);
                            if (fc[1] - fc[0] <= 64) {
                                // console.log("PLAYER CRUSHED BY WALL");
                                dispatchEvent(SPLODER.FlowNode.TRIGGER_CRUSH, body.rect, wall, 64 - (fc[1] - fc[0]), SPLODER.Geom.AXIS_Y, 0);
                            }

                        } else if (penetration.depth > 1.5) {
                            // console.log("WALL CRUSH!");
                            dispatchEvent(SPLODER.FlowNode.TRIGGER_CRUSH, body.rect, wall, penetration.depth, penetration.axis, penetration.orientation);
                        }
                    }

                }

                if (!wall.canCrush && penetration.depth > 0) {

                    //console.log(penetration.depth, penetration.orientation, walls[i].moving, walls[i].getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH), walls[i].getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH));

                    if (penetration.axis == SPLODER.SimulationContacts.AXIS_Y) {
                        if (penetration.orientation == 1) {
                         //   scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, wall, 0, 0, 0, 0 - penetration.depth);
                        } else {
                         //   scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, wall, 0, 0, 0, penetration.depth);
                        }
                    }

                }

            }

        }

    };


    var checkItemsContacts = function (items) {

        var i, j;
        var item, body, otherBody, range, bodyRange, playerRange;
        var bodiesTouching, bodiesNear, bodiesInRange;
        var penetrations, penetration, pd, po;

        // check for contacts between bodies

        i = items.length;

        while (i--) {

            item = items[i];

            if (item) {

                if (item.type == SPLODER.Item.TYPE_PARTICLE) continue;

                body = _bodies[item.id];

                if (body) {

                    // only check nearness once every 10 frames

                    if (body.type >= SPLODER.Item.TYPE_ITEM) {// && _frame % 10 == 0) {

                        range = Math.ceil(3 + body.rect.getAttrib(SPLODER.GameProps.PROPERTY_RANGE) * 0.25);
                        bodiesNear = SPLODER.SimulationContacts.getBodiesNear(body, _bodies, scope.model.items, null, 3, SPLODER.MovableItem);
                        bodiesInRange = SPLODER.SimulationContacts.getBodiesNear(body, _bodies, scope.model.items, null, range, SPLODER.MovableItem);
                        playerRange = SPLODER.Geom.distanceBetween(body.positionWorld.x, body.positionWorld.z, scope.player.positionWorld.x, scope.player.positionWorld.z);

                        if (playerRange <= (3 + 4 - 1) * 32) {
                            bodiesNear.push(scope.player);
                        }

                        if (playerRange <= (range + 4 - 1) * 32) {
                            bodiesInRange.push(scope.player);
                        }

                        var bodiesInRangeButNotNear;

                        if (bodiesNear.length > 0) {
                            bodiesInRangeButNotNear = bodiesInRange.filter(function(elem) {
                              return bodiesNear.indexOf(elem) < 0;
                            });
                        } else {
                            bodiesInRangeButNotNear = bodiesInRange;
                        }

                        dispatchEvents(SPLODER.FlowNode.TRIGGER_NEAR_IN, body, bodiesNear.filter(
                            function (otherBody) {
                                return !wasNear(body, otherBody);
                            }
                        ));
                        dispatchEvents(SPLODER.FlowNode.TRIGGER_RANGE_IN, body, bodiesInRangeButNotNear.filter(
                            function (otherBody) {
                                return !wasInRange(body, otherBody);
                            }
                        ));

                        updateNearContents(body, bodiesNear);
                        updateInRangeContents(body, bodiesInRange);

                        // only raycast sight lines 2 times a second

                        if (true || _frame % 30 == 0) {

                            if (body.type >= SPLODER.Item.TYPE_ITEM) {

                                j = bodiesInRange.length;

                                while (j--) {

                                    otherBody = bodiesInRange[j];

                                    if (otherBody.type >= SPLODER.Item.TYPE_ITEM) {

                                        var ang = SPLODER.Geom.angleBetween(body.positionWorld.x, body.positionWorld.z, otherBody.positionWorld.x, otherBody.positionWorld.z);
                                        var b_rot = body.rotation;

                                        var ang_delta = SPLODER.Geom.normalizeAngle(b_rot - ang);

                                        if (Math.abs(ang_delta) < Math.PI * 0.5) {

                                            var hits = SPLODER.GamePhysics.rayCast3d(scope.model, body.positionWorld, otherBody.positionWorld, 32);

                                            if (hits.length == 0) {

                                               dispatchEvent(SPLODER.FlowNode.TRIGGER_SEE, body, otherBody);

                                            }

                                        }

                                    }

                                }

                            }

                        }

                    }

                    bodiesTouching = SPLODER.SimulationContacts.getBodiesNear(body, _bodies, scope.model.items, null, 0);
                    dispatchEvents(SPLODER.FlowNode.TRIGGER_COLLISION, body, bodiesTouching);

                    if (body.rect.moving) {
                        // TODO: fix so bipeds can't walk through panels or platforms
                        checkPenetration(body, bodiesTouching, null, true);
                    }

                    if (body.solid) {
                        checkPenetration(body, _playerArray, null, true);
                    }

                    if (body.type == SPLODER.Item.TYPE_ITEM || body.type == SPLODER.Item.TYPE_BIPED || (body.type == SPLODER.Item.TYPE_PLATFORM && body.pushable)) {

                        // TODO: see if platforms are appearing in here
                        body.update();
                        penetrations = SPLODER.SimulationContacts.bodyInWallNSWECheck(body, scope.model);

                        if (penetrations) {

                            j = penetrations.length;

                            while (j--) {

                                penetration = penetrations[j];
                                pd = penetration.depth;
                                po = penetration.orientation;

                                dispatchEvent(SPLODER.FlowNode.TRIGGER_COLLISION, scope.model.getItemById(penetration.rectId), body);
                                //dispatchEvent(SPLODER.FlowNode.TRIGGER_COLLISION, body, scope.model.getItemById(penetration.rectId));

                                //console.log("BIPED IN WALL", body.id, penetration);

                                switch (penetration.axis) {

                                    case SPLODER.SimulationContacts.AXIS_X:

                                        scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, pd * po, 0);
                                        break;


                                    case SPLODER.SimulationContacts.AXIS_Y:

                                        scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, 0, 0, pd * po);
                                        break;


                                    case SPLODER.SimulationContacts.AXIS_Z:

                                        scope.dispatcher.dispatch(SPLODER.ACTION_OFFSET, body.rect, 0, pd * po);
                                        break;

                                }

                            }

                            body.update();

                        } else {
                            if (body.rect.id == 605) {
                                console.log("NO PENETRATIONS")
                            }
                        }

                    } else {

                        // MUST BE A STATELESS WALL WITH TRIGGERS
                        var bodiesTouchingWall = SPLODER.SimulationContacts.getBodiesNear(body, _bodies, scope.model.items, null, 0.1);
                        dispatchEvents(SPLODER.FlowNode.TRIGGER_COLLISION, body, bodiesTouchingWall, true);

                    }

                }

            }

        }

    };

    var checkEndedContacts = function () {

        // check contacts that were not repeated

        for (var contactIdx in _currentContacts) {

            if (!_nextContacts[contactIdx]) {

                var contact = _currentContacts[contactIdx];

                switch (contact.contactType) {
                    case SPLODER.FlowNode.TRIGGER_COLLISION:

                        dispatchEvent(SPLODER.FlowNode.TRIGGER_COLLISION_END, contact.itemA, contact.itemB);
                        break;

                    default:
                        // code
                }

            }

        }

        // reset contact states

        _currentContacts = _nextContacts;
        _nextContacts = {};

    };


    this.start = function () {

        reset();

    };


    this.preStep = function (delta) {

        updatePlayer(delta);

        var body, item, i;
        var force;

        // sync body positions with model

        for (var key in _bodies) {

            body = _bodies[key];
            if (body) body.update();

        }

        i = _bipeds.length;

        while (i--) {

            if (_bipeds[i]) {

                item = _bipeds[i];
                body = scope.getBodyById(item.id);

                if (body && item.moving) {
                    checkMovableItemFrontTerrain(item, body);
                }

            }

        }

        i = _moving_items.length;

        while (i--) {

            if (_moving_items[i]) {

                item = _moving_items[i];

                if (item && item.gravity && item.moving) {
                    body = scope.getBodyById(item.id);
                    if (body) checkMovableItemFrontTerrain(item, body);
                }

            }

        }

        handleBodyPhysics(_bodies);

        i = _forces.length;

        while (i--) {

            force = _forces[i];

            var vx = THREE.Math.clamp(force.vector.x, -10, 10);
            var vy = THREE.Math.clamp(force.vector.y, -10, 10);

            scope.dispatcher.dispatch(SPLODER.ACTION_MOVE, force.body.rect, vx / 32.0, vy / 32.0);

            force.vector.x *= 0.9;
            force.vector.y *= 0.9;

            if (Math.abs(force.vector.x) + Math.abs(force.vector.y) < 0.25) {
                _forces.splice(i, 1);
            }

        }

    };


    var checkMovableItemFrontTerrain = function (item, body) {

        var offsetY = 16;
        if (item.type == SPLODER.Item.TYPE_BIPED) offsetY = 80;

        var pos = SPLODER.GamePhysics.getPointInFrontOfBody(body, 60, offsetY);
        var fc = SPLODER.GamePhysics.getFloorCeilLevels(scope.model, pos.y, pos, 1);

        var biped_floor = body.positionWorld.y / 16;
        var front_floor = fc[0] / 16;
        var front_ceil = fc[1] / 16;
        //console.log(front_floor, biped_floor)

        if (front_floor > biped_floor + 1 &&
            front_floor < biped_floor + 10 &&
            front_ceil >= front_floor + body.boundingBox.depth - 1) {

            var offset = new THREE.Vector2(0, 16);
            SPLODER.Geom.rotatePointDeg(offset, item.rotation || 0);
            // console.log(offset)

            _jumpVector.x = offset.x / 8;
            _jumpVector.y = 24;
            _jumpVector.z = offset.y / 8;

            // console.log("JUMP!")

            body.jump(_jumpVector, pos);

        } else if (front_floor < biped_floor - 12) {

            item.target = null;

        }

    };


    this.postStep = function (delta) {

        _frame++;

        updateModelStates();
        updateSectorContents();

        checkItemsContacts(_triggerable_items);

        checkEndedContacts();

        // update bipeds

        var biped;
        var body;
        var i = _bipeds.length;

        while (i--) {

            biped = null;

            if (_bipeds[i]) {
                biped = _bipeds[i].mesh;
            }

            if (biped) {
                biped.poses.update(_frame);
                biped.face.update(_frame);
            }

        }

        for (var key in _dying_items) {

            body = null;

            if (_dying_items[key]) {
                body = _dying_items[key].mesh;
            }

            if (body) {

                if ('poses' in body) {
                    body.poses.update(_frame);
                    body.face.update(_frame);
                }
            }

        }

        // flip order for next step

        _triggerable_items.reverse();
        _moving_items.reverse();
        _moving_walls.reverse();

    };


    this.getBodyById = function (id) {

        return _bodies[id];

    };

    this.getBodiesNearPlayer = function (range) {
        range = range || 2.0;
        return SPLODER.SimulationContacts.getBodiesNear(scope.player, _bodies, scope.model.items, null, range);
    };

    this.getBipedById = function (id) {

        var i = _bipeds.length;

        while (i--) {

            if (_bipeds[i] && _bipeds[i].id == id) return _bipeds[i];

        }

    };


    this.playerCanTeleport = function () {
        return (Date.now() - _lastTeleportTime > 2000);
    };

    this.canSee = function (bodyA, bodyB) {

        var hits = SPLODER.GamePhysics.rayCast3d(scope.model, bodyA.positionWorld, bodyB.positionWorld, 32);

        return (hits.length == 0);

    };

    this.canSeeRects = function (itemA, itemB) {

        if (!itemA || !itemB) return false;

        var bodyA = itemA.id != -1 ? _bodies[itemA.id] : _playerBody;
        var bodyB = itemB.id != -1 ? _bodies[itemB.id] : _playerBody;

        return this.canSee(bodyA, bodyB)

    }


    var onModelChanged = function(action, prop, id, newVal) {

        var item;

        console.log("ACTION", action);

        switch (action) {

            case SPLODER.EVENT_STATE_CHANGE_START:

                // console.log("STATE CHANGE START", item);
                break;

            case SPLODER.EVENT_STATE_CHANGE_COMPLETE:

                // console.log("STATE CHANGE COMPLETE", item);
                break;

            case SPLODER.ACTION_CHANGE_GAMEPROPS:
                if (prop == SPLODER.GameProps.PROPERTY_HEALTH && newVal <= 0) {

                    item = this.model.getItemById(id);
                    // console.log("HEALTH IS 0", "removing item", id)
                    if (item && _bodies[item.id]) {
                        _dying_items[item.id] = item;
                    }
                    removeItem(item);
                }
                break;

            case SPLODER.ACTION_CONTEXT_CHANGE:

                // console.warn("RESETTING SIMULATION");
                reset();
                break;

            case SPLODER.ACTION_CREATE:

                item = prop;
                console.warn("ADDING ITEM TO SIMULATION", prop, id, item);
                addItem(item);
                updateSectorContents();
                break;

            case SPLODER.ACTION_DESTROY:

                item = this.model.getItemById(id);
                console.warn("REMOVING ITEM FROM SIMULATION", item);
                removeItem(item);
                removeFromArray(item, _dying_items);
                break;

        }

    };

    var dispatchEvent = function (type, sourceBody, targetBody) {

        if (type == SPLODER.FlowNode.TRIGGER_COLLISION &&
            sourceBody && targetBody) {

            addContact(sourceBody, targetBody, type);

        }

        scope.triggered.dispatch(type, sourceBody, targetBody)

        if (type == SPLODER.FlowNode.TRIGGER_COLLISION) {
            scope.triggered.dispatch(type, targetBody, sourceBody)
        }

    }


    var dispatchEvents = function (type, sourceBody, targetBodies, swapSourceAndTarget) {

        if (!sourceBody || !targetBodies) return;

        var i, targetBody;

        i = targetBodies.length;


        while (i--) {

            targetBody = targetBodies[i];

            if (targetBody instanceof SPLODER.WallItem && !sourceBody.rect.deactivated) {

                if (!swapSourceAndTarget) dispatchEvent(type, sourceBody, targetBody);
                else dispatchEvent(type, targetBody, sourceBody);

            } else if (targetBody && targetBody.rect && !targetBody.rect.deactivated && !sourceBody.rect.deactivated) {

                if (!swapSourceAndTarget) dispatchEvent(type, sourceBody, targetBody);
                else dispatchEvent(type, targetBody, sourceBody);

            }

        }

    };


    var onAction = function () {

        var action = arguments[0];
        var valueA = arguments[1];
        var itemId = arguments[2];
        var valueB = arguments[3];

        var item, body;

        switch (action) {

            case SPLODER.ACTION_APPLY_FORCE:

                if (valueA == -1) {
                    body = scope.player;
                } else {
                    body = scope.getBodyById(valueA);
                }

                if (body) {
                    var angle = arguments[2];
                    var power = arguments[3];
                    var force = new THREE.Vector2(0, power);
                    SPLODER.Geom.rotatePoint(force, angle);
                    _forces.push(new SPLODER.SimulationForce(body, force));
                }
                break;

            case SPLODER.ACTION_TELEPORT:

                if (!scope.playerCanTeleport()) return;

                item = scope.model.getItemById(valueA);

                if (item) {

                    var dest_x = (item.x + item.width * 0.5) * 32;
                    var dest_z = (item.y + item.width * 0.5) * 32;

                    var dest_y = SPLODER.GamePhysics.elevationCheck(scope.model, scope.player.boundingBox.y, new THREE.Vector3(dest_x * 32, scope.player.positionWorld.y, dest_z * 32), 0, false, false);
                    dest_y *= 16;
                    dest_y -= scope.player.boundingBox.depth * 16;

                    var pp = scope.player.boundingBox;
                    var playerParentRect = scope.model.getItemUnderPoint(pp.x, pp.z, 0, SPLODER.Item.TYPE_FILTER_WALL_LIQUID);
                    scope.player.teleport(dest_x, dest_y, dest_z, playerParentRect);

                    _lastTeleportTime = Date.now();

                }

                break;

            case SPLODER.FlowNode.ACTION_SHOW_TEXT:

                var bipedItem = scope.getBipedById(itemId);
                var biped = bipedItem ? bipedItem.mesh : null;

                if (biped) {

                    switch (valueA) {

                        case SPLODER.EVENT_STATE_CHANGE_START:

                            biped.face.say(valueB);

                    }

                }


                break;

        }

    }

};
