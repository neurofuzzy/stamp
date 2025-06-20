/**
 * Created by ggaudrea on 6/1/15.
 */

SPLODER.ItemStore = function () {

    SPLODER.Store.call(this);

    var scope = this;

    this.ItemClass = SPLODER.Item;

    this.addItem = function (type, x, y, width, height, attribs, noBoundsUpdate) {

        var item = new SPLODER.Item(type, x, y, width, height, attribs);

        item.id = this.nextItemId;
        this.nextItemId++;

        this.items.push(item);
        SPLODER.ShapeUtils.sortByAreaDesc(this.items);

        if (!noBoundsUpdate) {
            this.updateBounds();
        }

        return item;

    };

    this.initMetadata = function () {

        if (!this.metadata) this.metadata = {};
        this.metadata.level = 0;
        this.metadata.playerStart = { x: 0, y: 10, r: 180 };

    }

    this.getPlayerStart = function () {

        if (this.metadata && this.metadata.playerStart) {
            return this.metadata.playerStart;
        } else {
            return { x: 0, y: 10, r: 0 }
        }

    }

    this.setPlayerStart = function (x, y) {

        if (this.metadata && this.metadata.playerStart) {
            var p = this.metadata.playerStart;

            p.x = x;
            p.y = y;

            this.changed.dispatch(SPLODER.ACTION_CHANGE_PLAYERSTART, p);
        }

    }

    this.setPlayerRotation = function (r) {
        if (this.metadata && this.metadata.playerStart) {
            var p = this.metadata.playerStart;
            p.r = r || 0;
            this.changed.dispatch(SPLODER.ACTION_CHANGE_PLAYERSTART, p);
        }
    }


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

    this.onAction = function (action) {

        var actionType = action[0];
        var i, x, y, s, d, itemId, item, oldItem, newItem, type, pt, bounds, state;
        var prop, valueA, valueB;

        switch (actionType) {

            case SPLODER.ACTION_DESELECT:

                if (this.selection.length) {
                    this.saveUndo();
                    this.selection = [];
                    this.changed.dispatch(actionType);
                }
                break;

            case SPLODER.ACTION_SELECT_POINT:

                x = action[1];
                y = action[2];
                var addToSelection = action[3];
                var selectChildren = action[4];
                var result = this.getItemUnderPoint(x, y, 0, null, selectChildren);

                s = this.selection;

                if (result instanceof Array) {

                    this.saveUndo();
                    this.selection = result;
                    this.changed.dispatch(actionType, this.selection);
                    return;

                } else {

                    item = result;
                    if (item) console.log(item.id);

                }

                if (item) {

                    var threshold = 5;

                    if (x - item.x > threshold && y - item.y > threshold && item.x + item.width - x > threshold && item.y + item.height - y > threshold) {

                        if (this.itemIsSelected(item)) {
                            this.saveUndo();
                            this.selection = [];
                        }
                        this.changed.dispatch(SPLODER.ACTION_DESELECT);
                        return;

                    }

                }

                if (addToSelection) {

                    if (item && !this.itemIsSelected(item)) {

                        this.saveUndo();
                        s.push(item);
                        SPLODER.ShapeUtils.sortByAreaDesc(s);

                    } else if (!item) {

                        if (s.length) {
                            this.saveUndo();
                            this.selection = [];
                        }

                    }

                } else {

                    if (item && !this.itemIsSelected(item)) {

                        this.saveUndo()
                        this.selection = [item];

                    } else {

                        if (s.length) {
                            this.saveUndo();
                            this.selection = [];
                        }

                    }

                }

                this.changed.dispatch(actionType, this.selection);
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

            case SPLODER.ACTION_SELECT_WINDOW:

                item = action[1];
                this.selection = this.getItemsWithinRect(item.x, item.y, item.width, item.height);
                SPLODER.ShapeUtils.sortByAreaDesc(this.selection);
                this.changed.dispatch(actionType, this.selection);
                break;

            case SPLODER.ACTION_SELECT_ALL:

                this.saveUndo();
                this.selection = this.items.concat();
                SPLODER.ShapeUtils.sortByAreaDesc(this.selection);
                this.changed.dispatch(actionType, this.selection);
                break;

            case SPLODER.ACTION_SELECTION_START:

                this.saveUndo();
                break;

            case SPLODER.ACTION_SELECTION_MOVE:

                i = this.selection.length;

                var offset_states = (i == 1);

                while (i--) {
                    item = this.selection[i];
                    item.x += action[1];
                    item.y += action[2];

                    if (item.type == SPLODER.Item.TYPE_ITEM || item.type == SPLODER.Item.TYPE_BIPED) {

                        if (!(item.type == SPLODER.Item.TYPE_ITEM && item.getAttrib(SPLODER.GameProps.PROPERTY_GRAVITY) == 0)) {
                            item.setAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH, getFloorLevel(item.x, item.y));
                        }

                    }

                    if (offset_states && item.currentState == 0 && item.states) {
                        if (item.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_X)) {
                            item.states.offsetFrames(SPLODER.Item.PROPERTY_OFFSET_X, 0 - action[1]);
                        }
                        if (item.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_Y)) {
                            item.states.offsetFrames(SPLODER.Item.PROPERTY_OFFSET_Y, 0 - action[2]);
                        }
                    }
                }

                this.updateBounds();

                this.changed.dispatch(actionType, this.selection);
                break;

            case SPLODER.ACTION_SELECTION_DUPLICATE:

                this.saveUndo();
                s = this.selection;
                this.selection = [];
                d = this.duplicatedItems = [];

                i = s.length;

                while (i--) {

                    oldItem = s[i];
                    newItem = this.addItem();
                    newItem.unserialize(oldItem.serialize(), true);

                    d.unshift(oldItem);
                    this.selection.unshift(newItem);

                }

                this.updateBounds();
                this.changed.dispatch(actionType, this.selection);
                break;

            case SPLODER.ACTION_SELECTION_MIRROR_H:

                s = this.selection;

                if (s.length > 1) {

                    this.saveUndo();

                    bounds = SPLODER.ShapeUtils.getBounds(s);

                    s.forEach(function (item) {
                        item.x = bounds.x * 2 + bounds.width - item.x - item.width;
                    });

                    this.updateBounds();
                    this.changed.dispatch(actionType, this.selection);

                }

                break;

            case SPLODER.ACTION_SELECTION_MIRROR_V:

                s = this.selection;

                if (s.length > 1) {

                    this.saveUndo();

                    bounds = SPLODER.ShapeUtils.getBounds(s);

                    s.forEach(function (item) {
                        item.y = bounds.y * 2 + bounds.height - item.y - item.height;
                    });

                    this.updateBounds();
                    this.changed.dispatch(actionType, this.selection);

                }

                break;

            case SPLODER.ACTION_SELECTION_ROTATE:

                s = this.selection;

                if (s.length > 0) {

                    this.saveUndo();

                    bounds = SPLODER.ShapeUtils.getBounds(s);

                    s.forEach(function (item) {
                        var x = item.x;
                        var y = item.y;
                        var w = item.width;
                        var h = item.height;
                        var bw = bounds.width;
                        var bh = bounds.height;
                        var obx = Math.floor((bw - bh) * 0.5);
                        var oby = Math.floor((bh - bw) * 0.5);

                        item.x = bounds.x + bh - (y - bounds.y) - h + obx;
                        item.y = bounds.y + (x - bounds.x) + oby;
                        item.width = h;
                        item.height = w;

                        if (item.type == SPLODER.Item.TYPE_BIPED) {
                            SPLODER.modAttrib(item, SPLODER.Item.PROPERTY_ROTATION, 90 * action[1], 360);
                        }

                    });

                    this.updateBounds();
                    this.changed.dispatch(actionType, this.selection);

                }

                break;


            case SPLODER.ACTION_SELECTION_RELEASE:

                s = this.selection.concat();
                d = this.duplicatedItems;

                // TODO: the following block was causing unexpected deletions

                if (s.length && d.length) {

                    if (s[0].x == d[0].x && s[0].y == d[0].y && s[0].width == d[0].width && s[0].height == d[0].height) {

                        this.saveUndo();
                        this.deleteSelection();
                        this.duplicatedItems = [];

                        this.changed.dispatch(SPLODER.ACTION_SELECTION_DELETE, s);
                        return;

                    }

                }


                if (d.length) {
                    this.changed.dispatch(actionType, s);
                }

                this.duplicatedItems = [];

                break;

            case SPLODER.ACTION_SELECTION_DELETE:

                if (this.selection.length) {

                    s = this.selection.concat();
                    this.saveUndo();
                    this.deleteSelection();
                    this.changed.dispatch(actionType, s);

                }
                break;

            case SPLODER.ACTION_CREATE:

                this.saveUndo();

                type = action[1];
                x = action[2];
                y = action[3];

                var ITEM = SPLODER.Item;

                var parentNode = this.getItemUnderPoint(x, y, 0, ITEM.TYPE_WALL);
                // if (!parentNode) parentNode = this.getItemUnderPoint(x, y, 10, SPLODER.Item.TYPE_PLATFORM);

                newItem = this.addItem(type, x, y, action[4], action[5]);

                this.selection = [newItem];

                if (type == SPLODER.Item.TYPE_ITEM || type == SPLODER.Item.TYPE_BIPED) {

                    newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, getFloorLevel(x, y) + 1);

                } else if (parentNode) {

                    var parentFloorDepth = parentNode.getAttrib(ITEM.PROPERTY_FLOORDEPTH);

                    if (type == ITEM.TYPE_PLATFORM) {

                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, parentFloorDepth + 2);

                    } else if (type == ITEM.TYPE_PANEL || type == ITEM.TYPE_ITEM || type == ITEM.TYPE_BIPED) {

                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, parentFloorDepth);

                    } else if (type == SPLODER.Item.TYPE_LIQUID) {

                        newItem.setAttrib(ITEM.PROPERTY_LIQUIDLEVEL, parentFloorDepth - 2);
                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, parentFloorDepth - 8);

                    } else if (type == ITEM.TYPE_PARTICLE) {

                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, parentFloorDepth + 16);

                    }


                } else {

                    if (type == SPLODER.Item.TYPE_WALL) {

                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, 64);
                        newItem.setAttrib(ITEM.PROPERTY_CEILDEPTH, 80);

                    } else if (type == SPLODER.Item.TYPE_PLATFORM) {

                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, 66);
                        newItem.setAttrib(ITEM.PROPERTY_CEILDEPTH, 2);

                    } else if (type == SPLODER.Item.TYPE_LIQUID) {

                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, 56);
                        newItem.setAttrib(ITEM.PROPERTY_LIQUIDLEVEL, 62);

                    } else if (type == SPLODER.Item.TYPE_PARTICLE) {

                        newItem.setAttrib(ITEM.PROPERTY_FLOORDEPTH, 80);
                        newItem.setAttrib(ITEM.PROPERTY_CEILDEPTH, 16);

                    }

                }


                this.changed.dispatch(actionType, this.selection[0]);
                break;

            case SPLODER.ACTION_TWEAK:

                itemId = action[1];
                prop = action[2];
                valueA = action[3];

                if (itemId == -1) {
                    s = this.selection;
                } else {
                    item = this.getItemById(itemId);
                    s = [item];
                }

                for (i = 0; i < s.length; i++) {

                    item = s[i];



                    switch (item.type) {

                        case SPLODER.Item.TYPE_BIPED:

                            switch (prop) {

                                case SPLODER.Biped.PROPERTY_HEIGHT:
                                case SPLODER.Biped.PROPERTY_WEIGHT:
                                case SPLODER.Biped.PROPERTY_STRENGTH:
                                case SPLODER.Biped.PROPERTY_GENDER:
                                case SPLODER.Biped.PROPERTY_HEADSIZE:
                                case SPLODER.Biped.PROPERTY_HEADTHICK:
                                case SPLODER.Biped.PROPERTY_BEASTLY:

                                    SPLODER.setAttrib(item, prop, valueA, 0, 255, 0);
                                    break;

                                default:
                                    SPLODER.setAttrib(item, prop, valueA, 0, 100, 0);
                            }

                            break;

                        default:

                            switch (prop) {
                                case SPLODER.GameProps.PROPERTY_GRAVITY:
                                    item.setAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH, getFloorLevel(item.x, item.y));
                                    break;
                            }

                            SPLODER.setAttrib(item, prop, valueA, 0, 100, 0);

                    }

                }

                this.changed.dispatch(actionType, s, prop);

                break;

            case SPLODER.ACTION_CHANGE:

                itemId = action[1];
                prop = action[2];
                valueA = action[3];
                valueB = action[4];

                if (itemId == -1) {
                    s = this.selection;
                } else {
                    item = this.getItemById(itemId);
                    s = [item];
                }

                for (i = 0; i < s.length; i++) {

                    item = s[i];

                    if (item.type == SPLODER.Item.TYPE_BIPED) {

                        item.setAttrib(prop, valueA, 0);

                    } else {

                        switch (prop) {

                            case SPLODER.Rect.PROPERTY_TOPLEFT:

                                item.width += item.x - valueA;
                                item.height += item.y - valueB;
                                item.x = valueA;
                                item.y = valueB;
                                break;

                            case SPLODER.Rect.PROPERTY_TOPRIGHT:

                                item.width = valueA - item.x;
                                item.height += item.y - valueB;
                                item.y = valueB;
                                break;

                            case SPLODER.Rect.PROPERTY_BOTTOMRIGHT:

                                item.width = valueA - item.x;
                                item.height = valueB - item.y;
                                break;

                            case SPLODER.Rect.PROPERTY_BOTTOMLEFT:

                                item.width += item.x - valueA;
                                item.height = valueB - item.y;
                                item.x = valueA;
                                break;

                            case SPLODER.Item.PROPERTY_FLOORDEPTH:
                            case SPLODER.Item.PROPERTY_CEILDEPTH:

                                state = item.currentState;

                                if (item.type == SPLODER.Item.TYPE_LIQUID && prop == SPLODER.Item.PROPERTY_CEILDEPTH) {
                                    prop = SPLODER.Item.PROPERTY_LIQUIDLEVEL;
                                } else if (item.type == SPLODER.Item.TYPE_PLATFORM && prop == SPLODER.Item.PROPERTY_CEILDEPTH) {
                                    state = 0;
                                }
                                SPLODER.incrementAttrib(item, prop, valueA, 0, 128, item.currentState);
                                break;

                            case SPLODER.Item.PROPERTY_LIGHTLEVEL:
                            case SPLODER.Item.PROPERTY_POWER:

                                if (item.type == SPLODER.Item.TYPE_LIGHT) {
                                    SPLODER.incrementAttrib(item, prop, valueA * 0.5, 0, 100, 0);
                                } else {
                                    SPLODER.incrementAttrib(item, prop, valueA, 0, 240, 0);
                                }
                                break;

                            case SPLODER.Item.PROPERTY_LIGHTEFFECT:
                            case SPLODER.Item.PROPERTY_COLOR:

                                SPLODER.modAttrib(item, prop, valueA, 9, 0);
                                console.log(item.getAttrib(prop));
                                break;

                            case SPLODER.Item.PROPERTY_FLOORTEXTURE:
                            case SPLODER.Item.PROPERTY_CEILTEXTURE:
                            case SPLODER.Item.PROPERTY_BOTTOMWALLTEXTURE:
                            case SPLODER.Item.PROPERTY_BOTTOMWALLCORNICETEXTURE:
                            case SPLODER.Item.PROPERTY_TOPWALLTEXTURE:
                            case SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE:
                            case SPLODER.Item.PROPERTY_LIQUIDTYPE:

                                this.saveUndo();

                                if (item.type == SPLODER.Item.TYPE_LIQUID && prop == SPLODER.Item.PROPERTY_CEILTEXTURE) {
                                    prop = SPLODER.Item.PROPERTY_LIQUIDTYPE;
                                }

                                if (valueB) SPLODER.incrementAttrib(item, prop, valueA, 0, 512);
                                else item.setAttrib(prop, valueA);
                                break;

                            case SPLODER.Item.PROPERTY_CEIL:
                            case SPLODER.Item.PROPERTY_CEIL_SKY:
                            case SPLODER.Item.PROPERTY_LIQUID_HASFLOOR:

                                SPLODER.toggleAttrib(item, prop, 0);
                                console.log(item, prop, item.getAttrib(prop));
                                break;


                        }

                    }

                }

                SPLODER.ShapeUtils.sortByAreaDesc(this.items);
                this.updateBounds();
                this.changed.dispatch(actionType, s, prop);
                break;

            case SPLODER.ACTION_CHANGE_COMPLETE:

                itemId = action[1];
                item = this.getItemById(itemId);
                this.changed.dispatch(actionType, item);
                break;

            case SPLODER.ACTION_SET_CURRENTSTATE:

                s = this.selection;
                i = s.length;

                if (!i) {
                    s = this.items;
                    i = s.length;
                }

                while (i--) {
                    item = s[i];
                    item.currentState = action[2];
                }

                this.changed.dispatch(actionType, this.selection);

                break;

            case SPLODER.ACTION_CLEAR_STATE:

                this.saveUndo();

                state = action[2];

                s = this.selection;
                i = s.length;

                if (!i) {
                    s = this.items;
                    i = s.length;
                }

                while (i--) {

                    s[i].states.clearState(state);
                    this.changed.dispatch(actionType, this.selection);

                }

                break;

            case SPLODER.ACTION_CLEAR_PROPERTY:

                this.saveUndo();

                prop = action[2];

                s = this.selection;
                i = s.length;

                while (i--) {

                    s[i].clearAttrib(prop);
                    this.changed.dispatch(actionType, this.selection);

                }

                break;

            default:

                this.changed.dispatch(actionType);
                break;

        }

        SPLODER.ShapeUtils.buildTree(this.items);

    }

};

SPLODER.ItemStore.prototype = Object.create(SPLODER.Store.prototype);
SPLODER.ItemStore.prototype.constructor = SPLODER.ItemStore;
