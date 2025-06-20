/**
 * Created by ggaudrea on 2/28/15.
 */


SPLODER.Store = function () {

    this.id = 0;
    this.metadata = null;
    this.items = null;

    this.bounds = null;
    this.duplicatedItems = null;
    this.selection = null;
    this.nextItemId = 1;
    this.changed = null;
    this.bookmarked = null;

    this.ItemClass = SPLODER.Rect;


    this.init = function () {

        this.id = SPLODER.Store._nextId;
        SPLODER.Store._nextId++;

        this.reset(true);

        this.changed = new signals.Signal();
        this.bookmarked = new signals.Signal();

        return this;

    };

    this.initMetadata = function () {

        this.metadata = {};

    }

    this.reset = function (quiet) {

        this.initMetadata();
        this.items = [];
        this.bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            size: 0
        };
        this.duplicatedItems = [];
        this.selection = [];

        if (!quiet) {
            this.changed.dispatch(SPLODER.ACTION_RESET);
        }

    };

    this.registerWithDispatcher = function (dispatcher) {

        if (dispatcher) {
            dispatcher.add(this.onAction, this);
        }

    };

    this.addItem = function (type, x, y, width, height, noBoundsUpdate) {

        var item = new this.ItemClass(type, x, y, width, height);

        item.id = this.nextItemId;
        this.nextItemId++;

        this.items.push(item);
        SPLODER.ShapeUtils.sortByAreaDesc(this.items);

        if (!noBoundsUpdate) {
            this.updateBounds();
        }

        return item;

    };

    this.getNextItemIdAndAdvance = function () {

        var nextId = this.nextItemId;
        this.nextItemId++;
        return nextId;

    }

    this.deleteItem = function (item) {

        if (!item) return;

        var items = this.items;
        var idx = items.indexOf(item);

        if (idx >= 0) {
            items.splice(idx, 1);
            this.updateBounds();
        }

    };

    this.updateBounds = function () {

        this.bounds = SPLODER.ShapeUtils.getBounds(this.items);

    };

    this.hasItems = function () {
        return (this.items && this.items.length > 0)
    }

    this.serialize = function (items) {

        var local = items ? false : true;

        items = items || this.items;
        var itemsData = [];
        var selection = this.selection;
        var selectionIds = [];
        var i;

        var smeta = "{}";

        try {
            if (this.metadata) {
                smeta = window.btoa(JSON.stringify(this.metadata));
            }
        } catch (err) {
            smeta = "{}";
            console.error(err);
        }

        items = items.concat();
        items.sort(function (a, b) {
            if (a.id > b.id) {
                return 1;
            } else if (a.id < b.id) {
                return -1;
            }
            return 0;
        });

        i = items.length;

        while (i--) {
            itemsData.unshift(items[i].serialize());
        }

        if (local) {

            i = selection.length;

            while (i--) {
                selectionIds.unshift(selection[i].id);
            }

        }

        return  smeta + "~" + itemsData.join('|').split('null').join('@') + "~" + selectionIds.join('|');

    };


    this.unserialize = function (data, returnItems) {

        if (!data) return;

        var newItems = [];
        var newSelection = [];

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

                    var item = new this.ItemClass();
                    item.unserialize(itemsData[i]);

                    if (!isNaN(item.id)) {
                        newItems.push(item);
                        if (!returnItems) this.nextItemId = Math.max(this.nextItemId, item.id);

                        if (selectionIds.length && selectionIds.indexOf(item.id) >= 0) {
                            newSelection.push(item);
                        }
                    }

                }

            }

            SPLODER.ShapeUtils.sortByAreaDesc(newItems);
            SPLODER.ShapeUtils.sortByAreaDesc(newSelection);

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


    this.saveUndo = function () {

        this.bookmarked.dispatch(this.id);

    };

    this.restoreUndo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_UNDO);

    };

    this.redo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_REDO);

    };

    this.hasSelection = function (numFilter) {
        if (numFilter === undefined) {
            return this.selection.length > 0;
        } else {
            return this.selection.length == numFilter;
        }
    };


    this.selectionType = function () {

        var s = this.selection;

        if (s.length == 0) return -1;

        var type = s[0].type;

        var i = s.length;

        while (i--) {

            if (s[i].type != type) return -2;

        }

        return type;

    };


    this.deleteSelection = function () {

        var s = this.selection;
        var items = this.items;
        var i = s.length;
        var idx;

        while (i--) {
            idx = items.indexOf(s[i]);
            if (idx >= 0) {
                items.splice(idx, 1);
            }
        }

        this.selection = [];

        this.updateBounds();

    };


    this.getItemById = function (id) {

        var d = this.items;
        var i = d.length;

        while (i--) {

            if (d[i].id == id) return d[i];

        }

        return null;

    };

    this.filterType = function (type, typeFilter) {

        if (typeFilter != undefined && type !== typeFilter) {

            switch (typeFilter) {
            
                case SPLODER.Item.TYPE_FILTER_WALL_LIQUID:
                    return (type == SPLODER.Item.TYPE_WALL || type == SPLODER.Item.TYPE_LIQUID);

                case SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID:
                    return (type >= SPLODER.Item.TYPE_WALL && type <= SPLODER.Item.TYPE_LIQUID);
                
                default:
                    return false;

            }
        }

        return true;

    };

    this.getItemsUnderPoint = function (x, y, padding, items, multiple, typeFilter, selectChildren) {

        padding = padding || 0;

        items = items || this.items;

        if (!items) return multiple ? [] : null;

        var i = items.length;
        var item;
        var results = multiple ? [] : null;

        while (i--) {

            item = items[i];

            if (!this.filterType(item.type, typeFilter)) continue;

            if ((item.type == SPLODER.Item.TYPE_ITEM || item.type == SPLODER.Item.TYPE_BIPED) && SPLODER.Geom.distanceBetweenSquared(x, y, item.x, item.y) <= 4) {

                if (!multiple) {
                    return item;
                } else {
                    results.push(item);
                }

            } else if (item.type == SPLODER.Item.TYPE_LIGHT && SPLODER.Geom.distanceBetweenSquared(x, y, item.x, item.y) <= 2) {

                if (!multiple) {
                    return item;
                } else {
                    results.push(item);
                }

            } else if (item.type == SPLODER.Item.TYPE_PARTICLE && SPLODER.Geom.pointWithinRect(x, y, item, 1) && (x - item.x < 2 || y - item.y < 2 || item.x + item.width - x < 2 || item.y + item.height - y < 2)) {

                if (!multiple) {
                    return item;
                } else {
                    results.push(item);
                }

            } else if (item.type != SPLODER.Item.TYPE_PARTICLE && x >= item.x - padding && y >= item.y - padding && x <= item.x + item.width + padding && y <= item.y + item.height + padding) {

                if (!multiple) {
                    if (selectChildren) {
                        return [item].concat(SPLODER.ShapeUtils.getDescendants(item));
                    } else {
                        return item;
                    }
                } else {
                    results.push(item);
                }

            }

        }

        if (results) {
            SPLODER.ShapeUtils.sortByAreaDesc(results);
            results.reverse();
        }

        return results;

    };

    this.getItemUnderPoint = function (x, y, padding, typeFilter, selectChildren) {

        return this.getItemsUnderPoint(x, y, padding, null, false, typeFilter, selectChildren);

    };

    this.selectionIsUnderPoint = function (x, y, padding) {

        return this.getItemsUnderPoint(x, y, padding, this.selection);

    };

    this.itemIsSelected = function (item, isOnlySelection) {

        if (this.selection.indexOf(item) !== -1) {

            if (isOnlySelection) {
                return this.selection.length == 1;
            }

            return true;

        }

        return false;

    };

    this.itemWithIdIsSelected = function (id, isOnlySelection) {

        var item = this.getItemById(id);

        if (item) {

            return this.itemIsSelected(item, isOnlySelection);

        }

        return false;

    };

    this.getItemsWithinRect = function (x, y, width, height, typeFilter, items, ignoreItem, classFilter, noLights) {

        items = items || this.items;
        if (!items) return [];

        var i = items.length;
        var item;
        var results = [];

        while (i--) {

            item = items[i];

            if (typeFilter !== undefined && !this.filterType(item.type, typeFilter)) continue;
            if (classFilter !== undefined && !(item instanceof classFilter)) continue;
            if (noLights && item.type == SPLODER.Item.TYPE_LIGHT) continue;

            if (x <= item.x && y <= item.y && x + width >= item.x + item.width && y + height >= item.y + item.height) {
                if (item != ignoreItem) results.push(item);
            }

        }

        return results;

    };

    this.getItemsIntersectingRect = function (x, y, width, height, typeFilter, items, ignoreItem, classFilter, noLights) {

        items = items || this.items;
        if (!items) return [];

        var i = items.length;
        var item;
        var results = [];

        while (i--) {

            item = items[i];

            if (typeFilter !== undefined && !this.filterType(item.type, typeFilter)) continue;
            if (classFilter !== undefined && !(item instanceof classFilter)) continue;
            if (noLights && item.type == SPLODER.Item.TYPE_LIGHT) continue;

            if (!(item.x > x + width || item.x + item.width < x || item.y > y + height || item.y + item.height < y)) {
                if (item != ignoreItem) results.push(item);
            }
        }

        return results;

    };


    this.getItemsByType = function (typeFilter) {

        var filteredItems = [];

        if (!this.items) return [];

        var i = this.items.length;
        var item;

        while (i--) {

            item = this.items[i];

            if (this.filterType(item.type, typeFilter)) {
                filteredItems.unshift(item);
            }

        }

        return filteredItems;

    };

};

SPLODER.Store._nextId = 1;

SPLODER.Store.prototype.onAction = function (action) {

    // abstract method
    console.log("ABSTRACT METHOD CALLED: OVERRIDE!", action)

};

SPLODER.Store.prototype.copySelectionAsClipboard = function () {

    var s = this.selection;

    var clipboard = {
        modelId: this.id,
        bounds: SPLODER.ShapeUtils.getBounds(s),
        data: ""
    };

    if (s.length) {

        var itemsSerialized = [];

        for (var i = 0; i < s.length; i++) {

            item = s[i];
            itemsSerialized.push(item.serialize());

        }

        clipboard.data = itemsSerialized.join("|");

    }

    return clipboard;

};

SPLODER.Store.prototype.pasteSelectionFromClipboard = function (clipboard, doSort) {

    if (clipboard && clipboard.modelId == this.id && clipboard.data) {

        this.saveUndo();

        var itemsSerialized = clipboard.data.split("|");
        var s = this.selection = [];

        for (var i = 0; i < itemsSerialized.length; i++) {

            item = this.addItem();
            item.unserialize(itemsSerialized[i], true);

            s.push(item);

        }

        this.updateBounds();

        if (doSort !== false && s.length > 1) {
            SPLODER.ShapeUtils.sortByAreaDesc(s);
        }

        this.changed.dispatch(SPLODER.ACTION_CLIPBOARD_PASTE, s);

        return s;

    }

};

SPLODER.Store.LIGHT_COLOR_CHOICES = [0xffffff, 0xffcc99, 0xff9966, 0xff3300, 0xff00ff, 0x9933ff, 0x0033ff, 0x00ccff, 0x00ff00];
SPLODER.Store.PARTICLE_COLOR_CHOICES = [0xffffff, 0xff9933, 0xff6611, 0xff3311, 0xff11ff, 0x9933ff, 0x1133ff, 0x11ccff, 0x11ff22];

