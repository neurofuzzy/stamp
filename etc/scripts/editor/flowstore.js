/**
 * Created by ggaudrea on 6/1/15.
 */

SPLODER.FlowStore = function () {

    SPLODER.Store.call(this);

    var scope = this;

    var _flowId = 0;
    var _flowScope = 0;

    Object.defineProperty(this, "flowId", {

        get: function () {
            return _flowId;
        },

        set: function (val) {

            if (!isNaN(val)) {

                _flowId = val;

                scope.selection = [];

                scope.changed.dispatch(SPLODER.ACTION_CONTEXT_CHANGE);

            }

        }

    });

    Object.defineProperty(this, "flowScope", {

        get: function () {
            return _flowScope;
        },

        set: function (val) {

            if (!isNaN(val)) _flowScope = val;

        }

    });

    this.ItemClass = SPLODER.FlowNode;



    this.getItemsUnderPoint = function (x, y, padding, items, multiple, typeFilter) {

        padding = padding || 0;

        items = items || this.items;
        var i = items.length;
        var item;
        var results = multiple ? [] : null;

        while (i--) {

            item = items[i];

            if (typeFilter != undefined && item.type !== typeFilter) {
                continue;
            }

            if (item.flowId != this.flowId) {
                continue;
            }

            if (x >= item.x - padding && y >= item.y - padding && x <= item.x + item.width + padding && y <= item.y + item.height + padding) {

                if (!multiple) {
                    return item;
                } else {
                    results.push(item);
                }

            }

        }

        return results;

    };

    this.getItemsMatchingFlowID = function () {

        var scope = this;

        return this.items.filter(function (item) {
            return (item.flowId == scope.flowId);
        });

    }

    this.deleteItemsMatchingFlowID = function (id) {

        var scope = this;

        var items = this.items.filter(function (item) {

            return (item.flowId == id);
        });

        if (items) {

            items.forEach(function (item) {
                scope.deleteItem(item);
            });

            this.saveUndo();
        }

    }

    var scanNodeChildren = function () {

        var i = scope.items.length;
        var j, item;

        while (i--) {

            item = scope.items[i];

            if (item && item.children.length) {

                j = item.children.length;

                while (j--) {

                    if (!scope.getItemById(item.children[j])) {

                        item.children.splice(j, 1);
                        item.childrenTerminal.splice(j, 1);

                    }

                }

            }

        }

    }


    this.onAction = function (action) {

        if (!action) return;

        var actionType = action[0];
        var i, x, y, s, d, itemId, item, oldItem, newItem, type, subtype, operator, target;

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

                if (result && result.length > 1) {

                    this.saveUndo();
                    this.selection = result;
                    this.changed.dispatch(actionType, this.selection);
                    return;

                } else {

                    item = result;

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

                        this.saveUndo();
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

                if (action[1] instanceof SPLODER.Item) {

                    this.selection = [this.getItemById(action[1].id)];
                    this.changed.dispatch(actionType, this.selection);

                }
                break;

            case SPLODER.ACTION_SELECT_WINDOW:

                item = action[1];
                this.selection = this.getItemsIntersectingRect(item.x, item.y, item.width, item.height);
                this.selection = this.selection.filter(function (elem) {
                    return elem.flowId == _flowId;
                });
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

                while (i--) {
                    this.selection[i].x += action[1];
                    this.selection[i].y += action[2];
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
                    newItem.flowId = this.flowId;

                    d.unshift(oldItem);
                    this.selection.unshift(newItem);

                }

                SPLODER.FlowStore.remapNodeConnections(d, this.selection);

                this.updateBounds();
                this.changed.dispatch(actionType, this.selection);
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
                    scanNodeChildren();
                    this.changed.dispatch(actionType, s);

                }
                break;

            case SPLODER.ACTION_CREATE:

                this.saveUndo();

                type = action[1];
                subtype = action[2];
                operator = action[3];
                target = action[4];
                x = action[5];
                y = action[6];

                newItem = this.addItem(type, x, y, action[7], action[8]);
                newItem.flowId = this.flowId;

                var target_type = SPLODER.FlowNode.subtypeTargetTypes[type][subtype];

                newItem.setAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE, subtype);
                newItem.setAttrib(SPLODER.FlowNode.PROPERTY_OPERATOR, operator);
                newItem.setAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE, target_type);
                newItem.setAttrib(SPLODER.FlowNode.PROPERTY_TARGET, target);

                this.selection = [newItem];

                this.changed.dispatch(actionType, this.selection[0]);
                break;

            case SPLODER.ACTION_CHANGE:

                itemId = action[1];
                var prop = action[2];
                var valueA = action[3];

                if (itemId == -1) {
                    s = this.selection;
                } else {
                    item = this.getItemById(itemId);
                    s = [item];
                }

                for (i = 0; i < s.length; i++) {

                    item = s[i];
                    if (item) {
                        console.log("FLOWNODE CHANGED", prop, valueA)
                        item.setAttrib(parseInt(prop), parseInt(valueA));
                    }

                }

                this.updateBounds();
                this.changed.dispatch(actionType, s, prop);
                break;

            case SPLODER.ACTION_CHANGE_COMPLETE:

                itemId = action[1];
                item = this.getItemById(itemId);
                this.changed.dispatch(actionType, item);
                break;

            case SPLODER.ACTION_CONNECT:

                var sourceItem = this.getItemById(action[1]);
                var destItem = this.getItemById(action[2]);

                if (sourceItem && destItem) {
                    sourceItem.addChild(destItem.id, action[3]);
                }


                this.changed.dispatch(actionType, sourceItem);

                break;

            case SPLODER.ACTION_DISCONNECT:

                item = this.getItemById(action[1]);
                var terminal = action[2];

                if (item) {

                    if (terminal == 2) {

                        i = this.items.length;

                        while (i--) {

                            this.items[i].removeChild(item.id);

                        }

                    } else {

                        i = item.children.length;

                        while (i--) {

                            if (item.childrenTerminal[i] == terminal) {
                                item.removeChild(item.children[i]);
                            }

                        }

                    }

                }

                this.changed.dispatch(actionType, item);

                break;

        }

    }

};

SPLODER.FlowStore.prototype = Object.create(SPLODER.Store.prototype);
SPLODER.FlowStore.prototype.constructor = SPLODER.FlowStore;


SPLODER.FlowStore.remapNodeConnections = function (oldItems, newItems) {

    if (!newItems || !oldItems) return;

    var i = oldItems.length;

    var idxOf = function (items, id) {

        var i = items.length;

        while (i--) {

            if (items[i] && items[i].id == id) {

                return i;

            }

        }

        return -1;

    };

    var oldItem, newItem, j, childIdx;

    while (i--) {

        if (oldItems[i] && newItems[i]) {

            oldItem = oldItems[i];
            newItem = newItems[i];

            if (oldItem && newItem && oldItem.children.length) {

                j = oldItem.children.length;

                while (j--) {

                    childIdx = idxOf(oldItems, oldItem.children[j]);

                    if (childIdx != -1) {

                        console.log("remapping node child id", newItem.children[j], newItems[childIdx].id);
                        newItem.children[j] = newItems[childIdx].id;

                    }

                }

            }

        }


    }


};


SPLODER.FlowStore.prototype.pasteSelectionFromClipboard = function (clipboard, doSort) {

    if (clipboard && clipboard.data) {

        var i;

        var itemsSerialized = clipboard.data.split("|");

        var oldItems = [];

        for (i = 0; i < itemsSerialized.length; i++) {

            item = this.addItem();
            item.unserialize(itemsSerialized[i]);

            oldItems.push(item);

        }

        var newItems = SPLODER.Store.prototype.pasteSelectionFromClipboard.apply(this, arguments);

        i = newItems.length;


        while (i--) {

            newItems[i].flowId = this.flowId;
            newItems[i].x += 1.0;
            newItems[i].y += 1.0;

        }

        SPLODER.FlowStore.remapNodeConnections(oldItems, newItems);

        this.selection = oldItems;
        this.deleteSelection();

    }

};
