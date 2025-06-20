/**
 * Created by ggaudrea on 6/1/15.
 */

SPLODER.GameStore = function () {

    SPLODER.Store.call(this);

    var scope = this;

    this.player = null;
    this.flows = null;

    this.ItemClass = SPLODER.GameItem;

    this.addItem = function (type, x, y, width, height, attribs, noBoundsUpdate) {

        var item;

        if (type == SPLODER.Item.TYPE_PLATFORM || type == SPLODER.Item.TYPE_ITEM || type == SPLODER.Item.TYPE_BIPED) {
            item = new SPLODER.MovableItem(type, x, y, width, height, attribs);
        } else {
            item = new SPLODER.WallItem(type, x, y, width, height, attribs);
        }

        item.id = this.nextItemId;
        this.nextItemId++;

        this.items.push(item);
        SPLODER.ShapeUtils.sortByAreaDesc(this.items);

        if (!noBoundsUpdate) {
            this.updateBounds();
        }

        return item;

    };


    this.getMovableItems = function (includeStateless, includeDying) {

        if (!this.items) return [];

        return this.items.filter(function (elem) {

            if (elem.deactivated) return false;

            if (includeStateless && elem.type == SPLODER.Item.TYPE_PARTICLE) return false;
            if (!includeDying && elem.dying) return false;

            return (elem.type == SPLODER.Item.TYPE_BIPED ||
                elem.type == SPLODER.Item.TYPE_ITEM ||
                (elem instanceof SPLODER.MovableItem &&
                    (includeStateless ||
                    elem.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_X) ||
                    elem.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_Y) ||
                    elem.states.hasFrames(SPLODER.Item.PROPERTY_FLOORDEPTH)
                    )
            ));

        });

    };

    this.getMovableWalls = function () {

        if (!this.items) return [];

        return this.items.filter(function (elem) {
            return (elem instanceof SPLODER.WallItem && (elem.states.hasFrames(SPLODER.Item.PROPERTY_FLOORDEPTH) || elem.states.hasFrames(SPLODER.Item.PROPERTY_CEILDEPTH)));
        })

    };

    this.getStatelessWallsWithTriggers = function () {

        if (!this.items || !this.flows) return [];

        var scope = this;

        var newItems = this.items.filter(function (elem) {
            return (
                elem instanceof SPLODER.WallItem &&
                !elem.states.hasFrames(SPLODER.Item.PROPERTY_FLOORDEPTH) &&
                !elem.states.hasFrames(SPLODER.Item.PROPERTY_CEILDEPTH) &&
                scope.flows.itemHasTriggers(elem.id)
            );
        });

        console.log("STATELESS WALLS WITH TRIGGERS", newItems);

        return newItems;

    };

    this.getDyingItems = function () {

        if (!this.items) return [];

        return this.items.filter(function (elem) {
            return elem.dying;
        })

    };

    var getFloorLevel = function (tileX, tileY) {

        var floorLevel = 0;

        var local_items = scope.getItemsUnderPoint(tileX, tileY, 1, null, true);

        SPLODER.ShapeUtils.sortByAreaDesc(local_items);

        var platformRect = scope.getItemsUnderPoint(tileX, tileY, 1, local_items, false, SPLODER.Item.TYPE_PLATFORM);

        if (platformRect) {

            floorLevel = Math.max(floorLevel, platformRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH));

        }

        var wallRect = scope.getItemsUnderPoint(tileX, tileY, 1, local_items, false, SPLODER.Item.TYPE_WALL);

        if (wallRect) {

            floorLevel = Math.max(floorLevel, wallRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH));

        }

        var liquidRect = scope.getItemsUnderPoint(tileX, tileY, 1, local_items, false, SPLODER.Item.TYPE_LIQUID);

        if (liquidRect) {

            floorLevel = Math.max(floorLevel, liquidRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) - liquidRect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH));

        }

        return floorLevel;

    };

    this.initMetadata = function () {

        if (!this.metadata) this.metadata = {};
        this.metadata.level = -1;
        this.metadata.playerStart = { x: 0, y: 10, r: 180 };

    }

    this.getPlayerStart = function () {

        if (this.metadata && this.metadata.playerStart) {
            return this.metadata.playerStart;
        } else {
            return { x: 0, y: 10, r: 0 }
        }

    }

    this.getPlayerStartFloorLevel = function () {

        var p = scope.getPlayerStart()
        return getFloorLevel(p.x, p.y);

    }

    this.unserialize = function (data, returnItems) {

        if (!data) return;

        var newItems = [];
        var newSelection = [];
        var item, type;

        data = data.split('@').join('null');

        if (data.indexOf('~') >= 0) {

            var parts = data.split('~');

            var metadata = null;
            var itemsData = null;
            var selectionIds = null;

            if (parts.length == 3) {
                try {
                    metadata = JSON.parse(window.atob(parts[0]));
                    console.log(metadata)
                } catch (err) {
                    console.error("Store unserialize error:", err);
                }
                itemsData = parts[1].split('|');
                selectionIds = parts[2].split('|');
            } else {
                metadata = {};
                itemsData = parts[0].split('|');
                selectionIds = parts[1].split('|');
            }


            var i;

            for (i = 0; i < selectionIds.length; i++) {
                selectionIds[i] = parseInt(selectionIds[i]);
            }

            if (itemsData.length) {

                for (i = 0; i < itemsData.length; i++) {

                    if (itemsData[i]) {

                        type = parseInt(itemsData[i].split(',')[1]);

                        if (type == SPLODER.Item.TYPE_PLATFORM || type == SPLODER.Item.TYPE_ITEM || type == SPLODER.Item.TYPE_BIPED || type == SPLODER.Item.TYPE_PARTICLE) {
                            item = new SPLODER.MovableItem();
                        } else if (type == SPLODER.Item.TYPE_LIGHT) {
                            item = new SPLODER.GameItem();
                        } else {
                            item = new SPLODER.WallItem();
                        }

                        item.unserialize(itemsData[i]);
                        if (item.gameProps) {
                            item.gameProps.setGameMode(true);
                        }

                        if (!isNaN(item.id)) {
                            newItems.push(item);
                            if (!returnItems) this.nextItemId = Math.max(this.nextItemId, item.id);
                        }

                    }

                }

            }

            SPLODER.ShapeUtils.sortByAreaDesc(newItems);
            SPLODER.ShapeUtils.buildTree(newItems);

            for (i = 0; i < newItems.length; i++) {

                item = newItems[i];
                if (item instanceof SPLODER.WallItem || item instanceof SPLODER.MovableItem) {
                    item.setInitialProperties();
                }

            }

            if (!returnItems) {
                this.nextItemId++;
                this.metadata = metadata;
                this.items = newItems;
                this.selection = newSelection;
                this.updateBounds();
                this.changed.dispatch(SPLODER.ACTION_CONTEXT_CHANGE);
            } else {
                this.changed.dispatch(SPLODER.ACTION_CONTEXT_CHANGE);
                return newItems;
            }

        }

    };

    this.updateItem = function (item, frame) {

        if (item) {

            var was_moving = item.moving;
            var res = item.update(frame);

            if (res) this.changed.dispatch(SPLODER.ACTION_CHANGE, item);

            if (was_moving && !item.moving) {
                this.changed.dispatch(SPLODER.EVENT_STATE_CHANGE_COMPLETE, item);
            }

            return res;

        }

        return false;

    };


    this.onAction = function (action) {

        var actionType = action[0] || arguments[0];
        var ids = action[1];
        var valueA = action[2];
        var valueB = action[3];
        var valueC = action[4];
        var x, y, fd, cd;
        var i;
        var items = [];
        var item, itemB, changed;
        var prop, delta;

        switch (actionType) {

            case SPLODER.ACTION_CHANGE_GAMEPROPS:

                prop = valueA;
                console.log("DELTA", valueB, "ITEM(S)", ids, arguments);

                if (prop && ids && !isNaN(ids)) {

                    if (ids == -1) item = this.player;
                    else item = this.getItemById(ids);

                    console.log("CHANGING GAMEPROPS!", ids, prop, valueB, valueC, item)

                    if (item) {

                        if (!item.gameProps) {
                            console.warn("Item", item.id, "has no gameProps");
                            return;
                        }

                        delta = valueB;

                        if (valueC) {

                            itemB = this.getItemById(valueC);
                            if (itemB) delta = itemB.getAttrib(prop);
                            // console.log(itemB, delta)
                        }

                        if (prop == SPLODER.GameProps.PROPERTY_ITEMFRAME_RIGHT ||
                            prop == SPLODER.GameProps.PROPERTY_ITEMFRAME_LEFT ||
                            prop == SPLODER.GameProps.PROPERTY_STRENGTH ||
                            prop == SPLODER.GameProps.PROPERTY_SOLID) {

                            item.gameProps.setProp(prop, delta);
                            this.changed.dispatch(actionType, prop, ids, delta);

                        } else if (delta) {

                            var prev = item.gameProps.getProp(prop);
                            var res = item.changeGameProp(prop, delta);
                            console.log("CHANGED", prop, delta, prev, item.gameProps.getProp(prop), res);

                            if (res) {
                                this.changed.dispatch(actionType, prop, ids, item.gameProps.getProp(prop));
                            }

                        }


                    }

                }

                break;

            case SPLODER.ACTION_CREATE:

console.log("GAMESTORE ACTION CREATE", ids, arguments[1]);
                if (ids) {
                    for (i = 0; i < ids.length; i++) {
                        item = this.getItemById(ids[i]);
                        if (item) {
                            item.deactivated = true;
                            this.changed.dispatch(actionType, item);
                        }
                    }
                }

                break;

            case SPLODER.ACTION_DESTROY:

console.log("GAMESTORE ACTION DESTROY", ids, arguments[1]);
                item = arguments[1];
                if (item) {
                    item.deactivated = true;
                    this.changed.dispatch(actionType, item);
                }
                break;

            case SPLODER.ACTION_DESELECT:

                if (this.selection.length) {
                    this.selection = [];
                    this.changed.dispatch(actionType);
                }
                break;

            case SPLODER.ACTION_SELECT_ITEM:

                if (action[1] instanceof SPLODER.Rect) {
                    item = this.getItemById(action[1].id);
                } else if (!isNaN(action[1])) {
                    item = this.getItemById(action[1]);
                }

                if (item) {
                    if (!action[2]) {
                        this.selection = [item];
                    } else {
                        this.selection.push(item);
                    }
                    this.changed.dispatch(actionType, this.selection);
                }

                break;

            case SPLODER.ACTION_SET_CURRENTSTATE:

                if (!(ids instanceof Array)) {
                    ids = [ids];
                }

                changed = false;
                i = ids.length;

                while (i--) {
                    item = this.getItemById(ids[i]);

                    if (item && item.currentState != valueA) {

                        item.currentState = valueA;
                        changed = true;

                        this.changed.dispatch(SPLODER.EVENT_STATE_CHANGE_START, item);
                        if (!item.moving) {
                            this.changed.dispatch(SPLODER.EVENT_STATE_CHANGE_COMPLETE, item);
                        }
                        items.push(item);
                    } else if (!item) {
                        console.warn("ITEM STATE CANNOT BE CHANGED BECAUSE ITEM", ids[i], "CANNOT BE FOUND")
                    }
                }

                if (changed) this.changed.dispatch(actionType, items);

                break;

            case SPLODER.ACTION_MOVE:

                item = arguments[1];
                x = arguments[2];
                y = arguments[3];
                fd = arguments[4];
                cd = arguments[5];

                if (item) {

                    item.move(x, y, fd, cd);
                    this.changed.dispatch(actionType, item);

                }

                break;

            case SPLODER.ACTION_OFFSET:

                item = arguments[1];
                x = arguments[2];
                y = arguments[3];
                fd = arguments[4];
                cd = arguments[5];

                if (item) {

                    item.offset(x, y, fd, cd, true);
                    this.changed.dispatch(actionType, item);

                }

                break;

            case SPLODER.ACTION_ACTIVATE:

                item = arguments[1];
                if (item) item.deactivated = false;

                this.changed.dispatch(actionType, item);

                break;

            case SPLODER.ACTION_DEACTIVATE:

                item = arguments[1];
                if (item) item.deactivated = true;

                this.changed.dispatch(actionType, item);

                break;

            case SPLODER.ACTION_CONTEXT_CHANGE:

                this.changed.dispatch(actionType, -1);
                SPLODER.ShapeUtils.buildTree(this.items);

                break;

        }

    }

};

SPLODER.GameStore.prototype = Object.create(SPLODER.Store.prototype);
SPLODER.GameStore.prototype.constructor = SPLODER.GameStore;
